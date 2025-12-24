import React, { useState } from 'react';
import { Search, Loader2, ExternalLink, Globe, AlertCircle, Building2, TrendingUp, DollarSign } from 'lucide-react';
import { GeminiService } from '../../services/geminiService';
import { FmpService, FMPProfile } from '../../services/fmpService';
import { ResearchResponse } from '../../types';
import ReactMarkdown from 'react-markdown';

export const MarketResearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ResearchResponse | null>(null);
  const [companyProfile, setCompanyProfile] = useState<FMPProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setData(null);
    setCompanyProfile(null);

    try {
      // 1. Check if query is a likely ticker symbol (3-5 chars, no spaces)
      const isTicker = /^[A-Za-z]{1,5}$/.test(query);
      if (isTicker) {
        try {
            const profiles = await FmpService.getCompanyProfile(query);
            if (profiles && profiles.length > 0) {
                setCompanyProfile(profiles[0]);
            }
        } catch (e) {
            console.warn("Could not fetch FMP profile, continuing with research.");
        }
      }

      // 2. Perform Research
      const result = await GeminiService.conductResearch(query);
      setData(result);
    } catch (err) {
      setError("Failed to fetch market insights. Please check your API configuration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-50 flex flex-col">
       <div className="max-w-4xl mx-auto w-full">
         <header className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Market Intelligence</h1>
            <p className="text-slate-500">Real-time market research powered by Gemini & Financial Modeling Prep.</p>
         </header>

         <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2 mb-8 sticky top-0 z-10">
            <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                    <input 
                      type="text" 
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Enter a Ticker (e.g. AAPL) or Research Topic..." 
                      className="w-full pl-10 pr-4 py-3 rounded-lg border-none focus:ring-0 text-slate-900 placeholder-slate-400 outline-none"
                    />
                </div>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : 'Research'}
                </button>
            </form>
         </div>

         {error && (
             <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-lg flex items-center gap-3 mb-6">
                 <AlertCircle className="w-5 h-5"/>
                 {error}
             </div>
         )}

         {loading && !companyProfile && (
             <div className="text-center py-12">
                 <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-4"/>
                 <p className="text-slate-500">Analyzing market data sources...</p>
             </div>
         )}

         {/* Company Snapshot Card */}
         {companyProfile && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6 animate-fadeIn">
                <div className="p-6 border-b border-slate-100 flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        {companyProfile.image && <img src={companyProfile.image} alt={companyProfile.symbol} className="w-12 h-12 rounded bg-slate-50 p-1" />}
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">{companyProfile.companyName}</h2>
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <span className="font-semibold bg-slate-100 px-2 py-0.5 rounded">{companyProfile.symbol}</span>
                                <span>{companyProfile.exchangeShortName}</span>
                                <span>•</span>
                                <span>{companyProfile.currency}</span>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-slate-900 flex items-center justify-end gap-1">
                            <DollarSign className="w-5 h-5 text-slate-400"/>
                            {companyProfile.price}
                        </div>
                        <div className={`text-sm font-medium flex items-center justify-end gap-1 ${companyProfile.changes >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {companyProfile.changes >= 0 ? <TrendingUp className="w-3 h-3"/> : <TrendingUp className="w-3 h-3 rotate-180"/>}
                            {companyProfile.changes.toFixed(2)} ({((companyProfile.changes / companyProfile.price) * 100).toFixed(2)}%)
                        </div>
                    </div>
                </div>
                <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50/50">
                    <div>
                        <p className="text-xs text-slate-500 uppercase font-medium">Market Cap</p>
                        <p className="font-semibold text-slate-900">${(companyProfile.mktCap / 1000000000).toFixed(2)}B</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase font-medium">Beta</p>
                        <p className="font-semibold text-slate-900">{companyProfile.beta.toFixed(2)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase font-medium">Sector</p>
                        <p className="font-semibold text-slate-900">{companyProfile.sector}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase font-medium">CEO</p>
                        <p className="font-semibold text-slate-900 truncate">{companyProfile.ceo}</p>
                    </div>
                </div>
                <div className="p-6 text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                    {companyProfile.description}
                </div>
            </div>
         )}

         {data && (
             <div className="space-y-6 animate-fadeIn">
                 {/* Summary Section */}
                 <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                     <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                        <Globe className="w-5 h-5 text-emerald-500" />
                        <h2 className="text-xl font-bold text-slate-800">AI Executive Summary</h2>
                     </div>
                     <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed">
                        <ReactMarkdown>{data.summary}</ReactMarkdown>
                     </div>
                 </div>

                 {/* Sources Section */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <h3 className="col-span-full text-sm font-bold text-slate-500 uppercase tracking-wider mt-4">Referenced Sources</h3>
                     {data.sources.map((source, idx) => (
                         <a 
                            key={idx} 
                            href={source.uri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-start gap-3 p-4 bg-white rounded-lg border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all group"
                         >
                            <div className="bg-slate-100 p-2 rounded text-slate-500 group-hover:text-emerald-600 transition-colors">
                                <ExternalLink className="w-4 h-4"/>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-slate-900 truncate group-hover:text-emerald-700">{source.title}</h4>
                                <p className="text-xs text-slate-400 truncate mt-0.5">{source.uri}</p>
                            </div>
                         </a>
                     ))}
                 </div>
             </div>
         )}
         
         {!data && !loading && !error && !companyProfile && (
             <div className="text-center py-12 text-slate-400">
                 <Building2 className="w-12 h-12 mx-auto mb-4 opacity-20"/>
                 <p>Enter a Ticker (e.g. MSFT) or Topic to generate a comprehensive market report.</p>
             </div>
         )}
       </div>
    </div>
  );
};
