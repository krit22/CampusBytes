
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { db } from '../services/storage';
import { Order, OrderStatus, PaymentStatus, MenuItem, CartItem } from '../types';
import { 
  RefreshCw, Check, DollarSign, Lock, RotateCcw, ChevronRight, 
  CheckCircle2, Utensils, PackageCheck, Clock, BellRing, ChefHat, 
  Search, Menu as MenuIcon, BarChart3, X, AlertTriangle, Ban, Undo2,
  Timer, Plus, Trash2, TrendingUp, ClipboardList, Minus, Moon, Sun
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area
} from 'recharts';

// Robust Audio Player
const PLAY_SOUND = async (type: 'NEW' | 'CANCEL' = 'NEW') => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const audioContext = new AudioContextClass();
    
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    if (type === 'NEW') {
        // "Ding" effect (High pitch)
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(500, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1000, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.5);
    } else {
        // "Bomp" effect (Low pitch) for cancellation
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.4);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.4);
    }
  } catch (e) {
    console.error("Audio play failed", e);
  }
};

export const VendorApp: React.FC = () => {
  // --- STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [isMenuLoading, setIsMenuLoading] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showAddMenuModal, setShowAddMenuModal] = useState(false);
  const [showManualOrderModal, setShowManualOrderModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  
  // DARK MODE STATE
  const [darkMode, setDarkMode] = useState(() => {
    // Check localStorage or system preference
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('cb_vendor_theme');
        if (saved) return saved === 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // NOTIFICATIONS
  const [toast, setToast] = useState<{msg: string, type: 'NEW' | 'CANCEL'} | null>(null);
  
  // We track the status of every order to detect changes
  const prevOrderStatusMap = useRef<Map<string, OrderStatus>>(new Map());
  
  // TABS: 'NEW' | 'COOKING' | 'READY' | 'HISTORY' | 'MENU'
  const [activeTab, setActiveTab] = useState<string>('NEW');

  // MENU FILTERS
  const [menuSearch, setMenuSearch] = useState('');
  const [menuCatFilter, setMenuCatFilter] = useState('All');
  const categoryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

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
    setIsMenuLoading(true);
    const items = await db.getMenu();
    setMenu(items);
    setIsMenuLoading(false);
  };

  // Timer for Order Aging calculations
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Dark Mode Effect
  useEffect(() => {
    if (darkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('cb_vendor_theme', 'dark');
    } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('cb_vendor_theme', 'light');
    }
  }, [darkMode]);

  // Realtime Subscription
  useEffect(() => {
    if (isAuthenticated) {
      const unsubscribe = db.subscribeToOrders((newOrders) => {
        setOrders([...newOrders].sort((a, b) => b.createdAt - a.createdAt));
      });
      return () => unsubscribe();
    }
  }, [isAuthenticated]);

  // --- NOTIFICATION LOGIC ---
  useEffect(() => {
    if (orders.length === 0) return;

    const currentStatusMap = new Map(orders.map(o => [o.id, o.status]));
    const isFirstRun = prevOrderStatusMap.current.size === 0;

    if (!isFirstRun) {
        orders.forEach(order => {
            const prevStatus = prevOrderStatusMap.current.get(order.id);
            if (!prevStatus && order.status === OrderStatus.NEW) {
                // Skip notification for manual vendor orders to avoid self-spam
                if (order.customerId !== 'vendor_manual') {
                    PLAY_SOUND('NEW');
                    setToast({ msg: `New Order: ${order.token}`, type: 'NEW' });
                    setTimeout(() => setToast(null), 5000);
                }
            }
            if (prevStatus && prevStatus !== OrderStatus.CANCELLED && order.status === OrderStatus.CANCELLED) {
                PLAY_SOUND('CANCEL');
                setToast({ msg: `Order Cancelled: ${order.token}`, type: 'CANCEL' });
                setTimeout(() => setToast(null), 5000);
            }
        });
    }
    prevOrderStatusMap.current = currentStatusMap;
  }, [orders]);

  // --- HELPER: ORDER AGING STATUS ---
  const getOrderAgeStatus = (order: Order) => {
    if (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CANCELLED) return 'NORMAL';

    // Calculate elapsed time in minutes since last status update
    const elapsed = (currentTime - order.updatedAt) / 1000 / 60;

    if (order.status === OrderStatus.COOKING) {
        if (elapsed > 30) return 'CRITICAL'; // Red after 30m
        if (elapsed > 15) return 'WARNING'; // Yellow after 15m
    }
    
    if (order.status === OrderStatus.READY) {
        if (elapsed > 20) return 'CRITICAL'; // Red after 20m
        if (elapsed > 10) return 'WARNING'; // Yellow after 10m
    }

    return 'NORMAL';
  };

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
        await loadData(); // Refresh menu
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

  const handleDeleteItem = async (itemId: string) => {
    if(!confirm("Are you sure you want to delete this item permanently?")) return;
    try {
        await db.deleteMenuItem(itemId);
        setMenu(prev => prev.filter(m => m.id !== itemId));
    } catch (e) {
        alert("Failed to delete item.");
    }
  };

  // --- COMPUTED DATA ---
  const filteredOrders = useMemo(() => {
    if (activeTab === 'HISTORY') {
      return orders.filter(o => o.status === OrderStatus.DELIVERED || o.status === OrderStatus.CANCELLED);
    }
    if (activeTab === 'MENU') return [];
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

  // --- SCROLL HELPER ---
  const scrollToCat = (cat: string) => {
    setMenuCatFilter(cat);
    if (cat !== 'All' && categoryRefs.current[cat]) {
        categoryRefs.current[cat]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // --- RENDER: LOGIN SCREEN ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center">
          <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-900/40">
            <Lock className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-black text-white mb-2">Vendor Portal</h1>
          <p className="text-slate-500 mb-8 text-sm font-mono">System v3.4 (Operations)</p>
          
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

  // --- RENDER: DASHBOARD ---
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 pb-24 sm:pb-0 flex flex-col relative transition-colors duration-300">
      
      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-10 fade-in duration-300 w-full max-w-[90%] sm:max-w-sm">
          <div className={`p-4 rounded-2xl shadow-2xl flex items-center justify-between border ${toast.type === 'CANCEL' ? 'bg-red-900 text-white border-red-800' : 'bg-slate-900 text-white border-slate-800'}`}>
             <div className="flex items-center gap-3">
               <div className={`p-2 rounded-full animate-pulse ${toast.type === 'CANCEL' ? 'bg-red-500' : 'bg-orange-500'}`}>
                 {toast.type === 'CANCEL' ? <AlertTriangle size={20} className="text-white" /> : <BellRing size={20} className="text-white" />}
               </div>
               <div>
                 <div className={`font-bold text-xs uppercase tracking-wider ${toast.type === 'CANCEL' ? 'text-red-300' : 'text-orange-400'}`}>{toast.type === 'CANCEL' ? 'Alert' : 'New Order'}</div>
                 <div className="font-black text-lg">{toast.msg}</div>
               </div>
             </div>
             <button onClick={() => setToast(null)} className="p-2 hover:bg-white/10 rounded-full">
               <X size={18} className="text-white/60" />
             </button>
          </div>
        </div>
      )}

      {/* FULL STATS DASHBOARD */}
      {showStats && (
        <StatsDashboard 
            orders={orders} 
            revenue={revenue} 
            onClose={() => setShowStats(false)} 
        />
      )}

      {/* ADD MENU MODAL */}
      {showAddMenuModal && (
          <AddMenuItemModal 
            categories={menuCategories} 
            onClose={() => setShowAddMenuModal(false)} 
            onAdd={handleAddItem} 
          />
      )}
      
      {/* MANUAL ORDER MODAL */}
      {showManualOrderModal && (
          <ManualOrderModal 
            menu={menu}
            onClose={() => setShowManualOrderModal(false)}
            onOrder={handleManualOrder}
          />
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
                <span className="text-[9px] bg-green-900 text-green-400 px-1.5 rounded border border-green-800">v3.4</span>
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
           {['NEW', 'COOKING', 'READY', 'HISTORY', 'MENU'].map(tab => (
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

      {/* MAIN CONTENT */}
      <main className="flex-1 max-w-5xl mx-auto w-full p-4">
        
        {/* --- VIEW: MENU MANAGEMENT --- */}
        {activeTab === 'MENU' ? (
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
          /* --- VIEW: ORDERS KANBAN --- */
          <div className="space-y-4">
            {/* Manual Order Button (Only on NEW tab) */}
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
                filteredOrders.map(order => {
                    const ageStatus = getOrderAgeStatus(order);
                    const elapsedMins = Math.floor((currentTime - order.updatedAt) / 1000 / 60);
                    
                    return (
                    <div 
                        key={order.id} 
                        className={`rounded-2xl shadow-sm border overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 relative transition-colors duration-500
                            ${order.status === OrderStatus.CANCELLED ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900' : 'bg-white dark:bg-slate-850'}
                            ${ageStatus === 'WARNING' ? 'border-yellow-300 dark:border-yellow-700 ring-1 ring-yellow-200 dark:ring-yellow-900/50' : ''}
                            ${ageStatus === 'CRITICAL' ? 'border-red-300 dark:border-red-700 ring-1 ring-red-200 dark:ring-red-900/50 bg-red-50/30 dark:bg-red-900/10' : ''}
                            ${ageStatus === 'NORMAL' && order.status !== OrderStatus.CANCELLED ? 'border-slate-200 dark:border-slate-800' : ''}
                        `}
                    >
                        {/* Status Bar */}
                        <div className="h-1 w-full bg-slate-100 dark:bg-slate-800">
                            <div className={`h-full transition-all duration-500 ${
                            order.status === 'NEW' ? 'w-1/3 bg-blue-500' : 
                            order.status === 'COOKING' ? 'w-2/3 bg-orange-500' : 
                            order.status === 'READY' ? 'w-full bg-green-500' : 
                            order.status === 'CANCELLED' ? 'w-full bg-red-500' : 'w-full bg-slate-400'
                            }`} />
                        </div>
                        
                        {/* Card Header */}
                        <div className={`p-4 border-b flex justify-between items-start ${order.status === OrderStatus.CANCELLED ? 'border-red-100 dark:border-red-900/30' : 'border-slate-50 dark:border-slate-800'}`}>
                            <div>
                            <span className={`text-3xl font-black tracking-tighter ${order.status === OrderStatus.CANCELLED ? 'text-red-800 dark:text-red-400 decoration-2 line-through decoration-red-400' : 'text-slate-800 dark:text-slate-100'}`}>{order.token}</span>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="text-xs font-bold text-slate-400 uppercase">{order.customerName || 'Guest'}</div>
                                
                                {/* Live Timer Badge */}
                                {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                                    <div className={`text-[10px] font-mono px-1.5 py-0.5 rounded flex items-center gap-1 ${
                                        ageStatus === 'CRITICAL' ? 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-300 font-bold animate-pulse' :
                                        ageStatus === 'WARNING' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300 font-bold' :
                                        'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                    }`}>
                                        <Timer size={10} /> {elapsedMins}m
                                    </div>
                                )}
                            </div>
                            </div>
                            <div className="text-right">
                            <div className="font-bold text-slate-900 dark:text-white">₹{order.totalAmount}</div>
                            <button 
                                onClick={() => updatePayment(order.id, order.paymentStatus === 'PAID' ? PaymentStatus.PENDING : PaymentStatus.PAID)}
                                className={`mt-1 text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${order.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-900' : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'}`}
                            >
                                {order.paymentStatus === 'PAID' ? <Check size={10} /> : <DollarSign size={10} />} {order.paymentStatus}
                            </button>
                            </div>
                        </div>

                        {/* Items */}
                        <div className="p-4 flex-1 space-y-2 bg-slate-50/30 dark:bg-slate-900/30">
                            {order.items.map((item, i) => (
                            <div key={i} className="flex justify-between text-sm">
                                <span className="text-slate-600 dark:text-slate-400 font-medium"><b className="text-slate-900 dark:text-slate-200">{item.quantity}x</b> {item.name}</span>
                            </div>
                            ))}
                        </div>

                        {/* Action Footer */}
                        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-850">
                            {order.status === OrderStatus.NEW && (
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => { if(confirm("Reject this order as 'No Show'?")) updateStatus(order.id, OrderStatus.CANCELLED); }}
                                    className="px-3 py-3 bg-red-50 hover:bg-red-100 text-red-500 border border-red-200 dark:bg-red-900/20 dark:border-red-900/50 dark:hover:bg-red-900/40 rounded-xl"
                                    title="Reject / No Show"
                                >
                                    <X size={18} />
                                </button>
                                <button 
                                    onClick={() => updateStatus(order.id, OrderStatus.COOKING)}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-100 dark:shadow-none active:scale-[0.98] transition-all"
                                >
                                    <ChefHat size={18} /> Verify & Cook
                                </button>
                            </div>
                            )}

                            {order.status === OrderStatus.COOKING && (
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => updateStatus(order.id, OrderStatus.NEW)}
                                    className="px-3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 rounded-xl"
                                    title="Undo / Revert"
                                >
                                    <Undo2 size={18} />
                                </button>
                                <button 
                                onClick={() => { if(confirm("Force cancel this order?")) updateStatus(order.id, OrderStatus.CANCELLED); }}
                                className="px-3 py-3 bg-red-50 hover:bg-red-100 text-red-500 border border-red-200 dark:bg-red-900/20 dark:border-red-900/50 dark:hover:bg-red-900/40 rounded-xl"
                                title="Force Cancel"
                                >
                                <X size={18} />
                                </button>
                                <button 
                                onClick={() => updateStatus(order.id, OrderStatus.READY)}
                                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-100 dark:shadow-none active:scale-[0.98] transition-all"
                                >
                                Mark Ready <ChevronRight size={18} />
                                </button>
                            </div>
                            )}

                            {order.status === OrderStatus.READY && (
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => updateStatus(order.id, OrderStatus.COOKING)}
                                    className="px-3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 rounded-xl"
                                    title="Undo / Revert"
                                >
                                    <Undo2 size={18} />
                                </button>
                                <button 
                                onClick={() => { if(confirm("Force cancel this order?")) updateStatus(order.id, OrderStatus.CANCELLED); }}
                                className="px-3 py-3 bg-red-50 hover:bg-red-100 text-red-500 border border-red-200 dark:bg-red-900/20 dark:border-red-900/50 dark:hover:bg-red-900/40 rounded-xl"
                                title="Force Cancel"
                                >
                                <X size={18} />
                                </button>
                                <button 
                                onClick={() => completeOrder(order)}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-100 dark:shadow-none active:scale-[0.98] transition-all"
                                >
                                <PackageCheck size={18} /> Complete
                                </button>
                            </div>
                            )}

                            {order.status === OrderStatus.DELIVERED && (
                            <div className="flex items-center gap-2">
                                <div className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-1">
                                <CheckCircle2 size={14} /> Completed
                                </div>
                                <button 
                                    onClick={() => updateStatus(order.id, OrderStatus.READY)}
                                    className="px-3 py-3 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
                                >
                                <Undo2 size={16} />
                                </button>
                            </div>
                            )}
                            
                            {order.status === OrderStatus.CANCELLED && (
                                <div className="flex items-center justify-center gap-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold text-xs py-3 rounded-xl border border-red-200 dark:border-red-900/50">
                                <Ban size={14} /> CANCELLED
                                </div>
                            )}
                        </div>
                    </div>
                    );
                })
                )}
            </div>
          </div>
        )}
      </main>

      {/* MOBILE BOTTOM NAV */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-50 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.05)] transition-colors">
        <div className="grid grid-cols-5 h-16">
           <MobileTab id="NEW" icon={BellRing} label="Pending" active={activeTab} onClick={setActiveTab} count={counts.NEW} />
           <MobileTab id="COOKING" icon={ChefHat} label="Kitchen" active={activeTab} onClick={setActiveTab} count={counts.COOKING} />
           <MobileTab id="READY" icon={Utensils} label="Serve" active={activeTab} onClick={setActiveTab} count={counts.READY} />
           <MobileTab id="HISTORY" icon={Clock} label="History" active={activeTab} onClick={setActiveTab} count={0} />
           <MobileTab id="MENU" icon={MenuIcon} label="Menu" active={activeTab} onClick={setActiveTab} count={0} />
        </div>
      </nav>

    </div>
  );
};

// --- SUBCOMPONENTS ---

const ManualOrderModal = ({ menu, onClose, onOrder }: { menu: MenuItem[], onClose: () => void, onOrder: (name: string, items: any[], total: number, paymentStatus: PaymentStatus) => void }) => {
    const [customerName, setCustomerName] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [search, setSearch] = useState('');
    const [paymentPaid, setPaymentPaid] = useState(true); // Default to Paid for walk-ins

    const total = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    
    const addToCart = (item: MenuItem) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { ...item, quantity: 1 }];
        });
    };

    const updateQuantity = (itemId: string, delta: number) => {
        setCart(prev => prev.map(i => i.id === itemId ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i).filter(i => i.quantity > 0));
    };

    const handleSubmit = () => {
        if (cart.length === 0) return;
        onOrder(customerName, cart, total, paymentPaid ? PaymentStatus.PAID : PaymentStatus.PENDING);
    };

    const filteredMenu = menu.filter(m => m.isAvailable && m.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-100 dark:bg-slate-900 w-full sm:max-w-md h-[90vh] sm:h-auto sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden flex flex-col">
                <div className="bg-slate-900 p-5 flex justify-between items-center shrink-0">
                    <h3 className="text-white font-bold text-lg flex items-center gap-2"><ClipboardList size={20}/> Take Manual Order</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20}/></button>
                </div>
                
                <div className="flex-1 overflow-hidden flex flex-col">
                    <div className="p-4 bg-white dark:bg-slate-850 shadow-sm shrink-0 space-y-3 border-b dark:border-slate-800">
                        <input 
                             className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-orange-500 dark:text-white"
                             placeholder="Customer Name (Optional)"
                             value={customerName}
                             onChange={e => setCustomerName(e.target.value)}
                        />
                        <div className="relative">
                            <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
                            <input 
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-orange-500 dark:text-white"
                                placeholder="Quick Search Menu..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50 dark:bg-slate-950">
                        {search ? (
                             filteredMenu.map(item => (
                                <button 
                                    key={item.id} 
                                    onClick={() => addToCart(item)}
                                    className="w-full text-left bg-white dark:bg-slate-850 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-orange-300 flex justify-between items-center"
                                >
                                    <div>
                                        <div className="font-bold text-slate-800 dark:text-white">{item.name}</div>
                                        <div className="text-xs text-slate-500">₹{item.price}</div>
                                    </div>
                                    <Plus className="text-orange-500 bg-orange-50 dark:bg-orange-900/30 rounded p-0.5" size={20} />
                                </button>
                             ))
                        ) : (
                            <div className="text-center py-10 text-slate-400 text-sm">Start typing to find items...</div>
                        )}
                    </div>

                    {/* Cart Summary Area */}
                    <div className="bg-white dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 p-4 shrink-0 max-h-[40vh] overflow-y-auto">
                        <div className="text-xs font-bold text-slate-400 uppercase mb-2">Current Order</div>
                        {cart.length === 0 ? (
                             <p className="text-sm text-slate-400 italic">Empty Order</p>
                        ) : (
                            <div className="space-y-2 mb-4">
                                {cart.map(item => (
                                    <div key={item.id} className="flex justify-between items-center text-sm">
                                        <span className="text-slate-700 dark:text-slate-200 flex-1 truncate pr-2">{item.name}</span>
                                        <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-900 rounded p-0.5">
                                            <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-white dark:hover:bg-slate-800 rounded dark:text-slate-400"><Minus size={14}/></button>
                                            <span className="font-bold w-4 text-center dark:text-white">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-white dark:hover:bg-slate-800 rounded dark:text-slate-400"><Plus size={14}/></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        <div className="flex items-center justify-between py-3 border-t border-slate-100 dark:border-slate-800 mb-3">
                            <span className="font-bold text-lg dark:text-white">Total</span>
                            <span className="font-black text-xl text-orange-600">₹{total}</span>
                        </div>

                        <div className="flex items-center gap-2 mb-4 cursor-pointer" onClick={() => setPaymentPaid(!paymentPaid)}>
                            <div className={`w-5 h-5 rounded border flex items-center justify-center ${paymentPaid ? 'bg-green-500 border-green-500' : 'border-slate-300 dark:border-slate-600'}`}>
                                {paymentPaid && <Check size={14} className="text-white" />}
                            </div>
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Mark as Paid (Cash)</span>
                        </div>

                        <button 
                            onClick={handleSubmit}
                            disabled={cart.length === 0}
                            className="w-full bg-slate-900 dark:bg-orange-600 text-white font-bold py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <CheckCircle2 size={20} /> Place Order
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatsDashboard = ({ orders, revenue, onClose }: { orders: Order[], revenue: number, onClose: () => void }) => {
    const completedOrders = orders.filter(o => o.status === OrderStatus.DELIVERED);
    const totalOrders = completedOrders.length;
    
    // Calculate Item Sales
    const itemCounts: {[key: string]: number} = {};
    const itemRevenue: {[key: string]: number} = {};
    
    completedOrders.forEach(o => {
      o.items.forEach(i => {
        itemCounts[i.name] = (itemCounts[i.name] || 0) + i.quantity;
        itemRevenue[i.name] = (itemRevenue[i.name] || 0) + (i.price * i.quantity);
      });
    });
    
    // Data for Bar Chart (Top Items)
    const topItemsData = Object.entries(itemCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 7)
        .map(([name, count]) => ({ name, count }));

    // Data for Line Chart (Revenue Trend - Last 20 orders)
    const revenueData = orders
        .filter(o => o.paymentStatus === PaymentStatus.PAID)
        .sort((a, b) => a.createdAt - b.createdAt)
        .slice(-20) // Last 20 orders
        .map((o, idx) => ({
            id: idx + 1,
            token: o.token,
            amount: o.totalAmount
        }));

    const sortedItems = Object.entries(itemCounts).sort(([,a], [,b]) => b - a);
    const lowStockCandidates = sortedItems.slice(-3).filter(([_, count]) => count > 0);

    return (
        <div className="fixed inset-0 z-[60] bg-slate-100 dark:bg-slate-950 overflow-y-auto animate-in slide-in-from-bottom-10 duration-300">
            <div className="bg-slate-900 text-white sticky top-0 z-10 px-6 py-4 flex justify-between items-center shadow-md">
                <div>
                    <h2 className="text-xl font-black">Analytics Dashboard</h2>
                    <p className="text-slate-400 text-xs">Real-time Business Insights</p>
                </div>
                <button onClick={onClose} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors">
                    <X size={24} />
                </button>
            </div>
            
            <div className="max-w-5xl mx-auto p-6 space-y-6">
                
                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase mb-1">
                            <DollarSign size={14} /> Total Revenue
                        </div>
                        <div className="text-3xl font-black text-slate-900 dark:text-white">₹{revenue}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase mb-1">
                            <PackageCheck size={14} /> Completed Orders
                        </div>
                        <div className="text-3xl font-black text-slate-900 dark:text-white">{totalOrders}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 col-span-2 md:col-span-1">
                        <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase mb-1">
                            <TrendingUp size={14} /> Avg Order Value
                        </div>
                        <div className="text-3xl font-black text-slate-900 dark:text-white">₹{totalOrders > 0 ? Math.round(revenue / totalOrders) : 0}</div>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* BAR CHART: TOP ITEMS */}
                    <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                        <h3 className="font-bold text-lg mb-6 flex items-center gap-2 dark:text-white">
                            <TrendingUp className="text-green-500" size={20} /> Best Selling Items
                        </h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topItemsData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.2} />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 10, fill: '#94a3b8'}} />
                                    <Tooltip 
                                        cursor={{fill: 'transparent'}}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Bar dataKey="count" fill="#f97316" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* AREA CHART: REVENUE TREND */}
                    <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                        <h3 className="font-bold text-lg mb-6 flex items-center gap-2 dark:text-white">
                            <DollarSign className="text-blue-500" size={20} /> Revenue Trend (Last 20)
                        </h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="token" tick={{fontSize: 10, fill: '#94a3b8'}} interval={2} />
                                    <YAxis tick={{fontSize: 10, fill: '#94a3b8'}} />
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                    <Area type="monotone" dataKey="amount" stroke="#3b82f6" fillOpacity={1} fill="url(#colorAmt)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Insights Section */}
                <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <AlertTriangle className="text-orange-500" size={18} /> Optimization Tips
                    </h3>
                    <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                        {lowStockCandidates.length > 0 ? (
                            <li className="flex gap-2">
                                <span className="text-orange-500">•</span> 
                                <span>Consider promoting <b>{lowStockCandidates[0][0]}</b> as it has low sales volume.</span>
                            </li>
                        ) : (
                            <li className="text-slate-400 italic">Gathering more data...</li>
                        )}
                         {topItemsData.length > 0 && (
                             <li className="flex gap-2">
                                <span className="text-green-500">•</span> 
                                <span>{topItemsData[0].name} is your star performer. Keep it in stock!</span>
                            </li>
                         )}
                    </ul>
                </div>

            </div>
        </div>
    );
};

const AddMenuItemModal = ({ categories, onClose, onAdd }: any) => {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState(categories[1] || 'Snacks'); // Default to first actual category
    const [description, setDescription] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !price) return;
        onAdd({
            name,
            price: Number(price),
            category,
            description
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-850 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
                <div className="bg-slate-900 p-5 flex justify-between items-center">
                    <h3 className="text-white font-bold text-lg">Add New Item</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20}/></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Item Name</label>
                        <input 
                            className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-orange-500 outline-none dark:text-white"
                            placeholder="e.g. Special Burger"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Price (₹)</label>
                            <input 
                                type="number"
                                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-orange-500 outline-none dark:text-white"
                                placeholder="99"
                                value={price}
                                onChange={e => setPrice(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                            <select 
                                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-orange-500 outline-none dark:text-white"
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                            >
                                {categories.filter((c: string) => c !== 'All').map((c: string) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                                <option value="Specials">Specials</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                        <textarea 
                            className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-orange-500 outline-none h-24 resize-none dark:text-white"
                            placeholder="Brief details about the item..."
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="w-full bg-orange-600 text-white font-bold py-4 rounded-xl hover:bg-orange-700 transition-colors">
                        Add to Menu
                    </button>
                </form>
            </div>
        </div>
    );
}

const DesktopTab = ({ id, active, onClick, count }: any) => {
  const isActive = active === id;
  const labels: Record<string, string> = { NEW: 'Pending', COOKING: 'Kitchen', READY: 'Serving', HISTORY: 'History', MENU: 'Menu' };
  
  return (
    <button 
      onClick={() => onClick(id)}
      className={`relative px-6 py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${isActive ? 'border-orange-500 text-white bg-slate-900' : 'border-transparent text-slate-500 hover:bg-slate-900 hover:text-slate-300'}`}
    >
      {labels[id]}
      {count > 0 && id !== 'MENU' && <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-xs">{count}</span>}
    </button>
  );
};

const MobileTab = ({ id, icon: Icon, label, active, onClick, count }: any) => {
  const isActive = active === id;
  return (
    <button onClick={() => onClick(id)} className="relative flex flex-col items-center justify-center gap-0.5 active:bg-slate-50 dark:active:bg-slate-800 group">
       <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-slate-900 dark:bg-slate-700 text-white' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}>
         <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
       </div>
       <span className={`text-[9px] font-bold ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}>{label}</span>
       {count > 0 && (
         <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900 shadow-sm">
           {count}
         </span>
       )}
    </button>
  );
};
