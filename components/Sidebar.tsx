import React from 'react';
import { RefreshCw, Zap, Truck, Package, Database } from 'lucide-react';

interface SidebarProps {
  onRefresh: () => void;
  isRefreshing: boolean;
  autoRefresh: boolean;
  onToggleAutoRefresh: (checked: boolean) => void;
  onRequestRestock: () => void;
  isRestocking: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  onRefresh, 
  isRefreshing, 
  autoRefresh, 
  onToggleAutoRefresh, 
  onRequestRestock,
  isRestocking
}) => {
  return (
    <div className="w-full md:w-64 bg-white border-r border-gray-200 h-screen sticky top-0 flex flex-col">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-2 text-brand-600">
          <Package size={28} className="text-brand-600" />
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Retailer Portal</h1>
        </div>
      </div>

      <div className="p-6 flex-1 space-y-8">
        {/* Controls Section */}
        <div className="space-y-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Controls</h2>
          
          <button 
            onClick={onRefresh}
            disabled={isRefreshing}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg border border-gray-200 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>

          <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer select-none">
            <div className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={autoRefresh}
                onChange={(e) => onToggleAutoRefresh(e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
            </div>
            <span className="text-sm font-medium text-gray-700">Auto-refresh (30s)</span>
          </label>
        </div>

        {/* Actions Section */}
        <div className="space-y-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</h2>
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-sm text-blue-800 mb-3 leading-relaxed">
              Found low stock items? Trigger a restock request via N8N manually.
            </p>
            <button 
              onClick={onRequestRestock}
              disabled={isRestocking}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg shadow-sm hover:shadow transition-all font-medium disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isRestocking ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Truck size={18} />
              )}
              {isRestocking ? 'Sending...' : 'Request Restock'}
            </button>
          </div>
        </div>
      </div>
      
      <div className="p-6 border-t border-gray-100 space-y-2">
        <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium bg-emerald-50 p-2 rounded">
          <Database size={12} />
          <span>Google Sheets Connected</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Zap size={14} className="fill-current" />
          <span>Powered by React</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;