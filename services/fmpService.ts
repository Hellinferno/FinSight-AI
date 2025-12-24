import { handleAPIError, APIError } from '../utils/errorHandler';

// Safely access environment variables
const API_KEY = import.meta.env?.VITE_FMP_API_KEY;
const BASE_URL = 'https://financialmodelingprep.com/api/v3';

export interface FMPProfile {
  symbol: string;
  price: number;
  beta: number;
  volAvg: number;
  mktCap: number;
  lastDiv: number;
  range: string;
  changes: number;
  companyName: string;
  currency: string;
  cik: string;
  isin: string;
  cusip: string;
  exchange: string;
  exchangeShortName: string;
  industry: string;
  website: string;
  description: string;
  ceo: string;
  sector: string;
  country: string;
  fullTimeEmployees: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  dcfDiff: number;
  dcf: number;
  image: string;
  ipoDate: string;
  defaultImage: boolean;
  isEtf: boolean;
  isActivelyTrading: boolean;
  isAdr: boolean;
  isFund: boolean;
}

export interface FMPIncomeStatement {
  date: string;
  symbol: string;
  reportedCurrency: string;
  cik: string;
  fillingDate: string;
  acceptedDate: string;
  calendarYear: string;
  period: string;
  revenue: number;
  costOfRevenue: number;
  grossProfit: number;
  grossProfitRatio: number;
  researchAndDevelopmentExpenses: number;
  generalAndAdministrativeExpenses: number;
  sellingAndMarketingExpenses: number;
  otherExpenses: number;
  operatingExpenses: number;
  costAndExpenses: number;
  interestIncome: number;
  interestExpense: number;
  depreciationAndAmortization: number;
  ebitda: number;
  ebitdaratio: number;
  operatingIncome: number;
  operatingIncomeRatio: number;
  totalOtherIncomeExpensesNet: number;
  incomeBeforeTax: number;
  incomeBeforeTaxRatio: number;
  incomeTaxExpense: number;
  netIncome: number;
  netIncomeRatio: number;
  eps: number;
  epsdiluted: number;
  weightedAverageShsOut: number;
  weightedAverageShsOutDil: number;
  link: string;
  finalLink: string;
}

export const FmpService = {
  /**
   * Fetches the company profile (Price, Beta, Description, etc.)
   */
  async getCompanyProfile(ticker: string): Promise<FMPProfile[]> {
    if (!API_KEY) throw new APIError("Missing FMP API Key. Please check .env.local contains VITE_FMP_API_KEY.", 401, 'FMP');
    try {
      const response = await fetch(`${BASE_URL}/profile/${ticker.toUpperCase()}?apikey=${API_KEY}`);
      if (!response.ok) throw response;
      const data = await response.json();
      return data;
    } catch (error) {
      handleAPIError(error, 'FMP');
    }
  },

  /**
   * Fetches annual income statements.
   * limit=5 gets the last 5 years.
   */
  async getIncomeStatement(ticker: string, limit = 5): Promise<FMPIncomeStatement[]> {
    if (!API_KEY) throw new APIError("Missing FMP API Key. Please check .env.local contains VITE_FMP_API_KEY.", 401, 'FMP');
    try {
      const response = await fetch(`${BASE_URL}/income-statement/${ticker.toUpperCase()}?limit=${limit}&apikey=${API_KEY}`);
      if (!response.ok) throw response;
      const data = await response.json();
      return data;
    } catch (error) {
      handleAPIError(error, 'FMP');
    }
  },

  /**
   * NEW: Fuzzy Search for Tickers
   * Converts "Apple" or "Goggle" -> "AAPL" or "GOOGL"
   */
  async searchTicker(query: string): Promise<any[]> {
    if (!API_KEY) throw new APIError("Missing FMP API Key", 401, 'FMP');
    try {
      // The 'limit=1' ensures we get the best match (e.g. 'Apple' -> AAPL, not a small REIT)
      const response = await fetch(`${BASE_URL}/search?query=${encodeURIComponent(query)}&limit=1&apikey=${API_KEY}`);
      if (!response.ok) throw response;
      return await response.json();
    } catch (error) {
       // We catch here to allow the UI to handle empty results gracefully without crashing on 404s
       console.error("FMP Search failed", error);
       return [];
    }
  }
};