
import React, { useEffect, useState, useRef } from 'react';
import { ShoppingBag, Utensils, Clock, LogOut, ChevronRight, User as UserIcon, Mail, ArrowRight, Search, Flame, Timer, Lightbulb, Sparkles } from 'lucide-react';
import { MenuItem, CartItem, Order, OrderStatus, User } from '../types';
import { db, parseJwt } from '../services/storage';
import { CartSheet } from '../components/CartSheet';
import { Badge } from '../components/Badge';

// CONFIG
const GOOGLE_CLIENT_ID = import.meta.env?.VITE_GOOGLE_CLIENT_ID || "";

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
  const [view, setView] = useState<'LOGIN' | 'MENU' | 'ORDER_DETAILS' | 'HISTORY'>('LOGIN');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [focusedOrder, setFocusedOrder] = useState<Order | null>(null);
  const [dailyFact, setDailyFact] = useState('');
  
  // Menu UI States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const categoryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  // Login UI States
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [demoName, setDemoName] = useState('');
  const [demoEmail, setDemoEmail] = useState('');

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

  // Google Auth Initialization
  useEffect(() => {
    if (view === 'LOGIN' && GOOGLE_CLIENT_ID && window.google) {
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCredentialResponse
        });
        window.google.accounts.id.renderButton(
          document.getElementById("googleBtnWrapper"),
          { theme: "outline", size: "large", width: "100%", text: "continue_with" }
        );
      } catch (e) {
        console.error("Google Auth Init Error:", e);
      }
    }
  }, [view]);

  // Subscription for Order Updates
  useEffect(() => {
    if (user) {
      const unsubscribe = db.subscribeToOrders((allOrders) => {
        // Filter for this user
        const myOrders = allOrders.filter(o => o.customerId === user.id).sort((a,b) => b.createdAt - a.createdAt);
        setUserOrders(myOrders);
        
        if (focusedOrder) {
            const updated = myOrders.find(o => o.id === focusedOrder.id);
            if (updated) setFocusedOrder(updated);
        }
      });
      return () => unsubscribe();
    }
  }, [user, focusedOrder]);

  const handleGoogleCredentialResponse = async (response: any) => {
    try {
      const payload = parseJwt(response.credential);
      if (payload) {
        // Map Google Profile to App User
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

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoName || !demoEmail) return;
    
    const loggedUser = await db.login({
      name: demoName,
      email: demoEmail,
    });
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
    if (confirm('Sign out of CampusBytes?')) {
      await db.logout();
      window.location.reload();
    }
  };

  const addToCart = (item: MenuItem) => {
    // Add to cart is purely local, so it's naturally optimistic/instant
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
      // Error handling logic to catch rate limiting
      const msg = error.message === 'Failed to fetch' ? "Network error." : "Order failed.";
      alert(msg + " Check if you have too many active orders.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!focusedOrder) return;
    
    // Explicit check - user must type or click strongly confirmation
    if (window.confirm('WAIT! Are you absolutely sure you want to cancel your food? This cannot be undone.')) {
      // 1. Snapshot for revert
      const previousOrder = { ...focusedOrder };
      const previousList = [...userOrders];

      // 2. Optimistic Update
      const cancelledOrder = { ...focusedOrder, status: OrderStatus.CANCELLED };
      setFocusedOrder(cancelledOrder);
      setUserOrders(prev => prev.map(o => o.id === focusedOrder.id ? cancelledOrder : o));

      try {
        // 3. API Call
        await db.updateOrderStatus(focusedOrder.id, OrderStatus.CANCELLED);
      } catch (error) {
        // 4. Revert on failure
        console.error("Failed to cancel order", error);
        setFocusedOrder(previousOrder);
        setUserOrders(previousList);
        alert("Failed to cancel order. Please try again.");
      }
    }
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

  if (view === 'LOGIN') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-xl text-center space-y-8 transition-all border border-slate-100">
          {!showEmailForm ? (
            <>
              <div className="w-20 h-20 bg-orange-100 rounded-3xl flex items-center justify-center mx-auto text-orange-600 shadow-sm">
                <Utensils size={40} />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">CampusBytes</h1>
                <p className="text-slate-500 font-medium">Order smarter. Eat better.</p>
              </div>
              
              <div className="space-y-4 pt-2">
                {GOOGLE_CLIENT_ID ? (
                   <div id="googleBtnWrapper" className="h-[44px] w-full flex justify-center"></div>
                ) : (
                   <div className="text-sm text-red-500 bg-red-50 p-4 rounded-xl border border-red-100">
                      Config Error: Google Client ID missing.
                   </div>
                )}

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-slate-400">Or</span>
                  </div>
                </div>

                <button 
                  onClick={() => setShowEmailForm(true)}
                  className="w-full bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold py-3 rounded-xl border border-slate-200 text-sm transition-colors"
                >
                  Continue with Email
                </button>
              </div>
              <p className="text-[10px] text-slate-400 px-4 leading-tight">
                By continuing, you agree to our Terms of Service and Privacy Policy.
              </p>
            </>
          ) : (
            <form onSubmit={handleCustomLogin} className="text-left space-y-4 animate-in slide-in-from-right-10 fade-in duration-300">
              <div className="flex items-center gap-2 mb-6">
                <button type="button" onClick={() => setShowEmailForm(false)} className="p-1 hover:bg-slate-100 rounded-full">
                    <ChevronRight className="rotate-180" size={20} />
                </button>
                <h2 className="font-bold text-lg">Guest Details</h2>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Full Name</label>
                <div className="relative">
                  <UserIcon size={18} className="absolute left-3 top-3 text-slate-400" />
                  <input 
                    type="text" 
                    required
                    value={demoName}
                    onChange={e => setDemoName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-0 outline-none bg-slate-50"
                    placeholder="e.g. John Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Email Address</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-3 text-slate-400" />
                  <input 
                    type="email" 
                    required
                    value={demoEmail}
                    onChange={e => setDemoEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-0 outline-none bg-slate-50"
                    placeholder="e.g. john@campus.edu"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 flex items-center justify-center gap-2 mt-4 shadow-lg shadow-slate-200"
              >
                Start Ordering <ArrowRight size={16} />
              </button>
            </form>
          )}
        </div>
      </div>
    );
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
             {/* Nav Back */}
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

                          {/* FOOD TRIVIA - ENGAGEMENT */}
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

                          {/* ACTIONS */}
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
      return (
          <div className="min-h-screen bg-slate-50">
              <header className="bg-white sticky top-0 z-10 px-5 py-4 border-b border-slate-100 flex items-center gap-3 shadow-sm">
                    <button onClick={() => setView('MENU')} className="p-2 -ml-2 hover:bg-slate-100 rounded-full text-slate-600">
                        <ChevronRight className="rotate-180" size={24} />
                    </button>
                    <h1 className="font-bold text-lg text-slate-800">My Orders</h1>
              </header>
              <div className="p-5 space-y-4 max-w-md mx-auto pb-24">
                  {userOrders.length === 0 ? (
                      <div className="text-center py-20 text-slate-400">
                          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                              <ShoppingBag size={30} />
                          </div>
                          <p>No orders yet.</p>
                          <button onClick={() => setView('MENU')} className="text-orange-600 font-bold text-sm mt-2">Start Ordering</button>
                      </div>
                  ) : (
                      userOrders.map(order => (
                          <div 
                            key={order.id} 
                            onClick={() => { setFocusedOrder(order); setView('ORDER_DETAILS'); }}
                            className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 active:scale-[0.98] transition-transform"
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
                              <div className="flex justify-between items-center text-sm font-semibold pt-2 border-t border-slate-50">
                                  <span>₹{order.totalAmount}</span>
                                  <span className="text-orange-600 flex items-center gap-1">View Details <ChevronRight size={14} /></span>
                              </div>
                          </div>
                      ))
                  )}
              </div>
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

  // If searching, group by category of filtered items. If not searching, categories are handled by scroll
  const displayCategories: string[] = searchQuery 
    ? Array.from(new Set(filteredMenu.map(m => m.category))) 
    : categories;

  return (
    <div className="min-h-screen pb-24 max-w-md mx-auto bg-slate-50 border-x border-slate-100 shadow-2xl">
      {/* Header */}
      <header className="bg-white sticky top-0 z-20 shadow-sm">
          {/* Top Bar */}
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

        {/* Search Bar */}
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

        {/* Category Tabs (Sticky) - Only show if not searching */}
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

      {/* Menu Content */}
      <main className="p-5 space-y-6">
        
        {isLoading ? (
             <div className="flex justify-center py-20 text-slate-400 animate-pulse">Loading menu...</div>
        ) : (
            <>
                {/* Bestsellers Section - Only when not searching */}
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

                {/* Menu List */}
                {searchQuery && filteredMenu.length === 0 && (
                    <div className="text-center py-10 text-slate-400">
                        <p>No items found matching "{searchQuery}"</p>
                    </div>
                )}

                {/* Categories Loop */}
                {displayCategories.map(cat => {
                    // If searching, use filtered list, else use full list
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

      {/* Floating Cart Button */}
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
