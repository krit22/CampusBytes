
import React, { useEffect, useState, useRef } from 'react';
import { ShoppingBag, Utensils, Clock, LogOut, ChevronRight, Search, Flame, Lightbulb, Sparkles, Timer, RotateCcw } from 'lucide-react';
import { MenuItem, CartItem, Order, OrderStatus, User } from '../types';
import { db, parseJwt } from '../services/storage';
import { CartSheet } from '../components/CartSheet';
import { Badge } from '../components/Badge';

// SUB COMPONENTS
import { ConfirmationModal, ConfirmConfig } from '../components/shared/ConfirmationModal';
import { ToastNotification, ToastState } from '../components/shared/ToastNotification';
import { CustomerLogin } from '../components/customer/CustomerLogin';
import { BannedView } from '../components/customer/BannedView';

// CONFIG
const TRIVIA_FACTS = [
    "Honey never spoils. You can eat 3000-year-old honey!",
    "Bananas are berries, but strawberries aren't.",
    "Carrots were originally purple, not orange.",
    "Apples float because they are 25% air.",
    "Potatoes were the first food grown in space.",
    "Broccoli contains more protein per calorie than steak.",
    "Chocolate was once used as currency.",
    "A single spaghetti noodle is called a spaghetto."
];

export const CustomerApp: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  
  // UI States
  const [view, setView] = useState<'LOGIN' | 'MENU' | 'ORDER_DETAILS' | 'HISTORY' | 'BANNED'>('LOGIN');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [focusedOrder, setFocusedOrder] = useState<Order | null>(null);
  const [dailyFact, setDailyFact] = useState('');
  
  // Ban State
  const [banInfo, setBanInfo] = useState<{reason: string, expiresAt: number} | null>(null);
  
  // Notification Toast State
  const [toast, setToast] = useState<ToastState | null>(null);

  // Confirm Modal State
  const [confirmConfig, setConfirmConfig] = useState<ConfirmConfig>({ isOpen: false, title: '', message: '', onConfirm: () => {}, type: 'NEUTRAL' });

  // Menu UI States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const categoryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Initialize
  useEffect(() => {
    const checkUser = async () => {
      const currentUser = db.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        await loadData(currentUser.id);
        setView('MENU');
      } else {
        setView('LOGIN');
        setIsLoading(false);
      }
    };
    checkUser();
  }, []);

  useEffect(() => {
      setDailyFact(TRIVIA_FACTS[Math.floor(Math.random() * TRIVIA_FACTS.length)]);
  }, [view]);

  // Subscription for Order Updates
  useEffect(() => {
    if (user && view !== 'BANNED') {
      const unsubscribe = db.subscribeToOrders((allOrders) => {
        const myOrders = allOrders.filter(o => o.customerId === user.id).sort((a,b) => b.createdAt - a.createdAt);
        setUserOrders(myOrders);
        
        if (focusedOrder) {
            const updated = myOrders.find(o => o.id === focusedOrder.id);
            if (updated) setFocusedOrder(updated);
        }
      });
      return () => unsubscribe();
    }
  }, [user, focusedOrder, view]);

  // Toast Timer
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (msg: string, type: 'SUCCESS' | 'ERROR' | 'INFO' = 'INFO') => {
    setToast({ msg, type });
  };

  const requestConfirm = (title: string, message: string, action: () => void, type: 'DANGER' | 'NEUTRAL' = 'NEUTRAL') => {
      setConfirmConfig({ isOpen: true, title, message, onConfirm: action, type });
  };

  const handleGoogleCredentialResponse = async (response: any) => {
    try {
      const payload = parseJwt(response.credential);
      if (payload) {
        const googleUser: Partial<User> = {
          name: payload.name,
          email: payload.email,
          avatar: payload.picture,
          id: payload.sub
        };
        const loggedUser = await db.login(googleUser);
        finishLogin(loggedUser);
      }
    } catch (error) {
      console.error("Failed to process Google Login", error);
      alert("Login failed. Please try again.");
    }
  };

  const handleGuestLogin = async (name: string, email: string) => {
      const loggedUser = await db.login({ name, email });
      finishLogin(loggedUser);
  };

  const finishLogin = async (loggedUser: User) => {
    setUser(loggedUser);
    await loadData(loggedUser.id);
    setView('MENU');
    setIsLoading(false);
  };

  const loadData = async (userId: string) => {
    const [items, orders] = await Promise.all([
      db.getMenu(),
      db.getUserOrders(userId)
    ]);
    setMenu(items);
    setUserOrders(orders);
    setIsLoading(false);
  };

  const handleLogout = async () => {
    requestConfirm(
        'Sign Out',
        'Are you sure you want to sign out of CampusBytes?',
        async () => {
            await db.logout();
            setUser(null);
            setMenu([]);
            setCart([]);
            setUserOrders([]);
            setView('LOGIN');
        },
        'NEUTRAL'
    );
  };

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
    setCart(prev => {
      return prev.map(item => {
        if (item.id === itemId) {
          return { ...item, quantity: Math.max(0, item.quantity + delta) };
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  const handleReorder = (oldOrder: Order) => {
    let itemsAdded = 0;
    let itemsUnavailable = 0;
    const newCartItems: CartItem[] = [];

    oldOrder.items.forEach(oldItem => {
        const currentMenuItem = menu.find(m => m.name === oldItem.name); 
        
        if (currentMenuItem && currentMenuItem.isAvailable) {
            newCartItems.push({
                ...currentMenuItem,
                quantity: oldItem.quantity
            });
            itemsAdded++;
        } else {
            itemsUnavailable++;
        }
    });

    if (itemsAdded === 0) {
        showToast("All items from this order are currently unavailable.", "ERROR");
        return;
    }

    setCart(prev => {
        const combined = [...prev];
        newCartItems.forEach(newItem => {
            const existingIdx = combined.findIndex(c => c.id === newItem.id);
            if (existingIdx > -1) {
                combined[existingIdx].quantity += newItem.quantity;
            } else {
                combined.push(newItem);
            }
        });
        return combined;
    });

    if (itemsUnavailable > 0) {
        showToast(`${itemsAdded} items added. ${itemsUnavailable} items were sold out.`, "INFO");
    } else {
        showToast("Order added to cart!", "SUCCESS");
    }
    setIsCartOpen(true);
  };

  const handlePlaceOrder = async (method: 'CASH' | 'UPI') => {
    if (!user) return;
    setIsPlacingOrder(true);
    const total = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    try {
      const order = await db.createOrder(user, cart, total, method);
      setFocusedOrder(order);
      setView('ORDER_DETAILS');
      setCart([]);
      setIsCartOpen(false);
    } catch (error: any) {
      console.error("Order failed", error);
      if (error.status === 403) { 
        const data = error.data;
        setBanInfo({ reason: data.banReason, expiresAt: data.banExpiresAt });
        setView('BANNED');
        setIsCartOpen(false);
      } else {
          const msg = error.message === 'Failed to fetch' ? "Network error." : (error.message || "Order failed.");
          alert(msg);
      }
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!focusedOrder) return;
    requestConfirm(
        'Cancel Order?',
        'Are you sure? Cancelling too many orders will lead to an account suspension.',
        async () => {
            const previousOrder = { ...focusedOrder };
            const previousList = [...userOrders];

            const cancelledOrder = { ...focusedOrder, status: OrderStatus.CANCELLED };
            setFocusedOrder(cancelledOrder);
            setUserOrders(prev => prev.map(o => o.id === focusedOrder.id ? cancelledOrder : o));

            try {
                await db.updateOrderStatus(focusedOrder.id, OrderStatus.CANCELLED);
                showToast("Order cancelled.", "INFO");
            } catch (error) {
                console.error("Failed to cancel order", error);
                setFocusedOrder(previousOrder);
                setUserOrders(previousList);
                showToast("Failed to cancel. Network error?", "ERROR");
            }
        },
        'DANGER'
    );
  };
  
  const scrollToCategory = (cat: string) => {
      setSelectedCategory(cat);
      if (categoryRefs.current[cat]) {
          categoryRefs.current[cat]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
  };

  const getEstTime = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.NEW: return "Go to counter & listen for Token";
      case OrderStatus.COOKING: return "~10-15 mins";
      case OrderStatus.READY: return "Ready now!";
      default: return "";
    }
  }

  // --- RENDER VIEWS ---

  if (view === 'BANNED' && banInfo) {
      return <BannedView reason={banInfo.reason} expiresAt={banInfo.expiresAt} />;
  }

  if (view === 'LOGIN') {
    return <CustomerLogin onGoogleLogin={handleGoogleCredentialResponse} onGuestLogin={handleGuestLogin} />;
  }

  if (view === 'ORDER_DETAILS' && focusedOrder) {
     const activeOrder = focusedOrder;
     const isCancelled = activeOrder.status === OrderStatus.CANCELLED;
     const isDelivered = activeOrder.status === OrderStatus.DELIVERED;
     
     let headerBg = 'bg-orange-600';
     let title = 'Order Placed!';
     let subtitle = 'Show this screen to the counter';
     let estTime = getEstTime(activeOrder.status);
 
     if (isCancelled) {
       headerBg = 'bg-red-600';
       title = 'Order Cancelled';
       subtitle = 'This order was cancelled';
       estTime = "";
     } else if (isDelivered) {
       headerBg = 'bg-emerald-600';
       title = 'Order Delivered';
       subtitle = 'Enjoy your meal!';
       estTime = "";
     } else if (activeOrder.status === OrderStatus.READY) {
       headerBg = 'bg-green-600 animate-pulse';
       title = 'Order Ready!';
       subtitle = 'Please pick up your order';
     } else if (activeOrder.status === OrderStatus.COOKING) {
        title = 'Preparing...';
     } else if (activeOrder.status === OrderStatus.NEW) {
        title = 'Go to Counter';
        subtitle = 'Listen for your Token number';
        headerBg = 'bg-blue-600';
     }

     return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
             <ConfirmationModal config={confirmConfig} onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))} />
             <ToastNotification toast={toast} />

             <div className={`${headerBg} p-4 text-white flex items-center gap-2 transition-colors duration-500`}>
                 <button onClick={() => setView('MENU')} className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                    <ChevronRight size={20} className="rotate-180" />
                 </button>
                 <span className="font-bold">Back to Menu</span>
             </div>

             <div className="flex-1 p-6 flex flex-col items-center justify-start">
                <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
                    <div className={`${headerBg} p-6 text-center text-white transition-colors duration-500`}>
                        <h2 className="text-2xl font-bold mb-1">{title}</h2>
                        <p className="opacity-90 text-sm">{subtitle}</p>
                    </div>
                    
                    <div className="p-8 flex flex-col items-center text-center">
                        <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Your Token</div>
                        <div className="text-6xl font-black text-slate-900 mb-6 font-mono tracking-tight">{activeOrder.token}</div>
                        
                        {estTime && (
                          <div className="mb-6 flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                             <Timer size={16} className="text-slate-400" />
                             <span className="text-sm font-bold text-slate-600">{estTime}</span>
                          </div>
                        )}
                        
                        <div className="w-full space-y-6">
                          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                              <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-full ${activeOrder.status === OrderStatus.NEW ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                                      <Clock size={20} />
                                  </div>
                                  <div className="text-left">
                                      <div className="text-xs text-slate-500 font-medium">Status</div>
                                      <div className="font-bold text-slate-800"><Badge status={activeOrder.status} /></div>
                                  </div>
                              </div>
                          </div>

                          {!isCancelled && !isDelivered && (
                              <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex items-start gap-3 text-left">
                                  <Lightbulb className="shrink-0 text-orange-500 mt-1" size={18} />
                                  <div>
                                      <div className="text-xs font-bold text-orange-600 uppercase mb-1 flex items-center gap-1">
                                          Foodie Fact <Sparkles size={10} />
                                      </div>
                                      <p className="text-xs text-slate-600 leading-relaxed">{dailyFact}</p>
                                  </div>
                              </div>
                          )}
                          
                          <div className="border-t pt-6">
                              <h3 className="text-left font-bold text-slate-800 mb-4">Order Summary</h3>
                              <div className="space-y-3">
                                  {activeOrder.items.map((item, idx) => (
                                      <div key={idx} className="flex justify-between text-sm">
                                          <span className="text-slate-600">{item.quantity}x {item.name}</span>
                                          <span className="font-medium text-slate-900">₹{item.price * item.quantity}</span>
                                      </div>
                                  ))}
                              </div>
                              <div className="flex justify-between items-center mt-6 pt-4 border-t border-dashed font-bold text-lg">
                                  <span>Total</span>
                                  <span className="text-orange-600">₹{activeOrder.totalAmount}</span>
                              </div>
                              <div className="mt-2 text-right">
                                  <Badge status={activeOrder.paymentStatus} type="payment" />
                              </div>
                          </div>

                          <div className="pt-4 space-y-3">
                              <button 
                                  onClick={() => setView('MENU')}
                                  className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
                              >
                                  Explore Menu
                              </button>

                              {activeOrder.status === OrderStatus.NEW && (
                                  <button 
                                      onClick={handleCancelOrder}
                                      className="text-xs text-red-500 font-semibold hover:text-red-700 hover:underline py-2 transition-colors"
                                  >
                                      Cancel Order
                                  </button>
                              )}
                          </div>
                        </div>
                    </div>
                </div>
             </div>
        </div>
     );
  }

  if (view === 'HISTORY') {
      const activeHistoryOrders = userOrders.filter(o => [OrderStatus.NEW, OrderStatus.COOKING, OrderStatus.READY].includes(o.status));
      const pastHistoryOrders = userOrders.filter(o => [OrderStatus.DELIVERED, OrderStatus.CANCELLED].includes(o.status));

      const OrderCard = ({ order }: { order: Order }) => (
        <div 
            onClick={() => { setFocusedOrder(order); setView('ORDER_DETAILS'); }}
            className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 active:scale-[0.98] transition-transform group"
        >
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-lg bg-slate-100 px-2 rounded text-slate-700">{order.token}</span>
                    <div className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</div>
                </div>
                <Badge status={order.status} />
            </div>
            <div className="text-sm text-slate-600 mb-3">
                {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                <span className="text-sm font-bold">₹{order.totalAmount}</span>
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleReorder(order); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-orange-200 text-orange-600 bg-orange-50 hover:bg-orange-100 font-bold text-xs transition-colors"
                    >
                        <RotateCcw size={12} /> Reorder
                    </button>
                    
                    <span className="text-slate-400 group-hover:text-orange-600 transition-colors">
                        <ChevronRight size={16} />
                    </span>
                </div>
            </div>
        </div>
      );

      return (
          <div className="min-h-screen bg-slate-50">
              <ConfirmationModal config={confirmConfig} onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))} />
              <ToastNotification toast={toast} />

              <header className="bg-white sticky top-0 z-10 px-5 py-4 border-b border-slate-100 flex items-center gap-3 shadow-sm">
                    <button onClick={() => setView('MENU')} className="p-2 -ml-2 hover:bg-slate-100 rounded-full text-slate-600">
                        <ChevronRight className="rotate-180" size={24} />
                    </button>
                    <h1 className="font-bold text-lg text-slate-800">My Orders</h1>
              </header>
              <div className="p-5 space-y-8 max-w-md mx-auto pb-24">
                  {userOrders.length === 0 ? (
                      <div className="text-center py-20 text-slate-400">
                          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                              <ShoppingBag size={30} />
                          </div>
                          <p>No orders yet.</p>
                          <button onClick={() => setView('MENU')} className="text-orange-600 font-bold text-sm mt-2">Start Ordering</button>
                      </div>
                  ) : (
                      <>
                          {activeHistoryOrders.length > 0 && (
                              <div>
                                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                      Active Orders
                                  </h3>
                                  <div className="space-y-4">
                                      {activeHistoryOrders.map(order => <OrderCard key={order.id} order={order} />)}
                                  </div>
                              </div>
                          )}

                          {pastHistoryOrders.length > 0 && (
                              <div>
                                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Past Orders</h3>
                                  <div className="space-y-4 opacity-90 grayscale-[0.3]">
                                      {pastHistoryOrders.map(order => <OrderCard key={order.id} order={order} />)}
                                  </div>
                              </div>
                          )}
                      </>
                  )}
              </div>

              <CartSheet 
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                items={cart}
                onUpdateQuantity={updateQuantity}
                onPlaceOrder={handlePlaceOrder}
                isPlacingOrder={isPlacingOrder}
              />
          </div>
      )
  }

  // --- MAIN MENU VIEW ---
  const categories: string[] = Array.from(new Set(menu.map(m => m.category)));
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const activeOrdersCount = userOrders.filter(o => o.status !== OrderStatus.DELIVERED && o.status !== OrderStatus.CANCELLED).length;
  const bestsellers = menu.filter(m => m.isBestseller && m.isAvailable);
  
  const filteredMenu = menu.filter(m => {
      const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || m.category === selectedCategory;
      return m.isAvailable && matchesSearch && (searchQuery ? true : matchesCategory);
  });

  const displayCategories: string[] = searchQuery 
    ? Array.from(new Set(filteredMenu.map(m => m.category))) 
    : categories;

  return (
    <div className="min-h-screen pb-24 max-w-md mx-auto bg-slate-50 border-x border-slate-100 shadow-2xl relative">
      
      <ConfirmationModal config={confirmConfig} onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))} />
      <ToastNotification toast={toast} />

      <header className="bg-white sticky top-0 z-20 shadow-sm">
          <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                    <Utensils size={20} />
                </div>
                <div>
                    <h1 className="font-bold text-slate-800 leading-tight">CampusBytes</h1>
                    <p className="text-xs text-slate-500 max-w-[120px] truncate">Hello, {user?.name.split(' ')[0]}</p>
                </div>
            </div>
            
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => setView('HISTORY')}
                    className="p-2 relative hover:bg-slate-50 rounded-full text-slate-500 border border-transparent hover:border-slate-200 transition-all"
                >
                    <Clock size={22} />
                    {activeOrdersCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white animate-pulse">
                            {activeOrdersCount}
                        </span>
                    )}
                </button>
                <button 
                    onClick={handleLogout}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                >
                    <LogOut size={20} />
                </button>
            </div>
        </div>

        <div className="px-5 py-2 bg-white">
            <div className="relative">
                <Search size={18} className="absolute left-3 top-3 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Search food (e.g. Maggi)" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-orange-500 focus:ring-0 outline-none text-sm font-medium"
                />
            </div>
        </div>

        {!searchQuery && (
            <div className="flex gap-2 overflow-x-auto px-5 py-2 pb-3 scrollbar-hide bg-white border-b border-slate-100">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => scrollToCategory(cat)}
                        className="px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-all bg-slate-100 text-slate-600 hover:bg-slate-200"
                    >
                        {cat}
                    </button>
                ))}
            </div>
        )}
      </header>

      <main className="p-5 space-y-6">
        
        {isLoading ? (
             <div className="flex justify-center py-20 text-slate-400 animate-pulse">Loading menu...</div>
        ) : (
            <>
                {!searchQuery && bestsellers.length > 0 && (
                    <div className="mb-6">
                        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800 mb-4">
                            <Flame size={20} className="text-orange-500 fill-orange-500" /> Bestsellers
                        </h2>
                        <div className="flex gap-4 overflow-x-auto pb-4 -mx-5 px-5 scrollbar-hide">
                            {bestsellers.map(item => (
                                <div key={item.id} className="min-w-[160px] bg-white p-3 rounded-2xl shadow-sm border border-orange-100 flex flex-col">
                                    <div className="flex-1">
                                        <h3 className="font-bold text-slate-800 text-sm line-clamp-2 mb-1">{item.name}</h3>
                                        <div className="text-orange-600 font-bold text-sm">₹{item.price}</div>
                                    </div>
                                    <button 
                                        onClick={() => addToCart(item)}
                                        className="mt-3 w-full bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-bold py-2 rounded-lg transition-all active:scale-95"
                                    >
                                        ADD
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {searchQuery && filteredMenu.length === 0 && (
                    <div className="text-center py-10 text-slate-400">
                        <p>No items found matching "{searchQuery}"</p>
                    </div>
                )}

                {displayCategories.map(cat => {
                    const items = searchQuery 
                        ? filteredMenu.filter(m => m.category === cat)
                        : menu.filter(m => m.category === cat && m.isAvailable);
                    
                    if (items.length === 0) return null;

                    return (
                        <div key={cat} ref={el => { categoryRefs.current[cat] = el; }} className="scroll-mt-36">
                            <h2 className="text-lg font-bold text-slate-800 mb-3 px-1">{cat}</h2>
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden divide-y divide-slate-50">
                                {items.map(item => (
                                    <div key={item.id} className="p-4 flex justify-between items-center gap-3">
                                        <div className="flex-1">
                                            <h3 className="font-bold text-slate-800 text-sm">{item.name}</h3>
                                            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{item.description}</p>
                                            <div className="text-sm font-bold text-slate-900 mt-1">₹{item.price}</div>
                                        </div>
                                        <button 
                                            onClick={() => addToCart(item)}
                                            className="shrink-0 bg-white border border-slate-200 text-orange-600 shadow-sm font-bold text-xs px-5 py-2 rounded-lg hover:bg-orange-50 hover:border-orange-200 active:scale-95 transition-all"
                                        >
                                            ADD
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </>
        )}
      </main>

      {cartCount > 0 && (
          <div className="fixed bottom-6 left-0 right-0 px-6 max-w-md mx-auto z-20 animate-in slide-in-from-bottom-4 duration-300">
              <button 
                onClick={() => setIsCartOpen(true)}
                className="w-full bg-slate-900 text-white p-4 rounded-2xl shadow-xl flex justify-between items-center font-bold transform transition hover:scale-[1.02] active:scale-95"
              >
                  <span className="flex items-center gap-2">
                      <span className="bg-slate-700 px-2 py-0.5 rounded text-xs">{cartCount}</span>
                      View Cart
                  </span>
                  <span>₹{cart.reduce((s, i) => s + (i.price * i.quantity), 0)}</span>
              </button>
          </div>
      )}

      <CartSheet 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQuantity={updateQuantity}
        onPlaceOrder={handlePlaceOrder}
        isPlacingOrder={isPlacingOrder}
      />
    </div>
  );
};
