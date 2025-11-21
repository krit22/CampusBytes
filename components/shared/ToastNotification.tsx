
import React from 'react';
import { CheckCircle2, AlertCircle, Sparkles, BellRing, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'SUCCESS' | 'ERROR' | 'INFO' | 'NEW' | 'CANCEL';

export interface ToastState {
    msg: string;
    type: ToastType;
}

interface Props {
    toast: ToastState | null;
    onClose?: () => void;
}

export const ToastNotification: React.FC<Props> = ({ toast, onClose }) => {
    if (!toast) return null;

    // Vendor Style (New/Cancel)
    if (toast.type === 'NEW' || toast.type === 'CANCEL') {
        return (
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-10 fade-in duration-300 w-full max-w-[90%] sm:max-w-sm">
                <div className={`p-4 rounded-2xl shadow-2xl flex items-center justify-between border ${toast.type === 'CANCEL' ? 'bg-red-900 text-white border-red-800' : 'bg-slate-900 text-white border-slate-800'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full animate-pulse ${toast.type === 'CANCEL' ? 'bg-red-500' : 'bg-orange-500'}`}>
                            {toast.type === 'CANCEL' ? <AlertTriangle size={20} className="text-white" /> : <BellRing size={20} className="text-white" />}
                        </div>
                        <div>
                            <div className={`font-bold text-xs uppercase tracking-wider ${toast.type === 'CANCEL' ? 'text-red-300' : 'text-orange-400'}`}>{toast.type === 'CANCEL' ? 'Alert' : 'New Order'}</div>
                            <div className="font-black text-lg">{toast.msg}</div>
                        </div>
                    </div>
                    {onClose && (
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">
                            <X size={18} className="text-white/60" />
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // Customer Style (Success/Error/Info)
    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[160] w-[90%] max-w-sm animate-in slide-in-from-top-5 duration-300">
            <div className={`p-4 rounded-xl shadow-xl border flex items-center gap-3 ${
                toast.type === 'SUCCESS' ? 'bg-slate-900 text-white border-slate-800' :
                toast.type === 'ERROR' ? 'bg-red-600 text-white border-red-500' :
                'bg-white text-slate-900 border-slate-200'
            }`}>
                {toast.type === 'SUCCESS' ? <CheckCircle2 size={20} className="text-green-400" /> :
                    toast.type === 'ERROR' ? <AlertCircle size={20} className="text-white" /> :
                    <Sparkles size={20} className="text-blue-500" />}
                <div className="font-bold text-sm">{toast.msg}</div>
            </div>
        </div>
    );
};
