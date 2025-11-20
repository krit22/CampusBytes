
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { db } from '../services/storage';
import { Order, OrderStatus, PaymentStatus, MenuItem } from '../types';
import { Badge } from '../components/Badge';
import { RefreshCw, Check, DollarSign, User, Power, RotateCcw, ChevronRight, Play, CheckCircle2, Utensils, PackageCheck, Clock, BellRing, ChefHat, Search, Filter, Menu as MenuIcon, LogOut, Lock } from 'lucide-react';

export const VendorApp: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  
  // Tabs: NEW = Pending, COOKING = Kitchen, READY = Serving, HISTORY = Done/Cancelled, MENU = Menu Mgmt
  const [activeTab, setActiveTab] = useState<'NEW' | 'COOKING' | 'READY' | 'HISTORY' | 'MENU'>('NEW');

  // Menu Management State
  const [menuSearch, setMenuSearch] = useState('');
  const [selectedMenuCategory, setSelectedMenuCategory] = useState('All');
  const categoryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Auth Mock
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '1234') {
      setIsAuthenticated(true);
    } else {
      alert('Invalid PIN (Try 1234)');
      setPin('');
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      // Subscribe to Orders
      const unsubscribe = db.subscribeToOrders((newOrders) => {
        // Sort by time descending (newest first)
        const sorted = [...newOrders].sort((a, b) => b.createdAt - a.createdAt);
        setOrders(sorted);
      });
      
      // Fetch Menu
      loadMenu();

      return () => unsubscribe();
    }
  }, [isAuthenticated]);

  const loadMenu = async () => {
    const items = await db.getMenu();
    setMenu(items);
  };

  const handleStatusUpdate = async (orderId: string, status: OrderStatus) => {
    await db.updateOrderStatus(orderId, status);
  };

  const handlePaymentUpdate = async (orderId: string, status: PaymentStatus) => {
    await db.updatePaymentStatus(orderId, status);
  };

  const handleCompleteOrder = async (order: Order) => {
    // 1. Ensure payment is marked as PAID (Vendor confirms collection)
    if (order.paymentStatus !== PaymentStatus.PAID) {
        await db.updatePaymentStatus(order.id, PaymentStatus.PAID);
    }
    // 2. Mark as DELIVERED (Moves to Completed Tab)
    await db.updateOrderStatus(order.id, OrderStatus.DELIVERED);
  };
  
  const toggleItemAvailability = async (item: MenuItem) => {
      const newStatus = !item.isAvailable;
      // Optimistic update
      setMenu(prev => prev.map(m => m.id === item.id ? { ...m, isAvailable: newStatus } : m));
      try {
          await db.updateMenuItemStatus(item.id, newStatus);
      } catch (e) {
          console.error("Failed to update item", e);
          // Revert
          setMenu(prev => prev.map(m => m.id === item.id ? { ...m, isAvailable: !newStatus } : m));
      }
  };

  const scrollToCategory = (cat: string) => {
    setSelectedMenuCategory(cat);
    if (categoryRefs.current[cat]) {
        const yOffset = -180; // Offset for sticky headers
        const element = categoryRefs.current[cat];
        if (element) {
            const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({top: y, behavior: 'smooth'});
        }
    }
  };

  const filteredOrders = useMemo(() => {
    if (activeTab === 'MENU') return [];
    
    if (activeTab === 'HISTORY') {
        return orders.filter(o => o.status === OrderStatus.DELIVERED || o.status === OrderStatus.CANCELLED);
    }
    
    // Direct mapping for NEW, COOKING, READY
    return orders.filter(o => o.status === activeTab);
  }, [orders, activeTab]);

  // Menu Filtering Logic
  const menuCategories = useMemo(() => ['All', ...Array.from(new Set(menu.map(m => m.category))).sort()], [menu]);
  
  const getFilteredMenuItems = () => {
      return menu.filter(item => {
          const matchesSearch = item.name.toLowerCase().includes(menuSearch.toLowerCase());
          const matchesCategory = selectedMenuCategory === 'All' || item.category === selectedMenuCategory;
          return matchesSearch && matchesCategory;
      });
  };

  // Group metrics for tab badges
  const counts = useMemo(() => {
      return {
          [OrderStatus.NEW]: orders.filter(o => o.status === OrderStatus.NEW).length,
          [OrderStatus.COOKING]: orders.filter(o => o.status === OrderStatus.COOKING).length,
          [OrderStatus.READY]: orders.filter(o => o.status === OrderStatus.READY).length,
          history: orders.filter(o => o.status === OrderStatus.DELIVERED || o.status === OrderStatus.CANCELLED).length
      }
  }, [orders]);
  
  const totalRevenue = useMemo(() => {
      return orders.filter(o => o.paymentStatus === PaymentStatus.PAID).reduce((s, o) => s + o.totalAmount, 0);
  }, [orders]);

  const StatusStepper = ({ status }: { status: OrderStatus }) => {
      const steps = [OrderStatus.NEW, OrderStatus.COOKING, OrderStatus.READY];
      const currentIdx = steps.indexOf(status);
      const isDelivered = status === OrderStatus.DELIVERED;
      
      if (isDelivered || status === OrderStatus.CANCELLED) return null;

      return (
          <div className="flex items-center justify-between px-6 py-4 bg-slate-50/50 border-b border-slate-100 relative overflow-hidden">
              <div className="absolute left-10 right-10 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 -z-0"></div>
              <div 
                className="absolute left-10 h-0.5 bg-green-500 -z-0 transition-all duration-500"
                style={{ width: isDelivered ? '80%' : `${currentIdx * 40}%` }}
              ></div>

              {steps.map((step, idx) => {
                  const isActive = status === step;
                  const isCompleted = currentIdx > idx || isDelivered;
                  
                  let icon = <span className="text-[10px] font-bold">{idx + 1}</span>;
                  if (isCompleted) icon = <Check size={12} strokeWidth={4} />;
                  if (isActive) icon = <div className="w-2 h-2 bg-orange-500 rounded-full" />;

                  return (
                      <div key={step} className="relative z-10 flex flex-col items-center gap-1">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
                              isCompleted ? 'bg-green-500 text-white shadow-sm shadow-green-200' : 
                              isActive ? 'bg-white border-2 border-orange-500 text-orange-600 shadow-md' : 
                              'bg-white border-2 border-slate-200 text-slate-400'
                          }`}>
                              {icon}
                          </div>
                          <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${
                              isActive ? 'text-orange-600' : 
                              isCompleted ? 'text-green-600' : 'text-slate-400'
                          }`}>
                              {step}
                          </span>
                      </div>
                  );
              })}
          </div>
      );
  };

  // DARK MODE LOGIN SCREEN (Visual Proof of New Version)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-orange-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-900/50 transform -rotate-6">
             <Lock size={32} />
          </div>
          <h1 className="text-2xl font-black text-white mb-2 tracking-tight">Vendor Access</h1>
          <p className="text-slate-400 mb-8">Secure Terminal v2.0</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full text-center text-3xl tracking-[1em] py-4 border-2 border-slate-800 bg-slate-950 text-white rounded-xl focus:border-orange-500 focus:ring-0 outline-none transition-colors font-mono placeholder-slate-700"
              placeholder="••••"
              autoFocus
            />
            <button type="submit" className="w-full bg-orange-600 text-white font-bold py-4 rounded-xl hover:bg-orange-500 transition-all shadow-lg shadow-orange-900/20 active:scale-[0.98]">
              Unlock Dashboard
            </button>
          </form>
          <p className="mt-8 text-xs text-slate-600 font-mono">PIN: 1234</p>
        </div>
      </div>
    );
  }

  const TABS = [
      { id: 'NEW', label: 'Pending', mobileLabel: 'Pending', icon: BellRing, count: counts[OrderStatus.NEW], color: 'text-blue-400', border: 'border-blue-400', bg: 'bg-blue-900' },
      { id: 'COOKING', label: 'Kitchen', mobileLabel: 'Prep', icon: ChefHat, count: counts[OrderStatus.COOKING], color: 'text-orange-400', border: 'border-orange-400', bg: 'bg-orange-900' },
      { id: 'READY', label: 'Serving', mobileLabel: 'Serve', icon: Utensils, count: counts[OrderStatus.READY], color: 'text-green-400', border: 'border-green-400', bg: 'bg-green-900' },
      { id: 'HISTORY', label: 'History', mobileLabel: 'Done', icon: Clock, count: counts.history, color: 'text-slate-400', border: 'border-slate-400', bg: 'bg-slate-800' },
      { id: 'MENU', label: 'Menu', mobileLabel: 'Menu', icon: MenuIcon, count: 0, color: 'text-purple-400', border: 'border-purple-400', bg: 'bg-purple-900' },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col pb-24 sm:pb-0">
      {/* Top Bar - Dark Theme for Vendor to distinguish from Customer App */}
      <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-20 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-orange-900/50">
                 <ChefHat size={18} />
             </div>
             <div>
                <h1 className="text-lg font-bold text-white leading-none">CampusBytes</h1>
                <div className="flex items-center gap-2">
                   <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Vendor</span>
                   <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-px rounded border border-slate-700">v2.0</span>
                </div>
             </div>
          </div>
          
          <div className="flex items-center gap-3">
             <button 
                onClick={() => window.location.reload()} 
                className="p-2 bg-slate-900 text-slate-400 rounded-full hover:bg-slate-800 hover:text-white transition-colors border border-slate-800"
                title="Refresh"
             >
                 <RefreshCw size={18} />
             </button>
             <div className="font-mono font-bold text-emerald-400 bg-emerald-950/30 px-3 py-1.5 rounded-lg border border-emerald-900/50 flex items-center gap-1">
                 <DollarSign size={14} /> {totalRevenue}
             </div>
          </div>
        </div>
        
        {/* Desktop Tab Navigation (Hidden on mobile) */}
        <div className="hidden sm:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-slate-950">
            <div className="flex justify-center">
             {TABS.map(tab => (
                 <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold border-b-[3px] transition-all whitespace-nowrap px-4 max-w-[160px] ${activeTab === tab.id ? `${tab.border} ${tab.color} bg-slate-900` : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'}`}
                 >
                    <tab.icon size={18} className={activeTab === tab.id ? 'stroke-[2.5px]' : 'stroke-2'} />
                    {tab.label}
                    {tab.id !== 'MENU' && (
                        <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-slate-800 text-white' : 'bg-slate-900 text-slate-600 group-hover:bg-slate-800 group-hover:text-slate-300'}`}>
                            {tab.count}
                        </span>
                    )}
                 </button>
             ))}
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto p-4 sm:p-6 w-full">
        
        {/* Menu Management View */}
        {activeTab === 'MENU' ? (
           <div className="animate-in fade-in duration-500">
              {/* Search & Stats Header */}
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 sticky top-[70px] sm:top-[140px] z-10 mb-6">
                  <div className="flex gap-2 mb-4">
                      <div className="relative flex-1">
                          <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
                          <input 
                            type="text" 
                            placeholder="Search menu items..." 
                            value={menuSearch}
                            onChange={e => setMenuSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-900 focus:ring-0 outline-none transition-all font-medium"
                          />
                      </div>
                  </div>
                  
                  {/* Sticky Category Tabs */}
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                      {menuCategories.map(cat => (
                          <button
                            key={cat}
                            onClick={() => scrollToCategory(cat)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${
                                selectedMenuCategory === cat 
                                ? 'bg-slate-900 text-white shadow-md' 
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                              {cat}
                          </button>
                      ))}
                  </div>
              </div>

              {/* Systematic List View */}
              <div className="space-y-6 pb-20">
                  {menuSearch ? (
                      // Flat List for Search
                      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                          {getFilteredMenuItems().map(item => (
                             <MenuItemRow key={item.id} item={item} onToggle={() => toggleItemAvailability(item)} />
                          ))}
                          {getFilteredMenuItems().length === 0 && (
                              <div className="text-center py-12 text-slate-400">No items found.</div>
                          )}
                      </div>
                  ) : (
                      // Categorized List
                      menuCategories.filter(cat => selectedMenuCategory === 'All' ? cat !== 'All' : cat === selectedMenuCategory).map(cat => {
                          const items = menu.filter(m => m.category === cat);
                          if (items.length === 0) return null;
                          return (
                              <div key={cat} ref={el => { categoryRefs.current[cat] = el; }} className="scroll-mt-40">
                                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-2 pl-2">{cat}</h3>
                                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm divide-y divide-slate-50">
                                      {items.map(item => (
                                          <MenuItemRow key={item.id} item={item} onToggle={() => toggleItemAvailability(item)} />
                                      ))}
                                  </div>
                              </div>
                          )
                      })
                  )}
              </div>
           </div>
        ) : (
            /* Orders Grid */
            filteredOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 animate-in fade-in zoom-in-95 duration-300">
                    <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-4">
                        {activeTab === 'NEW' && <BellRing size={40} className="text-slate-400" />}
                        {activeTab === 'COOKING' && <ChefHat size={40} className="text-slate-400" />}
                        {activeTab === 'READY' && <Utensils size={40} className="text-slate-400" />}
                        {activeTab === 'HISTORY' && <Clock size={40} className="text-slate-400" />}
                    </div>
                    <p className="text-lg font-medium">No orders in {TABS.find(t => t.id === activeTab)?.label}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in slide-in-from-bottom-4 duration-500">
                {filteredOrders.map(order => (
                    <div key={order.id} className={`bg-white rounded-xl shadow-sm border flex flex-col overflow-hidden transition-all hover:shadow-md ${order.status === OrderStatus.NEW ? 'border-blue-300 shadow-blue-100 ring-1 ring-blue-100' : 'border-slate-200'}`}>
                        
                        {/* Progress Stepper */}
                        <StatusStepper status={order.status} />

                        {/* Card Header */}
                        <div className="p-4 border-b border-slate-50 flex justify-between items-start bg-slate-50/30">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-mono text-2xl font-black text-slate-800">{order.token}</span>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-slate-600 font-medium mb-1">
                                <User size={10} /> {order.customerName || 'Guest'}
                                </div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                    {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-slate-900 text-lg">₹{order.totalAmount}</div>
                                <button 
                                    onClick={() => handlePaymentUpdate(order.id, order.paymentStatus === PaymentStatus.PAID ? PaymentStatus.PENDING : PaymentStatus.PAID)}
                                    className={`text-xs px-2 py-1 rounded border flex items-center gap-1 mt-1 transition-colors ${order.paymentStatus === PaymentStatus.PAID ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-500'}`}
                                >
                                    {order.paymentStatus === PaymentStatus.PAID ? <Check size={12} /> : <DollarSign size={12} />}
                                    {order.paymentStatus}
                                </button>
                            </div>
                        </div>

                        {/* Items List */}
                        <div className="p-4 flex-1 space-y-2">
                            {order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-start text-sm">
                                    <span className="font-medium text-slate-700"><span className="font-bold text-slate-900">{item.quantity}x</span> {item.name}</span>
                                </div>
                            ))}
                        </div>

                        {/* Actions Footer */}
                        <div className="p-3 bg-white border-t border-slate-100">
                            <div className="grid grid-cols-12 gap-2">
                                
                                {/* State: NEW (Pending Tab) */}
                                {order.status === OrderStatus.NEW && (
                                    <button 
                                        onClick={() => handleStatusUpdate(order.id, OrderStatus.COOKING)}
                                        className="col-span-12 bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-blue-100 shadow-lg active:scale-[0.98]"
                                    >
                                        <Utensils size={18} /> Accept & Cook
                                    </button>
                                )}

                                {/* State: COOKING (Preparing Tab) */}
                                {order.status === OrderStatus.COOKING && (
                                    <>
                                        <button 
                                            onClick={() => handleStatusUpdate(order.id, OrderStatus.NEW)}
                                            className="col-span-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-1"
                                            title="Undo: Back to Pending"
                                        >
                                            <RotateCcw size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleStatusUpdate(order.id, OrderStatus.READY)}
                                            className="col-span-9 bg-orange-500 hover:bg-orange-600 text-white py-3.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-orange-100 shadow-lg active:scale-[0.98]"
                                        >
                                            Mark Ready <ChevronRight size={18} />
                                        </button>
                                    </>
                                )}

                                {/* State: READY (Serving Tab) */}
                                {order.status === OrderStatus.READY && (
                                    <>
                                        <button 
                                            onClick={() => handleStatusUpdate(order.id, OrderStatus.COOKING)}
                                            className="col-span-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-1"
                                            title="Undo: Back to Kitchen"
                                        >
                                            <RotateCcw size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleCompleteOrder(order)}
                                            className="col-span-9 bg-green-600 hover:bg-green-700 text-white py-3.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-green-100 shadow-lg active:scale-[0.98]"
                                        >
                                            <PackageCheck size={18} /> Complete Order
                                        </button>
                                    </>
                                )}

                                {/* State: DELIVERED (History Tab) */}
                                {order.status === OrderStatus.DELIVERED && (
                                    <div className="col-span-12 flex gap-2">
                                         <button 
                                            onClick={() => handleStatusUpdate(order.id, OrderStatus.READY)}
                                            className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 py-2 rounded-lg font-medium text-xs flex items-center justify-center gap-1"
                                        >
                                            <RotateCcw size={14} /> Revert
                                        </button>
                                        <div className="flex-1 flex items-center justify-center gap-1 text-green-700 font-bold text-sm bg-green-50 border border-green-200 rounded-lg">
                                            <CheckCircle2 size={16} /> Completed
                                        </div>
                                    </div>
                                )}
                                
                                {order.status === OrderStatus.CANCELLED && (
                                    <div className="col-span-12 text-center text-xs text-red-400 font-bold py-2 bg-red-50 rounded-lg border border-red-100">
                                        CANCELLED
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                </div>
            )
        )}
      </main>

      {/* Mobile Bottom Navigation - Sticky & Explicit */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
          <div className="grid grid-cols-5 h-[70px]">
              {TABS.map(tab => {
                  const isActive = activeTab === tab.id;
                  return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`relative flex flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-95 ${isActive ? 'text-slate-900' : 'text-slate-400'}`}
                      >
                          {isActive && (
                              <div className={`absolute top-0 left-1/2 -translate-x-1/2 h-1 w-8 ${tab.bg.replace('bg-', 'bg-').replace('900', '600')} rounded-b-full`}></div>
                          )}
                          
                          <div className="relative mt-1">
                              <tab.icon size={22} className={isActive ? 'fill-current opacity-10 stroke-[2.5px]' : 'stroke-[1.5px]'} />
                              {tab.count > 0 && tab.id !== 'MENU' && (
                                  <span className={`absolute -top-1.5 -right-2 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white shadow-sm`}>
                                      {tab.count}
                                  </span>
                              )}
                          </div>
                          <span className={`text-[9px] font-bold tracking-wide ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>{tab.mobileLabel}</span>
                      </button>
                  );
              })}
          </div>
      </nav>
    </div>
  );
};

// Helper Component for Menu List Rows (More systematic than grid)
const MenuItemRow: React.FC<{ item: MenuItem, onToggle: () => void }> = ({ item, onToggle }) => (
    <div className={`p-4 flex justify-between items-center transition-all group ${!item.isAvailable ? 'bg-slate-50' : 'hover:bg-slate-50'}`}>
        <div className={!item.isAvailable ? 'opacity-50' : ''}>
            <h3 className="font-bold text-slate-800 text-sm">{item.name}</h3>
            <div className="text-sm font-medium text-slate-500 mt-0.5">₹{item.price}</div>
        </div>
        
        <div className="flex items-center gap-3">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border ${item.isAvailable ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                {item.isAvailable ? 'In Stock' : 'Sold Out'}
            </span>
            
            {/* Toggle Switch Style Button */}
            <button 
                onClick={onToggle}
                className={`w-12 h-7 rounded-full p-1 transition-colors relative flex items-center ${item.isAvailable ? 'bg-green-500' : 'bg-slate-300'}`}
            >
                <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform ${item.isAvailable ? 'translate-x-5' : 'translate-x-0'}`}></div>
            </button>
        </div>
    </div>
);
