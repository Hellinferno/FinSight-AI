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
  revenue: number;
  expenses: number;
  cashFlow: number;
}

export interface ValuationResult {
  npv: number;
  irr: number;
  paybackPeriod: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isError?: boolean;
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
    taxRate: number; // percentage
    discountRate: number; // percentage
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
