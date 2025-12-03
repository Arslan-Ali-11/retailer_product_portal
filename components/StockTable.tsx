import React from 'react';
import { Product } from '../types';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface StockTableProps {
  data: Product[];
  columns: string[];
}

const StockTable: React.FC<StockTableProps> = ({ data, columns }) => {
  // Calculate max stock for progress bar scaling
  const maxStock = Math.max(...data.map(p => p.availableStock), 100);

  // Helper to detect column types for special rendering
  const isStockColumn = (colName: string) => {
    const lower = colName.toLowerCase();
    return lower.includes('available stock') || lower.includes('sync with shopify') || lower.includes('current stock');
  };

  const isPriceColumn = (colName: string) => {
    const lower = colName.toLowerCase();
    return lower.includes('price') || lower.includes('cost');
  };

  const isStatusColumn = (colName: string) => {
    return colName.toLowerCase() === 'status';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[calc(100vh-250px)]">
      <div className="overflow-auto flex-1">
        <table className="w-full text-left text-sm text-gray-600 border-collapse">
          <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-100">
            <tr>
              {columns.map((col, index) => (
                <th 
                  key={index} 
                  className={`px-6 py-4 whitespace-nowrap ${
                    index === 0 
                      ? 'sticky left-0 z-20 bg-gray-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' 
                      : ''
                  } sticky top-0 bg-gray-50 z-10`}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.map((product) => {
              const isBelowRestock = product.availableStock <= product.restockLevel;
              const stockPercentage = Math.min(100, (product.availableStock / maxStock) * 100); 
              
              let StatusIcon = CheckCircle;
              let statusColor = 'text-green-500';
              let statusBg = 'bg-green-50';

              if (product.availableStock === 0) {
                StatusIcon = XCircle;
                statusColor = 'text-red-500';
                statusBg = 'bg-red-50';
              } else if (isBelowRestock) {
                StatusIcon = AlertTriangle;
                statusColor = 'text-amber-500';
                statusBg = 'bg-amber-50';
              }

              return (
                <tr key={product.id} className={`hover:bg-gray-50 transition-colors ${isBelowRestock ? 'bg-amber-50/10' : ''}`}>
                  {columns.map((col, index) => {
                    const value = product.rowData[col];

                    // Render First Column (Sticky Product Name)
                    if (index === 0) {
                      return (
                        <td 
                          key={`${product.id}-${index}`} 
                          className="px-6 py-4 font-medium text-gray-900 sticky left-0 z-10 bg-white border-r border-gray-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]"
                        >
                          {value}
                        </td>
                      );
                    }

                    // Special Rendering: Stock Progress Bar
                    if (isStockColumn(col)) {
                      return (
                        <td key={`${product.id}-${index}`} className="px-6 py-4 min-w-[200px]">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold w-8 text-right">{value}</span>
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${isBelowRestock ? 'bg-amber-400' : 'bg-brand-500'}`}
                                style={{ width: `${stockPercentage}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      );
                    }

                    // Special Rendering: Price
                    if (isPriceColumn(col)) {
                      return (
                         <td key={`${product.id}-${index}`} className="px-6 py-4 font-mono text-gray-700">
                           {typeof value === 'number' || !isNaN(parseFloat(String(value).replace(/[^0-9.-]+/g,""))) 
                              ? `$${Number(String(value).replace(/[^0-9.-]+/g,"")).toFixed(2)}` 
                              : value}
                         </td>
                      );
                    }

                    // Special Rendering: Status (if explicit status column exists or we fallback to our calc)
                    if (isStatusColumn(col)) {
                         return (
                            <td key={`${product.id}-${index}`} className="px-6 py-4">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusBg} ${statusColor}`}>
                                <StatusIcon size={12} />
                                {value}
                                </span>
                            </td>
                         );
                    }

                    // Default Text Rendering
                    return (
                      <td key={`${product.id}-${index}`} className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {value}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {data.length === 0 && (
        <div className="p-8 text-center text-gray-400">No stock data available.</div>
      )}
    </div>
  );
};

export default StockTable;