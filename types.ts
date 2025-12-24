

export interface FinancialMetric {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  change?: number; // percentage
  trend?: 'up' | 'down' | 'neutral';
}

export interface CashFlowData {
  year: number;
  // Income Statement
  revenue: number;
  cogs: number;
  grossProfit: number;
  opex: number; // SG&A / Cash OpEx
  ebitda: number;
  depreciation: number;
  ebit: number;
  tax: number;
  netIncome: number;
  // Cash Flow
  changeInNWC: number;
  capex: number;
  cashFlow: number; // Unlevered Free Cash Flow
  // Balance Sheet (Snapshot at year end)
  cash: number;
  nwc: number; // Net Working Capital
  ppe: number; // Net Property Plant Equipment
  totalAssets: number;
  totalDebt: number;
  totalEquity: number;
}

export interface ValuationResult {
  npv: number;
  irr: number;
  paybackPeriod: number;
}

// Add this new interface for chart data
export interface VisualData {
  type: 'bar' | 'line';
  data: any[];
  keys: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isError?: boolean;
  visualData?: VisualData; // Stores chart configuration (type, data, keys)
}

export interface SearchResult {
  title: string;
  uri: string;
}

export interface ResearchResponse {
  summary: string;
  sources: SearchResult[];
}

export enum AppView {
  LANDING = 'LANDING',
  DASHBOARD = 'DASHBOARD',
  VALUATION = 'VALUATION',
  RESEARCH = 'RESEARCH',
  ANALYSIS = 'ANALYSIS',
  DATA_MANAGEMENT = 'DATA_MANAGEMENT',
  DOCUMENTS = 'DOCUMENTS',
}

export interface Scenario {
  id: string;
  name: string;
  drivers: {
    baseRevenue: number;
    revenueGrowth: number; // percentage
    cogsMargin: number; // percentage of revenue
    opexMargin: number; // percentage of revenue (excl D&A)
    taxRate: number; // percentage
    discountRate: number; // percentage
    // New 3-Statement Drivers
    nwcPercent: number; // Net Working Capital as % of Sales
    capexPercent: number; // CapEx as % of Sales
    depreciationPercent: number; // D&A as % of Sales (proxy)
  };
}

export interface DataConnector {
  id: string;
  name: string;
  type: 'ERP' | 'Accounting' | 'Bank';
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  lastSync: string;
  schedule: 'Manual' | 'Daily' | 'Weekly';
}