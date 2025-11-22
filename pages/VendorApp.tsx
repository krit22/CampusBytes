
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { db } from '../services/storage';
import { Order, OrderStatus, PaymentStatus, MenuItem } from '../types';
import { 
  RefreshCw, Lock, Clock, BellRing, ChefHat, Utensils, Grid, ClipboardList, TestTube 
} from 'lucide-react';

// COMPONENTS
import { ConfirmationModal, ConfirmConfig } from '../components/shared/ConfirmationModal';
import { ToastNotification, ToastState } from '../components/shared/ToastNotification';
import { SecurityPanel } from '../components/vendor/SecurityPanel';
import { ManualOrderModal } from '../components/vendor/ManualOrderModal';
import { AddMenuItemModal } from '../components/vendor/AddMenuItemModal';
import { StatsDashboard } from '../components/vendor/StatsDashboard';
import { OrderCard } from '../components/vendor/OrderCard';
import { MenuList } from '../components/vendor/MenuList';
import { MoreMenu } from '../components/vendor/MoreMenu';
import { SettingsPanel } from '../components/vendor/SettingsPanel';

// HOOKS
import { useAudio } from '../hooks/useAudio';

// --- HELPER COMPONENTS (Moved Outside to prevent re-mounting) ---

interface OrderGridProps {
  orders: Order[];
  currentTime: number;
  updateStatus: (id: string, status: OrderStatus) => void;
  updatePayment: (id: string, status: PaymentStatus) => void;
  completeOrder: (order: Order) => void;
  requestConfirm: (title: string, message: string, action: () => void, type: 'DANGER' | 'NEUTRAL') => void;
}

const OrderGrid: React.FC<OrderGridProps> = ({ orders, currentTime, updateStatus, updatePayment, completeOrder, requestConfirm }) => {
    if (orders.length === 0) {
        return (
          <div className="col-span-full text-center py-20 text-slate-400">
              <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock size={30} />
              </div>
              <p className="font-medium">No orders in this stage.</p>
          </div>
        );
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map(order => (
              <OrderCard 
                  key={order.id} order={order} currentTime={currentTime}
                  updateStatus={updateStatus} updatePayment={updatePayment}
                  completeOrder={completeOrder} requestConfirm={requestConfirm}
              />
          ))}
      </div>
    );
};

const SubViewWrapper: React.FC<{ title: string; onBack: () => void; children: React.ReactNode }> = ({ title, onBack, children }) => {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
                <button onClick={onBack} className="p-2 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
                    <Grid size={20} className="dark:text-white" />
                </button>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">{title}</h2>
            </div>
            {children}
        </div>
    )
}

const DesktopTab: React.FC<{ id: string, active: string, onClick: (id: string) => void, count: number }> = ({ id, active, onClick, count }) => (
   <button 
     onClick={() => onClick(id)}
     className={`relative px-8 py-4 font-bold text-sm tracking-wide transition-all border-b-4 ${active === id ? 'border-orange-500 text-white bg-slate-900' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'}`}
   >
     {id === 'NEW' ? 'PENDING' : id}
     {count > 0 && (
       <span className={`ml-2 px-1.5 py-0.5 text-[10px] rounded-full ${active === id ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
         {count}
       </span>
     )}
   </button>
);

const MobileTab = ({ id, icon: Icon, label, active, onClick, count }: any) => (
  <button 
    onClick={() => onClick(id)}
    className={`flex flex-col items-center justify-center relative transition-colors ${active === id ? 'text-orange-600 dark:text-orange-500' : 'text-slate-400 dark:text-slate-600'}`}
  >
    <div className={`p-1 rounded-xl transition-all ${active === id ? 'bg-orange-50 dark:bg-orange-900/20' : ''}`}>
        <Icon size={active === id ? 22 : 20} strokeWidth={active === id ? 2.5 : 2} />
    </div>
    <span className="text-[10px] font-bold mt-0.5">{label}</span>
    {count > 0 && (
      <span className="absolute top-1 right-2 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full px-1 border border-white dark:border-slate-900">
        {count}
      </span>
    )}
  </button>
);

export const VendorApp: React.FC = () => {
  // --- STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [showStats, setShowStats] = useState(false);
  const [showAddMenuModal, setShowAddMenuModal] = useState(false);
  const [showManualOrderModal, setShowManualOrderModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [isShopOpen, setIsShopOpen] = useState(true);
  
  // Refresh State
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Confirmation Modal State
  const [confirmConfig, setConfirmConfig] = useState<ConfirmConfig>({ 
      isOpen: false, title: '', message: '', onConfirm: () => {}, type: 'NEUTRAL' 
  });

  // TEST MODE DETECTION
  const isTestMode = import.meta.env?.DEV ?? false;

  const requestConfirm = (title: string, message: string, action: () => void, type: 'DANGER' | 'NEUTRAL' = 'NEUTRAL') => {
      setConfirmConfig({ isOpen: true, title, message, onConfirm: action, type });
  };
  
  // DARK MODE STATE
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('cb_vendor_theme');
        if (saved) return saved === 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const [toast, setToast] = useState<ToastState | null>(null);
  const prevOrderStatusMap = useRef<Map<string, OrderStatus>>(new Map());
  
  // TABS: NEW, COOKING, READY, MORE (MORE contains History, Menu, Security)
  const [activeTab, setActiveTab] = useState<string>('NEW');
  const [subTab, setSubTab] = useState<string | null>(null); // Used when inside "MORE"

  const { playSound } = useAudio();

  // --- AUTH & INIT ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    
    try {
      const success = await db.vendorLogin(password);
      if (success) {
        setIsAuthenticated(true);
        loadData();
      } else {
        alert('Invalid Password');
        setPassword('');
      }
    } catch (e) {
      console.error("Login failed", e);
      alert("Connection Error");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const loadData = async () => {
    try {
        const [items, settings] = await Promise.all([
            db.getMenu(),
            db.getSystemSettings()
        ]);
        setMenu(items);
        setIsShopOpen(settings.isShopOpen !== false);
    } catch (e) {
        console.error("Failed to load initial data", e);
    }
  };

  const handleRefresh = async () => {
      setIsRefreshing(true);
      try {
          await loadData(); // Reload Menu & Settings
          const latestOrders = await db.getOrders(); // Force fetch orders
          setOrders([...latestOrders].sort((a, b) => b.createdAt - a.createdAt));
      } catch (e) {
          console.error("Refresh failed", e);
          setToast({ msg: "Failed to refresh data", type: 'CANCEL' }); // Reusing CANCEL style for error
          setTimeout(() => setToast(null), 3000);
      } finally {
          // Min 500ms delay for visual feedback
          setTimeout(() => setIsRefreshing(false), 500);
      }
  };

  const toggleShopStatus = async () => {
      const newState = !isShopOpen;
      setIsShopOpen(newState);
      try {
          await db.toggleShopStatus(newState);
      } catch (e) {
          setIsShopOpen(!newState); // revert
          alert("Failed to update shop status");
      }
  };

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 60000); 
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (darkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('cb_vendor_theme', 'dark');
    } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('cb_vendor_theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    if (isAuthenticated) {
      const unsubscribe = db.subscribeToOrders((newOrders) => {
        setOrders([...newOrders].sort((a, b) => b.createdAt - a.createdAt));
      });
      return () => unsubscribe();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (orders.length === 0) return;

    const currentStatusMap = new Map(orders.map(o => [o.id, o.status]));
    const isFirstRun = prevOrderStatusMap.current.size === 0;

    if (!isFirstRun) {
        orders.forEach(order => {
            const prevStatus = prevOrderStatusMap.current.get(order.id);
            if (!prevStatus && order.status === OrderStatus.NEW) {
                if (order.customerId !== 'vendor_manual') {
                    playSound('NEW');
                    setToast({ msg: `New Order: ${order.token}`, type: 'NEW' });
                    setTimeout(() => setToast(null), 5000);
                }
            }
            if (prevStatus && prevStatus !== OrderStatus.CANCELLED && order.status === OrderStatus.CANCELLED) {
                playSound('CANCEL');
                setToast({ msg: `Order Cancelled: ${order.token}`, type: 'CANCEL' });
                setTimeout(() => setToast(null), 5000);
            }
        });
    }
    prevOrderStatusMap.current = currentStatusMap;
  }, [orders, playSound]);

  // --- ACTIONS ---
  const updateStatus = async (orderId: string, status: OrderStatus) => {
    const previousOrders = [...orders];
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    try {
      await db.updateOrderStatus(orderId, status);
    } catch (error) {
      console.error("Failed to update status", error);
      setOrders(previousOrders);
      alert("Connection failed. Changes reverted.");
    }
  };

  const updatePayment = async (orderId: string, status: PaymentStatus) => {
    const previousOrders = [...orders];
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, paymentStatus: status } : o));
    try {
      await db.updatePaymentStatus(orderId, status);
    } catch (error) {
      console.error("Failed to update payment", error);
      setOrders(previousOrders);
      alert("Connection failed. Changes reverted.");
    }
  };

  const completeOrder = async (order: Order) => {
    const previousOrders = [...orders];
    setOrders(prev => prev.map(o => {
      if (o.id === order.id) {
        return { ...o, paymentStatus: PaymentStatus.PAID, status: OrderStatus.DELIVERED };
      }
      return o;
    }));
    try {
      if (order.paymentStatus !== PaymentStatus.PAID) {
        await db.updatePaymentStatus(order.id, PaymentStatus.PAID);
      }
      await db.updateOrderStatus(order.id, OrderStatus.DELIVERED);
    } catch (error) {
      console.error("Failed to complete order", error);
      setOrders(previousOrders);
      alert("Connection failed. Changes reverted.");
    }
  };

  const handleUpdateMenuItem = async (item: MenuItem, updates: Partial<MenuItem>) => {
    setMenu(prev => prev.map(m => m.id === item.id ? { ...m, ...updates } : m));
    try {
      await db.updateMenuItem(item.id, updates);
    } catch (e) {
      console.error("Failed to update item", e);
      setMenu(prev => prev.map(m => m.id === item.id ? item : m));
      alert("Failed to update menu item.");
    }
  };
  
  const handleAddItem = async (newItem: Partial<MenuItem>) => {
     try {
        await db.addMenuItem(newItem);
        await loadData(); 
        setShowAddMenuModal(false);
     } catch (e) {
        alert("Failed to add item.");
     }
  };
  
  const handleManualOrder = async (customerName: string, items: any[], total: number, paymentStatus: PaymentStatus) => {
     try {
        await db.createManualOrder(customerName, items, total, paymentStatus);
        setShowManualOrderModal(false);
     } catch (e) {
        alert("Failed to create manual order.");
     }
  };

  const handleDeleteItem = (itemId: string) => {
    requestConfirm(
        "Delete Item",
        "Are you sure you want to delete this item permanently? This cannot be undone.",
        async () => {
            try {
                await db.deleteMenuItem(itemId);
                setMenu(prev => prev.filter(m => m.id !== itemId));
            } catch (e) {
                alert("Failed to delete item.");
            }
        },
        'DANGER'
    );
  };

  const filteredOrders = useMemo(() => {
    // HISTORY is now handled in the sub-component logic or explicitly when filtering
    if (subTab === 'HISTORY') {
      return orders.filter(o => o.status === OrderStatus.DELIVERED || o.status === OrderStatus.CANCELLED);
    }
    if (activeTab === 'MORE') return [];
    return orders.filter(o => o.status === activeTab);
  }, [orders, activeTab, subTab]);

  const counts = useMemo(() => ({
    NEW: orders.filter(o => o.status === OrderStatus.NEW).length,
    COOKING: orders.filter(o => o.status === OrderStatus.COOKING).length,
    READY: orders.filter(o => o.status === OrderStatus.READY).length,
  }), [orders]);

  const revenue = useMemo(() => 
    orders.filter(o => o.paymentStatus === PaymentStatus.PAID).reduce((acc, curr) => acc + curr.totalAmount, 0), 
  [orders]);

  const menuCategories = useMemo(() => 
    ['All', ...Array.from(new Set(menu.map(m => m.category))).sort()], 
  [menu]);

  // --- NAV HANDLERS ---
  const handleMainTabChange = (tab: string) => {
      setActiveTab(tab);
      setSubTab(null); // Reset sub-tab when switching main tabs
  };

  const handleMoreNavigate = (feature: string) => {
      setSubTab(feature);
  };


  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center relative overflow-hidden">
          {/* TEST MODE INDICATOR ON LOGIN */}
          {isTestMode && (
             <div className="absolute top-0 right-0 bg-yellow-400 text-slate-900 text-xs font-black px-3 py-1 rounded-bl-xl shadow-md z-10">
                TEST MODE
             </div>
          )}

          <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-900/40">
            <Lock className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-black text-white mb-2">Vendor Portal</h1>
          <p className="text-slate-500 mb-8 text-sm font-mono">System v4.5 (Secure)</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter Password"
              className="w-full bg-slate-950 border border-slate-800 text-white text-center text-xl font-bold tracking-widest py-4 rounded-xl focus:border-orange-500 focus:ring-0 outline-none transition-all"
              autoFocus
            />
            <button 
              type="submit" 
              disabled={isLoggingIn}
              className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-4 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-orange-900/20 disabled:opacity-70"
            >
              {isLoggingIn ? 'Verifying...' : 'Access Dashboard'}
            </button>
          </form>
          
          {isTestMode && (
             <p className="mt-6 text-slate-600 text-xs font-mono">
                Dev Hint: Password is <span className="text-yellow-400 font-bold">123</span>
             </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 pb-24 sm:pb-0 flex flex-col relative transition-colors duration-300">
      
      <ConfirmationModal config={confirmConfig} onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))} />
      <ToastNotification toast={toast} onClose={() => setToast(null)} />

      {showStats && (
        <StatsDashboard orders={orders} revenue={revenue} onClose={() => setShowStats(false)} />
      )}

      {showAddMenuModal && (
          <AddMenuItemModal categories={menuCategories} onClose={() => setShowAddMenuModal(false)} onAdd={handleAddItem} />
      )}
      
      {showManualOrderModal && (
          <ManualOrderModal menu={menu} onClose={() => setShowManualOrderModal(false)} onOrder={handleManualOrder} />
      )}

      {/* CLEAN HEADER */}
      <header className="bg-slate-900 dark:bg-slate-900 text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-orange-600 p-1.5 rounded-lg">
              <ChefHat size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                  <h1 className="font-bold leading-none">CampusBytes</h1>
                  {isTestMode && (
                      <span className="bg-yellow-400 text-slate-900 text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-1">
                          <TestTube size={8} /> TEST
                      </span>
                  )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`w-2 h-2 rounded-full ${isShopOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                <span className="text-[10px] font-mono text-slate-400">{isShopOpen ? 'ONLINE' : 'CLOSED'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
             <button 
               onClick={handleRefresh}
               disabled={isRefreshing}
               className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 transition-colors disabled:opacity-50"
             >
                <RefreshCw size={18} className={isRefreshing ? 'animate-spin text-orange-500' : ''} />
             </button>
          </div>
        </div>

        {/* DESKTOP NAV (Only visible on large screens) */}
        <div className="hidden sm:flex bg-slate-950 justify-center border-t border-slate-800">
           {['NEW', 'COOKING', 'READY', 'MORE'].map(tab => (
             <DesktopTab 
               key={tab} 
               id={tab} 
               active={activeTab} 
               onClick={handleMainTabChange} 
               count={counts[tab as keyof typeof counts] || 0} 
             />
           ))}
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-5xl mx-auto w-full p-4">
        
        {/* 1. NEW ORDERS TAB */}
        {activeTab === 'NEW' && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                <button 
                    onClick={() => setShowManualOrderModal(true)}
                    className="w-full bg-slate-800 dark:bg-slate-800 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-md active:scale-[0.99] transition-transform hover:bg-slate-700 border border-slate-700"
                >
                    <ClipboardList size={20} /> Take Manual Order
                </button>
                <OrderGrid 
                  orders={filteredOrders}
                  currentTime={currentTime}
                  updateStatus={updateStatus}
                  updatePayment={updatePayment}
                  completeOrder={completeOrder}
                  requestConfirm={requestConfirm}
                />
            </div>
        )}

        {/* 2. KITCHEN / READY TABS */}
        {(activeTab === 'COOKING' || activeTab === 'READY') && (
            <div className="animate-in slide-in-from-right-4 duration-300">
                <OrderGrid 
                  orders={filteredOrders}
                  currentTime={currentTime}
                  updateStatus={updateStatus}
                  updatePayment={updatePayment}
                  completeOrder={completeOrder}
                  requestConfirm={requestConfirm}
                />
            </div>
        )}

        {/* 3. MORE TAB (The Hub) */}
        {activeTab === 'MORE' && (
            <div className="animate-in slide-in-from-right-4 duration-300">
                {subTab === null && (
                    <MoreMenu 
                        onNavigate={handleMoreNavigate}
                        onToggleShop={toggleShopStatus}
                        isShopOpen={isShopOpen}
                        onToggleTheme={() => setDarkMode(!darkMode)}
                        isDarkMode={darkMode}
                        onShowStats={() => setShowStats(true)}
                    />
                )}

                {/* SUB-VIEWS INSIDE 'MORE' */}
                {subTab === 'HISTORY' && (
                    <SubViewWrapper title="Order History" onBack={() => setSubTab(null)}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredOrders.map(order => (
                                <OrderCard 
                                    key={order.id} order={order} currentTime={currentTime}
                                    updateStatus={updateStatus} updatePayment={updatePayment}
                                    completeOrder={completeOrder} requestConfirm={requestConfirm}
                                />
                            ))}
                        </div>
                    </SubViewWrapper>
                )}

                {subTab === 'MENU' && (
                    <SubViewWrapper title="Menu Control" onBack={() => setSubTab(null)}>
                        <MenuList 
                            menu={menu}
                            onToggleStatus={handleUpdateMenuItem}
                            onDeleteItem={handleDeleteItem}
                            onAddClick={() => setShowAddMenuModal(true)}
                        />
                    </SubViewWrapper>
                )}

                {subTab === 'SECURITY' && (
                    <SubViewWrapper title="Security Center" onBack={() => setSubTab(null)}>
                        <SecurityPanel requestConfirm={requestConfirm} />
                    </SubViewWrapper>
                )}

                {subTab === 'SETTINGS' && (
                    <SubViewWrapper title="Settings" onBack={() => setSubTab(null)}>
                        <SettingsPanel onBack={() => setSubTab(null)} />
                    </SubViewWrapper>
                )}
            </div>
        )}

      </main>

      {/* MOBILE NAV (Fixed Bottom) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-50 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.05)] transition-colors">
        <div className="grid grid-cols-4 h-16">
           <MobileTab id="NEW" icon={BellRing} label="Pending" active={activeTab} onClick={handleMainTabChange} count={counts.NEW} />
           <MobileTab id="COOKING" icon={ChefHat} label="Kitchen" active={activeTab} onClick={handleMainTabChange} count={counts.COOKING} />
           <MobileTab id="READY" icon={Utensils} label="Serve" active={activeTab} onClick={handleMainTabChange} count={counts.READY} />
           <MobileTab id="MORE" icon={Grid} label="More" active={activeTab} onClick={handleMainTabChange} count={0} />
        </div>
      </nav>

    </div>
  );
};
