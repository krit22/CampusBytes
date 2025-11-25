
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, CheckCircle2, Zap, BarChart3, 
  ChefHat, Clock, ShieldCheck, 
  CreditCard, Smartphone, Monitor, QrCode, Sparkles, MoveRight, Users
} from 'lucide-react';

export const MarketingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 font-sans selection:bg-orange-500 selection:text-white overflow-x-hidden">
      
      {/* BACKGROUND BLOBS */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob"></div>
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-orange-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* NAV */}
      <nav className="fixed top-0 w-full z-50 bg-slate-950/70 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-tr from-orange-500 to-red-600 text-white p-2 rounded-lg shadow-lg shadow-orange-500/20">
              <Zap size={20} fill="currentColor" />
            </div>
            <span className="text-xl font-black text-white tracking-tight">CampusBytes</span>
          </div>
          <div className="flex gap-4 items-center">
             <Link to="/" className="hidden md:flex text-sm font-bold text-slate-400 hover:text-white transition-colors">
                Vendor Login
             </Link>
             <Link to="/customer" className="bg-white text-slate-950 px-5 py-2.5 rounded-full text-sm font-bold hover:bg-slate-200 transition-all shadow-lg hover:shadow-xl">
                Open App
             </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            {/* TEXT CONTENT */}
            <div className="space-y-8 animate-in slide-in-from-bottom-10 duration-700">
                <div className="inline-flex items-center gap-2 bg-slate-900/50 backdrop-blur-md border border-white/10 text-orange-400 px-4 py-1.5 rounded-full font-bold text-xs">
                    <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                    </span>
                    Live at Hall 1, 3 & Staff Canteen
                </div>
                
                <h1 className="text-5xl md:text-7xl font-black text-white leading-[0.95] tracking-tight">
                    Dining at <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-500 to-purple-600">
                    Lightspeed.
                    </span>
                </h1>
                
                <p className="text-lg text-slate-400 leading-relaxed max-w-lg">
                    The modern OS for campus food courts. Scan QR, order instantly, and skip the chaos of the counter queue.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Link to="/vendor" className="group bg-orange-600 text-white px-8 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-orange-500 transition-all shadow-xl shadow-orange-900/20 active:scale-95">
                         Start Vendor Demo <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform"/>
                    </Link>
                    <Link to="/customer" className="px-8 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 text-white border border-white/10 hover:bg-white/5 transition-all active:scale-95">
                        <Smartphone size={20} /> Customer View
                    </Link>
                </div>

                <div className="pt-8 flex items-center gap-6 border-t border-white/5">
                     <div className="flex -space-x-3">
                        <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-950 flex items-center justify-center text-xs text-white">🎓</div>
                        <div className="w-10 h-10 rounded-full bg-slate-700 border-2 border-slate-950 flex items-center justify-center text-xs text-white">🏫</div>
                        <div className="w-10 h-10 rounded-full bg-slate-600 border-2 border-slate-950 flex items-center justify-center text-xs text-white">+5</div>
                     </div>
                     <div className="text-sm font-medium text-slate-400">
                         Trusted by <span className="text-white font-bold">5,000+ students</span> daily
                     </div>
                </div>
            </div>

            {/* 3D PHONE MOCKUP */}
            <div className="relative hidden lg:block perspective-1000 group">
                 {/* Floating Elements behind */}
                 <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/30 rounded-full blur-2xl animate-pulse"></div>
                 
                 {/* The Phone Container */}
                 <div className="relative w-[340px] mx-auto transform-style-3d rotate-y-n12 group-hover:rotate-y-0 transition-transform duration-700 ease-out">
                      {/* Phone Frame */}
                      <div className="relative bg-slate-950 rounded-[50px] border-[10px] border-slate-800 shadow-2xl overflow-hidden h-[680px]">
                           {/* Screen */}
                           <div className="w-full h-full bg-white flex flex-col relative overflow-hidden">
                                
                                {/* Status Bar */}
                                <div className="h-12 bg-white flex justify-between items-center px-6 pt-2">
                                     <div className="text-xs font-bold text-slate-900">9:41</div>
                                     <div className="flex gap-1">
                                          <div className="w-4 h-2.5 bg-slate-900 rounded-sm"></div>
                                          <div className="w-0.5 h-2.5 bg-slate-900/30 rounded-sm"></div>
                                     </div>
                                </div>

                                {/* App Content */}
                                <div className="flex-1 overflow-hidden px-4 pt-2">
                                     {/* Header */}
                                     <div className="flex justify-between items-center mb-6">
                                          <div>
                                              <div className="text-xs text-slate-400 font-bold">Good Morning,</div>
                                              <div className="text-xl font-black text-slate-900">Alex</div>
                                          </div>
                                          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                                              <ChefHat size={20} />
                                          </div>
                                     </div>

                                     {/* Hero Card */}
                                     <div className="bg-slate-900 rounded-2xl p-5 text-white mb-6 relative overflow-hidden shadow-xl shadow-orange-900/20">
                                          <div className="absolute right-0 top-0 w-32 h-32 bg-orange-500 blur-[60px] opacity-40"></div>
                                          <div className="relative z-10">
                                              <div className="flex justify-between items-start mb-6">
                                                  <div>
                                                      <div className="text-orange-400 text-[10px] font-bold uppercase tracking-widest mb-1">In Progress</div>
                                                      <div className="text-4xl font-black">R-92</div>
                                                  </div>
                                                  <div className="bg-white/10 p-2 rounded-lg animate-pulse">
                                                      <Clock size={16} />
                                                  </div>
                                              </div>
                                              <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                                                  <div className="bg-orange-500 w-2/3 h-full rounded-full"></div>
                                              </div>
                                              <div className="flex justify-between mt-2 text-[10px] text-slate-400 font-medium">
                                                  <span>Cooking</span>
                                                  <span>~4m left</span>
                                              </div>
                                          </div>
                                     </div>

                                     {/* Category Pills */}
                                     <div className="flex gap-3 overflow-x-hidden mb-6">
                                          {['All', 'Snacks', 'Meals', 'Drinks'].map((c, i) => (
                                              <div key={c} className={`px-4 py-2 rounded-full text-xs font-bold ${i===0 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                  {c}
                                              </div>
                                          ))}
                                     </div>

                                     {/* Menu Items */}
                                     <div className="space-y-4">
                                          {[1, 2, 3].map((_, i) => (
                                              <div key={i} className="flex gap-4 items-center">
                                                  <div className="w-16 h-16 bg-slate-100 rounded-xl"></div>
                                                  <div className="flex-1">
                                                      <div className="h-4 w-32 bg-slate-100 rounded mb-2"></div>
                                                      <div className="h-3 w-16 bg-slate-50 rounded"></div>
                                                  </div>
                                                  <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">+</div>
                                              </div>
                                          ))}
                                     </div>
                                </div>
                                
                                {/* Tab Bar */}
                                <div className="h-16 bg-white border-t border-slate-100 flex justify-around items-center px-4 absolute bottom-0 w-full">
                                      <div className="text-orange-600"><ChefHat size={24}/></div>
                                      <div className="text-slate-300"><Clock size={24}/></div>
                                      <div className="text-slate-300"><Users size={24}/></div>
                                </div>
                           </div>
                      </div>

                      {/* Floating Element 1: Order Ready Notification */}
                      <div className="absolute top-1/3 -right-16 bg-white p-4 rounded-2xl shadow-xl shadow-black/10 flex items-center gap-3 animate-float border border-slate-100 z-20">
                          <div className="bg-green-100 p-2 rounded-full text-green-600">
                              <CheckCircle2 size={20} />
                          </div>
                          <div>
                              <div className="font-bold text-slate-900 text-sm">Order Ready!</div>
                              <div className="text-xs text-slate-500">Collect Token R-92</div>
                          </div>
                      </div>

                      {/* Floating Element 2: Stats */}
                      <div className="absolute bottom-32 -left-12 bg-slate-900 p-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-float border border-slate-800 z-20" style={{ animationDelay: '2s' }}>
                          <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400">
                              <BarChart3 size={20} />
                          </div>
                          <div>
                              <div className="font-bold text-white text-sm">Revenue</div>
                              <div className="text-xs text-slate-400">+24% this week</div>
                          </div>
                      </div>
                 </div>
            </div>
        </div>
      </section>

      {/* TRUSTED BY TICKER */}
      <section className="bg-slate-900/50 border-y border-white/5 py-8 overflow-hidden">
           <div className="max-w-7xl mx-auto px-6 mb-4 text-center">
               <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Powering Modern Campuses</p>
           </div>
           <div className="flex gap-16 justify-center items-center opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
               {/* Mock Logos */}
               <div className="text-2xl font-black text-white flex items-center gap-2"><span className="text-orange-500">TECH</span> INSTITUTE</div>
               <div className="text-2xl font-black text-white flex items-center gap-2">UNI<span className="text-blue-500">VER</span>SITY</div>
               <div className="text-2xl font-black text-white flex items-center gap-2">COLLEGE<span className="text-purple-500">LABS</span></div>
               <div className="text-2xl font-black text-white flex items-center gap-2"><span className="text-green-500">CAMPUS</span> ONE</div>
           </div>
      </section>

      {/* BENTO GRID FEATURES */}
      <section className="py-32 px-6 max-w-7xl mx-auto relative">
          <div className="text-center mb-20">
              <h2 className="text-orange-500 font-bold tracking-widest uppercase text-sm mb-3">Why CampusBytes?</h2>
              <h3 className="text-4xl md:text-5xl font-black text-white">Everything you need to <br/> run a digital kitchen.</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Card 1: Large - Analytics */}
              <div className="md:col-span-2 bg-slate-900 rounded-3xl p-8 border border-white/10 hover:border-orange-500/50 transition-colors group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl group-hover:bg-orange-500/20 transition-colors"></div>
                  <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-6">
                          <div className="p-3 bg-orange-500/20 rounded-xl text-orange-400">
                              <BarChart3 size={24} />
                          </div>
                          <h4 className="text-2xl font-bold text-white">Kitchen Analytics</h4>
                      </div>
                      <p className="text-slate-400 text-lg max-w-md mb-8">
                          Track peak hours, best-selling items, and revenue growth in real-time. Make data-driven decisions for your menu.
                      </p>
                      
                      {/* Visual Graph Mockup */}
                      <div className="h-48 w-full bg-slate-950 rounded-xl border border-white/5 p-4 flex items-end gap-2 relative">
                          {/* Live Indicator */}
                          <div className="absolute top-4 right-4 flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-full border border-white/5">
                              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                              <span className="text-xs font-bold text-white">Live</span>
                          </div>
                          {[30, 50, 40, 70, 50, 80, 60, 90, 75, 95].map((h, i) => (
                              <div key={i} style={{ height: `${h}%` }} className="flex-1 bg-gradient-to-t from-orange-600/20 to-orange-500 rounded-t-sm group-hover:to-orange-400 transition-all duration-500"></div>
                          ))}
                      </div>
                  </div>
              </div>

              {/* Card 2: QR Code / Speed */}
              <div className="bg-slate-900 rounded-3xl p-8 border border-white/10 hover:border-blue-500/50 transition-colors group relative">
                  <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
                          <QrCode size={24} />
                      </div>
                      <h4 className="text-xl font-bold text-white">No App Install</h4>
                  </div>
                  <p className="text-slate-400 mb-8">
                      Students just scan a QR code. No downloads, no signups. Frictionless ordering means higher volume.
                  </p>
                  <div className="flex justify-center">
                      <div className="bg-white p-4 rounded-2xl">
                          <QrCode size={100} className="text-slate-900" />
                      </div>
                  </div>
              </div>

              {/* Card 3: Anti-Spam */}
              <div className="bg-slate-900 rounded-3xl p-8 border border-white/10 hover:border-red-500/50 transition-colors group">
                  <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-red-500/20 rounded-xl text-red-400">
                          <ShieldCheck size={24} />
                      </div>
                      <h4 className="text-xl font-bold text-white">Anti-Spam</h4>
                  </div>
                  <p className="text-slate-400 mb-6">
                      Automatic detection of fake orders. 3-strike policy bans bad actors instantly.
                  </p>
                  <div className="bg-slate-950 rounded-xl p-4 border border-red-500/20 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 text-xs font-bold">!</div>
                      <div>
                          <div className="text-xs font-bold text-white">Suspicious Activity</div>
                          <div className="text-[10px] text-slate-500">User banned for 1hr</div>
                      </div>
                  </div>
              </div>

              {/* Card 4: Large - Vendor Dashboard */}
              <div className="md:col-span-2 bg-slate-900 rounded-3xl p-8 border border-white/10 hover:border-purple-500/50 transition-colors group relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-colors"></div>
                   <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                       <div className="flex-1">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400">
                                    <Monitor size={24} />
                                </div>
                                <h4 className="text-2xl font-bold text-white">Vendor Command Center</h4>
                            </div>
                            <p className="text-slate-400 text-lg mb-6">
                                Manage the entire kitchen from a single tablet. Mark orders cooked, ready, or delivered with one tap.
                            </p>
                            <div className="flex gap-2">
                                <span className="bg-slate-800 text-white text-xs font-bold px-3 py-1 rounded-full border border-white/10">Dark Mode</span>
                                <span className="bg-slate-800 text-white text-xs font-bold px-3 py-1 rounded-full border border-white/10">Sound Alerts</span>
                            </div>
                       </div>
                       
                       {/* Mini UI Mockup */}
                       <div className="w-full md:w-1/2 bg-slate-950 rounded-xl border border-white/10 p-4 shadow-2xl transform rotate-3 group-hover:rotate-0 transition-transform duration-500">
                            <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/5">
                                <div className="text-sm font-bold text-white">Orders</div>
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="bg-slate-900 p-3 rounded-lg border border-white/5 flex justify-between items-center">
                                    <div>
                                        <div className="text-orange-400 text-[10px] font-bold">COOKING</div>
                                        <div className="text-white font-bold">#42</div>
                                    </div>
                                    <div className="bg-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg">Ready</div>
                                </div>
                                <div className="bg-slate-900 p-3 rounded-lg border border-white/5 flex justify-between items-center opacity-50">
                                    <div>
                                        <div className="text-blue-400 text-[10px] font-bold">PENDING</div>
                                        <div className="text-white font-bold">#43</div>
                                    </div>
                                    <div className="bg-slate-800 text-slate-400 text-xs font-bold px-3 py-1.5 rounded-lg">Accept</div>
                                </div>
                            </div>
                       </div>
                   </div>
              </div>
          </div>
      </section>

      {/* SYNC VISUALIZATION */}
      <section className="py-20 bg-gradient-to-b from-slate-950 to-slate-900 border-t border-white/5">
          <div className="max-w-4xl mx-auto px-6 text-center">
              <h2 className="text-3xl font-black text-white mb-12">Instant Sync Technology</h2>
              
              <div className="flex items-center justify-center gap-4 md:gap-12 relative">
                  {/* Customer Side */}
                  <div className="flex flex-col items-center gap-4 relative z-10">
                      <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700 shadow-xl">
                          <Smartphone size={40} className="text-slate-400" />
                      </div>
                      <span className="text-sm font-bold text-slate-400">Customer</span>
                  </div>

                  {/* Animated Connection */}
                  <div className="flex-1 h-0.5 bg-slate-800 relative max-w-[200px]">
                      <div className="absolute top-1/2 -translate-y-1/2 left-0 w-full flex justify-between px-2">
                           <div className="w-3 h-3 bg-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.8)] animate-float" style={{ animationDuration: '2s' }}></div>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-500/50 to-transparent w-1/2 animate-shimmer"></div>
                  </div>

                  {/* Cloud/Server */}
                  <div className="flex flex-col items-center gap-4 relative z-10">
                      <div className="w-24 h-24 bg-orange-600 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(234,88,12,0.3)] animate-pulse">
                          <Zap size={40} className="text-white" fill="currentColor" />
                      </div>
                      <span className="text-sm font-bold text-orange-500">Real-time Core</span>
                  </div>

                  {/* Animated Connection */}
                  <div className="flex-1 h-0.5 bg-slate-800 relative max-w-[200px]">
                        <div className="absolute top-1/2 -translate-y-1/2 right-0 w-full flex justify-between px-2">
                           <div className="w-3 h-3 bg-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.8)] animate-float" style={{ animationDuration: '2.5s' }}></div>
                        </div>
                  </div>

                  {/* Vendor Side */}
                  <div className="flex flex-col items-center gap-4 relative z-10">
                      <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700 shadow-xl">
                          <Monitor size={40} className="text-slate-400" />
                      </div>
                      <span className="text-sm font-bold text-slate-400">Vendor</span>
                  </div>
              </div>
          </div>
      </section>

      {/* CTA FOOTER */}
      <footer className="py-20 px-6 border-t border-white/10 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-orange-500/10 filter blur-[100px] pointer-events-none"></div>
          
          <div className="max-w-3xl mx-auto text-center relative z-10">
              <h2 className="text-5xl md:text-6xl font-black text-white tracking-tight mb-8">
                  Ready to upgrade?
              </h2>
              <p className="text-xl text-slate-400 mb-10">
                  Join the digital food court revolution today. Setup takes less than 5 minutes.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Link to="/vendor" className="px-10 py-5 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-bold text-xl shadow-2xl shadow-orange-900/50 transition-all hover:-translate-y-1">
                      Launch Vendor App
                  </Link>
                  <Link to="/customer" className="px-10 py-5 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold text-xl transition-all hover:-translate-y-1">
                      Try as Student
                  </Link>
              </div>

              <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
                   <div>© 2024 CampusBytes. All rights reserved.</div>
                   <div className="flex gap-6">
                       <a href="#" className="hover:text-white transition-colors">Privacy</a>
                       <a href="#" className="hover:text-white transition-colors">Terms</a>
                       <a href="#" className="hover:text-white transition-colors">Contact</a>
                   </div>
              </div>
          </div>
      </footer>

    </div>
  );
};
