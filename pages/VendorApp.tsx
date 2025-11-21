
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { db } from '../services/storage';
import { Order, OrderStatus, PaymentStatus, MenuItem } from '../types';
import { 
  RefreshCw, Check, DollarSign, Lock, RotateCcw, ChevronRight, 
  CheckCircle2, Utensils, PackageCheck, Clock, BellRing, ChefHat, 
  Search, Menu as MenuIcon, BarChart3, X, AlertTriangle, Ban, Undo2
} from 'lucide-react';

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

  // Realtime Subscription
  useEffect(() => {
    if (isAuthenticated) {
      const unsubscribe = db.subscribeToOrders((newOrders) => {
        // We merge new data carefully to avoid overwriting optimistic updates
        // In a polling scenario, we usually just replace. 
        // Ideally, we check timestamps, but for simplicity, we replace here
        // as optimistic updates are fast and temporary.
        setOrders([...newOrders].sort((a, b) => b.createdAt - a.createdAt));
      });
      return () => unsubscribe();
    }
  }, [isAuthenticated]);

  // --- NOTIFICATION LOGIC ---
  useEffect(() => {
    if (orders.length === 0) return;

    // Convert current orders to a map for easy lookup
    const currentStatusMap = new Map(orders.map(o => [o.id, o.status]));
    const isFirstRun = prevOrderStatusMap.current.size === 0;

    if (!isFirstRun) {
        orders.forEach(order => {
            const prevStatus = prevOrderStatusMap.current.get(order.id);
            
            // 1. Check for NEW orders
            if (!prevStatus && order.status === OrderStatus.NEW) {
                PLAY_SOUND('NEW');
                setToast({ msg: `New Order: ${order.token}`, type: 'NEW' });
                setTimeout(() => setToast(null), 5000);
            }

            // 2. Check for CANCELLED orders
            if (prevStatus && prevStatus !== OrderStatus.CANCELLED && order.status === OrderStatus.CANCELLED) {
                PLAY_SOUND('CANCEL');
                setToast({ msg: `Order Cancelled: ${order.token}`, type: 'CANCEL' });
                setTimeout(() => setToast(null), 5000);
            }
        });
    }

    // Update Ref
    prevOrderStatusMap.current = currentStatusMap;
  }, [orders]);

  // --- ACTIONS (OPTIMISTIC UI) ---
  
  const updateStatus = async (orderId: string, status: OrderStatus) => {
    // 1. Snapshot
    const previousOrders = [...orders];

    // 2. Optimistic Update
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));

    try {
      // 3. API Call
      await db.updateOrderStatus(orderId, status);
    } catch (error) {
      // 4. Revert on Failure
      console.error("Failed to update status", error);
      setOrders(previousOrders);
      alert("Connection failed. Changes reverted.");
    }
  };

  const updatePayment = async (orderId: string, status: PaymentStatus) => {
    // 1. Snapshot
    const previousOrders = [...orders];

    // 2. Optimistic Update
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, paymentStatus: status } : o));

    try {
      // 3. API Call
      await db.updatePaymentStatus(orderId, status);
    } catch (error) {
      // 4. Revert on Failure
      console.error("Failed to update payment", error);
      setOrders(previousOrders);
      alert("Connection failed. Changes reverted.");
    }
  };

  const completeOrder = async (order: Order) => {
    // 1. Snapshot
    const previousOrders = [...orders];

    // 2. Optimistic Update
    setOrders(prev => prev.map(o => {
      if (o.id === order.id) {
        return { 
          ...o, 
          paymentStatus: PaymentStatus.PAID, 
          status: OrderStatus.DELIVERED 
        };
      }
      return o;
    }));

    try {
      // 3. API Calls
      if (order.paymentStatus !== PaymentStatus.PAID) {
        await db.updatePaymentStatus(order.id, PaymentStatus.PAID);
      }
      await db.updateOrderStatus(order.id, OrderStatus.DELIVERED);
    } catch (error) {
      // 4. Revert on Failure
      console.error("Failed to complete order", error);
      setOrders(previousOrders);
      alert("Connection failed. Changes reverted.");
    }
  };

  const toggleItem = async (item: MenuItem) => {
    const newStatus = !item.isAvailable;
    
    // Optimistic Update
    setMenu(prev => prev.map(m => m.id === item.id ? { ...m, isAvailable: newStatus } : m));
    
    try {
      await db.updateMenuItemStatus(item.id, newStatus);
    } catch (e) {
      // Revert
      console.error("Failed to toggle item", e);
      setMenu(prev => prev.map(m => m.id === item.id ? { ...m, isAvailable: !newStatus } : m));
      alert("Failed to update menu item.");
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

  // --- STATS CALCULATION ---
  const stats = useMemo(() => {
    const completedOrders = orders.filter(o => o.status === OrderStatus.DELIVERED);
    const totalOrders = completedOrders.length;
    
    const itemCounts: {[key: string]: number} = {};
    completedOrders.forEach(o => {
      o.items.forEach(i => {
        itemCounts[i.name] = (itemCounts[i.name] || 0) + i.quantity;
      });
    });
    
    const topItems = Object.entries(itemCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);

    return {
      totalOrders,
      avgOrderValue: totalOrders > 0 ? Math.round(revenue / totalOrders) : 0,
      topItems
    };
  }, [orders, revenue]);

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
          <p className="text-slate-500 mb-8 text-sm font-mono">System v3.1 (Live)</p>
          
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
    <div className="min-h-screen bg-slate-100 pb-24 sm:pb-0 flex flex-col relative">
      
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

      {/* STATS MODAL */}
      {showStats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-900 p-5 flex justify-between items-center">
               <h2 className="text-white font-bold text-lg flex items-center gap-2">
                 <BarChart3 className="text-orange-500" /> Sales Report
               </h2>
               <button onClick={() => setShowStats(false)} className="text-slate-400 hover:text-white bg-white/10 p-1 rounded-full">
                 <X size={20} />
               </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
                    <div className="text-xs text-green-600 font-bold uppercase mb-1">Revenue</div>
                    <div className="text-2xl font-black text-green-800">₹{revenue}</div>
                 </div>
                 <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                    <div className="text-xs text-blue-600 font-bold uppercase mb-1">Orders</div>
                    <div className="text-2xl font-black text-blue-800">{stats.totalOrders}</div>
                 </div>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                 <div className="text-xs text-slate-500 font-bold uppercase mb-3">Top Selling Items</div>
                 {stats.topItems.length > 0 ? (
                   <div className="space-y-3">
                     {stats.topItems.map(([name, count], idx) => (
                       <div key={name} className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-3">
                             <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-orange-100 text-orange-700' : 'bg-slate-200 text-slate-600'}`}>{idx + 1}</span>
                             <span className="font-medium text-slate-700">{name}</span>
                          </div>
                          <span className="font-bold text-slate-900">{count} sold</span>
                       </div>
                     ))}
                   </div>
                 ) : (
                   <div className="text-center text-slate-400 text-sm py-2">No sales data yet</div>
                 )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="bg-slate-900 text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-orange-600 p-1.5 rounded-lg">
              <ChefHat size={20} />
            </div>
            <div>
              <h1 className="font-bold leading-none">CampusBytes</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-mono text-slate-400">VENDOR</span>
                <span className="text-[9px] bg-green-900 text-green-400 px-1.5 rounded border border-green-800">v3.1</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
             <button 
                onClick={() => setShowStats(true)}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
             >
                <BarChart3 size={14} className="text-orange-400" /> 
                <span className="font-mono font-bold text-sm text-white">₹{revenue}</span>
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
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 sticky top-[70px] sm:top-16 z-20">
               <div className="relative mb-4">
                 <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
                 <input 
                   type="text" 
                   placeholder="Search items..." 
                   value={menuSearch} 
                   onChange={e => setMenuSearch(e.target.value)}
                   className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-slate-900 outline-none font-medium transition-all"
                 />
               </div>
               <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                 {menuCategories.map(cat => (
                   <button
                     key={cat}
                     onClick={() => scrollToCat(cat)}
                     className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${menuCatFilter === cat ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                   >
                     {cat}
                   </button>
                 ))}
               </div>
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
                      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                         {items.map(item => (
                           <div key={item.id} className={`p-4 flex justify-between items-center transition-colors ${!item.isAvailable ? 'bg-slate-50/80' : ''}`}>
                              <div className={!item.isAvailable ? 'opacity-50' : ''}>
                                <h4 className="font-bold text-slate-800">{item.name}</h4>
                                <p className="text-sm text-slate-500 font-medium">₹{item.price}</p>
                              </div>
                              <button 
                                onClick={() => toggleItem(item)}
                                className={`relative w-14 h-8 rounded-full transition-colors ${item.isAvailable ? 'bg-green-500' : 'bg-slate-300'}`}
                              >
                                <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${item.isAvailable ? 'translate-x-6' : 'translate-x-0'}`} />
                              </button>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrders.length === 0 ? (
              <div className="col-span-full text-center py-20 text-slate-400">
                <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock size={30} />
                </div>
                <p className="font-medium">No orders in this stage.</p>
              </div>
            ) : (
              filteredOrders.map(order => (
                <div key={order.id} className={`rounded-2xl shadow-sm border overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 ${order.status === OrderStatus.CANCELLED ? 'bg-red-50 border-red-100' : 'bg-white border-slate-200'}`}>
                   {/* Status Bar */}
                   <div className="h-1 w-full bg-slate-100">
                      <div className={`h-full transition-all duration-500 ${
                        order.status === 'NEW' ? 'w-1/3 bg-blue-500' : 
                        order.status === 'COOKING' ? 'w-2/3 bg-orange-500' : 
                        order.status === 'READY' ? 'w-full bg-green-500' : 
                        order.status === 'CANCELLED' ? 'w-full bg-red-500' : 'w-full bg-slate-400'
                      }`} />
                   </div>
                   
                   {/* Card Header */}
                   <div className={`p-4 border-b flex justify-between items-start ${order.status === OrderStatus.CANCELLED ? 'border-red-100' : 'border-slate-50'}`}>
                      <div>
                        <span className={`text-3xl font-black tracking-tighter ${order.status === OrderStatus.CANCELLED ? 'text-red-800 decoration-2 line-through decoration-red-400' : 'text-slate-800'}`}>{order.token}</span>
                        <div className="text-xs font-bold text-slate-400 uppercase mt-1">{order.customerName || 'Guest'}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900">₹{order.totalAmount}</div>
                        <button 
                          onClick={() => updatePayment(order.id, order.paymentStatus === 'PAID' ? PaymentStatus.PENDING : PaymentStatus.PAID)}
                          className={`mt-1 text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${order.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
                        >
                           {order.paymentStatus === 'PAID' ? <Check size={10} /> : <DollarSign size={10} />} {order.paymentStatus}
                        </button>
                      </div>
                   </div>

                   {/* Items */}
                   <div className="p-4 flex-1 space-y-2 bg-slate-50/30">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                           <span className="text-slate-600 font-medium"><b className="text-slate-900">{item.quantity}x</b> {item.name}</span>
                        </div>
                      ))}
                   </div>

                   {/* Action Footer */}
                   <div className="p-3 border-t border-slate-100 bg-white">
                      {order.status === OrderStatus.NEW && (
                        <button 
                          onClick={() => updateStatus(order.id, OrderStatus.COOKING)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-100 active:scale-[0.98] transition-all"
                        >
                          <ChefHat size={18} /> Accept & Cook
                        </button>
                      )}

                      {order.status === OrderStatus.COOKING && (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => updateStatus(order.id, OrderStatus.NEW)}
                            className="px-3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl"
                            title="Undo"
                          >
                            <Undo2 size={18} />
                          </button>
                          <button 
                            onClick={() => updateStatus(order.id, OrderStatus.READY)}
                            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-100 active:scale-[0.98] transition-all"
                          >
                            Mark Ready <ChevronRight size={18} />
                          </button>
                        </div>
                      )}

                      {order.status === OrderStatus.READY && (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => updateStatus(order.id, OrderStatus.COOKING)}
                            className="px-3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl"
                            title="Undo"
                          >
                             <Undo2 size={18} />
                          </button>
                          <button 
                            onClick={() => completeOrder(order)}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-100 active:scale-[0.98] transition-all"
                          >
                            <PackageCheck size={18} /> Complete
                          </button>
                        </div>
                      )}

                      {order.status === OrderStatus.DELIVERED && (
                         <div className="flex items-center gap-2">
                           <div className="flex-1 bg-slate-100 text-slate-500 font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-1">
                             <CheckCircle2 size={14} /> Completed
                           </div>
                           <button 
                              onClick={() => updateStatus(order.id, OrderStatus.READY)}
                              className="px-3 py-3 border border-slate-200 text-slate-400 hover:text-slate-600 rounded-xl"
                           >
                             <Undo2 size={16} />
                           </button>
                         </div>
                      )}
                      
                      {order.status === OrderStatus.CANCELLED && (
                          <div className="flex items-center justify-center gap-2 bg-red-100 text-red-600 font-bold text-xs py-3 rounded-xl border border-red-200">
                            <Ban size={14} /> CANCELLED
                          </div>
                      )}
                   </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* MOBILE BOTTOM NAV */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
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
    <button onClick={() => onClick(id)} className="relative flex flex-col items-center justify-center gap-0.5 active:bg-slate-50">
       <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>
         <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
       </div>
       <span className={`text-[9px] font-bold ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>{label}</span>
       {count > 0 && (
         <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-white shadow-sm">
           {count}
         </span>
       )}
    </button>
  );
};
