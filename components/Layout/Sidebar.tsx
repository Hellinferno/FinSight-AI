import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Calculator, Globe, MessageSquareText, Database, FileText, X, LogIn, LogOut, Zap, Crown } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { supabase } from '../../lib/supabaseClient';
import { PricingModal } from '../Subscription/PricingModal';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, setUser, isPro, setProStatus } = useStore();
  const [loading, setLoading] = useState(false);
  const [showPricing, setShowPricing] = useState(false);

  useEffect(() => {
    (supabase.auth as any).getSession().then(({ data }: any) => {
        setUser(data?.session?.user ?? null);
    });
    
    const { data } = (supabase.auth as any).onAuthStateChange((_event: any, session: any) => {
        setUser(session?.user ?? null);
    });
    
    return () => {
        if (data && data.subscription) data.subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async () => {
    const email = prompt("Enter your email for a magic link:");
    if (!email) return;
    setLoading(true);
    const { error } = await (supabase.auth as any).signInWithOtp({ email });
    setLoading(false);
    if (error) alert(error.message);
    else alert("Check your email for the login link!");
  };

  const navItems = [
    { path: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/app/valuation', label: 'Valuation & DCF', icon: Calculator },
    { path: '/app/documents', label: 'Doc Intelligence', icon: FileText },
    { path: '/app/data', label: 'Data Connectors', icon: Database },
    { path: '/app/research', label: 'Market Research', icon: Globe },
    { path: '/app/analyst', label: 'AI Analyst', icon: MessageSquareText },
  ];

  return (
    <>
      <PricingModal isOpen={showPricing} onClose={() => setShowPricing(false)} />

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
            className="fixed inset-0 bg-slate-900/50 z-20 lg:hidden backdrop-blur-sm"
            onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
          fixed lg:static inset-y-0 left-0 z-30 w-64 glass-sidebar text-slate-300 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-900/20">
                    F
                </div>
                <span className="text-xl font-bold text-white tracking-tight">FinSight AI</span>
            </div>
            <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
            </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) => `w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                isActive
                  ? 'bg-emerald-600/20 text-emerald-400 font-medium border border-emerald-500/30'
                  : 'hover:bg-slate-800/50 hover:text-white hover:border hover:border-slate-700/50 border border-transparent'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700/50">
            {/* Pro Upgrade / Status Card */}
            {!isPro ? (
                 <div className="mb-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-4 border border-slate-700 text-center relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all"></div>
                     <Crown className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                     <h4 className="text-white font-semibold text-sm mb-1">Upgrade to Pro</h4>
                     <p className="text-xs text-slate-400 mb-3">Unlock AI Chat & Exports</p>
                     <button 
                        onClick={() => setShowPricing(true)}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors shadow-lg shadow-emerald-900/50"
                     >
                        Upgrade Now
                     </button>
                 </div>
            ) : (
                 <div className="mb-4 bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-3 flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                         <Zap className="w-4 h-4 fill-emerald-400" />
                     </div>
                     <div>
                         <p className="text-white text-xs font-bold">Pro Active</p>
                         <p className="text-emerald-400 text-[10px]">Premium Features Unlocked</p>
                     </div>
                 </div>
            )}

            {user ? (
               <div className="glass-panel p-3 rounded-xl bg-slate-800/30 border-slate-700/50">
                 <div className="flex items-center gap-3 mb-3 px-2">
                    <div className="w-8 h-8 rounded-full bg-slate-700 text-slate-200 flex items-center justify-center text-xs font-bold border border-slate-600">
                        {user.email[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">{user.email}</p>
                        <p className="text-[10px] text-slate-500">Member</p>
                    </div>
                 </div>
                 <button 
                    onClick={() => (supabase.auth as any).signOut()}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-rose-900/20 text-slate-400 hover:text-rose-400 rounded-lg text-xs transition-colors"
                 >
                    <LogOut className="w-3 h-3" /> Sign Out
                 </button>
               </div>
            ) : (
               <button 
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-all mb-2 border border-slate-700"
               >
                  <LogIn className="w-4 h-4" /> {loading ? 'Sending...' : 'Sign In'}
               </button>
            )}
            
            <div className="text-[10px] text-slate-600 text-center mt-2">
                v3.2.0 • Pro Edition
            </div>
        </div>
      </div>
    </>
  );
};