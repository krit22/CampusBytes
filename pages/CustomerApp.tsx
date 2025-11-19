import React, { useEffect, useState } from 'react';
import { ShoppingBag, Utensils, Clock } from 'lucide-react';
import { MenuItem, CartItem, Order, OrderStatus } from '../types';
import { db } from '../services/storage';
import { CartSheet } from '../components/CartSheet';
import { Badge } from '../components/Badge';

export const CustomerApp: React.FC = () => {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  useEffect(() => {
    loadMenu();
    // Check for existing active order in session
    const savedOrderId = sessionStorage.getItem('active_order_id');
    if (savedOrderId) {
      // Poll for this specific order status
      const unsubscribe = db.subscribeToOrders((orders) => {
        const found = orders.find(o => o.id === savedOrderId);
        if (found) setActiveOrder(found);
      });
      return () => unsubscribe();
    }
  }, []);

  const loadMenu = async () => {
    const items = await db.getMenu();
    setMenu(items);
    setIsLoading(false);
  };

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    setIsCartOpen(true);
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
    setIsPlacingOrder(true);
    const total = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    try {
      const order = await db.createOrder(cart, total, method);
      setActiveOrder(order);
      sessionStorage.setItem('active_order_id', order.id);
      setCart([]);
      setIsCartOpen(false);
      
      // Subscribe to updates for this new order
      const unsubscribe = db.subscribeToOrders((orders) => {
        const found = orders.find(o => o.id === order.id);
        if (found) setActiveOrder(found);
      });
      
    } catch (error) {
      console.error("Order failed", error);
      alert("Failed to place order. Please try again.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!activeOrder) return;
    if (window.confirm('Are you sure you want to cancel this order?')) {
      try {
        await db.updateOrderStatus(activeOrder.id, OrderStatus.CANCELLED);
      } catch (error) {
        console.error("Failed to cancel order", error);
        alert("Failed to cancel order. Please try again.");
      }
    }
  };

  const categories = Array.from(new Set(menu.map(m => m.category)));
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (activeOrder) {
    const isCancelled = activeOrder.status === OrderStatus.CANCELLED;
    const isDelivered = activeOrder.status === OrderStatus.DELIVERED;
    
    let headerBg = 'bg-orange-600';
    let title = 'Order Placed!';
    let subtitle = 'Show this screen to the counter';

    if (isCancelled) {
      headerBg = 'bg-red-600';
      title = 'Order Cancelled';
      subtitle = 'This order was cancelled';
    } else if (isDelivered) {
      headerBg = 'bg-emerald-600';
      title = 'Order Delivered';
      subtitle = 'Enjoy your meal!';
    } else if (activeOrder.status === OrderStatus.READY) {
      headerBg = 'bg-green-600';
      title = 'Order Ready!';
      subtitle = 'Please pick up your order';
    }

    return (
      <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
          <div className={`${headerBg} p-6 text-center text-white transition-colors duration-300`}>
            <h2 className="text-2xl font-bold mb-1">{title}</h2>
            <p className="opacity-90 text-sm">{subtitle}</p>
          </div>
          
          <div className="p-8 flex flex-col items-center text-center">
            <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Your Token</div>
            <div className="text-6xl font-black text-slate-900 mb-8 font-mono tracking-tight">{activeOrder.token}</div>
            
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

              {activeOrder.status === OrderStatus.NEW && (
                 <button 
                    onClick={handleCancelOrder}
                    className="w-full py-3 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl font-semibold shadow-sm transition-colors"
                 >
                    Cancel Order
                 </button>
              )}

              {(isDelivered || isCancelled) && (
                 <button 
                    onClick={() => {
                        setActiveOrder(null);
                        sessionStorage.removeItem('active_order_id');
                    }}
                    className="w-full py-3 bg-slate-900 text-white rounded-xl font-semibold shadow-lg mt-2"
                 >
                    Start New Order
                 </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 max-w-md mx-auto bg-slate-50 border-x border-slate-100 shadow-2xl">
      {/* Header */}
      <header className="bg-white sticky top-0 z-10 px-5 py-4 border-b border-slate-100 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
            <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                <Utensils size={20} />
            </div>
            <div>
                <h1 className="font-bold text-slate-800 leading-tight">CampusBytes</h1>
                <p className="text-xs text-slate-500">Central Canteen</p>
            </div>
        </div>
        {cartCount > 0 && (
            <button 
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 text-slate-700 hover:bg-slate-50 rounded-full transition-colors"
            >
                <ShoppingBag size={24} />
                <span className="absolute top-0 right-0 w-5 h-5 bg-orange-600 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                    {cartCount}
                </span>
            </button>
        )}
      </header>

      {/* Menu */}
      <main className="p-5 space-y-8">
        {isLoading ? (
             <div className="flex justify-center py-20 text-slate-400 animate-pulse">Loading menu...</div>
        ) : (
            categories.map(cat => (
            <div key={cat}>
                <h2 className="text-lg font-bold text-slate-800 mb-4 px-1">{cat}</h2>
                <div className="space-y-4">
                {menu.filter(m => m.category === cat).map(item => (
                    <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-start gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-slate-800">{item.name}</h3>
                                {/* Veg/Non-veg dot could go here */}
                            </div>
                            <p className="text-xs text-slate-500 line-clamp-2 mb-3">{item.description}</p>
                            <div className="font-bold text-slate-900">₹{item.price}</div>
                        </div>
                        <button 
                            onClick={() => addToCart(item)}
                            className="bg-orange-50 hover:bg-orange-100 text-orange-700 font-semibold text-sm px-4 py-2 rounded-lg transition-colors self-end"
                        >
                            Add
                        </button>
                    </div>
                ))}
                </div>
            </div>
            ))
        )}
      </main>

      {/* Floating Cart Button (if items exist) */}
      {cartCount > 0 && (
          <div className="fixed bottom-6 left-0 right-0 px-6 max-w-md mx-auto z-20">
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