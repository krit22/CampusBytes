
import React, { useState, useEffect } from 'react';
import { db } from '../../services/storage';
import { Save, Phone } from 'lucide-react';

interface Props {
    onBack: () => void;
}

export const SettingsPanel: React.FC<Props> = () => {
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const settings = await db.getSystemSettings();
        setPhone(settings.vendorPhoneNumber || '');
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await db.updateSystemSettings({ vendorPhoneNumber: phone });
            alert("Settings Saved!");
        } catch (error) {
            alert("Failed to save settings");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-in fade-in space-y-6">
             <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                <h3 className="text-lg font-bold dark:text-white mb-4">General Store Settings</h3>
                
                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vendor Contact Number</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-3 text-slate-400" size={18} />
                            <input 
                                type="tel"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-orange-500 dark:text-white font-medium"
                                placeholder="e.g. 9876543210"
                            />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">This number will be dialed when customers click "Call Vendor".</p>
                    </div>

                    <div className="pt-2">
                        <button 
                            type="submit"
                            disabled={loading}
                            className="bg-slate-900 dark:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            <Save size={18} /> {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
             </div>
        </div>
    );
};