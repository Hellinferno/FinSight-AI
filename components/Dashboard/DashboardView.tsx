import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';
import { MetricCard } from './MetricCard';
import { MOCK_NOTIFICATIONS, REVENUE_BY_DEPT } from '../../constants';
import { FinancialMetric } from '../../types';
import { Bell, Filter, Calendar as CalendarIcon, ChevronDown, Download, FileText, X, Loader2 } from 'lucide-react';
import { GeminiService } from '../../services/geminiService';
import ReactMarkdown from 'react-markdown';

// Enhanced Mock Data for Pie Chart
const EXPENSE_BREAKDOWN = [
  { name: 'Salaries', value: 450000, color: '#3b82f6' },
  { name: 'Marketing', value: 200000, color: '#10b981' },
  { name: 'R&D', value: 150000, color: '#8b5cf6' },
  { name: 'Ops/Overhead', value: 90000, color: '#f59e0b' },
];

export const DashboardView: React.FC = () => {
  const [departmentFilter, setDepartmentFilter] = useState<'All' | 'Sales' | 'Marketing'>('All');
  const [periodFilter, setPeriodFilter] = useState<'YTD' | 'Q1' | 'Q2'>('YTD');
  
  // Report Generation State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportContent, setReportContent] = useState('');

  // Dynamic Data based on filters
  const currentRevenueData = REVENUE_BY_DEPT[departmentFilter] || REVENUE_BY_DEPT['All'];
  
  // Calculate dynamic KPIs
  const totalRev = currentRevenueData.reduce((acc, curr) => acc + curr.revenue, 0);
  const totalProfit = currentRevenueData.reduce((acc, curr) => acc + curr.profit, 0);
  const margin = totalRev > 0 ? ((totalProfit / totalRev) * 100).toFixed(1) : '0';

  const KPIS: FinancialMetric[] = [
    { label: 'Revenue (' + periodFilter + ')', value: totalRev, prefix: '$', change: departmentFilter === 'All' ? 12.5 : 8.4, trend: 'up' },
    { label: 'Net Profit', value: totalProfit, prefix: '$', change: 1.2, trend: totalProfit > 0 ? 'up' : 'down' },
    { label: 'Profit Margin', value: Number(margin), suffix: '%', change: -0.5, trend: 'down' },
    { label: 'Burn Rate (Mo)', value: 125000, prefix: '$', change: 2.1, trend: 'neutral' },
  ];

  const handleGenerateReport = async () => {
    setShowReportModal(true);
    setReportLoading(true);
    setReportContent('');
    
    try {
        const context = `
            Department: ${departmentFilter}
            Period: ${periodFilter}
            Total Revenue: $${totalRev}
            Total Profit: $${totalProfit}
            Margin: ${margin}%
            
            Monthly Data (Revenue vs Profit):
            ${JSON.stringify(currentRevenueData)}
            
            Expense Breakdown:
            ${JSON.stringify(EXPENSE_BREAKDOWN)}
        `;
        
        const report = await GeminiService.generateReport(context);
        setReportContent(report);
    } catch (error) {
        setReportContent("Failed to generate report. Please ensure your API key is configured correctly.");
    } finally {
        setReportLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6 h-full overflow-y-auto bg-slate-50 relative">
      
      {/* Header & Filter Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Executive Overview</h1>
          <p className="text-slate-500 mt-1">Real-time performance monitoring and variance analysis.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 px-3 border-r border-slate-200">
                <Filter className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filters</span>
            </div>
            
            {/* Dept Filter */}
            <div className="relative group">
                <button className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 rounded-lg text-sm font-medium text-slate-700">
                    Dept: {departmentFilter} <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
                <div className="absolute top-full right-0 mt-2 w-32 bg-white border border-slate-200 rounded-lg shadow-xl hidden group-hover:block z-10">
                    {['All', 'Sales', 'Marketing'].map(d => (
                        <button key={d} onClick={() => setDepartmentFilter(d as any)} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 text-slate-700">{d}</button>
                    ))}
                </div>
            </div>

            {/* Period Filter */}
             <div className="relative group">
                <button className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 rounded-lg text-sm font-medium text-slate-700">
                    <CalendarIcon className="w-3 h-3 text-slate-400" /> {periodFilter} <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
                <div className="absolute top-full right-0 mt-2 w-32 bg-white border border-slate-200 rounded-lg shadow-xl hidden group-hover:block z-10">
                    {['YTD', 'Q1', 'Q2'].map(d => (
                        <button key={d} onClick={() => setPeriodFilter(d as any)} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 text-slate-700">{d}</button>
                    ))}
                </div>
            </div>

            <button className="p-2 text-slate-400 hover:text-emerald-600 border-l border-slate-200 pl-3 ml-1">
                <Download className="w-4 h-4" />
            </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {KPIS.map((metric, idx) => (
          <MetricCard key={idx} metric={metric} />
        ))}
      </div>

      {/* Main Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* P&L Trend - Responsive to filters */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800">Revenue & Profitability Trend</h3>
            <div className="flex gap-2">
                <span className="flex items-center gap-1 text-xs text-slate-500"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Revenue</span>
                <span className="flex items-center gap-1 text-xs text-slate-500"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Net Profit</span>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={currentRevenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                  itemStyle={{ fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorProf)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Expense Allocation</h3>
            <div className="flex-1 min-h-[200px] relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={EXPENSE_BREAKDOWN}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {EXPENSE_BREAKDOWN.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
                {/* Center text for Donut */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                        <span className="block text-2xl font-bold text-slate-800">890k</span>
                        <span className="text-xs text-slate-500 uppercase">Total Exp</span>
                    </div>
                </div>
            </div>
            <div className="mt-4 space-y-2">
                {EXPENSE_BREAKDOWN.map(item => (
                    <div key={item.name} className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{backgroundColor: item.color}}></div>
                            <span className="text-slate-600">{item.name}</span>
                        </div>
                        <span className="font-medium text-slate-900">${(item.value/1000).toFixed(0)}k</span>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* Bottom Row - Alerts & Drill Down Hint */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-800">Active Alerts</h3>
                    <Bell className="w-4 h-4 text-slate-400" />
                </div>
                <div className="space-y-3">
                    {MOCK_NOTIFICATIONS.map(n => (
                        <div key={n.id} className="flex gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                             <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 flex-shrink-0"></div>
                             <div>
                                 <p className="text-sm text-slate-800 font-medium leading-tight">{n.text}</p>
                                 <p className="text-xs text-slate-500 mt-1">{n.time}</p>
                             </div>
                        </div>
                    ))}
                </div>
           </div>
           
           <div className="lg:col-span-2 bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-xl text-white flex items-center justify-between relative overflow-hidden">
                <div className="relative z-10 max-w-lg">
                    <h3 className="text-xl font-bold mb-2">Drill-Down Analysis</h3>
                    <p className="text-slate-300 text-sm mb-4">
                        The current Profit Margin for {departmentFilter} is trending {Number(margin) < 10 ? 'below' : 'above'} target. 
                        Drill down into specific cost centers to identify variance root causes.
                    </p>
                    <button 
                        onClick={handleGenerateReport}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                    >
                        <FileText className="w-4 h-4" />
                        Generate Variance Report
                    </button>
                </div>
                <div className="absolute right-0 bottom-0 opacity-10">
                    <BarChart width={300} height={150} data={currentRevenueData}>
                        <Bar dataKey="revenue" fill="#fff" />
                    </BarChart>
                </div>
           </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col animate-fadeIn">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-emerald-600" />
                        <h2 className="text-xl font-bold text-slate-800">Variance Analysis Report</h2>
                    </div>
                    <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6">
                    {reportLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                            <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-4" />
                            <p>Analyzing financial data and generating narrative...</p>
                        </div>
                    ) : (
                        <div className="prose prose-slate prose-sm max-w-none">
                             <ReactMarkdown>{reportContent}</ReactMarkdown>
                        </div>
                    )}
                </div>
                
                <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-end gap-3">
                    <button onClick={() => setShowReportModal(false)} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-white transition-colors">
                        Close
                    </button>
                    <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2">
                        <Download className="w-4 h-4" /> Export PDF
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
