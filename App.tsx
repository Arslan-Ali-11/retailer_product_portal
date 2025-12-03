import React, { useState, useEffect, useCallback } from 'react';
import { Package, AlertTriangle, DollarSign, AlertOctagon, RefreshCw } from 'lucide-react';
import { Product, DashboardMetrics } from './types';
import { fetchStockData, triggerRestockWebhook } from './services/api';
import Sidebar from './components/Sidebar';
import MetricCard from './components/MetricCard';
import StockTable from './components/StockTable';
import { LowStockModal } from './components/LowStockModal';

function App() {
  const [data, setData] = useState<Product[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({ totalProducts: 0, lowStockItems: 0, stockValue: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [restocking, setRestocking] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // UI State - Manages which products to show in the modal, its title, and style variant
  const [modalState, setModalState] = useState<{ 
    isOpen: boolean; 
    title: string; 
    products: Product[];
    variant: 'neutral' | 'warning' | 'critical';
  }>({
    isOpen: false,
    title: '',
    products: [],
    variant: 'neutral'
  });

  // Derived state for alerts and lists
  const criticalItems = data.filter(p => p.availableStock <= 10);
  const lowStockList = data.filter(p => p.status === 'Low Stock' || p.status === 'Out of Stock');

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 5000); 
  }, []);

  const openModal = (title: string, products: Product[], variant: 'neutral' | 'warning' | 'critical' = 'neutral') => {
    setModalState({ isOpen: true, title, products, variant });
  };

  const closeModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  };

  const calculateMetrics = (products: Product[]) => {
    const totalProducts = products.length;
    const lowStockItems = products.filter(p => p.status === 'Low Stock' || p.status === 'Out of Stock').length;
    const stockValue = products.reduce((sum, p) => sum + (p.availableStock * p.price), 0);
    
    setMetrics({ totalProducts, lowStockItems, stockValue });
  };

  // Pure data fetching function - strictly for Google Sheets
  const loadData = useCallback(async (isAuto = false) => {
    if (!isAuto) setRefreshing(true);
    
    try {
      setError(null);
      // ONLY fetch stock data. Do NOT trigger any other side effects or webhooks here.
      const result = await fetchStockData();
      
      setData(result.products);
      setColumns(result.columns);
      calculateMetrics(result.products);
      
      if (!isAuto && !loading) showToast("Data refreshed from Google Sheets");
    } catch (error: any) {
      console.error("Failed to fetch data", error);
      const msg = error.message || "Failed to load data. Check console.";
      setError(msg);
      // We only toast on auto-refresh or if data is already loaded, otherwise we show the big error card
      if (isAuto || data.length > 0) showToast(msg);
    } finally {
      if (!isAuto) setRefreshing(false);
      setLoading(false);
    }
  }, [loading, showToast, data.length]);

  // Initial Load
  useEffect(() => {
    loadData(true);
  }, [loadData]);

  // Auto Refresh Interval Logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (autoRefresh) {
      console.log("Auto-refresh enabled: polling Google Sheets every 30s");
      interval = setInterval(() => {
        // We strictly call loadData(true) which only fetches from Sheets
        loadData(true);
      }, 30000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, loadData]);

  // Manual Restock Handler - This is the ONLY place the webhook is called
  const handleRestockRequest = async () => {
    const lowItems = data.filter(p => p.status !== 'In Stock');
    
    if (lowItems.length === 0) {
      showToast("No items need restocking right now.");
      return;
    }

    setRestocking(true);
    try {
      // Trigger Webhook ONLY here
      await triggerRestockWebhook(lowItems);
      showToast(`Restock request sent for ${lowItems.length} items successfully!`);
    } catch (error) {
      showToast("Failed to send restock request. Check network tab.");
    } finally {
      setRestocking(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      <Sidebar 
        onRefresh={() => loadData(false)}
        isRefreshing={refreshing}
        autoRefresh={autoRefresh}
        onToggleAutoRefresh={setAutoRefresh}
        onRequestRestock={handleRestockRequest}
        isRestocking={restocking}
      />

      <main className="flex-1 p-6 md:p-12 overflow-y-auto w-full">
        <div className="max-w-full space-y-8">
          
          {/* Critical Alert Banner */}
          {criticalItems.length > 0 && !loading && !error && (
            <div 
              onClick={() => openModal('Critical Items (≤10)', criticalItems, 'critical')}
              className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r shadow-sm flex items-start gap-4 cursor-pointer hover:bg-red-100 transition-colors group"
              role="button"
              tabIndex={0}
              aria-label="View critical stock items"
            >
              <AlertOctagon className="text-red-500 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" size={24} />
              <div>
                <h3 className="text-red-800 font-bold flex items-center gap-2">
                  Critical Stock Alert
                  <span className="text-xs font-normal bg-red-200 text-red-800 px-2 py-0.5 rounded-full">Click to view</span>
                </h3>
                <p className="text-red-700 text-sm mt-1">
                  The following items have critically low stock (≤ 10): 
                  <span className="font-semibold"> {criticalItems.map(i => i.productName).join(', ')}</span>
                </p>
              </div>
            </div>
          )}

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard 
              title="Total Products" 
              value={metrics.totalProducts} 
              icon={Package} 
              color="text-indigo-600 bg-indigo-50"
              trend="Click to view full inventory"
              onClick={() => openModal('Full Inventory List', data, 'neutral')}
            />
            <MetricCard 
              title="Low Stock Items" 
              value={metrics.lowStockItems} 
              icon={AlertTriangle} 
              color="text-amber-600 bg-amber-50"
              trend="Click to view details"
              onClick={() => openModal('Low Stock Items', lowStockList, 'warning')}
            />
            <MetricCard 
              title="Total Stock Value" 
              value={`$${metrics.stockValue.toLocaleString()}`} 
              icon={DollarSign} 
              color="text-emerald-600 bg-emerald-50"
            />
          </div>

          {/* Main Data View */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Inventory Status</h2>
              <span className="text-xs text-gray-400">
                Last updated: {new Date().toLocaleTimeString()}
              </span>
            </div>
            
            {loading ? (
              <div className="h-64 flex items-center justify-center bg-white rounded-xl border border-gray-100">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-100 rounded-xl p-8 text-center shadow-sm">
                <div className="inline-flex p-3 rounded-full bg-red-100 mb-4">
                  <AlertTriangle className="text-red-600" size={32} />
                </div>
                <h3 className="text-lg font-bold text-red-900 mb-2">Connection Error</h3>
                <div className="text-red-700 mb-6 max-w-lg mx-auto whitespace-pre-line leading-relaxed">
                  {error}
                </div>
                <button 
                  onClick={() => loadData(false)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors shadow-sm"
                >
                  <RefreshCw size={18} />
                  Retry Connection
                </button>
              </div>
            ) : (
              <StockTable data={data} columns={columns} />
            )}
          </div>
        </div>
      </main>

      {/* Popups and Toasts */}
      <LowStockModal 
        isOpen={modalState.isOpen} 
        onClose={closeModal} 
        products={modalState.products}
        title={modalState.title}
        variant={modalState.variant}
      />

      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom-5 fade-in duration-300 z-50">
          <div className={`w-2 h-2 rounded-full ${toastMessage.includes("Error") || toastMessage.includes("Denied") || toastMessage.includes("Failed") ? "bg-red-400" : "bg-brand-400"}`} />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default App;