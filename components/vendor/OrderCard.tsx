
import React from 'react';
import { Order, OrderStatus, PaymentStatus } from '../../types';
import { Timer, Check, DollarSign, X, ChefHat, Undo2, ChevronRight, PackageCheck, CheckCircle2, Ban, MapPin, Phone, Bike } from 'lucide-react';

interface Props {
    order: Order;
    currentTime: number;
    updateStatus: (id: string, status: OrderStatus) => void;
    updatePayment: (id: string, status: PaymentStatus) => void;
    completeOrder: (order: Order) => void;
    requestConfirm: (title: string, message: string, action: () => void, type: 'DANGER' | 'NEUTRAL') => void;
}

export const OrderCard: React.FC<Props> = ({ order, currentTime, updateStatus, updatePayment, completeOrder, requestConfirm }) => {
    
    const isDelivery = order.orderType === 'DELIVERY';

    const getOrderAgeStatus = (order: Order) => {
        if (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CANCELLED || order.status === OrderStatus.NEW) return 'NORMAL';
        const elapsed = (currentTime - order.updatedAt) / 1000 / 60;
        if (order.status === OrderStatus.COOKING) {
            if (elapsed > 30) return 'CRITICAL';
            if (elapsed > 20) return 'URGENT';
            if (elapsed > 10) return 'WARNING';
        }
        if (order.status === OrderStatus.READY || order.status === OrderStatus.OUT_FOR_DELIVERY) {
            if (elapsed > 25) return 'CRITICAL';
            if (elapsed > 15) return 'URGENT';
            if (elapsed > 10) return 'WARNING';
        }
        return 'NORMAL';
    };

    const ageStatus = getOrderAgeStatus(order);
    const elapsedMins = Math.floor((currentTime - order.updatedAt) / 1000 / 60);

    return (
        <div 
            className={`rounded-2xl shadow-sm border overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 relative transition-colors duration-500
                ${order.status === OrderStatus.CANCELLED ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900' : 'bg-white dark:bg-slate-850'}
                ${isDelivery ? 'border-purple-200 dark:border-purple-800' : (ageStatus === 'NORMAL' ? 'border-slate-200 dark:border-slate-800' : '')}
                ${ageStatus === 'WARNING' ? 'border-yellow-300 dark:border-yellow-700 ring-1 ring-yellow-200 dark:ring-yellow-900/50' : ''}
                ${ageStatus === 'URGENT' ? 'border-orange-300 dark:border-orange-700 ring-1 ring-orange-200 dark:ring-orange-900/50 bg-orange-50/30 dark:bg-orange-900/10' : ''}
                ${ageStatus === 'CRITICAL' ? 'border-red-300 dark:border-red-700 ring-1 ring-red-200 dark:ring-red-900/50 bg-red-50/30 dark:bg-red-900/10' : ''}
            `}
        >
            {/* Delivery Banner */}
            {isDelivery && order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.CANCELLED && (
                <div className="bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-[10px] font-bold uppercase tracking-wider px-4 py-1 flex items-center justify-between">
                    <span className="flex items-center gap-1"><Bike size={12}/> Campus Delivery</span>
                    {order.deliveryDetails?.phoneNumber && (
                        <a href={`tel:${order.deliveryDetails.phoneNumber}`} className="flex items-center gap-1 hover:underline">
                            <Phone size={10}/> {order.deliveryDetails.phoneNumber}
                        </a>
                    )}
                </div>
            )}

            {/* Status Bar */}
            <div className="h-1 w-full bg-slate-100 dark:bg-slate-800">
                <div className={`h-full transition-all duration-500 ${
                order.status === 'NEW' ? 'w-1/4 bg-blue-500' : 
                order.status === 'COOKING' ? 'w-2/4 bg-orange-500' : 
                order.status === 'READY' ? 'w-3/4 bg-green-500' : 
                order.status === 'OUT_FOR_DELIVERY' ? 'w-[90%] bg-purple-500' :
                order.status === 'CANCELLED' ? 'w-full bg-red-500' : 'w-full bg-slate-400'
                }`} />
            </div>
            
            {/* Card Header */}
            <div className={`p-4 border-b flex justify-between items-start ${order.status === OrderStatus.CANCELLED ? 'border-red-100 dark:border-red-900/30' : 'border-slate-50 dark:border-slate-800'}`}>
                <div>
                <span className={`text-3xl font-black tracking-tighter ${order.status === OrderStatus.CANCELLED ? 'text-red-800 dark:text-red-400 decoration-2 line-through decoration-red-400' : 'text-slate-800 dark:text-slate-100'}`}>{order.token}</span>
                <div className="flex flex-col gap-1 mt-1">
                    <div className="text-xs font-bold text-slate-400 uppercase">{order.customerName || 'Guest'}</div>
                    
                    {/* Address Display for Delivery */}
                    {isDelivery && order.deliveryDetails && (
                        <div className="flex items-start gap-1 text-xs text-purple-600 dark:text-purple-400 font-medium mt-0.5">
                            <MapPin size={12} className="shrink-0 mt-0.5" />
                            <span>{order.deliveryDetails.location} <span className="text-slate-400">({order.deliveryDetails.instructions})</span></span>
                        </div>
                    )}

                    {/* Live Timer Badge */}
                    {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                        <div className={`w-fit text-[10px] font-mono px-1.5 py-0.5 rounded flex items-center gap-1 ${
                            ageStatus === 'CRITICAL' ? 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-300 font-bold animate-pulse' :
                            ageStatus === 'URGENT' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300 font-bold' :
                            ageStatus === 'WARNING' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300 font-bold' :
                            'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                            <Timer size={10} /> {elapsedMins}m
                        </div>
                    )}
                </div>
                </div>
                <div className="text-right">
                <div className="font-bold text-slate-900 dark:text-white">₹{order.totalAmount}</div>
                <button 
                    onClick={() => updatePayment(order.id, order.paymentStatus === 'PAID' ? PaymentStatus.PENDING : PaymentStatus.PAID)}
                    className={`mt-1 text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${order.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-900' : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'}`}
                >
                    {order.paymentStatus === 'PAID' ? <Check size={10} /> : <DollarSign size={10} />} {order.paymentStatus}
                </button>
                </div>
            </div>

            {/* Items */}
            <div className="p-4 flex-1 space-y-2 bg-slate-50/30 dark:bg-slate-900/30">
                {order.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400 font-medium"><b className="text-slate-900 dark:text-slate-200">{item.quantity}x</b> {item.name}</span>
                </div>
                ))}
            </div>

            {/* Action Footer */}
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-850">
                {order.status === OrderStatus.NEW && (
                <div className="flex gap-2">
                    <button 
                        onClick={() => requestConfirm(
                            "Reject Order", 
                            "Reject this order? This will add a strike to the user.",
                            () => updateStatus(order.id, OrderStatus.CANCELLED),
                            'DANGER'
                        )}
                        className="px-3 py-3 bg-red-50 hover:bg-red-100 text-red-500 border border-red-200 dark:bg-red-900/20 dark:border-red-900/50 dark:hover:bg-red-900/40 rounded-xl"
                        title="Reject"
                    >
                        <X size={18} />
                    </button>
                    <button 
                        onClick={() => updateStatus(order.id, OrderStatus.COOKING)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-100 dark:shadow-none active:scale-[0.98] transition-all"
                    >
                        <ChefHat size={18} /> Accept & Cook
                    </button>
                </div>
                )}

                {order.status === OrderStatus.COOKING && (
                <div className="flex gap-2">
                    <button 
                        onClick={() => updateStatus(order.id, OrderStatus.NEW)}
                        className="px-3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 rounded-xl"
                        title="Undo"
                    >
                        <Undo2 size={18} />
                    </button>
                    <button 
                    onClick={() => updateStatus(order.id, OrderStatus.READY)}
                    className={`flex-1 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all ${isDelivery ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-100' : 'bg-orange-500 hover:bg-orange-600 shadow-orange-100'}`}
                    >
                    {isDelivery ? 'Mark Packed' : 'Mark Ready'} <ChevronRight size={18} />
                    </button>
                </div>
                )}

                {order.status === OrderStatus.READY && (
                <div className="flex gap-2">
                    <button 
                        onClick={() => updateStatus(order.id, OrderStatus.COOKING)}
                        className="px-3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 rounded-xl"
                        title="Undo"
                    >
                        <Undo2 size={18} />
                    </button>
                    
                    {/* Delivery Workflow Branching */}
                    {isDelivery ? (
                        <button 
                        onClick={() => updateStatus(order.id, OrderStatus.OUT_FOR_DELIVERY)}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 dark:shadow-none active:scale-[0.98] transition-all"
                        >
                        <Bike size={18} /> Dispatch Rider
                        </button>
                    ) : (
                        <button 
                        onClick={() => completeOrder(order)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-100 dark:shadow-none active:scale-[0.98] transition-all"
                        >
                        <PackageCheck size={18} /> Complete
                        </button>
                    )}
                </div>
                )}

                {/* Extra step for Delivery */}
                {order.status === OrderStatus.OUT_FOR_DELIVERY && (
                    <div className="flex gap-2">
                        <button 
                            onClick={() => updateStatus(order.id, OrderStatus.READY)}
                            className="px-3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 rounded-xl"
                            title="Undo"
                        >
                            <Undo2 size={18} />
                        </button>
                        <button 
                        onClick={() => completeOrder(order)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-100 dark:shadow-none active:scale-[0.98] transition-all"
                        >
                        <CheckCircle2 size={18} /> Confirm Delivery
                        </button>
                    </div>
                )}

                {order.status === OrderStatus.DELIVERED && (
                <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-1">
                    <CheckCircle2 size={14} /> {isDelivery ? 'Delivered' : 'Completed'}
                    </div>
                    <button 
                        onClick={() => updateStatus(order.id, isDelivery ? OrderStatus.OUT_FOR_DELIVERY : OrderStatus.READY)}
                        className="px-3 py-3 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
                    >
                    <Undo2 size={16} />
                    </button>
                </div>
                )}
                
                {order.status === OrderStatus.CANCELLED && (
                    <div className="flex items-center justify-center gap-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold text-xs py-3 rounded-xl border border-red-200 dark:border-red-900/50">
                    <Ban size={14} /> CANCELLED
                    </div>
                )}
            </div>
        </div>
    );
};
