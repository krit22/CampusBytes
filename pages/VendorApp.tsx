
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { db } from '../services/storage';
import { Order, OrderStatus, PaymentStatus, MenuItem, CartItem } from '../types';
import { 
  RefreshCw, Lock, Clock, BellRing, ChefHat, Search, Menu as MenuIcon, BarChart3, Plus, Trash2, ClipboardList, Moon, Sun, ShieldAlert, Utensils
} from 'lucide-react';

// COMPONENTS
import { ConfirmationModal, ConfirmConfig } from '../components/shared/ConfirmationModal';
import { ToastNotification, ToastState } from '../components/shared/ToastNotification';
import { SecurityPanel } from '../components/vendor/SecurityPanel';
import { ManualOrderModal } from '../components/vendor/ManualOrderModal';
import { AddMenuItemModal } from '../components/vendor/AddMenuItemModal';
import { StatsDashboard } from '../components/vendor/StatsDashboard';
import { OrderCard } from '../components/vendor/OrderCard';

// HOOKS
import { useAudio } from '../hooks/useAudio';

export const VendorApp: React.FC = () => {
  // --- STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [showStats, setShowStats] = useState(false);
  const [showAddMenuModal, setShowAddMenuModal] = useState(false);
  const [showManualOrderModal, setShowManualOrderModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  
  // Confirmation Modal State
  const [confirmConfig, setConfirmConfig] = useState<ConfirmConfig>({ 
      isOpen: false, title: '', message: '', onConfirm: () => {}, type: 'NEUTRAL' 
  });

  // Helper for requesting confirmation
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
  const [activeTab, setActiveTab] = useState<string>('NEW');
  const [menuSearch, setMenuSearch] = useState('');
  const [menuCatFilter, setMenuCatFilter] = useState('All');
  const categoryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const { playSound } = useAudio();

  // --- AUTH & INIT ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '1234') {
      setIsAuthenticated(true);
      loadData();
    } else {
      alert('Invalid PIN (Try 1234)');
      setPin('');
    }
  };

  const loadData = async () => {
    const items = await db.getMenu();
    setMenu(items);
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

  const toggleItem = async (item: MenuItem) => {
    const newStatus = !item.isAvailable;
    setMenu(prev => prev.map(m => m.id === item.id ? { ...m, isAvailable: newStatus } : m));
    try {
      await db.updateMenuItemStatus(item.id, newStatus);
    } catch (e) {
      console.error("Failed to toggle item", e);
      setMenu(prev => prev.map(m => m.id === item.id ? { ...m, isAvailable: !newStatus } : m));
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
    if (activeTab === 'HISTORY') {
      return orders.filter(o => o.status === OrderStatus.DELIVERED || o.status === OrderStatus.CANCELLED);
    }
    if (activeTab === 'MENU' || activeTab === 'SECURITY') return [];
    return orders.filter(o => o.status === activeTab);
  }, [orders, activeTab]);

  const counts = useMemo(() => ({
    NEW: orders.filter(o => o.status === OrderStatus.NEW).length,
    COOKING: orders.filter(o => o.status === OrderStatus.COOKING).length,
    READY: orders.filter(o => o.status === OrderStatus.READY).length,
    HISTORY: orders.filter(o => o.status === OrderStatus.DELIVERED).length
  }), [orders]);

  const revenue = useMemo(() => 
    orders.filter(o => o.paymentStatus === PaymentStatus.PAID).reduce((acc, curr) => acc + curr.totalAmount, 0), 
  [orders]);

  const menuCategories = useMemo(() => 
    ['All', ...Array.from(new Set(menu.map(m => m.category))).sort()], 
  [menu]);

  const scrollToCat = (cat: string) => {
    setMenuCatFilter(cat);
    if (cat !== 'All' && categoryRefs.current[cat]) {
        categoryRefs.current[cat]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center">
          <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-900/40">
            <Lock className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-black text-white mb-2">Vendor Portal</h1>
          <p className="text-slate-500 mb-8 text-sm font-mono">System v4.0 (Operations)</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" 
              value={pin}
              onChange={e => setPin(e.target.value)}
              placeholder="Enter PIN (1234)"
              className="w-full bg-slate-950 border border-slate-800 text-white text-center text-2xl font-bold tracking-widest py-4 rounded-xl focus:border-orange-500 focus:ring-0 outline-none transition-all placeholder:text-slate-800 placeholder:text-base placeholder:tracking-normal placeholder:font-normal"
              autoFocus
              inputMode="numeric"
            />
            <button type="submit" className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-4 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-orange-900/20">
              Access Dashboard
            </button>
          </form>
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

      {/* HEADER */}
      <header className="bg-slate-900 dark:bg-slate-900 text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-orange-600 p-1.5 rounded-lg">
              <ChefHat size={20} />
            </div>
            <div>
              <h1 className="font-bold leading-none">CampusBytes</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-mono text-slate-400">VENDOR</span>
                <span className="text-[9px] bg-green-900 text-green-400 px-1.5 rounded border border-green-800">v4.0</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
             <button 
               onClick={() => setDarkMode(!darkMode)}
               className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-yellow-400 transition-colors border border-slate-700"
               title="Toggle Theme"
             >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
             </button>
             <button 
                onClick={() => setShowStats(true)}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors group"
             >
                <BarChart3 size={14} className="text-orange-400 group-hover:scale-110 transition-transform" /> 
                <span className="font-mono font-bold text-sm text-white hidden sm:inline">Stats</span>
             </button>
             <button 
               onClick={() => window.location.reload()}
               className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 transition-colors"
             >
                <RefreshCw size={18} />
             </button>
          </div>
        </div>

        {/* DESKTOP NAV */}
        <div className="hidden sm:flex bg-slate-950 justify-center border-t border-slate-800">
           {['NEW', 'COOKING', 'READY', 'HISTORY', 'MENU', 'SECURITY'].map(tab => (
             <DesktopTab 
               key={tab} 
               id={tab} 
               active={activeTab} 
               onClick={setActiveTab} 
               count={counts[tab as keyof typeof counts] || 0} 
             />
           ))}
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full p-4">
        {activeTab === 'SECURITY' ? (
            <SecurityPanel requestConfirm={requestConfirm} />
        ) : activeTab === 'MENU' ? (
          <div className="animate-in fade-in duration-300 space-y-4">
            <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 sticky top-[70px] sm:top-16 z-20 transition-colors">
               <div className="relative mb-4">
                 <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
                 <input 
                   type="text" 
                   placeholder="Search items..." 
                   value={menuSearch} 
                   onChange={e => setMenuSearch(e.target.value)}
                   className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 outline-none font-medium transition-all text-slate-900 dark:text-white"
                 />
               </div>
               <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                 {menuCategories.map(cat => (
                   <button
                     key={cat}
                     onClick={() => scrollToCat(cat)}
                     className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${menuCatFilter === cat ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                   >
                     {cat}
                   </button>
                 ))}
               </div>
            </div>

            <div className="flex justify-end">
                <button 
                    onClick={() => setShowAddMenuModal(true)}
                    className="bg-slate-900 dark:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-slate-800 dark:hover:bg-orange-500 transition-colors shadow-lg shadow-slate-200 dark:shadow-none"
                >
                    <Plus size={18} /> Add New Item
                </button>
            </div>

            <div className="space-y-6">
               {menuCategories.filter(c => c !== 'All').map(cat => {
                 const items = menu.filter(m => 
                   m.category === cat && 
                   m.name.toLowerCase().includes(menuSearch.toLowerCase()) &&
                   (menuCatFilter === 'All' || menuCatFilter === cat)
                 );
                 
                 if (items.length === 0) return null;

                 return (
                   <div key={cat} ref={el => { categoryRefs.current[cat] = el; }}>
                      <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-2 ml-1">{cat}</h3>
                      <div className="bg-white dark:bg-slate-850 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden transition-colors">
                         {items.map(item => (
                           <div key={item.id} className={`p-4 flex justify-between items-center transition-colors ${!item.isAvailable ? 'bg-slate-50/80 dark:bg-slate-900/50' : ''}`}>
                              <div className="flex items-center gap-4">
                                <div className={!item.isAvailable ? 'opacity-50' : ''}>
                                    <h4 className="font-bold text-slate-800 dark:text-white">{item.name}</h4>
                                    <p className="text-sm text-slate-500 font-medium">₹{item.price}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-4">
                                  <button 
                                    onClick={() => toggleItem(item)}
                                    className={`relative w-14 h-8 rounded-full transition-colors ${item.isAvailable ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                                  >
                                    <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${item.isAvailable ? 'translate-x-6' : 'translate-x-0'}`} />
                                  </button>
                                  
                                  <button
                                    onClick={() => handleDeleteItem(item.id)}
                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                    title="Delete Item"
                                  >
                                      <Trash2 size={18} />
                                  </button>
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                 );
               })}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {activeTab === 'NEW' && (
                <button 
                    onClick={() => setShowManualOrderModal(true)}
                    className="w-full bg-slate-800 dark:bg-slate-800 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-md active:scale-[0.99] transition-transform hover:bg-slate-700 border border-slate-700"
                >
                    <ClipboardList size={20} /> Take Manual Order (Walk-in)
                </button>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOrders.length === 0 ? (
                <div className="col-span-full text-center py-20 text-slate-400">
                    <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Clock size={30} />
                    </div>
                    <p className="font-medium">No orders in this stage.</p>
                </div>
                ) : (
                    filteredOrders.map(order => (
                        <OrderCard 
                            key={order.id}
                            order={order}
                            currentTime={currentTime}
                            updateStatus={updateStatus}
                            updatePayment={updatePayment}
                            completeOrder={completeOrder}
                            requestConfirm={requestConfirm}
                        />
                    ))
                )}
            </div>
          </div>
        )}
      </main>

      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-50 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.05)] transition-colors">
        <div className="grid grid-cols-6 h-16">
           <MobileTab id="NEW" icon={BellRing} label="Pending" active={activeTab} onClick={setActiveTab} count={counts.NEW} />
           <MobileTab id="COOKING" icon={ChefHat} label="Kitchen" active={activeTab} onClick={setActiveTab} count={counts.COOKING} />
           <MobileTab id="READY" icon={Utensils} label="Serve" active={activeTab} onClick={setActiveTab} count={counts.READY} />
           <MobileTab id="HISTORY" icon={Clock} label="History" active={activeTab} onClick={setActiveTab} count={0} />
           <MobileTab id="MENU" icon={MenuIcon} label="Menu" active={activeTab} onClick={setActiveTab} count={0} />
           <MobileTab id="SECURITY" icon={ShieldAlert} label="Security" active={activeTab} onClick={setActiveTab} count={0} />
        </div>
      </nav>

    </div>
  );
};

const DesktopTab = ({ id, active, onClick, count }: { id: string, active: string, onClick: (id: string) => void, count: number }) => (
   <button 
     onClick={() => onClick(id)}
     className={`relative px-8 py-4 font-bold text-sm tracking-wide transition-all border-b-4 ${active === id ? 'border-orange-500 text-white bg-slate-900' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'}`}
   >
     {id}
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
