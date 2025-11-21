
import React, { useState } from 'react';
import { MenuItem, CartItem, PaymentStatus } from '../../types';
import { ClipboardList, X, Search, Plus, Minus, Check, CheckCircle2 } from 'lucide-react';

interface Props {
    menu: MenuItem[];
    onClose: () => void;
    onOrder: (name: string, items: any[], total: number, paymentStatus: PaymentStatus) => void;
}

export const ManualOrderModal: React.FC<Props> = ({ menu, onClose, onOrder }) => {
    const [customerName, setCustomerName] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [search, setSearch] = useState('');
    const [paymentPaid, setPaymentPaid] = useState(true); 

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
