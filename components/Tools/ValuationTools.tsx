import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Calculator, RefreshCw, Save, Copy, TrendingUp, TrendingDown, Layers, Download, Search, Loader2, Cloud, CloudOff, FileText, Table } from 'lucide-react';
import { CashFlowData, ValuationResult, Scenario } from '../../types';
import { DEFAULT_SCENARIO, OPTIMISTIC_SCENARIO, PESSIMISTIC_SCENARIO } from '../../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FmpService, FMPIncomeStatement } from '../../services/fmpService';
import { supabase } from '../../lib/supabaseClient';
import { validateTicker } from '../../utils/errorHandler';

// Helper for formatting large numbers
const formatLargeNumber = (num: number) => {
    if (Math.abs(num) >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
    if (Math.abs(num) >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
    if (Math.abs(num) >= 1e3) return `$${(num / 1e3).toFixed(1)}k`;
    return `$${num.toFixed(0)}`;
};

const STORAGE_KEY = 'finsight_scenarios_v1';

export const ValuationTools: React.FC = () => {
  // Initialize state with default, then attempt to load from storage
  const [scenarios, setScenarios] = useState<Scenario[]>([DEFAULT_SCENARIO, OPTIMISTIC_SCENARIO, PESSIMISTIC_SCENARIO]);
  const [activeScenarioId, setActiveScenarioId] = useState<string>(DEFAULT_SCENARIO.id);
  const [projectionYears, setProjectionYears] = useState<number>(5);
  const [activeTab, setActiveTab] = useState<'IS' | 'BS' | 'CF'>('IS');
  const [isLoaded, setIsLoaded] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // FMP Integration State
  const [tickerInput, setTickerInput] = useState('');
  const [isLoadingTicker, setIsLoadingTicker] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // 1. Fetch User & Load Scenarios on Mount
  useEffect(() => {
    // Cast to any to resolve TS errors where SupabaseAuthClient type definition is missing methods
    (supabase.auth as any).getUser().then(({ data }: any) => {
        const user = data?.user;
        setUser(user);
        if (user) loadSavedScenarios(user.id);
    }).catch((err: any) => {
        console.warn("Supabase auth check failed (ValuationTools):", err);
    });

    // Check LocalStorage as fallback or initial load
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
                setScenarios(parsed);
            }
        } catch (e) {
            console.error("Failed to load saved scenarios", e);
        }
    }
    setIsLoaded(true);
  }, []);

  // Save to LocalStorage whenever scenarios change (Auto-save local)
  useEffect(() => {
      if (isLoaded) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
      }
  }, [scenarios, isLoaded]);

  const loadSavedScenarios = async (userId: string) => {
      const { data, error } = await supabase
        .from('scenarios')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
      
      if (data && data.length > 0) {
          const dbScenarios: Scenario[] = data.map((d: any) => ({
              id: d.id, 
              name: d.name,
              drivers: d.drivers
          }));
          
          setScenarios(prev => {
              const existingIds = new Set(prev.map(s => s.id));
              const newFromCloud = dbScenarios.filter(s => !existingIds.has(s.id));
              return [...prev, ...newFromCloud];
          });
      }
  };

  const saveScenarioToCloud = async () => {
      if (!user) {
          alert("Please sign in from the sidebar to save scenarios to the cloud.");
          return;
      }
      setIsSaving(true);
      
      const { error } = await supabase
        .from('scenarios')
        .insert({
            user_id: user.id,
            name: activeScenario.name,
            drivers: activeScenario.drivers
        });

      setIsSaving(false);

      if (error) {
          alert("Failed to save: " + error.message);
      } else {
          alert("Scenario saved to cloud successfully!");
          loadSavedScenarios(user.id); // Refresh list
      }
  };

  const activeScenario = useMemo(() => 
    scenarios.find(s => s.id === activeScenarioId) || scenarios[0] || DEFAULT_SCENARIO, 
    [scenarios, activeScenarioId]
  );

  // Helper to project cash flows based on drivers
  const calculateProjections = (scenario: Scenario): { flows: CashFlowData[], result: ValuationResult } => {
    const flows: CashFlowData[] = [];
    const { 
        baseRevenue, revenueGrowth, cogsMargin, opexMargin, taxRate, discountRate,
        nwcPercent, capexPercent, depreciationPercent 
    } = scenario.drivers;
    
    // Initial Balance Sheet Assumptions (Year 0)
    // Simplified starting point to enable 3-statement logic
    const startNWC = baseRevenue * ((nwcPercent || 10) / 100);
    const startPPE = baseRevenue * 0.5;
    const startCash = baseRevenue * 0.1;
    const startDebt = baseRevenue * 0.2;
    const startEquity = (startCash + startNWC + startPPE) - startDebt;

    flows.push({ 
        year: 0, 
        revenue: baseRevenue, 
        cogs: baseRevenue * (cogsMargin / 100), 
        grossProfit: baseRevenue * (1 - cogsMargin / 100),
        opex: baseRevenue * (opexMargin / 100),
        ebitda: 0, 
        depreciation: 0,
        ebit: 0, 
        tax: 0,
        netIncome: 0,
        changeInNWC: 0,
        capex: 0,
        cashFlow: 0,
        // BS Year 0
        cash: startCash,
        nwc: startNWC,
        ppe: startPPE,
        totalAssets: startCash + startNWC + startPPE,
        totalDebt: startDebt,
        totalEquity: startEquity
    });

    let prevRev = baseRevenue;
    let prevNWC = startNWC;
    let prevPPE = startPPE;
    let prevCash = startCash;
    let prevEquity = startEquity;
    // Debt assumed constant for unlevered model simplicity, or we could add paydown logic
    let currentDebt = startDebt; 

    for (let i = 1; i <= projectionYears; i++) {
        // Income Statement
        const revenue = prevRev * (1 + (revenueGrowth / 100));
        const cogs = revenue * (cogsMargin / 100);
        const grossProfit = revenue - cogs;
        const opex = revenue * ((opexMargin || 20) / 100); // Cash OpEx
        const ebitda = grossProfit - opex;
        const depreciation = revenue * ((depreciationPercent || 3) / 100);
        const ebit = ebitda - depreciation;
        const tax = Math.max(0, ebit * (taxRate / 100));
        const netIncome = ebit - tax;

        // Cash Flow Items
        const nwc = revenue * ((nwcPercent || 10) / 100);
        const changeInNWC = nwc - prevNWC;
        const capex = revenue * ((capexPercent || 5) / 100);
        
        // Free Cash Flow (Unlevered)
        // EBIT * (1-t) + D&A - CapEx - ChangeInNWC
        // Or via Net Income: Net Income + Int(1-t) + D&A - CapEx - ChangeInNWC
        // Assuming no interest for FCF calculation here (Unlevered)
        const fcf = ebit * (1 - taxRate/100) + depreciation - capex - changeInNWC;
        
        // Balance Sheet Continuity
        const ppe = prevPPE + capex - depreciation;
        const equity = prevEquity + netIncome; // Retained Earnings acc
        
        // Cash Walk (Simplified): Cash_end = Cash_begin + NetIncome + D&A - ChangeNWC - CapEx 
        // (Note: This is rough, assumes NetIncome is cash proxy aside from noted adjustments)
        const cashFlowForBS = netIncome + depreciation - changeInNWC - capex; 
        const cash = prevCash + cashFlowForBS;

        flows.push({
            year: i,
            revenue, cogs, grossProfit, opex, ebitda, depreciation, ebit, tax, netIncome,
            changeInNWC, capex, cashFlow: fcf,
            cash, nwc, ppe,
            totalAssets: cash + nwc + ppe,
            totalDebt: currentDebt,
            totalEquity: equity
        });

        // Update for next iteration
        prevRev = revenue;
        prevNWC = nwc;
        prevPPE = ppe;
        prevCash = cash;
        prevEquity = equity;
    }

    // Valuation Metrics
    let npv = 0;
    const rate = discountRate / 100;
    flows.forEach(f => {
        if (f.year > 0) {
             npv += f.cashFlow / Math.pow(1 + rate, f.year);
        }
    });

    // Terminal Value (Gordon Growth)
    const lastFCF = flows[flows.length-1].cashFlow;
    const terminalGrowth = 0.02; // 2% perpetual
    const terminalValue = (lastFCF * (1 + terminalGrowth)) / (rate - terminalGrowth);
    const pvTerminalValue = terminalValue / Math.pow(1 + rate, projectionYears);
    const totalEnterpriseValue = npv + pvTerminalValue;

    // IRR Approx
    let low = -0.99;
    let high = 2.0;
    let guess = 0.1;
    for(let i=0; i<50; i++) {
        guess = (low + high) / 2;
        let npvGuess = -flows[0].revenue * 2; // Initial investment proxy
        flows.forEach(cf => { if(cf.year>0) npvGuess += cf.cashFlow / Math.pow(1+guess, cf.year) });
        if(Math.abs(npvGuess) < 100) break;
        if(npvGuess > 0) low = guess;
        else high = guess;
    }

    return {
        flows,
        result: {
            npv: totalEnterpriseValue,
            irr: guess * 100,
            paybackPeriod: 0 
        }
    };
  };

  const { flows: currentFlows, result: currentResult } = useMemo(() => calculateProjections(activeScenario), [activeScenario, projectionYears]);

  const updateDriver = (key: keyof Scenario['drivers'], value: number) => {
    setScenarios(prev => prev.map(s => {
        if (s.id === activeScenarioId) {
            return { ...s, drivers: { ...s.drivers, [key]: value } };
        }
        return s;
    }));
  };

  const createScenario = () => {
    const newId = `custom-${Date.now()}`;
    const newScenario: Scenario = {
        ...activeScenario,
        id: newId,
        name: `Scenario ${scenarios.length + 1}`
    };
    setScenarios([...scenarios, newScenario]);
    setActiveScenarioId(newId);
  };

  const deleteScenario = (id: string) => {
      if (scenarios.length <= 1) return;
      const newScenarios = scenarios.filter(s => s.id !== id);
      setScenarios(newScenarios);
      setActiveScenarioId(newScenarios[0].id);
  }

  const handleImportTicker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tickerInput.trim()) return;
    
    setIsLoadingTicker(true);
    setImportError(null);

    try {
        validateTicker(tickerInput.toUpperCase());
        const financials = await FmpService.getIncomeStatement(tickerInput);
        if (!financials || financials.length < 2) {
            throw new Error("Insufficient financial data found for this ticker.");
        }
        const latest = financials[0];
        const previous = financials[1];

        const baseRevenue = latest.revenue;
        const revenueGrowth = ((latest.revenue - previous.revenue) / previous.revenue) * 100;
        const cogsMargin = (latest.costOfRevenue / latest.revenue) * 100;
        const calculatedOpex = latest.grossProfit - (latest.incomeBeforeTax || latest.netIncome); // Proxy
        const opexMargin = (calculatedOpex / latest.revenue) * 100;
        const taxRate = latest.incomeBeforeTax && latest.incomeBeforeTax !== 0 ? (latest.incomeTaxExpense / latest.incomeBeforeTax) * 100 : 21;

        const newId = `import-${tickerInput}-${Date.now()}`;
        const newScenario: Scenario = {
            id: newId,
            name: `Actuals: ${tickerInput.toUpperCase()}`,
            drivers: {
                baseRevenue,
                revenueGrowth,
                cogsMargin,
                opexMargin: Math.max(0, opexMargin),
                taxRate: Math.max(0, taxRate), 
                discountRate: 9.5,
                nwcPercent: 5,
                capexPercent: 5,
                depreciationPercent: 4
            }
        };

        setScenarios([...scenarios, newScenario]);
        setActiveScenarioId(newId);
        setTickerInput('');

    } catch (err: any) {
        setImportError(err.message || "Failed to fetch ticker data.");
    } finally {
        setIsLoadingTicker(false);
    }
  };

  const comparisonData = useMemo(() => {
    return scenarios.map(s => {
        const { result } = calculateProjections(s);
        return {
            name: s.name,
            EV: Math.round(result.npv),
            IRR: parseFloat(result.irr.toFixed(1))
        };
    });
  }, [scenarios, projectionYears]);

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                    <Calculator className="w-8 h-8 text-emerald-600" />
                    Financial Modeling
                </h1>
                <p className="text-slate-500 mt-1 flex items-center gap-2">
                    3-Statement Modeling & Valuation Engine (IS, BS, CF)
                </p>
            </div>
            
            {/* Action Bar */}
            <div className="flex gap-2 items-start flex-wrap">
                 <form onSubmit={handleImportTicker} className="flex gap-2">
                    <div className="relative">
                        <input 
                            type="text" 
                            value={tickerInput}
                            onChange={(e) => setTickerInput(e.target.value)}
                            placeholder="Import Ticker (e.g. AAPL)"
                            className="pl-9 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none w-48 lg:w-64 text-sm"
                        />
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                    <button 
                        type="submit" 
                        disabled={isLoadingTicker}
                        className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                        {isLoadingTicker ? <Loader2 className="w-4 h-4 animate-spin"/> : <Download className="w-4 h-4" />}
                        Import
                    </button>
                 </form>
                 <button onClick={createScenario} className="flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    <Copy className="w-4 h-4" /> Duplicate
                </button>
                <button 
                    onClick={saveScenarioToCloud}
                    disabled={isSaving || !user}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:bg-slate-400 transition-colors"
                >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4" />} 
                    Save
                </button>
            </div>
        </header>
        
        {importError && (
            <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <TrendingDown className="w-4 h-4" /> {importError}
            </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left: Inputs & Scenario Manager */}
            <div className="lg:col-span-4 space-y-6">
                
                {/* Scenario Selector */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex justify-between">
                        <span>Active Scenario</span>
                        <span className="text-emerald-600 flex items-center gap-1"><Save className="w-3 h-3"/> Auto-Saving</span>
                    </label>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {scenarios.map(s => (
                            <div key={s.id} className="flex items-center gap-2">
                                <button
                                    onClick={() => setActiveScenarioId(s.id)}
                                    className={`flex-1 flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${
                                        activeScenarioId === s.id 
                                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm ring-1 ring-emerald-500' 
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Layers className={`w-4 h-4 ${activeScenarioId === s.id ? 'text-emerald-600' : 'text-slate-400'}`} />
                                        <span className="font-medium truncate max-w-[120px]">{s.name}</span>
                                    </div>
                                    {activeScenarioId === s.id && <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0"></div>}
                                </button>
                                {scenarios.length > 1 && (
                                    <button 
                                        onClick={() => deleteScenario(s.id)}
                                        className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-100 transition-all"
                                    >
                                        <Trash2 className="w-4 h-4"/>
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Driver Inputs */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <SettingsInput className="w-5 h-5 text-slate-500" />
                        <h2 className="text-lg font-bold text-slate-800">Assumptions & Drivers</h2>
                    </div>

                    <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Top Line</h3>
                            <InputGroup label="Base Revenue ($)" value={activeScenario.drivers.baseRevenue} onChange={(v) => updateDriver('baseRevenue', v)} step={100000} />
                            <InputGroup label="Revenue Growth (%)" value={activeScenario.drivers.revenueGrowth} onChange={(v) => updateDriver('revenueGrowth', v)} step={0.1} color="blue" />
                        </div>
                        
                        <div className="space-y-4 pt-4 border-t border-slate-100">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Margins & Ops</h3>
                            <InputGroup label="COGS Margin (%)" value={activeScenario.drivers.cogsMargin} onChange={(v) => updateDriver('cogsMargin', v)} step={0.5} color="rose" />
                            <InputGroup label="OpEx (SG&A) %" value={activeScenario.drivers.opexMargin || 20} onChange={(v) => updateDriver('opexMargin', v)} step={0.5} color="amber" />
                            <InputGroup label="Tax Rate (%)" value={activeScenario.drivers.taxRate} onChange={(v) => updateDriver('taxRate', v)} step={0.5} />
                        </div>

                        <div className="space-y-4 pt-4 border-t border-slate-100">
                             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Balance Sheet Drivers</h3>
                             <InputGroup label="Working Capital % Sales" value={activeScenario.drivers.nwcPercent || 10} onChange={(v) => updateDriver('nwcPercent', v)} step={0.5} color="purple" />
                             <InputGroup label="CapEx % Sales" value={activeScenario.drivers.capexPercent || 5} onChange={(v) => updateDriver('capexPercent', v)} step={0.5} color="indigo" />
                             <InputGroup label="D&A % Sales" value={activeScenario.drivers.depreciationPercent || 3} onChange={(v) => updateDriver('depreciationPercent', v)} step={0.1} color="cyan" />
                        </div>
                        
                        <div className="pt-4 border-t border-slate-100">
                             <InputGroup label="Discount Rate / WACC (%)" value={activeScenario.drivers.discountRate} onChange={(v) => updateDriver('discountRate', v)} step={0.1} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Right: Results & Visualization */}
            <div className="lg:col-span-8 space-y-6">
                
                {/* Key Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-900 text-white p-5 rounded-xl shadow-lg">
                        <p className="text-slate-400 text-xs font-medium uppercase mb-1">Enterprise Value (TEV)</p>
                        <div className="text-2xl font-bold text-emerald-400">
                            {formatLargeNumber(currentResult.npv)}
                        </div>
                    </div>
                    <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
                        <p className="text-slate-500 text-xs font-medium uppercase mb-1">Exit EBITDA Margin</p>
                        <div className="text-2xl font-bold text-blue-600">
                           {(currentFlows[currentFlows.length-1].ebitda / currentFlows[currentFlows.length-1].revenue * 100).toFixed(1)}%
                        </div>
                    </div>
                    <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
                         <p className="text-slate-500 text-xs font-medium uppercase mb-1">Terminal FCF</p>
                         <div className="text-2xl font-bold text-emerald-600">
                            {formatLargeNumber(currentFlows[currentFlows.length-1].cashFlow)}
                         </div>
                    </div>
                </div>

                {/* 3-Statement Tables */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
                    <div className="flex border-b border-slate-100">
                        <TabButton active={activeTab === 'IS'} onClick={() => setActiveTab('IS')} label="Income Statement" icon={FileText} />
                        <TabButton active={activeTab === 'BS'} onClick={() => setActiveTab('BS')} label="Balance Sheet" icon={Table} />
                        <TabButton active={activeTab === 'CF'} onClick={() => setActiveTab('CF')} label="Cash Flow" icon={RefreshCw} />
                    </div>
                    
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-sm text-right">
                            <thead className="bg-white text-slate-500 font-medium border-b border-slate-100 sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-3 text-left w-48 bg-white">Fiscal Year</th>
                                    {currentFlows.filter(f => f.year > 0).map(f => (
                                        <th key={f.year} className="px-6 py-3 bg-slate-50/50">Year {f.year}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {activeTab === 'IS' && (
                                    <>
                                        <Row label="Total Revenue" values={currentFlows} field="revenue" bold />
                                        <Row label="COGS" values={currentFlows} field="cogs" isNegative />
                                        <Row label="Gross Profit" values={currentFlows} field="grossProfit" bold bg />
                                        <Row label="OpEx (SG&A)" values={currentFlows} field="opex" isNegative />
                                        <Row label="EBITDA" values={currentFlows} field="ebitda" bold />
                                        <Row label="Depreciation & Amort." values={currentFlows} field="depreciation" isNegative />
                                        <Row label="EBIT" values={currentFlows} field="ebit" bold bg />
                                        <Row label="Income Tax" values={currentFlows} field="tax" isNegative />
                                        <Row label="Net Income" values={currentFlows} field="netIncome" bold color="text-emerald-700" />
                                    </>
                                )}
                                {activeTab === 'BS' && (
                                    <>
                                        <tr className="bg-slate-100"><td colSpan={10} className="px-6 py-1 text-left text-xs font-bold text-slate-500 uppercase">Assets</td></tr>
                                        <Row label="Cash & Equivalents" values={currentFlows} field="cash" />
                                        <Row label="Net Working Capital" values={currentFlows} field="nwc" />
                                        <Row label="Net PP&E" values={currentFlows} field="ppe" />
                                        <Row label="Total Assets" values={currentFlows} field="totalAssets" bold bg />
                                        <tr className="bg-slate-100"><td colSpan={10} className="px-6 py-1 text-left text-xs font-bold text-slate-500 uppercase">Liabilities & Equity</td></tr>
                                        <Row label="Total Debt" values={currentFlows} field="totalDebt" />
                                        <Row label="Total Equity" values={currentFlows} field="totalEquity" />
                                        <Row label="Total Liab. & Equity" values={currentFlows} field="totalAssets" bold bg />
                                    </>
                                )}
                                {activeTab === 'CF' && (
                                    <>
                                        <Row label="Net Income" values={currentFlows} field="netIncome" bold />
                                        <Row label="Plus: D&A" values={currentFlows} field="depreciation" />
                                        <Row label="Less: Change in NWC" values={currentFlows} field="changeInNWC" isNegative />
                                        <Row label="Less: CapEx" values={currentFlows} field="capex" isNegative />
                                        <Row label="Unlevered Free Cash Flow" values={currentFlows} field="cashFlow" bold bg color="text-emerald-700" />
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Scenario Comparison Chart */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">Valuation Sensitivity (TEV)</h3>
                    <div className="h-64 w-full min-w-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={comparisonData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={true} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={120} tick={{fontSize: 11}} />
                                <Tooltip 
                                    cursor={{fill: '#f8fafc'}}
                                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                    formatter={(value: number) => formatLargeNumber(value)}
                                />
                                <Bar dataKey="EV" fill="#10b981" radius={[0, 4, 4, 0]} barSize={30}>
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
};

// Subcomponent for table rows
const Row = ({ label, values, field, isNegative, bold, bg, color }: any) => (
    <tr className={`${bg ? 'bg-slate-50/50' : ''}`}>
        <td className={`px-6 py-3 text-left ${bold ? 'font-bold text-slate-800' : 'text-slate-600'} pl-${bold ? '6' : '8'}`}>{label}</td>
        {values.filter((f: any) => f.year > 0).map((f: any) => (
            <td key={f.year} className={`px-6 py-3 ${color || (bold ? 'text-slate-900' : 'text-slate-500')} ${bold ? 'font-semibold' : ''}`}>
                {isNegative ? `(${formatLargeNumber(f[field])})` : formatLargeNumber(f[field])}
            </td>
        ))}
    </tr>
);

const TabButton = ({ active, onClick, label, icon: Icon }: any) => (
    <button
        onClick={onClick}
        className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors border-b-2 ${
            active 
            ? 'border-emerald-500 text-emerald-600 bg-emerald-50/30' 
            : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
        }`}
    >
        <Icon className="w-4 h-4" />
        {label}
    </button>
);

const InputGroup: React.FC<{ label: string; value: number; onChange: (val: number) => void; step: number; color?: string }> = ({ label, value, onChange, step, color = 'emerald' }) => {
    return (
        <div>
            <div className="flex justify-between mb-1">
                <label className="text-xs font-medium text-slate-500">{label}</label>
                <span className="text-xs font-bold text-slate-900">
                    {label.includes('Revenue') ? formatLargeNumber(value) : `${value.toFixed(1)}%`}
                </span>
            </div>
            <input 
                type="range" 
                min={label.includes('Growth') ? -20 : 0} 
                max={label.includes('Growth') ? 50 : label.includes('Revenue') ? value * 3 : 100} 
                step={step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className={`w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-${color}-600`}
            />
        </div>
    );
};

const SettingsInput = ({className}: {className: string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
        <circle cx="12" cy="12" r="3"></circle>
    </svg>
)