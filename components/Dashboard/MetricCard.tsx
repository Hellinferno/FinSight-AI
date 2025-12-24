import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { FinancialMetric } from '../../types';

export const MetricCard: React.FC<{ metric: FinancialMetric }> = ({ metric }) => {
  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide">{metric.label}</h3>
        {metric.change !== undefined && (
          <span
            className={`flex items-center text-xs font-semibold px-2 py-1 rounded-full ${
              metric.trend === 'up'
                ? 'bg-emerald-100 text-emerald-700'
                : metric.trend === 'down'
                ? 'bg-rose-100 text-rose-700'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {metric.trend === 'up' && <ArrowUpRight className="w-3 h-3 mr-1" />}
            {metric.trend === 'down' && <ArrowDownRight className="w-3 h-3 mr-1" />}
            {metric.trend === 'neutral' && <Minus className="w-3 h-3 mr-1" />}
            {Math.abs(metric.change)}%
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-slate-900">
        {metric.prefix}{metric.value.toLocaleString()}{metric.suffix}
      </div>
    </div>
  );
};
