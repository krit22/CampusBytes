
import React, { useState } from 'react';
import { CartItem, OrderType, DeliveryDetails } from '../types';
import { X, Plus, Minus, CreditCard, Banknote, MapPin, Phone, Home } from 'lucide-react';

interface CartSheetProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onPlaceOrder: (paymentMethod: 'CASH' | 'UPI', orderType: OrderType, deliveryDetails?: DeliveryDetails) => void;
  isPlacingOrder: boolean;
}

const HALLS = Array.from({ length: 15 }, (_, i) => `Hall ${i + 1}`);
HALLS.push('Staff Quarters', 'Library', 'Other');

export const CartSheet: React.FC<CartSheetProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onPlaceOrder,
  isPlacingOrder
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI'>('UPI');
  const [orderType, setOrderType] = useState<OrderType>('DINE_IN');
  
  // Delivery State
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('Hall 1');
  const [instructions, setInstructions] = useState('');

  if (!isOpen) return null;

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const isDelivery = orderType === 'DELIVERY';

  const handlePlaceOrderClick = () => {
    if (isDelivery) {
        if (!phone || phone.length < 10) {
            alert("Please enter a valid 10-digit phone number.");
            return;
        }
        if (!instructions && location === 'Other') {
             alert("Please specify your location.");
             return;
        }
        onPlaceOrder(paymentMethod, 'DELIVERY', {
            phoneNumber: phone,
            location: location,
            instructions: instructions || 'Main Gate'
        });
    } else {
        onPlaceOrder(paymentMethod, 'DINE_IN');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center pointer-events-none">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto transition-opacity" 
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative w-full max-w-md bg-white rounded-t-2xl md:rounded-2xl shadow-2xl pointer-events-auto max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-10 duration-200">
        
        {/* Header with Order Type Toggle */}
        <div className="flex flex-col gap-4 p-5 border-b bg-slate-50 rounded-t-2xl">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800">Checkout</h2>
                <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500">
                    <X size={20} />
                </button>
            </div>
            
            {/* Toggle Switch */}
            <div className="flex p-1 bg-slate-200 rounded-xl">
                <button 
                    onClick={() => setOrderType('DINE_IN')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${!isDelivery ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Home size={16} /> Self Pickup
                </button>
                <button 
                    onClick={() => setOrderType('DELIVERY')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${isDelivery ? 'bg-white shadow-sm text-purple-700' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <MapPin size={16} /> Delivery
                </button>
            </div>
        </div>

        {/* Content Area (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* Items List */}
          <div className="space-y-4">
              {items.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <p>Your cart is empty.</p>
                </div>
              ) : (
                items.map(item => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-slate-800">{item.name}</h3>
                      <p className="text-sm text-slate-500">₹{item.price} x {item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-1 border border-slate-100">
                      <button onClick={() => onUpdateQuantity(item.id, -1)} className="p-1 hover:bg-white rounded-md text-slate-600"><Minus size={16} /></button>
                      <span className="font-medium text-sm w-4 text-center">{item.quantity}</span>
                      <button onClick={() => onUpdateQuantity(item.id, 1)} className="p-1 hover:bg-white rounded-md text-slate-600"><Plus size={16} /></button>
                    </div>
                  </div>
                ))
              )}
          </div>

          {/* Delivery Form */}
          {items.length > 0 && isDelivery && (
              <div className="space-y-4 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-bottom-2">
                  <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Delivery Details</h3>
                  
                  <div className="space-y-3">
                      <div>
                          <label className="text-xs font-bold text-slate-500 ml-1">Phone Number <span className="text-red-500">*</span></label>
                          <div className="relative mt-1">
                              <Phone size={18} className="absolute left-3 top-3 text-slate-400" />
                              <input 
                                  type="tel" 
                                  value={phone}
                                  onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                  placeholder="9876543210"
                                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-purple-500 outline-none transition-all"
                              />
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                          <div>
                               <label className="text-xs font-bold text-slate-500 ml-1">Location <span className="text-red-500">*</span></label>
                               <select 
                                  value={location}
                                  onChange={e => setLocation(e.target.value)}
                                  className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-purple-500 outline-none"
                               >
                                  {HALLS.map(h => <option key={h} value={h}>{h}</option>)}
                               </select>
                          </div>
                          <div>
                               <label className="text-xs font-bold text-slate-500 ml-1">Room / Details</label>
                               <input 
                                  type="text"
                                  value={instructions}
                                  onChange={e => setInstructions(e.target.value)}
                                  placeholder="e.g. Room 304"
                                  className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-purple-500 outline-none"
                               />
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {/* Payment Method */}
          {items.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
                <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Payment</h3>
                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={() => setPaymentMethod('UPI')}
                        className={`flex items-center justify-center gap-2 py-3 rounded-xl border font-medium transition-all ${paymentMethod === 'UPI' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-slate-200 bg-white text-slate-600'}`}
                    >
                        <CreditCard size={18} /> UPI
                    </button>
                    <button 
                        onClick={() => setPaymentMethod('CASH')}
                        className={`flex items-center justify-center gap-2 py-3 rounded-xl border font-medium transition-all ${paymentMethod === 'CASH' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-slate-200 bg-white text-slate-600'}`}
                    >
                        <Banknote size={18} /> Cash
                    </button>
                </div>
            </div>
          )}

        </div>

        {/* Footer Action */}
        {items.length > 0 && (
          <div className="p-5 bg-white border-t border-slate-100 rounded-b-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
             <div className="flex justify-between items-center mb-4 text-lg font-bold text-slate-900">
                <span>Total</span>
                <span>₹{total}</span>
             </div>
            <button 
              onClick={handlePlaceOrderClick}
              disabled={isPlacingOrder}
              className={`w-full text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2
                 ${isDelivery ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-200' : 'bg-orange-600 hover:bg-orange-700 shadow-orange-200'}
                 disabled:opacity-70 disabled:cursor-not-allowed
              `}
            >
              {isPlacingOrder ? 'Placing Order...' : (
                  isDelivery ? `Order Delivery • ₹${total}` : `Place Pickup Order • ₹${total}`
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
