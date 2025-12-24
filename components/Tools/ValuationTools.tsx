import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Calculator, RefreshCw, Save, Copy, TrendingUp, TrendingDown, Layers } from 'lucide-react';
import { CashFlowData, ValuationResult, Scenario } from '../../types';
import { DEFAULT_SCENARIO, OPTIMISTIC_SCENARIO, PESSIMISTIC_SCENARIO } from '../../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const ValuationTools: React.FC = () => {
  const [scenarios, setScenarios] = useState<Scenario[]>([DEFAULT_SCENARIO, OPTIMISTIC_SCENARIO, PESSIMISTIC_SCENARIO]);
  const [activeScenarioId, setActiveScenarioId] = useState<string>(DEFAULT_SCENARIO.id);
  const [projectionYears, setProjectionYears] = useState<number>(5);

  const activeScenario = useMemo(() => 
    scenarios.find(s => s.id === activeScenarioId) || DEFAULT_SCENARIO, 
    [scenarios, activeScenarioId]
  );

  // Helper to project cash flows based on drivers
  const calculateProjections = (scenario: Scenario): { flows: CashFlowData[], result: ValuationResult } => {
    const flows: CashFlowData[] = [];
    const { baseRevenue, revenueGrowth, cogsMargin, taxRate, discountRate } = scenario.drivers;
    
    // Year 0 (Initial Investment placeholder - usually calculated separately, hardcoded for model simplicity here)
    const initialInvestment = - (baseRevenue * 0.2); // Assume 20% of revenue as initial investment needed
    flows.push({ year: 0, revenue: 0, expenses: 0, cashFlow: initialInvestment });

    let currentRevenue = baseRevenue;

    for (let i = 1; i <= projectionYears; i++) {
        const rev = currentRevenue * (1 + (revenueGrowth / 100));
        const exp = rev * (cogsMargin / 100);
        const ebitda = rev - exp;
        const tax = Math.max(0, ebitda * (taxRate / 100));
        const fcf = ebitda - tax; // Simplified FCF

        flows.push({
            year: i,
            revenue: rev,
            expenses: exp,
            cashFlow: fcf
        });
        currentRevenue = rev;
    }

    // Valuation Metrics
    let npv = 0;
    const rate = discountRate / 100;
    flows.forEach(f => {
        npv += f.cashFlow / Math.pow(1 + rate, f.year);
    });

    // IRR Approx
    let low = -0.99;
    let high = 2.0;
    let guess = 0.1;
    for(let i=0; i<50; i++) {
        guess = (low + high) / 2;
        let npvGuess = 0;
        flows.forEach(cf => npvGuess += cf.cashFlow / Math.pow(1+guess, cf.year));
        if(Math.abs(npvGuess) < 100) break;
        if(npvGuess > 0) low = guess;
        else high = guess;
    }

    return {
        flows,
        result: {
            npv,
            irr: guess * 100,
            paybackPeriod: 0 // Not calculating for brevity
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

  // Compare all scenarios
  const comparisonData = useMemo(() => {
    return scenarios.map(s => {
        const { result } = calculateProjections(s);
        return {
            name: s.name,
            NPV: Math.round(result.npv),
            IRR: parseFloat(result.irr.toFixed(1))
        };
    });
  }, [scenarios, projectionYears]);

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex justify-between items-end">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                    <Calculator className="w-8 h-8 text-emerald-600" />
                    Scenario Planning & Valuation
                </h1>
                <p className="text-slate-500 mt-1">
                    Driver-based financial modeling with multi-scenario support.
                </p>
            </div>
            <div className="flex gap-2">
                <button onClick={createScenario} className="flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    <Copy className="w-4 h-4" /> Duplicate Scenario
                </button>
            </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left: Inputs & Scenario Manager */}
            <div className="lg:col-span-4 space-y-6">
                
                {/* Scenario Selector */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Active Scenario</label>
                    <div className="space-y-2">
                        {scenarios.map(s => (
                            <button
                                key={s.id}
                                onClick={() => setActiveScenarioId(s.id)}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${
                                    activeScenarioId === s.id 
                                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm ring-1 ring-emerald-500' 
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Layers className={`w-4 h-4 ${activeScenarioId === s.id ? 'text-emerald-600' : 'text-slate-400'}`} />
                                    <span className="font-medium">{s.name}</span>
                                </div>
                                {activeScenarioId === s.id && <div className="w-2 h-2 rounded-full bg-emerald-500"></div>}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Driver Inputs */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <SettingsInput className="w-5 h-5 text-slate-500" />
                        <h2 className="text-lg font-bold text-slate-800">Model Drivers</h2>
                    </div>

                    <div className="space-y-5">
                        <InputGroup 
                            label="Base Revenue ($)" 
                            value={activeScenario.drivers.baseRevenue} 
                            onChange={(v) => updateDriver('baseRevenue', v)} 
                            step={10000}
                        />
                         <InputGroup 
                            label="Annual Growth Rate (%)" 
                            value={activeScenario.drivers.revenueGrowth} 
                            onChange={(v) => updateDriver('revenueGrowth', v)} 
                            step={0.5}
                            color="blue"
                        />
                         <InputGroup 
                            label="COGS / Expense Margin (%)" 
                            value={activeScenario.drivers.cogsMargin} 
                            onChange={(v) => updateDriver('cogsMargin', v)} 
                            step={0.5}
                            color="rose"
                        />
                         <InputGroup 
                            label="Tax Rate (%)" 
                            value={activeScenario.drivers.taxRate} 
                            onChange={(v) => updateDriver('taxRate', v)} 
                            step={1}
                        />
                         <InputGroup 
                            label="Discount Rate / WACC (%)" 
                            value={activeScenario.drivers.discountRate} 
                            onChange={(v) => updateDriver('discountRate', v)} 
                            step={0.5}
                        />
                    </div>
                </div>
            </div>

            {/* Right: Results & Visualization */}
            <div className="lg:col-span-8 space-y-6">
                
                {/* Key Metrics Cards */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-900 text-white p-5 rounded-xl shadow-lg">
                        <p className="text-slate-400 text-xs font-medium uppercase mb-1">Scenario NPV</p>
                        <div className={`text-2xl font-bold ${currentResult.npv >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            ${(currentResult.npv / 1000).toFixed(0)}k
                        </div>
                    </div>
                    <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
                        <p className="text-slate-500 text-xs font-medium uppercase mb-1">IRR</p>
                        <div className={`text-2xl font-bold ${currentResult.irr > activeScenario.drivers.discountRate ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {currentResult.irr.toFixed(1)}%
                        </div>
                    </div>
                    <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
                        <p className="text-slate-500 text-xs font-medium uppercase mb-1">5-Yr Revenue CAGR</p>
                        <div className="text-2xl font-bold text-blue-600">
                           {activeScenario.drivers.revenueGrowth.toFixed(1)}%
                        </div>
                    </div>
                </div>

                {/* Scenario Comparison Chart */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">Scenario Sensitivity Analysis (NPV Comparison)</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={comparisonData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={true} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                                <Tooltip 
                                    cursor={{fill: '#f8fafc'}}
                                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                />
                                <Bar dataKey="NPV" fill="#10b981" radius={[0, 4, 4, 0]} barSize={30}>
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Detailed Cash Flow Table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                        <h3 className="font-semibold text-slate-800">Projected Financials - {activeScenario.name}</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-right">
                            <thead className="bg-white text-slate-500 font-medium">
                                <tr>
                                    <th className="px-6 py-3 text-left">Line Item</th>
                                    {currentFlows.filter(f => f.year > 0).map(f => (
                                        <th key={f.year} className="px-6 py-3">Year {f.year}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                <tr>
                                    <td className="px-6 py-3 text-left font-medium text-slate-900">Revenue</td>
                                    {currentFlows.filter(f => f.year > 0).map(f => (
                                        <td key={f.year} className="px-6 py-3">${(f.revenue / 1000).toFixed(0)}k</td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="px-6 py-3 text-left font-medium text-slate-900">Expenses (COGS)</td>
                                    {currentFlows.filter(f => f.year > 0).map(f => (
                                        <td key={f.year} className="px-6 py-3 text-rose-600">(${ (f.expenses / 1000).toFixed(0) }k)</td>
                                    ))}
                                </tr>
                                <tr className="bg-slate-50">
                                    <td className="px-6 py-3 text-left font-bold text-slate-900">Free Cash Flow</td>
                                    {currentFlows.filter(f => f.year > 0).map(f => (
                                        <td key={f.year} className="px-6 py-3 font-bold text-emerald-600">${ (f.cashFlow / 1000).toFixed(0) }k</td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
};

// Subcomponent for cleaner inputs
const InputGroup: React.FC<{ label: string; value: number; onChange: (val: number) => void; step: number; color?: string }> = ({ label, value, onChange, step, color = 'emerald' }) => {
    return (
        <div>
            <div className="flex justify-between mb-1">
                <label className="text-sm font-medium text-slate-600">{label}</label>
                <span className="text-sm font-bold text-slate-900">{value.toLocaleString()}</span>
            </div>
            <input 
                type="range" 
                min={label.includes('Growth') ? -10 : 0} 
                max={label.includes('Growth') ? 30 : label.includes('Revenue') ? 5000000 : 100} 
                step={step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className={`w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-${color}-600`}
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
