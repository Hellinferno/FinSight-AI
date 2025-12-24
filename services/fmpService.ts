const API_KEY = 'zKtKqCr1VYJ0LG4csL4bxq9ZtaYeDKzo';
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
    try {
      const response = await fetch(`${BASE_URL}/profile/${ticker.toUpperCase()}?apikey=${API_KEY}`);
      if (!response.ok) throw new Error(`FMP API Error: ${response.statusText}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Failed to fetch company profile", error);
      throw error;
    }
  },

  /**
   * Fetches annual income statements.
   * limit=5 gets the last 5 years.
   */
  async getIncomeStatement(ticker: string, limit = 5): Promise<FMPIncomeStatement[]> {
    try {
      const response = await fetch(`${BASE_URL}/income-statement/${ticker.toUpperCase()}?limit=${limit}&apikey=${API_KEY}`);
      if (!response.ok) throw new Error(`FMP API Error: ${response.statusText}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Failed to fetch income statement", error);
      throw error;
    }
  }
};
