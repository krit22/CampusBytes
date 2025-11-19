import React, { useState } from 'react';
import { CartItem } from '../types';
import { X, Plus, Minus, CreditCard, Banknote } from 'lucide-react';

interface CartSheetProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onPlaceOrder: (paymentMethod: 'CASH' | 'UPI') => void;
  isPlacingOrder: boolean;
}

export const CartSheet: React.FC<CartSheetProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onPlaceOrder,
  isPlacingOrder
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI'>('UPI');
  
  if (!isOpen) return null;

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center pointer-events-none">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto transition-opacity" 
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative w-full max-w-md bg-white rounded-t-2xl md:rounded-2xl shadow-2xl pointer-events-auto max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-10 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-xl font-bold text-slate-800">Your Cart</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <p>Your cart is empty.</p>
              <button onClick={onClose} className="mt-4 text-orange-600 font-semibold text-sm hover:underline">
                Browse Menu
              </button>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-slate-800">{item.name}</h3>
                  <p className="text-sm text-slate-500">₹{item.price} x {item.quantity}</p>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-1">
                  <button 
                    onClick={() => onUpdateQuantity(item.id, -1)}
                    className="p-1 hover:bg-white rounded-md text-slate-600 shadow-sm"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="font-medium text-sm w-4 text-center">{item.quantity}</span>
                  <button 
                    onClick={() => onUpdateQuantity(item.id, 1)}
                    className="p-1 hover:bg-white rounded-md text-slate-600 shadow-sm"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-5 bg-slate-50 border-t space-y-4 rounded-b-2xl">
            <div className="flex justify-between items-center text-lg font-bold text-slate-900">
              <span>Total</span>
              <span>₹{total}</span>
            </div>
            
            <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Payment Method</p>
                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={() => setPaymentMethod('UPI')}
                        className={`flex items-center justify-center gap-2 py-3 rounded-lg border font-medium transition-all ${paymentMethod === 'UPI' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-slate-200 bg-white text-slate-600'}`}
                    >
                        <CreditCard size={18} />
                        UPI
                    </button>
                    <button 
                        onClick={() => setPaymentMethod('CASH')}
                        className={`flex items-center justify-center gap-2 py-3 rounded-lg border font-medium transition-all ${paymentMethod === 'CASH' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-slate-200 bg-white text-slate-600'}`}
                    >
                        <Banknote size={18} />
                        Cash
                    </button>
                </div>
            </div>

            <button 
              onClick={() => onPlaceOrder(paymentMethod)}
              disabled={isPlacingOrder}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-200 transition-all active:scale-[0.98]"
            >
              {isPlacingOrder ? 'Placing Order...' : `Place Order • ₹${total}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};