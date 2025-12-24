import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Menu } from 'lucide-react';

export const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="flex-1 h-full overflow-hidden relative flex flex-col">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between shrink-0">
             <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-teal-600 rounded flex items-center justify-center text-white text-xs font-bold">F</div>
                <span className="font-bold text-slate-900 dark:text-white">FinSight AI</span>
             </div>
             <button 
                 onClick={() => setIsSidebarOpen(true)} 
                 className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
             >
                 <Menu className="w-6 h-6" />
             </button>
        </div>
        
        <div className="flex-1 overflow-hidden relative">
            <Outlet />
        </div>
      </main>
    </div>
  );
};