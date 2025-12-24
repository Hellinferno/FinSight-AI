import React, { useState } from 'react';
import { Sidebar } from './components/Layout/Sidebar';
import { DashboardView } from './components/Dashboard/DashboardView';
import { ValuationTools } from './components/Tools/ValuationTools';
import { MarketResearch } from './components/Research/MarketResearch';
import { AIAnalyst } from './components/Analysis/AIAnalyst';
import { DataConnectors } from './components/Data/DataConnectors';
import { DocumentAnalysis } from './components/Documents/DocumentAnalysis';
import { AppView } from './types';
import { Menu } from 'lucide-react';

function App() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const renderView = () => {
    switch (currentView) {
      case AppView.DASHBOARD: return <DashboardView />;
      case AppView.VALUATION: return <ValuationTools />;
      case AppView.RESEARCH: return <MarketResearch />;
      case AppView.ANALYSIS: return <AIAnalyst />;
      case AppView.DATA_MANAGEMENT: return <DataConnectors />;
      case AppView.DOCUMENTS: return <DocumentAnalysis />;
      default: return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar (Responsive) */}
      <Sidebar 
        currentView={currentView} 
        onChangeView={setCurrentView} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content */}
      <main className="flex-1 h-full overflow-hidden relative flex flex-col">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shrink-0 z-10">
             <div className="flex items-center gap-2">
                 <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-teal-600 rounded flex items-center justify-center text-white text-xs font-bold">F</div>
                 <span className="font-bold text-slate-900">FinSight AI</span>
             </div>
             <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
             >
                 <Menu className="w-6 h-6" />
             </button>
        </div>

        {/* View Content */}
        <div className="flex-1 overflow-hidden relative">
            {renderView()}
        </div>
      </main>
    </div>
  );
}

export default App;