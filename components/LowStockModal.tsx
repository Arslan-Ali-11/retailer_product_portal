import React from 'react';
import { X, AlertTriangle, XCircle, Package, CheckCircle } from 'lucide-react';
import { Product } from '../types';

interface LowStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  title?: string;
  variant?: 'neutral' | 'warning' | 'critical';
}

export const LowStockModal: React.FC<LowStockModalProps> = ({ 
  isOpen, 
  onClose, 
  products, 
  title = "Items", 
  variant = 'neutral' 
}) => {
  if (!isOpen) return null;

  // Determine header styles based on variant
  let HeaderIcon = Package;
  let headerColor = "text-indigo-600";
  let headerBg = "bg-indigo-50";

  if (variant === 'warning') {
    HeaderIcon = AlertTriangle;
    headerColor = "text-amber-600";
    headerBg = "bg-amber-50";
  } else if (variant === 'critical') {
    HeaderIcon = AlertTriangle;
    headerColor = "text-red-600";
    headerBg = "bg-red-50";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${headerBg} ${headerColor}`}>
              <HeaderIcon size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{title}</h2>
              <p className="text-sm text-gray-500">{products.length} items found</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-0">
          {products.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              No items found.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 font-medium sticky top-0 shadow-sm">
                <tr>
                  <th className="px-6 py-3 bg-gray-50">Product Name</th>
                  <th className="px-6 py-3 bg-gray-50">Status</th>
                  <th className="px-6 py-3 text-right bg-gray-50">Available</th>
                  <th className="px-6 py-3 text-right bg-gray-50">Restock Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((p) => {
                  let StatusIcon = CheckCircle;
                  let badgeClass = "bg-green-100 text-green-700";

                  if (p.status === 'Out of Stock') {
                    StatusIcon = XCircle;
                    badgeClass = "bg-red-100 text-red-700";
                  } else if (p.status === 'Low Stock') {
                    StatusIcon = AlertTriangle;
                    badgeClass = "bg-amber-100 text-amber-700";
                  }

                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{p.productName}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${badgeClass}`}>
                          <StatusIcon size={12} />
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-gray-600">{p.availableStock}</td>
                      <td className="px-6 py-4 text-right font-mono text-gray-400">{p.restockLevel}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium shadow-sm transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};