import React, { useEffect, useState } from 'react';
import { LayoutDashboard, Calculator, Globe, MessageSquareText, Database, FileText, LogOut, LogIn, X } from 'lucide-react';
import { AppView } from '../../types';
import { supabase } from '../../lib/supabaseClient';

interface SidebarProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  isOpen: boolean;        // NEW: Control visibility on mobile
  onClose: () => void;    // NEW: Function to close sidebar
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, isOpen, onClose }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Cast to any to handle potential type mismatches in the environment
    (supabase.auth as any).getSession().then(({ data }: any) => {
        setUser(data?.session?.user ?? null);
    });
    
    const { data } = (supabase.auth as any).onAuthStateChange((_event: any, session: any) => {
        setUser(session?.user ?? null);
    });
    
    return () => {
        if (data && data.subscription) {
            data.subscription.unsubscribe();
        }
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
    { id: AppView.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: AppView.VALUATION, label: 'Scenario Modeling', icon: Calculator },
    { id: AppView.DOCUMENTS, label: 'Document Intelligence', icon: FileText },
    { id: AppView.DATA_MANAGEMENT, label: 'Data Connectors', icon: Database },
    { id: AppView.RESEARCH, label: 'Market Research', icon: Globe },
    { id: AppView.ANALYSIS, label: 'AI Analyst', icon: MessageSquareText },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
            className="fixed inset-0 bg-slate-900/50 z-20 lg:hidden backdrop-blur-sm"
            onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
          fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shadow-xl transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                    F
                </div>
                <span className="text-xl font-bold text-white tracking-tight">FinSight AI</span>
            </div>
            {/* Close Button (Mobile Only) */}
            <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
            </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { onChangeView(item.id); onClose(); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? 'bg-emerald-600/10 text-emerald-400 font-medium border border-emerald-600/20'
                    : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-400' : 'text-slate-500 group-hover:text-white'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
            {user ? (
               <div className="mb-4">
                 <div className="flex items-center gap-3 mb-3 px-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-900 text-emerald-200 flex items-center justify-center text-xs font-bold">
                        {user.email[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">{user.email}</p>
                        <p className="text-[10px] text-emerald-500">Pro Plan</p>
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
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-emerald-900/20 mb-4"
               >
                  <LogIn className="w-4 h-4" /> {loading ? 'Sending...' : 'Sign In'}
               </button>
            )}
            <div className="text-[10px] text-slate-600 text-center">
                v2.4.0 • Enterprise Edition
            </div>
        </div>
      </div>
    </>
  );
};