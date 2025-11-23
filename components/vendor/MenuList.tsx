
import React, { useState, useRef } from 'react';
import { MenuItem } from '../../types';
import { Search, Plus, Trash2, Star } from 'lucide-react';

interface Props {
    menu: MenuItem[];
    onToggleStatus: (item: MenuItem, updates: Partial<MenuItem>) => void;
    onDeleteItem: (id: string) => void;
    onAddClick: () => void;
}

export const MenuList: React.FC<Props> = ({ menu, onToggleStatus, onDeleteItem, onAddClick }) => {
    const [menuSearch, setMenuSearch] = useState('');
    const [menuCatFilter, setMenuCatFilter] = useState('All');
    const categoryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

    const menuCategories = ['All', ...Array.from(new Set(menu.map(m => m.category))).sort()];

    const scrollToCat = (cat: string) => {
        setMenuCatFilter(cat);
        if (cat !== 'All' && categoryRefs.current[cat]) {
            categoryRefs.current[cat]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    return (
        <div className="animate-in fade-in duration-300 space-y-4">
            {/* Search & Filter Header */}
            <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 sticky top-[70px] sm:top-16 z-20 transition-colors">
               <div className="relative mb-4">
                 <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
                 <input 
                   type="text" 
                   placeholder="Search items..." 
                   value={menuSearch} 
                   onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMenuSearch(e.target.value)}
                   className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 outline-none font-medium transition-all text-slate-900 dark:text-white"
                 />
               </div>
               <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                 {menuCategories.map(cat => (
                   <button
                     key={cat as string}
                     onClick={() => scrollToCat(cat as string)}
                     className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${menuCatFilter === cat ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                   >
                     {cat}
                   </button>
                 ))}
               </div>
            </div>

            {/* Add Button */}
            <div className="flex justify-end">
                <button 
                    onClick={onAddClick}
                    className="bg-slate-900 dark:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-slate-800 dark:hover:bg-orange-500 transition-colors shadow-lg shadow-slate-200 dark:shadow-none"
                >
                    <Plus size={18} /> Add New Item
                </button>
            </div>

            {/* Menu Items List */}
            <div className="space-y-6">
               {menuCategories.filter(c => c !== 'All').map(cat => {
                 const items = menu.filter(m => 
                   m.category === cat && 
                   m.name.toLowerCase().includes(menuSearch.toLowerCase()) &&
                   (menuCatFilter === 'All' || menuCatFilter === cat)
                 );
                 
                 if (items.length === 0) return null;

                 return (
                   <div key={cat as string} ref={el => { categoryRefs.current[cat as string] = el; }}>
                      <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-2 ml-1">{cat}</h3>
                      <div className="bg-white dark:bg-slate-850 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden transition-colors">
                         {items.map(item => (
                           <div key={item.id} className={`p-4 flex justify-between items-center transition-colors ${!item.isAvailable ? 'bg-slate-50/80 dark:bg-slate-900/50' : ''}`}>
                              <div className="flex items-center gap-4">
                                <div className={!item.isAvailable ? 'opacity-50' : ''}>
                                    <h4 className="font-bold text-slate-800 dark:text-white">{item.name}</h4>
                                    <p className="text-sm text-slate-500 font-medium">₹{item.price}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-4">
                                  {/* BESTSELLER TOGGLE */}
                                  <button
                                    onClick={() => onToggleStatus(item, { isBestseller: !item.isBestseller })}
                                    className={`p-2 rounded-lg transition-colors ${item.isBestseller ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' : 'text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                    title="Toggle Bestseller"
                                  >
                                    <Star size={20} fill={item.isBestseller ? "currentColor" : "none"} />
                                  </button>

                                  {/* AVAILABILITY TOGGLE */}
                                  <button 
                                    onClick={() => onToggleStatus(item, { isAvailable: !item.isAvailable })}
                                    className={`relative w-14 h-8 rounded-full transition-colors ${item.isAvailable ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                                    title="Toggle Availability"
                                  >
                                    <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${item.isAvailable ? 'translate-x-6' : 'translate-x-0'}`} />
                                  </button>
                                  
                                  {/* DELETE BUTTON */}
                                  <button
                                    onClick={() => onDeleteItem(item.id)}
                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                    title="Delete Item"
                                  >
                                      <Trash2 size={18} />
                                  </button>
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                 );
               })}
            </div>
        </div>
    );
};
