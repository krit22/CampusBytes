
import React, { useState } from 'react';
import { User } from '../../types';
import { UserCircle2, Phone, ArrowRight, Save } from 'lucide-react';

interface Props {
    user: User;
    onSave: (updates: Partial<User>) => void;
    isFirstTime: boolean;
}

export const UserProfileModal: React.FC<Props> = ({ user, onSave, isFirstTime }) => {
    const [name, setName] = useState(user.name);
    const [phone, setPhone] = useState(user.phone || '');
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ name, phone });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="flex flex-col items-center mb-6">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-orange-100 mb-4 shadow-sm">
                        <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 text-center">
                        {isFirstTime ? 'Welcome, Foodie!' : 'Edit Profile'}
                    </h2>
                    <p className="text-slate-500 text-sm text-center">
                        {isFirstTime ? 'Let\'s set up your profile for faster checkout.' : 'Update your contact details.'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Your Name</label>
                        <div className="relative">
                            <UserCircle2 className="absolute left-3 top-3 text-slate-400" size={20} />
                            <input 
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-orange-500 outline-none font-bold text-slate-800"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Phone Number (Default)</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-3 text-slate-400" size={20} />
                            <input 
                                type="tel"
                                value={phone}
                                onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                placeholder="9876543210"
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-orange-500 outline-none font-bold text-slate-800"
                                required={isFirstTime} // Mandatory on signup
                            />
                        </div>
                    </div>

                    <button 
                        type="submit"
                        className="w-full mt-4 bg-slate-900 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg active:scale-[0.98]"
                    >
                        {isFirstTime ? <>Start Ordering <ArrowRight size={20} /></> : <>Save Changes <Save size={20} /></>}
                    </button>
                </form>
            </div>
        </div>
    );
};
