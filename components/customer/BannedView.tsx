
import React from 'react';
import { ShieldBan } from 'lucide-react';

interface Props {
    reason: string;
    expiresAt: number;
}

export const BannedView: React.FC<Props> = ({ reason, expiresAt }) => {
    const date = new Date(expiresAt);
    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white text-center">
            <div className="w-24 h-24 bg-red-900/30 rounded-full flex items-center justify-center mb-6 border-4 border-red-600 animate-pulse">
                <ShieldBan size={50} className="text-red-500" />
            </div>
            <h1 className="text-3xl font-black mb-2 tracking-tight">Account Suspended</h1>
            <p className="text-slate-400 mb-8">Suspicious activity detected.</p>
            
            <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-sm border border-slate-800 space-y-4">
                <div>
                    <div className="text-xs font-bold text-slate-500 uppercase">Reason</div>
                    <div className="font-medium text-red-400">{reason}</div>
                </div>
                <div>
                    <div className="text-xs font-bold text-slate-500 uppercase">Ban Expires</div>
                    <div className="font-mono text-lg">{date.toLocaleDateString()} {date.toLocaleTimeString()}</div>
                </div>
            </div>
            
            <button 
                onClick={() => window.location.reload()}
                className="mt-8 px-6 py-3 bg-white text-slate-900 font-bold rounded-full hover:bg-slate-200"
            >
                Refresh Status
            </button>
        </div>
    );
};
