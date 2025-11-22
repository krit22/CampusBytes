
import React from 'react';
import { 
  Clock, Menu as MenuIcon, ShieldAlert, BarChart3, Power, Moon, Sun, ChevronRight, Settings 
} from 'lucide-react';

interface Props {
    onNavigate: (tab: string) => void;
    onToggleShop: () => void;
    isShopOpen: boolean;
    onToggleTheme: () => void;
    isDarkMode: boolean;
    onShowStats: () => void;
}

export const MoreMenu: React.FC<Props> = ({ 
    onNavigate, onToggleShop, isShopOpen, onToggleTheme, isDarkMode, onShowStats 
}) => {
    
    const MenuCard = ({ icon: Icon, title, subtitle, onClick, colorClass }: any) => (
        <button 
            onClick={onClick}
            className="bg-white dark:bg-slate-850 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-orange-200 dark:hover:border-slate-700 transition-all text-left group w-full flex items-center justify-between"
        >
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${colorClass}`}>
                    <Icon size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">{title}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">{subtitle}</p>
                </div>
            </div>
            <ChevronRight className="text-slate-300 group-hover:text-orange-400 transition-colors" />
        </button>
    );

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-6 p-1">
            
            {/* Primary Management Links */}
            <div className="space-y-3">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Management</h2>
                <MenuCard 
                    icon={MenuIcon} 
                    title="Menu Control" 
                    subtitle="Edit items, prices & availability"
                    onClick={() => onNavigate('MENU')}
                    colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                />
                <MenuCard 
                    icon={Clock} 
                    title="Order History" 
                    subtitle="View past delivered orders"
                    onClick={() => onNavigate('HISTORY')}
                    colorClass="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                />
                <MenuCard 
                    icon={ShieldAlert} 
                    title="Security Center" 
                    subtitle="Manage bans & spam protection"
                    onClick={() => onNavigate('SECURITY')}
                    colorClass="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                />
                 <MenuCard 
                    icon={Settings} 
                    title="Store Settings" 
                    subtitle="Contact info & general configs"
                    onClick={() => onNavigate('SETTINGS')}
                    colorClass="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                />
            </div>

            {/* Quick Actions / Settings */}
            <div className="space-y-3">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">System Controls</h2>
                
                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={onToggleShop}
                        className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all ${
                            isShopOpen 
                            ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-900 dark:text-green-400' 
                            : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-900 dark:text-red-400'
                        }`}
                    >
                        <Power size={28} />
                        <span className="font-bold text-sm">{isShopOpen ? 'Shop OPEN' : 'Shop CLOSED'}</span>
                    </button>

                    <button 
                        onClick={onShowStats}
                        className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-2 text-slate-700 dark:text-slate-200 hover:border-orange-300 transition-colors"
                    >
                        <BarChart3 size={28} className="text-orange-500" />
                        <span className="font-bold text-sm">Analytics</span>
                    </button>
                </div>

                <button 
                    onClick={onToggleTheme}
                    className="w-full bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-slate-700 dark:text-white"
                >
                    <div className="flex items-center gap-3">
                        <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg">
                            {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
                        </div>
                        <span className="font-bold text-sm">Dark Mode</span>
                    </div>
                    <div className={`w-12 h-6 rounded-full p-1 transition-colors ${isDarkMode ? 'bg-orange-500' : 'bg-slate-300'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${isDarkMode ? 'translate-x-6' : ''}`} />
                    </div>
                </button>
            </div>

            <div className="pt-4 text-center">
                <p className="text-[10px] text-slate-400 font-mono">CampusBytes Vendor v4.0</p>
            </div>
        </div>
    );
};