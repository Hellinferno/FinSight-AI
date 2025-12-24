import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, Database } from 'lucide-react';
import { GeminiService } from '../../services/geminiService';
import { FmpService } from '../../services/fmpService';
import { ChatMessage } from '../../types';
import ReactMarkdown from 'react-markdown';

export const AIAnalyst: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
        id: '1',
        role: 'model',
        text: 'I am your Financial Agent. I can fetch real-time data for any public company. Try "Check AAPL price" or "Analyze Microsoft".',
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
        
        // 1. Ask Gemini (It decides if it needs a tool)
        const response: any = await GeminiService.startFinancialChat(history, userMsg.text);

        if (response.type === 'TOOL_CALL' && response.functionName === 'get_realtime_stock_data') {
            let ticker = (response.args as any).ticker;
            setAgentAction(`Fetching data for "${ticker}"...`);

            try {
                // STRATEGY: Try Direct Ticker -> If Fail -> Fuzzy Search
                let profile = await FmpService.getCompanyProfile(ticker).catch(() => []);
                let wasTypo = false;

                // If direct lookup failed (empty array), assume it's a name or typo
                if (!profile || profile.length === 0) {
                     setAgentAction(`"${ticker}" not found. Auto-correcting...`);
                     const searchResults = await FmpService.searchTicker(ticker).catch(() => []);
                     
                     if (searchResults && searchResults.length > 0) {
                         // We found a match! (e.g. "Goggle" -> "GOOGL")
                         ticker = searchResults[0].symbol; 
                         wasTypo = true;
                         setAgentAction(`Resolved to ${ticker}. Fetching data...`);
                         // Now fetch the REAL data using the correct symbol
                         profile = await FmpService.getCompanyProfile(ticker);
                     }
                }

                // If we STILL have no profile, give up
                if (!profile || profile.length === 0) {
                    throw new Error("Stock not found. Please check the ticker or company name.");
                }

                // Fetch Financials
                const financials = await FmpService.getIncomeStatement(ticker, 1).catch(() => []);

                const toolData = {
                    status: "success",
                    note: wasTypo ? `User searched for name/typo. Auto-resolved to ${ticker}.` : "Direct ticker match.",
                    profile: profile[0],
                    financials: financials[0] || "Not available"
                };

                // 3. Send Data back to Gemini for final answer
                const finalAnswer = await GeminiService.sendToolResultToChat(history, 'get_realtime_stock_data', toolData);
                
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    role: 'model',
                    text: finalAnswer || "I retrieved the data but couldn't generate a summary.",
                    timestamp: new Date()
                }]);

            } catch (err: any) {
                const errorMsg = err.message || "Failed to fetch stock data.";
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    role: 'model',
                    text: `I couldn't find data for that company. ${errorMsg}`,
                    timestamp: new Date(),
                    isError: true
                }]);
            }
        } else {
            // Standard Text Response
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'model',
                text: response.text || "I didn't understand that.",
                timestamp: new Date()
            }]);
        }
    } catch (error: any) {
        console.error(error);
        const errorMessage = error?.message || "System Error: Please check API configurations.";
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'model',
            text: errorMessage,
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
            AI Analyst
            <span className="text-xs font-normal text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Database className="w-3 h-3"/> Agent Active
            </span>
        </h1>
      </header>
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        {messages.map((msg, index) => (
            <div key={msg.id} className={`flex gap-4 max-w-4xl mx-auto ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${
                    msg.role === 'user' ? 'bg-slate-200 text-slate-600' : 'bg-emerald-600 text-white'
                }`}>
                    {msg.role === 'user' ? <User className="w-5 h-5"/> : <Bot className="w-5 h-5"/>}
                </div>
                <div className={`flex flex-col max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`px-6 py-4 rounded-2xl shadow-sm text-sm leading-relaxed prose prose-sm ${
                        msg.role === 'user' 
                        ? 'bg-slate-800 text-slate-100 rounded-tr-none' 
                        : msg.isError 
                            ? 'bg-rose-50 text-rose-800 border border-rose-200 rounded-tl-none'
                            : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                    }`}>
                        {msg.role === 'model' && index === messages.length - 1 && !loading ? (
                            <Typewriter text={msg.text} />
                        ) : (
                            <ReactMarkdown>{msg.text}</ReactMarkdown>
                        )}
                    </div>
                    <span className="text-xs text-slate-400 mt-2 px-1">
                        {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
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
                 <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex-shrink-0 flex items-center justify-center">
                    <Bot className="w-5 h-5"/>
                </div>
                <div className="bg-white border border-slate-200 px-6 py-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                    <span className="text-sm text-slate-500">Thinking</span>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-400"/>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-6 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSend} className="relative">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Try: 'Analyze NVDA stock' or 'Compare AAPL and MSFT'"
                    className="w-full pl-6 pr-14 py-4 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                />
                <button 
                    type="submit" 
                    disabled={!input.trim() || loading}
                    className="absolute right-3 top-3 p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-600 transition-colors"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : <Send className="w-5 h-5" />}
                </button>
            </form>
            <p className="text-center text-xs text-slate-400 mt-3">
                AI may produce inaccurate information. Data provided by FMP API.
            </p>
        </div>
      </div>
    </div>
  );
};

// Improved Typewriter Component
const Typewriter: React.FC<{ text: string; onComplete?: () => void }> = ({ text, onComplete }) => {
    const [displayedText, setDisplayedText] = useState('');
    const indexRef = useRef(0); // Use Ref to track index without triggering re-renders

    useEffect(() => {
        // Reset if text changes
        setDisplayedText('');
        indexRef.current = 0;

        const timer = setInterval(() => {
            // Calculate next index
            const currentIndex = indexRef.current;
            
            if (currentIndex < text.length) {
                // Append next character safely
                setDisplayedText((prev) => prev + text.charAt(currentIndex));
                indexRef.current += 1;
            } else {
                clearInterval(timer);
                if (onComplete) onComplete();
            }
        }, 15); // Slightly slower (15ms) for smoother effect

        return () => clearInterval(timer); // Cleanup prevents "ghost" typing
    }, [text]); // Only restart if the full text changes

    return <ReactMarkdown>{displayedText}</ReactMarkdown>;
};