import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, Database, BarChart3, AlertTriangle } from 'lucide-react';
import { GeminiService } from '../../services/geminiService';
import { FmpService } from '../../services/fmpService';
import { ChatMessage } from '../../types';
import ReactMarkdown from 'react-markdown';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Improved Typewriter Component
// Uses slice approach to guarantee deterministic rendering and avoid race conditions
// This fixes the "Ican aaayyee" stuttering bug.
const Typewriter: React.FC<{ text: string; onComplete?: () => void }> = ({ text, onComplete }) => {
    const [displayedText, setDisplayedText] = useState('');
    const indexRef = useRef(0);
    const onCompleteRef = useRef(onComplete);

    // Keep ref updated to avoid restarting effect when callback changes
    useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);

    useEffect(() => {
        // Reset state when text changes to ensure clean typing
        setDisplayedText('');
        indexRef.current = 0;
        
        if (!text) return;

        const timer = setInterval(() => {
            if (indexRef.current < text.length) {
                // Use slice to strictly render from 0 to current index
                setDisplayedText(text.slice(0, indexRef.current + 1));
                indexRef.current += 1;
            } else {
                clearInterval(timer);
                if (onCompleteRef.current) onCompleteRef.current();
            }
        }, 15); // 15ms speed
        
        return () => clearInterval(timer);
    }, [text]);

    return <ReactMarkdown>{displayedText}</ReactMarkdown>;
};

export const AIAnalyst: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
        id: '1',
        role: 'model',
        text: 'I can analyze single stocks or compare companies. Try "Compare Apple and Microsoft revenue" or "Analyze NVDA".',
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

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
        const history = messages.map(m => ({ role: m.role, text: m.text }));
        
        // 1. Ask Gemini
        const response = await GeminiService.startFinancialChat(history, userMsg.text);

        if (response.type === 'TOOL_CALL') {
            
            // --- TOOL 1: SINGLE STOCK ---
            if (response.functionName === 'get_realtime_stock_data') {
                let ticker = (response.args as any).ticker;
                setAgentAction(`Analyzing ${ticker}...`);
                
                // (Existing single stock logic - simplified for brevity)
                let profile = await FmpService.getCompanyProfile(ticker).catch(() => []);
                if (!profile.length) {
                    const search = await FmpService.searchTicker(ticker);
                    if (search.length) { ticker = search[0].symbol; profile = await FmpService.getCompanyProfile(ticker); }
                }
                const financials = await FmpService.getIncomeStatement(ticker, 1);
                
                const toolData = { profile: profile[0], financials: financials[0] };
                const finalAnswer = await GeminiService.sendToolResultToChat(history, 'get_realtime_stock_data', toolData);
                
                setMessages(prev => [...prev, {
                    id: Date.now().toString(), role: 'model', text: finalAnswer, timestamp: new Date()
                }]);

            // --- TOOL 2: COMPARISON (NEW!) ---
            } else if (response.functionName === 'compare_companies') {
                const tickers = (response.args as any).tickers || [];
                setAgentAction(`Comparing ${tickers.join(', ')}...`);

                // A. Fetch Data for ALL companies in parallel
                const results = await Promise.all(tickers.map(async (t: string) => {
                    let symbol = t;
                    const search = await FmpService.searchTicker(t);
                    if (search.length) symbol = search[0].symbol;
                    const financials = await FmpService.getIncomeStatement(symbol, 5);
                    return { symbol, financials: financials.reverse() }; // Oldest to Newest
                }));

                // B. Format Data for Chart (Merge by Year)
                const chartData: any[] = [];
                if (results.length > 0 && results[0].financials.length > 0) {
                    // Use first company's years as baseline
                    results[0].financials.forEach((f, index) => {
                        const dataPoint: any = { year: f.calendarYear };
                        results.forEach(r => {
                            // Safe check if data exists for this year
                            if (r.financials[index]) {
                                dataPoint[r.symbol] = r.financials[index].revenue;
                            }
                        });
                        chartData.push(dataPoint);
                    });
                }

                // C. Send Data to Gemini for Text Summary
                const toolOutput = { comparison_data: chartData, note: "Revenue in USD" };
                const finalAnswer = await GeminiService.sendToolResultToChat(history, 'compare_companies', toolOutput);

                // D. Add Message with CHART DATA
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    role: 'model',
                    text: finalAnswer,
                    timestamp: new Date(),
                    visualData: { 
                        type: 'bar', 
                        data: chartData, 
                        keys: results.map(r => r.symbol) 
                    }
                }]);
            }

        } else {
            // Text only response
            setMessages(prev => [...prev, {
                id: Date.now().toString(), role: 'model', text: response.text, timestamp: new Date()
            }]);
        }

    } catch (error: any) {
        console.error("Chat Error:", error);
        setMessages(prev => [...prev, {
            id: Date.now().toString(), 
            role: 'model', 
            text: `Analysis failed: ${error.message || 'Unknown error'}. Please try a different query or check your API configuration.`, 
            timestamp: new Date(), 
            isError: true
        }]);
    } finally {
        setLoading(false);
        setAgentAction(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      <header className="px-8 py-6 border-b border-slate-200 bg-white">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            AI Analyst <span className="text-xs font-normal text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Agent Active</span>
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-4 max-w-4xl mx-auto ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${
                    msg.isError ? 'bg-rose-100 text-rose-600' : 
                    msg.role === 'user' ? 'bg-slate-200 text-slate-600' : 'bg-emerald-600 text-white'
                }`}>
                    {msg.isError ? <AlertTriangle className="w-5 h-5"/> : (msg.role === 'user' ? <User className="w-5 h-5"/> : <Bot className="w-5 h-5"/>)}
                </div>
                
                <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`px-6 py-4 rounded-2xl shadow-sm text-sm leading-relaxed ${
                        msg.isError ? 'bg-rose-50 border border-rose-200 text-rose-800' :
                        msg.role === 'user' ? 'bg-slate-800 text-white rounded-tr-none' : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                    }`}>
                        {/* 1. TEXT CONTENT */}
                        {msg.role === 'model' && msg.id === messages[messages.length - 1].id && !loading && !msg.isError ? (
                            <Typewriter text={msg.text} />
                        ) : (
                            <ReactMarkdown>{msg.text}</ReactMarkdown>
                        )}

                        {/* 2. CHART CONTENT */}
                        {msg.visualData && msg.visualData.type === 'bar' && (
                            <div className="mt-4 h-64 w-full min-w-[300px] bg-slate-50 p-2 rounded-xl border border-slate-100">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={msg.visualData.data}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="year" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${(val/1e9).toFixed(0)}B`} />
                                        <Tooltip 
                                            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                            formatter={(val: number) => [`$${(val/1e9).toFixed(1)}B`, 'Revenue']}
                                        />
                                        <Legend />
                                        {msg.visualData.keys.map((key, idx) => (
                                            <Bar 
                                                key={key} 
                                                dataKey={key} 
                                                fill={['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'][idx % 4]} 
                                                radius={[4, 4, 0, 0]} 
                                            />
                                        ))}
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        ))}
        
        {/* Agent Action Indicator */}
        {agentAction && (
             <div className="flex gap-4 max-w-4xl mx-auto items-center animate-fadeIn">
                 <div className="w-10 flex-shrink-0"></div>
                 <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                     <Database className="w-3 h-3 animate-pulse" />
                     {agentAction}
                 </div>
             </div>
        )}

        {loading && !agentAction && (
            <div className="flex gap-4 max-w-4xl mx-auto">
                 <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex-shrink-0 flex items-center justify-center"><Bot className="w-5 h-5"/></div>
                 <div className="bg-white border border-slate-200 px-6 py-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                    <span className="text-sm text-slate-500">Thinking</span>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-400"/>
                 </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-6 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto relative">
            <form onSubmit={handleSend} className="relative">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Try: 'Compare Apple and Microsoft' or 'Analyze NVDA'"
                    className="w-full pl-6 pr-14 py-4 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
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