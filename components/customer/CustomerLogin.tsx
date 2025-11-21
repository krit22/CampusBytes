
import React, { useState, useEffect } from 'react';
import { Utensils, ChevronRight, User as UserIcon, Mail, ArrowRight } from 'lucide-react';

// CONFIG
const GOOGLE_CLIENT_ID = import.meta.env?.VITE_GOOGLE_CLIENT_ID || "";

interface Props {
    onGoogleLogin: (response: any) => void;
    onGuestLogin: (name: string, email: string) => void;
}

export const CustomerLogin: React.FC<Props> = ({ onGoogleLogin, onGuestLogin }) => {
    const [showEmailForm, setShowEmailForm] = useState(false);
    const [demoName, setDemoName] = useState('');
    const [demoEmail, setDemoEmail] = useState('');

    useEffect(() => {
        if (GOOGLE_CLIENT_ID && window.google && !showEmailForm) {
          try {
            window.google.accounts.id.initialize({
              client_id: GOOGLE_CLIENT_ID,
              callback: onGoogleLogin
            });
            window.google.accounts.id.renderButton(
              document.getElementById("googleBtnWrapper"),
              { theme: "outline", size: "large", width: "100%", text: "continue_with" }
            );
          } catch (e) {
            console.error("Google Auth Init Error:", e);
          }
        }
    }, [showEmailForm, onGoogleLogin]);

    const handleCustomLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!demoName || !demoEmail) return;
        onGuestLogin(demoName, demoEmail);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-xl text-center space-y-8 transition-all border border-slate-100">
          {!showEmailForm ? (
            <>
              <div className="w-20 h-20 bg-orange-100 rounded-3xl flex items-center justify-center mx-auto text-orange-600 shadow-sm">
                <Utensils size={40} />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">CampusBytes</h1>
                <p className="text-slate-500 font-medium">Order smarter. Eat better.</p>
              </div>
              
              <div className="space-y-4 pt-2">
                {GOOGLE_CLIENT_ID ? (
                   <div id="googleBtnWrapper" className="h-[44px] w-full flex justify-center"></div>
                ) : (
                   <div className="text-sm text-red-500 bg-red-50 p-4 rounded-xl border border-red-100">
                      Config Error: Google Client ID missing.
                   </div>
                )}

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-slate-400">Or</span>
                  </div>
                </div>

                <button 
                  onClick={() => setShowEmailForm(true)}
                  className="w-full bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold py-3 rounded-xl border border-slate-200 text-sm transition-colors"
                >
                  Continue with Email
                </button>
              </div>
              <p className="text-[10px] text-slate-400 px-4 leading-tight">
                By continuing, you agree to our Terms of Service and Privacy Policy.
              </p>
            </>
          ) : (
            <form onSubmit={handleCustomLogin} className="text-left space-y-4 animate-in slide-in-from-right-10 fade-in duration-300">
              <div className="flex items-center gap-2 mb-6">
                <button type="button" onClick={() => setShowEmailForm(false)} className="p-1 hover:bg-slate-100 rounded-full">
                    <ChevronRight className="rotate-180" size={20} />
                </button>
                <h2 className="font-bold text-lg">Guest Details</h2>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Full Name</label>
                <div className="relative">
                  <UserIcon size={18} className="absolute left-3 top-3 text-slate-400" />
                  <input 
                    type="text" 
                    required
                    value={demoName}
                    onChange={e => setDemoName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-0 outline-none bg-slate-50"
                    placeholder="e.g. John Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Email Address</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-3 text-slate-400" />
                  <input 
                    type="email" 
                    required
                    value={demoEmail}
                    onChange={e => setDemoEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-0 outline-none bg-slate-50"
                    placeholder="e.g. john@campus.edu"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 flex items-center justify-center gap-2 mt-4 shadow-lg shadow-slate-200"
              >
                Start Ordering <ArrowRight size={16} />
              </button>
            </form>
          )}
        </div>
      </div>
    );
};
