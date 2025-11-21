
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { db } from '../services/storage';
import { Order, OrderStatus, PaymentStatus, MenuItem } from '../types';
import { 
  RefreshCw, Check, DollarSign, User, Power, RotateCcw, ChevronRight, 
  CheckCircle2, Utensils, PackageCheck, Clock, BellRing, ChefHat, 
  Search, Menu as MenuIcon, Lock, ArrowRight, Undo2
} from 'lucide-react';

export const VendorApp: React.FC = () => {
  // --- STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [isMenuLoading, setIsMenuLoading] = useState(false);
  
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
      // Trigger initial data load
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
        setOrders([...newOrders].sort((a, b) => b.createdAt - a.createdAt));
      });
      return () => unsubscribe();
    }
  }, [isAuthenticated]);

  // --- ACTIONS ---
  const updateStatus = async (orderId: string, status: OrderStatus) => {
    // Optimistic update for UI responsiveness
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    await db.updateOrderStatus(orderId, status);
  };

  const updatePayment = async (orderId: string, status: PaymentStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, paymentStatus: status } : o));
    await db.updatePaymentStatus(orderId, status);
  };

  const completeOrder = async (order: Order) => {
    // 1. Mark Paid
    if (order.paymentStatus !== PaymentStatus.PAID) {
      await updatePayment(order.id, PaymentStatus.PAID);
    }
    // 2. Mark Delivered
    await updateStatus(order.id, OrderStatus.DELIVERED);
  };

  const toggleItem = async (item: MenuItem) => {
    const newStatus = !item.isAvailable;
    setMenu(prev => prev.map(m => m.id === item.id ? { ...m, isAvailable: newStatus } : m));
    try {
      await db.updateMenuItemStatus(item.id, newStatus);
    } catch (e) {
      // Revert on failure
      setMenu(prev => prev.map(m => m.id === item.id ? { ...m, isAvailable: !newStatus } : m));
    }
  };

  // --- COMPUTED DATA ---
  const filteredOrders = useMemo(() => {
    if (activeTab === 'HISTORY') {
      return orders.filter(o => o.status === OrderStatus.DELIVERED || o.status === OrderStatus.CANCELLED);
    }
    if (activeTab === 'MENU') return [];
    // For NEW, COOKING, READY
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

  // --- RENDER: LOGIN SCREEN (DARK MODE) ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center">
          <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-900/40">
            <Lock className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-black text-white mb-2">Vendor Portal</h1>
          <p className="text-slate-500 mb-8 text-sm font-mono">System v3.0 (Live)</p>
          
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
    <div className="min-h-screen bg-slate-100 pb-24 sm:pb-0 flex flex-col">
      
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
                <span className="text-[9px] bg-green-900 text-green-400 px-1.5 rounded border border-green-800">v3.0</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="hidden sm:flex items-center gap-1 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-emerald-400 font-mono font-bold text-sm">
                <DollarSign size={14} /> {revenue}
             </div>
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
            {/* Menu Filters */}
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

            {/* Menu List */}
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
                <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col animate-in slide-in-from-bottom-4">
                   {/* Status Bar */}
                   <div className="h-1 w-full bg-slate-100">
                      <div className={`h-full transition-all duration-500 ${
                        order.status === 'NEW' ? 'w-1/3 bg-blue-500' : 
                        order.status === 'COOKING' ? 'w-2/3 bg-orange-500' : 
                        order.status === 'READY' ? 'w-full bg-green-500' : 'w-full bg-slate-400'
                      }`} />
                   </div>
                   
                   {/* Card Header */}
                   <div className="p-4 border-b border-slate-50 flex justify-between items-start">
                      <div>
                        <span className="text-3xl font-black text-slate-800 tracking-tighter">{order.token}</span>
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
                   <div className="p-4 flex-1 bg-slate-50/30 space-y-2">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                           <span className="text-slate-600 font-medium"><b className="text-slate-900">{item.quantity}x</b> {item.name}</span>
                        </div>
                      ))}
                   </div>

                   {/* Action Footer - Dynamic based on Status */}
                   <div className="p-3 border-t border-slate-100 bg-white">
                      {/* NEW -> COOKING */}
                      {order.status === OrderStatus.NEW && (
                        <button 
                          onClick={() => updateStatus(order.id, OrderStatus.COOKING)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-100 active:scale-[0.98] transition-all"
                        >
                          <ChefHat size={18} /> Accept & Cook
                        </button>
                      )}

                      {/* COOKING -> READY */}
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

                      {/* READY -> DONE */}
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

                      {/* HISTORY -> REVERT */}
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
                          <div className="bg-red-50 text-red-500 font-bold text-xs py-3 rounded-xl text-center border border-red-100">
                            CANCELLED
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
