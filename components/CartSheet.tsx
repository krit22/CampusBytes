
import React, { useState, useEffect } from 'react';
import { CartItem, OrderType, DeliveryDetails, User, SavedAddress } from '../types';
import { X, Plus, Minus, Banknote, MapPin, Phone, Home, Bike, Info, CheckCircle2, ChevronDown, Building2, PenLine, Save } from 'lucide-react';

interface CartSheetProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  user: User | null;
  onUpdateQuantity: (id: string, delta: number) => void;
  onPlaceOrder: (paymentMethod: 'CASH' | 'UPI', orderType: OrderType, deliveryDetails?: DeliveryDetails) => void;
  isPlacingOrder: boolean;
  onUpdateUser: (updates: Partial<User>) => Promise<void>;
}

const HALLS = Array.from({ length: 15 }, (_, i) => `Hall ${i + 1}`);
HALLS.push('Staff Quarters', 'Library', 'Other');

export const CartSheet: React.FC<CartSheetProps> = ({
  isOpen,
  onClose,
  items,
  user,
  onUpdateQuantity,
  onPlaceOrder,
  isPlacingOrder,
  onUpdateUser
}) => {
  // Payment is now strictly CASH
  const paymentMethod = 'CASH';
  const [orderType, setOrderType] = useState<OrderType>('DINE_IN');
  
  // Delivery State
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressTab, setAddressTab] = useState<'HALL' | 'OTHER'>('HALL');
  
  // Form State
  const [phone, setPhone] = useState('');
  const [hallName, setHallName] = useState(''); // Default to empty to force selection
  const [roomNo, setRoomNo] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  const [saveAsDefault, setSaveAsDefault] = useState(true);

  // Init form with user defaults
  useEffect(() => {
    if (user) {
        if (user.phone) setPhone(user.phone);
        
        if (user.savedAddress) {
            // User has a saved address -> Show Summary View
            setIsEditingAddress(false);
            setAddressTab(user.savedAddress.type);
            
            if (user.savedAddress.type === 'HALL') {
                setHallName(user.savedAddress.hallName || '');
                setRoomNo(user.savedAddress.roomNo || '');
            } else {
                setCustomLocation(user.savedAddress.customLocation || '');
            }
        } else {
            // No saved address -> Force Edit Mode (First Time)
            setIsEditingAddress(true);
            setHallName('');
            setRoomNo('');
            setCustomLocation('');
        }
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const isDelivery = orderType === 'DELIVERY';

  const handlePlaceOrderClick = async () => {
    if (isDelivery) {
        if (!phone || phone.length < 10) {
            alert("Please enter a valid 10-digit phone number.");
            return;
        }

        let finalLocation = '';
        let finalInstructions = '';

        if (addressTab === 'HALL') {
            if (!hallName) { alert("Please select your Hall."); return; }
            if (!roomNo) { alert("Please enter your Room Number."); return; }
            finalLocation = hallName;
            finalInstructions = `Room ${roomNo}`;
        } else {
            if (!customLocation) { alert("Please describe your location."); return; }
            finalLocation = "Custom Location";
            finalInstructions = customLocation;
        }

        // Auto-save user preference if checked
        if (saveAsDefault) {
            const savedAddress: SavedAddress = {
                type: addressTab,
                hallName: addressTab === 'HALL' ? hallName : undefined,
                roomNo: addressTab === 'HALL' ? roomNo : undefined,
                customLocation: addressTab === 'OTHER' ? customLocation : undefined
            };
            await onUpdateUser({ phone, savedAddress });
        } else {
            // At least save phone if it was empty
            if (user && !user.phone) await onUpdateUser({ phone });
        }

        onPlaceOrder(paymentMethod, 'DELIVERY', {
            phoneNumber: phone,
            location: finalLocation,
            instructions: finalInstructions
        });
    } else {
        onPlaceOrder(paymentMethod, 'DINE_IN');
    }
  };

  const getAddressSummary = () => {
      if (addressTab === 'HALL') return `${hallName}, Room ${roomNo || '...'}`;
      return customLocation || 'Select Location';
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
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b bg-slate-50 rounded-t-2xl">
            <h2 className="text-xl font-bold text-slate-800">Checkout</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500">
                <X size={20} />
            </button>
        </div>

        {/* Content Area (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* Order Type Selector */}
          <div>
            <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider mb-3">Order Type</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setOrderType('DINE_IN')}
                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                  !isDelivery 
                  ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm' 
                  : 'border-slate-100 bg-white text-slate-400 hover:bg-slate-50 hover:border-slate-200'
                }`}
              >
                <Home size={28} />
                <div className="text-center">
                    <div className="font-bold text-sm">Self Pickup</div>
                    <div className="text-[10px] opacity-75 leading-tight mt-1">Collect at counter</div>
                </div>
              </button>

              <button
                onClick={() => setOrderType('DELIVERY')}
                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                  isDelivery 
                  ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-sm' 
                  : 'border-slate-100 bg-white text-slate-400 hover:bg-slate-50 hover:border-slate-200'
                }`}
              >
                <Bike size={28} />
                <div className="text-center">
                    <div className="font-bold text-sm">Delivery</div>
                    <div className="text-[10px] opacity-75 leading-tight mt-1">We bring it to you</div>
                </div>
              </button>
            </div>
          </div>

          {/* Delivery Details Manager (Zomato Style) */}
          {items.length > 0 && isDelivery && (
              <div className="space-y-4 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-bottom-2">
                  <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider flex items-center gap-2">
                      Delivery Details
                  </h3>

                  {/* SAVED / CURRENT ADDRESS CARD */}
                  {!isEditingAddress ? (
                      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-start gap-3">
                          <div className="bg-purple-100 p-2 rounded-lg text-purple-600 mt-1">
                              <MapPin size={20} />
                          </div>
                          <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <h4 className="font-bold text-slate-800 text-sm">Delivering to</h4>
                                <button onClick={() => setIsEditingAddress(true)} className="text-xs font-bold text-orange-600 uppercase tracking-wide">Change</button>
                              </div>
                              <p className="text-slate-600 text-sm mt-1 font-medium">{getAddressSummary()}</p>
                              <div className="mt-3 flex items-center gap-2 pt-3 border-t border-slate-50">
                                  <Phone size={14} className="text-slate-400" />
                                  <input 
                                      type="tel"
                                      value={phone}
                                      onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                      placeholder="Phone Number"
                                      className="text-sm font-bold text-slate-700 bg-transparent outline-none w-full"
                                  />
                                  <PenLine size={12} className="text-slate-300" />
                              </div>
                          </div>
                      </div>
                  ) : (
                      /* EDIT ADDRESS MODE */
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-4">
                          <div className="flex p-1 bg-white rounded-lg border border-slate-200">
                              <button onClick={() => setAddressTab('HALL')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${addressTab === 'HALL' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Campus Hall</button>
                              <button onClick={() => setAddressTab('OTHER')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${addressTab === 'OTHER' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Manual Location</button>
                          </div>

                          {addressTab === 'HALL' ? (
                              <div className="grid grid-cols-2 gap-3">
                                  <div>
                                       <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Select Hall</label>
                                       <div className="relative">
                                           <select 
                                              value={hallName}
                                              onChange={e => setHallName(e.target.value)}
                                              className="w-full mt-1 p-2.5 bg-white border border-slate-200 rounded-lg focus:border-purple-500 outline-none text-sm appearance-none font-medium"
                                           >
                                              <option value="" disabled>Select Hall</option>
                                              {HALLS.filter(h => h !== 'Other').map(h => <option key={h} value={h}>{h}</option>)}
                                           </select>
                                           <ChevronDown size={14} className="absolute right-2 top-4 text-slate-400 pointer-events-none" />
                                       </div>
                                  </div>
                                  <div>
                                       <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Room No.</label>
                                       <input 
                                          type="text"
                                          value={roomNo}
                                          onChange={e => setRoomNo(e.target.value)}
                                          placeholder="e.g. 302"
                                          className="w-full mt-1 p-2.5 bg-white border border-slate-200 rounded-lg focus:border-purple-500 outline-none text-sm font-medium"
                                       />
                                  </div>
                              </div>
                          ) : (
                              <div>
                                   <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Location Description</label>
                                   <textarea 
                                      value={customLocation}
                                      onChange={e => setCustomLocation(e.target.value)}
                                      placeholder="e.g. Near Main Library Entrance, wearing red shirt."
                                      rows={2}
                                      className="w-full mt-1 p-2.5 bg-white border border-slate-200 rounded-lg focus:border-purple-500 outline-none text-sm font-medium resize-none"
                                   />
                              </div>
                          )}

                          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setSaveAsDefault(!saveAsDefault)}>
                              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${saveAsDefault ? 'bg-purple-600 border-purple-600' : 'bg-white border-slate-300'}`}>
                                  {saveAsDefault && <CheckCircle2 size={12} className="text-white" />}
                              </div>
                              <span className="text-xs font-medium text-slate-600">Save as default address</span>
                          </div>

                          <button 
                             onClick={() => setIsEditingAddress(false)}
                             className="w-full py-2 bg-slate-900 text-white text-sm font-bold rounded-lg shadow-sm"
                          >
                             Confirm Location
                          </button>
                      </div>
                  )}
              </div>
          )}
          
          {/* Items List */}
          <div>
            <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider mb-3">Order Summary</h3>
            <div className="space-y-4">
                {items.length === 0 ? (
                    <div className="text-center py-4 text-slate-400">
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
          </div>

          {/* Payment Method - CASH ONLY */}
          {items.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-slate-100">
                <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Payment Method</h3>
                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white text-emerald-600 rounded-lg shadow-sm">
                            <Banknote size={20} />
                        </div>
                        <div>
                            <div className="font-bold text-sm text-emerald-900">Cash Payment</div>
                            <div className="text-xs text-emerald-700">{isDelivery ? 'Pay on delivery' : 'Pay at counter'}</div>
                        </div>
                    </div>
                    <div className="bg-white text-emerald-600 rounded-full p-1">
                         <CheckCircle2 size={20} />
                    </div>
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
                  isDelivery ? `Place Delivery Order • ₹${total}` : `Place Pickup Order • ₹${total}`
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
