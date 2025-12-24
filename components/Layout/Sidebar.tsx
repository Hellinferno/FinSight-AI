import React from 'react';
import { LayoutDashboard, Calculator, Globe, MessageSquareText, FileBarChart, Database } from 'lucide-react';
import { AppView } from '../../types';

interface SidebarProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView }) => {
  const navItems = [
    { id: AppView.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: AppView.VALUATION, label: 'Scenario Modeling', icon: Calculator },
    { id: AppView.DATA_MANAGEMENT, label: 'Data Connectors', icon: Database },
    { id: AppView.RESEARCH, label: 'Market Research', icon: Globe },
    { id: AppView.ANALYSIS, label: 'AI Analyst', icon: MessageSquareText },
  ];

  return (
    <div className="w-64 bg-slate-900 text-slate-300 h-screen flex flex-col border-r border-slate-800 shadow-xl z-20 flex-shrink-0">
      <div className="p-6 border-b border-slate-800 flex items-center gap-2">
        <FileBarChart className="w-8 h-8 text-emerald-500" />
        <span className="text-xl font-bold text-white tracking-tight">FinSight AI</span>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                isActive
                  ? 'bg-emerald-600/10 text-emerald-400 font-medium'
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-400' : 'text-slate-500 group-hover:text-white'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
        <p>v2.0.1 • Enterprise</p>
        <p className="mt-1">System Status: Online</p>
      </div>
    </div>
  );
};