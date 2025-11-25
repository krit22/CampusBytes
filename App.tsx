
import React from 'react';
import { HashRouter, Routes, Route, Link } from 'react-router-dom';
import { CustomerApp } from './pages/CustomerApp';
import { VendorApp } from './pages/VendorApp';
import { MarketingPage } from './pages/MarketingPage';
import { Smartphone, Store, Info, Rocket } from 'lucide-react';

const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-6xl mx-auto w-full">
        
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">CampusBytes</h1>
          <p className="text-lg text-slate-600 max-w-lg mx-auto">
            The lightning-fast ordering system for campus stalls. 
            Experience the flow as a Customer, manage as a Vendor, or explore the platform.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 w-full">
          {/* OPTION 1: CUSTOMER APP */}
          <Link to="/customer" className="group relative overflow-hidden bg-white p-8 rounded-3xl shadow-xl border border-slate-100 hover:shadow-2xl transition-all hover:-translate-y-1 flex flex-col h-full">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Smartphone size={120} />
            </div>
            <div className="relative z-10 flex-1 flex flex-col">
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Smartphone size={24} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Customer App</h2>
              <p className="text-slate-500 mb-6 flex-1">Scan QR, browse menu, and get notified when food is ready.</p>
              <span className="inline-flex items-center text-orange-600 font-bold group-hover:gap-2 transition-all mt-auto">
                Order Now <span>→</span>
              </span>
            </div>
          </Link>

          {/* OPTION 2: PRODUCT TOUR (NEW) */}
          <Link to="/info" className="group relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 flex flex-col h-full">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-white">
               <Rocket size={120} />
             </div>
             <div className="relative z-10 flex-1 flex flex-col">
               <div className="w-12 h-12 bg-white/20 text-white rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform backdrop-blur-sm">
                 <Rocket size={24} fill="currentColor" />
               </div>
               <h2 className="text-2xl font-bold text-white mb-2">Product Tour</h2>
               <p className="text-blue-100 mb-6 flex-1">See how it works. A complete overview for Vendors & Universities.</p>
               <span className="inline-flex items-center text-white font-bold group-hover:gap-2 transition-all mt-auto">
                 Learn More <span>→</span>
               </span>
             </div>
          </Link>

          {/* OPTION 3: VENDOR PORTAL */}
          <Link to="/vendor" className="group relative overflow-hidden bg-slate-900 p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 flex flex-col h-full">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-white">
              <Store size={120} />
            </div>
            <div className="relative z-10 flex-1 flex flex-col">
              <div className="w-12 h-12 bg-slate-800 text-orange-400 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Store size={24} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Vendor Portal</h2>
              <p className="text-slate-400 mb-6 flex-1">Manage queue, update status, and track payments in real-time.</p>
              <span className="inline-flex items-center text-orange-400 font-bold group-hover:gap-2 transition-all mt-auto">
                Vendor Login <span>→</span>
              </span>
            </div>
          </Link>
        </div>

        <div className="mt-12 p-6 bg-blue-50 rounded-2xl border border-blue-100 text-sm text-blue-800 max-w-2xl">
          <div className="flex items-start gap-3">
            <Info size={20} className="shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="font-bold">How to test this demo:</p>
              <ol className="list-decimal pl-4 space-y-1 opacity-90">
                <li>Open <strong>Vendor Portal</strong> in a new tab (PIN: 1234).</li>
                <li>Keep this tab open as the <strong>Customer App</strong>.</li>
                <li>Place an order here. Watch it appear instantly on the Vendor tab.</li>
                <li>Update status on Vendor tab. Watch it update here.</li>
              </ol>
            </div>
          </div>
        </div>

      </div>
      
      <footer className="py-6 text-center text-slate-400 text-sm">
        Built for Campus Entrepreneurs
      </footer>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/customer" element={<CustomerApp />} />
        <Route path="/vendor" element={<VendorApp />} />
        <Route path="/info" element={<MarketingPage />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
