import React, { useEffect, useState, useMemo } from 'react';
import { db } from '../services/storage';
import { Order, OrderStatus, PaymentStatus } from '../types';
import { Badge } from '../components/Badge';
import { RefreshCw, CheckCircle, Clock, Check, X, DollarSign } from 'lucide-react';

export const VendorApp: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'DONE'>('ACTIVE');

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
      const unsubscribe = db.subscribeToOrders((newOrders) => {
        // Sort by time descending (newest first)
        const sorted = [...newOrders].sort((a, b) => b.createdAt - a.createdAt);
        setOrders(sorted);
      });
      return () => unsubscribe();
    }
  }, [isAuthenticated]);

  const handleStatusUpdate = async (orderId: string, status: OrderStatus) => {
    await db.updateOrderStatus(orderId, status);
  };

  const handlePaymentUpdate = async (orderId: string, status: PaymentStatus) => {
    await db.updatePaymentStatus(orderId, status);
  };

  const filteredOrders = useMemo(() => {
    if (filter === 'ALL') return orders;
    if (filter === 'DONE') return orders.filter(o => o.status === OrderStatus.DELIVERED || o.status === OrderStatus.CANCELLED);
    // Active
    return orders.filter(o => o.status !== OrderStatus.DELIVERED && o.status !== OrderStatus.CANCELLED);
  }, [orders, filter]);

  // Group metrics
  const metrics = useMemo(() => {
      return {
          pending: orders.filter(o => o.status === OrderStatus.NEW).length,
          cooking: orders.filter(o => o.status === OrderStatus.COOKING).length,
          revenue: orders.filter(o => o.paymentStatus === PaymentStatus.PAID).reduce((s, o) => s + o.totalAmount, 0)
      }
  }, [orders]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
             <RefreshCw size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Vendor Login</h1>
          <p className="text-slate-500 mb-6">Enter your store PIN to manage orders.</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full text-center text-3xl tracking-widest py-4 border-2 border-slate-200 rounded-xl focus:border-orange-500 focus:ring-0 outline-none transition-colors bg-slate-50 font-mono"
              placeholder="••••"
              autoFocus
            />
            <button type="submit" className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-colors">
              Access Dashboard
            </button>
          </form>
          <p className="mt-6 text-xs text-slate-400">Demo PIN: 1234</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Top Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <h1 className="text-xl font-bold text-slate-800">Kitchen View</h1>
             <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> Live
             </span>
          </div>
          <div className="flex gap-4 text-sm font-medium text-slate-600">
              <div className="hidden md:block">Pending: <span className="text-orange-600">{metrics.pending}</span></div>
              <div className="hidden md:block">Cooking: <span className="text-blue-600">{metrics.cooking}</span></div>
              <div>Rev: <span className="text-emerald-600">₹{metrics.revenue}</span></div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-6 overflow-x-auto">
             {(['ACTIVE', 'DONE', 'ALL'] as const).map(f => (
                 <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${filter === f ? 'border-orange-600 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                 >
                    {f === 'ACTIVE' ? 'Active Queue' : f === 'DONE' ? 'Completed' : 'All History'}
                 </button>
             ))}
        </div>
      </header>

      {/* Main Grid */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {filteredOrders.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
                <p className="text-lg">No orders in this view.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrders.map(order => (
                <div key={order.id} className={`bg-white rounded-xl shadow-sm border flex flex-col overflow-hidden transition-all hover:shadow-md ${order.status === OrderStatus.NEW ? 'border-blue-200 ring-1 ring-blue-100' : 'border-slate-200'}`}>
                    {/* Card Header */}
                    <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono text-2xl font-black text-slate-800">{order.token}</span>
                                <Badge status={order.status} />
                            </div>
                            <div className="text-xs text-slate-500">
                                {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {order.items.length} items
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="font-bold text-slate-900 text-lg">₹{order.totalAmount}</div>
                            <button 
                                onClick={() => handlePaymentUpdate(order.id, order.paymentStatus === PaymentStatus.PAID ? PaymentStatus.PENDING : PaymentStatus.PAID)}
                                className={`text-xs px-2 py-1 rounded border flex items-center gap-1 mt-1 transition-colors ${order.paymentStatus === PaymentStatus.PAID ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-yellow-50 border-yellow-200 text-yellow-700'}`}
                            >
                                {order.paymentStatus === PaymentStatus.PAID ? <Check size={12} /> : <DollarSign size={12} />}
                                {order.paymentStatus}
                            </button>
                            <div className="text-[10px] text-slate-400 mt-0.5 font-mono uppercase">{order.paymentMethod}</div>
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
                    <div className="p-3 bg-slate-50 border-t border-slate-100 grid grid-cols-2 gap-2">
                         {/* State Transition Logic */}
                         {order.status === OrderStatus.NEW && (
                             <button 
                                onClick={() => handleStatusUpdate(order.id, OrderStatus.COOKING)}
                                className="col-span-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold text-sm transition-colors"
                             >
                                Accept & Cook
                             </button>
                         )}

                        {order.status === OrderStatus.COOKING && (
                             <button 
                                onClick={() => handleStatusUpdate(order.id, OrderStatus.READY)}
                                className="col-span-2 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg font-semibold text-sm transition-colors"
                             >
                                Mark Ready
                             </button>
                         )}

                        {order.status === OrderStatus.READY && (
                             <button 
                                onClick={() => handleStatusUpdate(order.id, OrderStatus.DELIVERED)}
                                disabled={order.paymentStatus !== PaymentStatus.PAID}
                                className="col-span-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 disabled:text-slate-500 text-white py-2 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                             >
                                {order.paymentStatus !== PaymentStatus.PAID ? 'Collect Payment First' : 'Complete Order'}
                             </button>
                         )}

                         {(order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CANCELLED) && (
                             <div className="col-span-2 text-center text-xs text-slate-400 py-2">
                                 Order Closed
                             </div>
                         )}
                    </div>
                </div>
            ))}
            </div>
        )}
      </main>
    </div>
  );
};