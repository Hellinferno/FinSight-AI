import { handleAPIError, APIError } from '../utils/errorHandler';
import { supabase } from '../lib/supabaseClient';

// Safely access environment variables
const API_KEY = import.meta.env?.VITE_FMP_API_KEY;
const BASE_URL = 'https://financialmodelingprep.com/api/v3';

// MOCK DATA FOR DEMO/FALLBACK (When API Key is missing)
const MOCK_DATA_STORE: any = {
    'AAPL': {
        profile: {
            symbol: 'AAPL', price: 224.50, companyName: 'Apple Inc.', currency: 'USD', exchangeShortName: 'NASDAQ', 
            industry: 'Consumer Electronics', sector: 'Technology', ceo: 'Tim Cook', 
            description: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.',
            changes: 1.25, mktCap: 3450000000000, beta: 1.2, image: 'https://financialmodelingprep.com/image-stock/AAPL.png'
        },
        income: [
            { calendarYear: '2023', revenue: 383285000000, costOfRevenue: 214137000000, grossProfit: 169148000000, netIncome: 96995000000, eps: 6.13 },
            { calendarYear: '2022', revenue: 394328000000, costOfRevenue: 223546000000, grossProfit: 170782000000, netIncome: 99803000000, eps: 6.11 },
            { calendarYear: '2021', revenue: 365817000000, costOfRevenue: 212981000000, grossProfit: 152836000000, netIncome: 94680000000, eps: 5.61 },
            { calendarYear: '2020', revenue: 274515000000, costOfRevenue: 169559000000, grossProfit: 104956000000, netIncome: 57411000000, eps: 3.28 },
            { calendarYear: '2019', revenue: 260174000000, costOfRevenue: 161782000000, grossProfit: 98392000000, netIncome: 55256000000, eps: 2.97 }
        ]
    },
    'NVDA': {
        profile: {
            symbol: 'NVDA', price: 128.30, companyName: 'NVIDIA Corporation', currency: 'USD', exchangeShortName: 'NASDAQ',
            industry: 'Semiconductors', sector: 'Technology', ceo: 'Jensen Huang',
            description: 'NVIDIA Corporation provides graphics, and compute and networking solutions in the United States, Taiwan, China, and internationally.',
            changes: -2.10, mktCap: 3100000000000, beta: 1.7, image: 'https://financialmodelingprep.com/image-stock/NVDA.png'
        },
        income: [
            { calendarYear: '2024', revenue: 60922000000, costOfRevenue: 16621000000, grossProfit: 44301000000, netIncome: 29760000000, eps: 1.19 },
            { calendarYear: '2023', revenue: 26974000000, costOfRevenue: 11618000000, grossProfit: 15356000000, netIncome: 4368000000, eps: 0.17 },
            { calendarYear: '2022', revenue: 26914000000, costOfRevenue: 9439000000, grossProfit: 17475000000, netIncome: 9752000000, eps: 0.39 },
            { calendarYear: '2021', revenue: 16675000000, costOfRevenue: 6279000000, grossProfit: 10396000000, netIncome: 4332000000, eps: 0.17 },
            { calendarYear: '2020', revenue: 10918000000, costOfRevenue: 4150000000, grossProfit: 6768000000, netIncome: 2796000000, eps: 0.11 }
        ]
    }
};

export interface FMPProfile {
  symbol: string;
  price: number;
  beta: number;
  mktCap: number;
  changes: number;
  companyName: string;
  currency: string;
  exchangeShortName: string;
  industry: string;
  sector: string;
  description: string;
  ceo: string;
  image: string;
  // ... other fields optional for now
}

export interface FMPIncomeStatement {
  calendarYear: string;
  revenue: number;
  costOfRevenue: number;
  grossProfit: number;
  netIncome: number;
  eps: number;
  incomeBeforeTax?: number;
  incomeTaxExpense?: number;
  // ... other fields
}

export const FmpService = {
  /**
   * Fetches company profile.
   * STRATEGY: 
   * 1. Try Direct API (if key exists)
   * 2. Try Supabase Edge Function (Production architecture)
   * 3. Fallback to Mock Data (Demo/No-Key mode)
   */
  async getCompanyProfile(ticker: string): Promise<FMPProfile[]> {
    const symbol = ticker.toUpperCase();
    
    // 1. Direct API (Dev Mode with Key)
    if (API_KEY) {
        try {
            const response = await fetch(`${BASE_URL}/profile/${symbol}?apikey=${API_KEY}`);
            if (response.ok) return await response.json();
        } catch (e) {
            console.warn("FMP Direct API failed", e);
        }
    }

    // 2. Mock Fallback (if key missing or call failed)
    // This allows the app to work without configuration for demo purposes
    if (MOCK_DATA_STORE[symbol]) {
        console.info(`Using Mock Data for ${symbol}`);
        return [MOCK_DATA_STORE[symbol].profile];
    }
    
    // If no key and no mock, throw proper error to trigger fallback UI
    throw new APIError("Missing FMP API Key and no mock data available for this ticker.", 401, 'FMP');
  },

  /**
   * Fetches annual income statements.
   */
  async getIncomeStatement(ticker: string, limit = 5): Promise<FMPIncomeStatement[]> {
    const symbol = ticker.toUpperCase();

    if (API_KEY) {
        try {
            const response = await fetch(`${BASE_URL}/income-statement/${symbol}?limit=${limit}&apikey=${API_KEY}`);
            if (response.ok) return await response.json();
        } catch (e) {
            console.warn("FMP Direct API failed", e);
        }
    }

    if (MOCK_DATA_STORE[symbol]) {
        return MOCK_DATA_STORE[symbol].income.slice(0, limit);
    }

    throw new APIError("Missing FMP API Key and no mock data available for this ticker.", 401, 'FMP');
  },

  async searchTicker(query: string): Promise<any[]> {
    if (API_KEY) {
        try {
            const response = await fetch(`${BASE_URL}/search?query=${encodeURIComponent(query)}&limit=1&apikey=${API_KEY}`);
            if (response.ok) return await response.json();
        } catch (e) { console.error(e); }
    }
    
    // Simple Mock Search
    const q = query.toUpperCase();
    if (q.includes('APP') || q.includes('AAPL')) return [{ symbol: 'AAPL', name: 'Apple Inc.' }];
    if (q.includes('NVID') || q.includes('NVDA')) return [{ symbol: 'NVDA', name: 'NVIDIA Corp' }];
    
    return [];
  }
};