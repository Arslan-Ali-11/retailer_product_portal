export interface Product {
  // Core logic fields (internal use for metrics/alerts)
  id: string;
  productName: string;
  sku: string;
  availableStock: number;
  restockLevel: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  price: number;
  lastUpdated: string;

  // Dynamic data for table display (contains all sheet columns)
  rowData: Record<string, any>;
}

export interface DashboardMetrics {
  totalProducts: number;
  lowStockItems: number;
  stockValue: number;
}

export interface StockDataResult {
  products: Product[];
  columns: string[];
}