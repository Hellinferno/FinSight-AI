import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, Database, AlertTriangle } from 'lucide-react';
import { GeminiService } from '../../services/geminiService';
import { FmpService } from '../../services/fmpService';
import { ChatMessage } from '../../types';
import ReactMarkdown from 'react-markdown';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useStore } from '../../store/useStore';
import { PricingModal } from '../Subscription/PricingModal';

export const AIAnalyst: React.FC = () => {
  const { isPro } = useStore();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
        id: '1',
        role: 'model',
        text: 'I can analyze stocks (AAPL) or compare companies. Try "Compare Apple and Microsoft revenue".',
        timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [agentAction, setAgentAction] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, agentAction]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    // PAYWALL CHECK: 5 messages limit for free
    if (!isPro && messages.filter(m => m.role === 'user').length >= 5) {
        setShowUpgrade(true);
        return;
    }

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
        const history = messages.map(m => ({ role: m.role, text: m.text }));
        
        // Create a placeholder message for the streaming response
        const responseId = Date.now().toString();
        setMessages(prev => [...prev, { id: responseId, role: 'model', text: '', timestamp: new Date() }]);

        const streamIterator = GeminiService.streamFinancialChat(history, userMsg.text);
        
        let fullText = '';
        let functionCallFound = false;
        let functionCallData: any = null;

        for await (const chunk of streamIterator) {
            // Check for Function Calls first
            const fc = chunk.functionCalls?.[0];
            if (fc) {
                functionCallFound = true;
                functionCallData = fc;
                break; // Stop streaming text if we got a tool call
            }

            const textChunk = chunk.text;
            if (textChunk) {
                fullText += textChunk;
                setMessages(prev => prev.map(m => m.id === responseId ? { ...m, text: fullText } : m));
            }
        }

        // Handle Tool Call if found
        if (functionCallFound && functionCallData) {
            const call = functionCallData;
            
            // --- TOOL 1: SINGLE STOCK ---
            if (call.name === 'get_realtime_stock_data') {
                const ticker = (call.args as any).ticker;
                setAgentAction(`Analyzing ${ticker}...`);
                
                let profile = await FmpService.getCompanyProfile(ticker).catch(() => []);
                if (!profile.length) {
                     const search = await FmpService.searchTicker(ticker);
                     if (search.length) { 
                        profile = await FmpService.getCompanyProfile(search[0].symbol).catch(() => []);
                     }
                }
                const financials = await FmpService.getIncomeStatement(profile[0]?.symbol || ticker, 1).catch(() => []);
                
                const toolData = { profile: profile[0], financials: financials[0] };
                const finalAnswer = await GeminiService.sendToolResultToChat(history, 'get_realtime_stock_data', toolData);
                
                setMessages(prev => prev.map(m => m.id === responseId ? { ...m, text: finalAnswer } : m));

            // --- TOOL 2: COMPARISON ---
            } else if (call.name === 'compare_companies') {
                const tickers = (call.args as any).tickers || [];
                setAgentAction(`Comparing ${tickers.join(', ')}...`);

                const results = await Promise.all(tickers.map(async (t: string) => {
                    let symbol = t;
                    const search = await FmpService.searchTicker(t);
                    if (search.length) symbol = search[0].symbol;
                    const financials = await FmpService.getIncomeStatement(symbol, 5).catch(() => []);
                    return { symbol, financials: financials.reverse() };
                }));

                const chartData: any[] = [];
                if (results.length > 0 && results[0].financials.length > 0) {
                    results[0].financials.forEach((f:any, index:number) => {
                        const dataPoint: any = { year: f.calendarYear };
                        results.forEach(r => {
                            if (r.financials[index]) dataPoint[r.symbol] = r.financials[index].revenue;
                        });
                        chartData.push(dataPoint);
                    });
                }

                const toolOutput = { comparison_data: chartData, note: "Revenue in USD" };
                const finalAnswer = await GeminiService.sendToolResultToChat(history, 'compare_companies', toolOutput);

                setMessages(prev => prev.map(m => m.id === responseId ? { 
                    ...m, 
                    text: finalAnswer, 
                    visualData: { type: 'bar', data: chartData, keys: results.map(r => r.symbol) } 
                } : m));
            }
        }

    } catch (error: any) {
        console.error("Chat Error:", error);
        setMessages(prev => [...prev, {
            id: Date.now().toString(), role: 'model', text: "Analysis failed. Please try again.", timestamp: new Date(), isError: true
        }]);
    } finally {
        setLoading(false);
        setAgentAction(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 relative transition-colors duration-300">
      <PricingModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />
      
      <header className="px-8 py-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            AI Analyst <span className="text-xs font-normal text-emerald-700 bg-emerald-100 dark:bg-emerald-900 dark:text-emerald-300 px-2 py-0.5 rounded-full">Agent Active</span>
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-4 max-w-4xl mx-auto ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${
                    msg.isError ? 'bg-rose-100 text-rose-600' : 
                    msg.role === 'user' ? 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300' : 'bg-emerald-600 text-white'
                }`}>
                    {msg.isError ? <AlertTriangle className="w-5 h-5"/> : (msg.role === 'user' ? <User className="w-5 h-5"/> : <Bot className="w-5 h-5"/>)}
                </div>
                
                <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`px-6 py-4 rounded-2xl shadow-sm text-sm leading-relaxed ${
                        msg.isError ? 'bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200' :
                        msg.role === 'user' ? 'bg-slate-800 text-white rounded-tr-none' : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-tl-none'
                    }`}>
                        <ReactMarkdown>{msg.text}</ReactMarkdown>

                        {msg.visualData && msg.visualData.type === 'bar' && (
                            <div className="mt-4 h-64 w-full min-w-[300px] bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={msg.visualData.data}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                                        <XAxis dataKey="year" fontSize={12} tickLine={false} axisLine={false} stroke="#94a3b8" />
                                        <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${(val/1e9).toFixed(0)}B`} stroke="#94a3b8" />
                                        <Tooltip 
                                            contentStyle={{borderRadius: '8px', border: 'none', backgroundColor: '#1e293b', color: '#fff'}}
                                            formatter={(val: number) => [`$${(val/1e9).toFixed(1)}B`, 'Revenue']}
                                        />
                                        <Legend />
                                        {msg.visualData.keys.map((key, idx) => (
                                            <Bar key={key} dataKey={key} fill={['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'][idx % 4]} radius={[4, 4, 0, 0]} />
                                        ))}
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        ))}
        
        {agentAction && (
             <div className="flex gap-4 max-w-4xl mx-auto items-center animate-fadeIn">
                 <div className="w-10 flex-shrink-0"></div>
                 <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-800">
                     <Database className="w-3 h-3 animate-pulse" />
                     {agentAction}
                 </div>
             </div>
        )}

        {loading && !agentAction && messages[messages.length - 1].role === 'user' && (
            <div className="flex gap-4 max-w-4xl mx-auto">
                 <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex-shrink-0 flex items-center justify-center"><Bot className="w-5 h-5"/></div>
                 <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-6 py-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Thinking</span>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-400"/>
                 </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-6 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto relative">
            <form onSubmit={handleSend} className="relative">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={isPro ? "Try: 'Compare Apple and Microsoft' or 'Analyze NVDA'" : "Try: 'Compare Apple and Microsoft' (5 free messages left)"}
                    className="w-full pl-6 pr-14 py-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
                <button type="submit" disabled={!input.trim() || loading} className="absolute right-3 top-3 p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : <Send className="w-5 h-5" />}
                </button>
            </form>
        </div>
      </div>
    </div>
  );
};