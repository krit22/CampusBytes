
import React from 'react';

export type ConfirmConfig = {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'DANGER' | 'NEUTRAL';
};

interface Props {
    config: ConfirmConfig;
    onClose: () => void;
}

export const ConfirmationModal: React.FC<Props> = ({ config, onClose }) => {
    if (!config.isOpen) return null;
    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl transform scale-100 animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
                <h3 className={`text-xl font-bold mb-2 ${config.type === 'DANGER' ? 'text-red-600 dark:text-red-500' : 'text-slate-900 dark:text-white'}`}>
                    {config.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-300 mb-6">{config.message}</p>
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 rounded-xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            config.onConfirm();
                            onClose();
                        }}
                        className={`flex-1 py-3 rounded-xl font-bold text-white shadow-lg ${
                            config.type === 'DANGER' 
                            ? 'bg-red-600 hover:bg-red-700 shadow-red-200 dark:shadow-none' 
                            : 'bg-slate-900 hover:bg-slate-800 dark:bg-orange-600 dark:hover:bg-orange-500 shadow-slate-200 dark:shadow-none'
                        }`}
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};
