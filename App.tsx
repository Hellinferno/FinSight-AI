import React, { useState } from 'react';
import { Sidebar } from './components/Layout/Sidebar';
import { DashboardView } from './components/Dashboard/DashboardView';
import { ValuationTools } from './components/Tools/ValuationTools';
import { MarketResearch } from './components/Research/MarketResearch';
import { AIAnalyst } from './components/Analysis/AIAnalyst';
import { DataConnectors } from './components/Data/DataConnectors';
import { AppView } from './types';

function App() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);

  const renderView = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return <DashboardView />;
      case AppView.VALUATION:
        return <ValuationTools />;
      case AppView.RESEARCH:
        return <MarketResearch />;
      case AppView.ANALYSIS:
        return <AIAnalyst />;
      case AppView.DATA_MANAGEMENT:
        return <DataConnectors />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar currentView={currentView} onChangeView={setCurrentView} />
      <main className="flex-1 h-full overflow-hidden relative">
        {renderView()}
      </main>
    </div>
  );
}

export default App;