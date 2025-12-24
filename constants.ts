
import { CashFlowData, Scenario } from './types';

// Dashboard Mock Data
export const REVENUE_BY_DEPT = {
  All: [
    { month: 'Jan', revenue: 4000, profit: 1600 },
    { month: 'Feb', revenue: 3000, profit: 1602 },
    { month: 'Mar', revenue: 2000, profit: -7800 },
    { month: 'Apr', revenue: 2780, profit: -1128 },
    { month: 'May', revenue: 1890, profit: -2910 },
    { month: 'Jun', revenue: 2390, profit: -1410 },
    { month: 'Jul', revenue: 3490, profit: -810 },
  ],
  Sales: [
    { month: 'Jan', revenue: 2500, profit: 1500 },
    { month: 'Feb', revenue: 2000, profit: 1200 },
    { month: 'Mar', revenue: 1500, profit: 900 },
    { month: 'Apr', revenue: 1800, profit: 1100 },
    { month: 'May', revenue: 1200, profit: 700 },
    { month: 'Jun', revenue: 1600, profit: 950 },
    { month: 'Jul', revenue: 2200, profit: 1300 },
  ],
  Marketing: [
    { month: 'Jan', revenue: 0, profit: -800 },
    { month: 'Feb', revenue: 0, profit: -900 },
    { month: 'Mar', revenue: 0, profit: -1200 },
    { month: 'Apr', revenue: 0, profit: -850 },
    { month: 'May', revenue: 0, profit: -950 },
    { month: 'Jun', revenue: 0, profit: -800 },
    { month: 'Jul', revenue: 0, profit: -1000 },
  ],
};

export const DEFAULT_SCENARIO: Scenario = {
  id: 'base',
  name: 'Base Case',
  drivers: {
    baseRevenue: 1000000,
    revenueGrowth: 5,
    cogsMargin: 40,
    opexMargin: 30,
    taxRate: 21,
    discountRate: 10,
    nwcPercent: 10,
    capexPercent: 5,
    depreciationPercent: 3
  }
};

export const OPTIMISTIC_SCENARIO: Scenario = {
  id: 'optimistic',
  name: 'Bull Case',
  drivers: {
    baseRevenue: 1000000,
    revenueGrowth: 12,
    cogsMargin: 35,
    opexMargin: 25,
    taxRate: 21,
    discountRate: 10,
    nwcPercent: 8,
    capexPercent: 6,
    depreciationPercent: 3
  }
};

export const PESSIMISTIC_SCENARIO: Scenario = {
  id: 'pessimistic',
  name: 'Bear Case',
  drivers: {
    baseRevenue: 1000000,
    revenueGrowth: -2,
    cogsMargin: 55,
    opexMargin: 35,
    taxRate: 25,
    discountRate: 12,
    nwcPercent: 12,
    capexPercent: 3,
    depreciationPercent: 4
  }
};

export const MOCK_NOTIFICATIONS = [
  { id: 1, text: "Q3 Budget Variance Report available", time: "2h ago" },
  { id: 2, text: "Interest rate sensitivity threshold breached", time: "4h ago" },
  { id: 3, text: "New competitor filing detected (SEC)", time: "1d ago" },
];