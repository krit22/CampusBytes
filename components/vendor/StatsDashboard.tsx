
import React from 'react';
import { Order, OrderStatus, PaymentStatus } from '../../types';
import { X, DollarSign, PackageCheck, TrendingUp, AlertTriangle } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area
} from 'recharts';

interface Props {
    orders: Order[];
    revenue: number;
    onClose: () => void;
}

export const StatsDashboard: React.FC<Props> = ({ orders, revenue, onClose }) => {
    const completedOrders = orders.filter(o => o.status === OrderStatus.DELIVERED);
    const totalOrders = completedOrders.length;
    
    // Calculate Item Sales
    const itemCounts: {[key: string]: number} = {};
    
    completedOrders.forEach(o => {
      o.items.forEach(i => {
        itemCounts[i.name] = (itemCounts[i.name] || 0) + i.quantity;
      });
    });
    
    // Data for Bar Chart (Top Items)
    const topItemsData = Object.entries(itemCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 7)
        .map(([name, count]) => ({ name, count }));

    // Data for Line Chart (Revenue Trend - Last 20 orders)
    const revenueData = orders
        .filter(o => o.paymentStatus === PaymentStatus.PAID)
        .sort((a, b) => a.createdAt - b.createdAt)
        .slice(-20) // Last 20 orders
        .map((o, idx) => ({
            id: idx + 1,
            token: o.token,
            amount: o.totalAmount
        }));

    const sortedItems = Object.entries(itemCounts).sort(([,a], [,b]) => b - a);
    const lowStockCandidates = sortedItems.slice(-3).filter(([_, count]) => count > 0);

    return (
        <div className="fixed inset-0 z-[60] bg-slate-100 dark:bg-slate-950 overflow-y-auto animate-in slide-in-from-bottom-10 duration-300">
            <div className="bg-slate-900 text-white sticky top-0 z-10 px-6 py-4 flex justify-between items-center shadow-md">
                <div>
                    <h2 className="text-xl font-black">Analytics Dashboard</h2>
                    <p className="text-slate-400 text-xs">Real-time Business Insights</p>
                </div>
                <button onClick={onClose} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors">
                    <X size={24} />
                </button>
            </div>
            
            <div className="max-w-5xl mx-auto p-6 space-y-6">
                
                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase mb-1">
                            <DollarSign size={14} /> Total Revenue
                        </div>
                        <div className="text-3xl font-black text-slate-900 dark:text-white">₹{revenue}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase mb-1">
                            <PackageCheck size={14} /> Completed Orders
                        </div>
                        <div className="text-3xl font-black text-slate-900 dark:text-white">{totalOrders}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 col-span-2 md:col-span-1">
                        <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase mb-1">
                            <TrendingUp size={14} /> Avg Order Value
                        </div>
                        <div className="text-3xl font-black text-slate-900 dark:text-white">₹{totalOrders > 0 ? Math.round(revenue / totalOrders) : 0}</div>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* BAR CHART: TOP ITEMS */}
                    <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                        <h3 className="font-bold text-lg mb-6 flex items-center gap-2 dark:text-white">
                            <TrendingUp className="text-green-500" size={20} /> Best Selling Items
                        </h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topItemsData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.2} />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 10, fill: '#94a3b8'}} />
                                    <Tooltip 
                                        cursor={{fill: 'transparent'}}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Bar dataKey="count" fill="#f97316" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* AREA CHART: REVENUE TREND */}
                    <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                        <h3 className="font-bold text-lg mb-6 flex items-center gap-2 dark:text-white">
                            <DollarSign className="text-blue-500" size={20} /> Revenue Trend (Last 20)
                        </h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="token" tick={{fontSize: 10, fill: '#94a3b8'}} interval={2} />
                                    <YAxis tick={{fontSize: 10, fill: '#94a3b8'}} />
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                    <Area type="monotone" dataKey="amount" stroke="#3b82f6" fillOpacity={1} fill="url(#colorAmt)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Insights Section */}
                <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <AlertTriangle className="text-orange-500" size={18} /> Optimization Tips
                    </h3>
                    <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                        {lowStockCandidates.length > 0 ? (
                            <li className="flex gap-2">
                                <span className="text-orange-500">•</span> 
                                <span>Consider promoting <b>{lowStockCandidates[0][0]}</b> as it has low sales volume.</span>
                            </li>
                        ) : (
                            <li className="text-slate-400 italic">Gathering more data...</li>
                        )}
                         {topItemsData.length > 0 && (
                             <li className="flex gap-2">
                                <span className="text-green-500">•</span> 
                                <span>{topItemsData[0].name} is your star performer. Keep it well stocked!</span>
                            </li>
                         )}
                    </ul>
                </div>
            </div>
        </div>
    );
};
