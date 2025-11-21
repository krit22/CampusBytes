
import React, { useEffect, useState } from 'react';
import { db } from '../../services/storage';
import { SpamRecord, SystemSettings } from '../../types';
import { Unlock } from 'lucide-react';

interface Props {
    requestConfirm: (title: string, message: string, action: () => void, type: 'DANGER' | 'NEUTRAL') => void;
}

export const SecurityPanel: React.FC<Props> = ({ requestConfirm }) => {
    const [bannedUsers, setBannedUsers] = useState<SpamRecord[]>([]);
    const [settings, setSettings] = useState<SystemSettings>({ key: 'GLOBAL_SETTINGS', isBanSystemActive: true });

    useEffect(() => {
        loadSecurityData();
    }, []);

    const loadSecurityData = async () => {
        const [bans, sys] = await Promise.all([
            db.getBannedUsers(),
            db.getSystemSettings()
        ]);
        setBannedUsers(bans);
        setSettings(sys);
    };

    const toggleSystem = async () => {
        const newState = !settings.isBanSystemActive;
        setSettings(prev => ({ ...prev, isBanSystemActive: newState }));
        await db.toggleBanSystem(newState);
    };

    const unban = (id: string) => {
        requestConfirm("Unban User", "Are you sure you want to unban this user?", async () => {
            await db.unbanUser(id);
            loadSecurityData();
        }, 'NEUTRAL');
    };

    const unbanAll = () => {
        requestConfirm("Unban ALL Users", "Are you sure you want to UNBAN ALL users? This cannot be undone.", async () => {
            await db.unbanAllUsers();
            loadSecurityData();
        }, 'DANGER');
    };

    return (
        <div className="animate-in fade-in space-y-6">
            <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold dark:text-white">Anti-Spam Protection</h3>
                    <p className="text-sm text-slate-500">Automatically bans users after 3 cancellations.</p>
                </div>
                <button 
                    onClick={toggleSystem}
                    className={`px-6 py-2 rounded-full font-bold transition-colors ${settings.isBanSystemActive ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-100 text-slate-500'}`}
                >
                    {settings.isBanSystemActive ? 'ACTIVE' : 'DISABLED'}
                </button>
            </div>

            <div className="bg-white dark:bg-slate-850 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-4 border-b dark:border-slate-800 flex justify-between items-center">
                    <h3 className="font-bold dark:text-white">Banned Users ({bannedUsers.length})</h3>
                    {bannedUsers.length > 0 && (
                        <button onClick={unbanAll} className="text-xs text-red-500 font-bold hover:underline">UNBAN ALL</button>
                    )}
                </div>
                {bannedUsers.length === 0 ? (
                    <div className="p-10 text-center text-slate-400 text-sm">No banned users found.</div>
                ) : (
                    <div className="divide-y dark:divide-slate-800">
                        {bannedUsers.map(user => (
                            <div key={user.customerId} className="p-4 flex justify-between items-center">
                                <div>
                                    <div className="font-bold text-sm dark:text-white">{user.customerName || 'Unknown'}</div>
                                    <div className="text-xs text-red-500 font-medium">{user.banReason}</div>
                                    <div className="text-[10px] text-slate-400">Expires: {new Date(user.banExpiresAt).toLocaleString()}</div>
                                </div>
                                <button onClick={() => unban(user.customerId)} className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white shadow-sm">
                                    <Unlock size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
