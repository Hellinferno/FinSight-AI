import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout/Layout';
import { LandingPage } from './components/Landing/LandingPage';
import { DashboardView } from './components/Dashboard/DashboardView';
import { ValuationTools } from './components/Tools/ValuationTools';
import { MarketResearch } from './components/Research/MarketResearch';
import { AIAnalyst } from './components/Analysis/AIAnalyst';
import { DataConnectors } from './components/Data/DataConnectors';
import { DocumentAnalysis } from './components/Documents/DocumentAnalysis';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        
        {/* Protected Application Routes */}
        <Route path="/app" element={<Layout />}>
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardView />} />
          <Route path="valuation" element={<ValuationTools />} />
          <Route path="research" element={<MarketResearch />} />
          <Route path="analyst" element={<AIAnalyst />} />
          <Route path="documents" element={<DocumentAnalysis />} />
          <Route path="data" element={<DataConnectors />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;