import { Product, StockDataResult } from '../types';

// UPDATED: Sheet ID provided by user
const SHEET_ID = '1E43VwrR0vxtIc-hOpZKnkny9vsUv3iKedwr5cMBFHLw'.trim();
const API_KEY = 'AIzaSyAfhk_YJMHEjcwxacu4AI26elLQUvOeMDk'.trim();

/**
 * Fallback method: Fetches data using the Google Visualization API.
 * This bypasses strict CORS/API Key issues often found with the v4 API on public sheets.
 */
const fetchViaGviz = async (sheetId: string): Promise<any[][]> => {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`;
  
  console.log("Attempting Gviz Fallback...");
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Gviz Fallback failed: ${response.statusText}`);
  }
  
  const text = await response.text();
  // Gviz returns JSON wrapped in a function: /*O_o*/ google.visualization.Query.setResponse({...});
  // We clean it to get pure JSON.
  const jsonString = text.substring(47).slice(0, -2);
  const json = JSON.parse(jsonString);
  
  // Parse Headers from cols
  const headers = json.table.cols.map((col: any) => col.label || "");
  
  // Parse Data from rows
  const rows = json.table.rows.map((row: any) => {
    return row.c.map((cell: any) => (cell ? (cell.v ?? "") : ""));
  });
  
  // Return combined array [headers, ...rows] to match API v4 format
  return [headers, ...rows];
};

export const fetchStockData = async (): Promise<StockDataResult> => {
  if (!SHEET_ID) {
    throw new Error("Configuration Error: Sheet ID is missing.");
  }

  let rows: any[][] = [];

  try {
    // 1. Try Standard API v4
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/A1:Z?key=${API_KEY}&t=${Date.now()}`;
    console.log(`Fetching stock data...`);
    
    const response = await fetch(url);

    if (!response.ok) {
       // If API fails (403, 404, or CORS), throw to trigger catch block
       throw new Error(`API v4 Failed: ${response.status}`);
    }

    const data = await response.json();
    rows = data.values;

  } catch (apiError: any) {
    console.warn("Standard API failed, switching to Fallback (Gviz)...", apiError);
    
    try {
      // 2. Fallback to Gviz
      rows = await fetchViaGviz(SHEET_ID);
      console.log("Fallback successful!");
    } catch (fallbackError: any) {
      console.error("All fetch methods failed.", fallbackError);
      throw new Error("Connection Failed. Ensure your Google Sheet is 'Public' (Anyone with the link).");
    }
  }

  if (!rows || rows.length < 2) {
    console.warn("Sheet is empty or missing headers");
    return { products: [], columns: [] };
  }

  // 3. Dynamic Column Mapping
  const originalHeaders = rows[0].map((h: any) => String(h).trim());
  const lowerHeaders = originalHeaders.map(h => h.toLowerCase());
  
  const findIndex = (searchTerms: string[]) => {
    return lowerHeaders.findIndex((h: string) => searchTerms.some(term => h.includes(term)));
  };

  const idx = {
    name: findIndex(['product name', 'product', 'item', 'name']),
    sku: findIndex(['sku', 'code', 'id']),
    price: findIndex(['selling price', 'price', 'cost']),
    // Prioritize specific column name for stock but fallback to others
    stock: findIndex(['sync with shopify', 'available stock', 'current stock', 'quantity', 'inventory']),
    // Expanded terms for restock level
    restock: findIndex(['restock level', 'restock', 'min stock', 'minimum stock', 'reorder point', 'threshold'])
  };

  // 4. Parse Rows
  const dataRows = rows.slice(1);

  const products = dataRows.map((row: any[], index: number) => {
    const parseNumber = (val: any): number => {
      if (!val) return 0;
      // Aggressive cleaning: Remove everything except digits, minus sign, and decimal point
      // This handles "10 pcs", "$10.00", "approx 5" -> 5
      const cleanVal = String(val).replace(/[^0-9.-]/g, '');
      const num = parseFloat(cleanVal);
      return isNaN(num) ? 0 : num;
    };

    const productName = idx.name > -1 ? (row[idx.name] || 'Unknown Product') : 'Unknown Product';
    const sku = idx.sku > -1 ? (row[idx.sku] || `SKU-${index}`) : `SKU-${index}`;
    const price = idx.price > -1 ? parseNumber(row[idx.price]) : 0;
    const availableStock = idx.stock > -1 ? parseNumber(row[idx.stock]) : 0;
    const restockLevel = idx.restock > -1 ? parseNumber(row[idx.restock]) : 0;

    let status: Product['status'] = 'In Stock';
    if (availableStock === 0) {
      status = 'Out of Stock';
    } else if (availableStock <= restockLevel) {
      status = 'Low Stock';
    }

    // Capture all columns dynamically
    const rowData: Record<string, any> = {};
    originalHeaders.forEach((header, colIndex) => {
      rowData[header] = row[colIndex] || "";
    });

    return {
      id: `row-${index}-${sku}`,
      productName,
      sku,
      availableStock,
      restockLevel,
      status,
      price,
      lastUpdated: new Date().toISOString(),
      rowData // Store full row data
    };
  });

  return {
    products,
    columns: originalHeaders
  };
};

export const triggerRestockWebhook = async (items: Product[]): Promise<boolean> => {
  const WEBHOOK_URL = 'https://my-automations.online/webhook/alert';
  
  console.log(`Triggering Webhook to: ${WEBHOOK_URL} for ${items.length} items`);

  const payload = {
    source: 'Retailer Portal',
    type: 'Restock Request',
    timestamp: new Date().toISOString(),
    items: items.map(item => ({
      itemName: item.productName,
      availableStock: item.availableStock,
      sku: item.sku,
      restockLevel: item.restockLevel
    }))
  };

  try {
    // 'no-cors' mode is required for webhooks that don't send CORS headers.
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      mode: 'no-cors', 
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify(payload)
    });
    return true;
  } catch (error) {
    console.error("Webhook Error:", error);
    throw error;
  }
};