import React from 'react';

const STOCKS = [
  { s: 'AAPL', p: '224.50', c: '+1.2%' },
  { s: 'MSFT', p: '412.00', c: '+0.8%' },
  { s: 'GOOGL', p: '175.30', c: '-0.4%' },
  { s: 'NVDA', p: '128.30', c: '+2.1%' },
  { s: 'AMZN', p: '185.10', c: '+1.5%' },
  { s: 'TSLA', p: '178.00', c: '-1.2%' },
  { s: 'BTC', p: '64,200', c: '+3.5%' },
  { s: 'ETH', p: '3,450', c: '+2.1%' },
  { s: 'SPY', p: '510.20', c: '+0.5%' },
  { s: 'QQQ', p: '440.15', c: '+0.9%' },
];

export const StockTicker: React.FC = () => {
  return (
    <div className="w-full bg-slate-900 text-white overflow-hidden whitespace-nowrap py-2 border-b border-slate-800 flex items-center h-10">
      <div className="inline-block animate-marquee">
        {[...STOCKS, ...STOCKS, ...STOCKS].map((stock, i) => (
          <span key={i} className="mx-6 font-mono text-sm inline-flex items-center gap-2">
            <span className="font-bold text-emerald-400">{stock.s}</span>
            <span className="text-slate-200">${stock.p}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded ${stock.c.includes('+') ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
              {stock.c}
            </span>
          </span>
        ))}
      </div>
      <style>{`
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee:hover {
            animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};