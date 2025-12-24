import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, Sparkles, Database } from 'lucide-react';
import { GeminiService } from '../../services/geminiService';
import { FmpService } from '../../services/fmpService';
import { ChatMessage } from '../../types';
import ReactMarkdown from 'react-markdown';

export const AIAnalyst: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
        id: '1',
        role: 'model',
        text: 'Hello, I am your Financial Analyst Assistant. I have access to real-time market data. Ask me about stock prices, company profiles, or general financial concepts.',
        timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [agentAction, setAgentAction] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, agentAction]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        text: input,
        timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setAgentAction(null);

    try {
        // --- AGENTIC LAYER: Detect Ticker & Fetch Data ---
        let contextInjection = "";
        
        // Simple regex to find potential tickers (e.g. AAPL, MSFT) - 1 to 5 uppercase letters
        // We use a simplified heuristic here for the demo.
        const potentialTickers = userMsg.text.match(/\b[A-Z]{2,5}\b/g);

        if (potentialTickers && potentialTickers.length > 0) {
            const ticker = potentialTickers[0]; // Take the first one found
            setAgentAction(`Fetching real-time data for ${ticker}...`);
            
            try {
                // Fetch Profile and Financials
                const [profile, financials] = await Promise.all([
                     FmpService.getCompanyProfile(ticker).catch(() => []),
                     FmpService.getIncomeStatement(ticker, 1).catch(() => [])
                ]);

                if (profile.length > 0) {
                    const p = profile[0];
                    const f = financials.length > 0 ? financials[0] : null;
                    
                    contextInjection = `
                    [SYSTEM DATA INJECTION]
                    The user is asking about ${ticker}. Here is the real-time data from FMP API:
                    - Price: $${p.price}
                    - Market Cap: $${p.mktCap}
                    - Beta: ${p.beta}
                    - CEO: ${p.ceo}
                    - Description: ${p.description}
                    - Industry: ${p.industry}
                    ${f ? `- Last Reported Revenue: ${f.revenue}` : ''}
                    ${f ? `- Last Reported Net Income: ${f.netIncome}` : ''}
                    
                    Use this data to answer the user's question accurately.
                    [/SYSTEM DATA INJECTION]
                    `;
                }
            } catch (err) {
                console.warn("Agent failed to fetch data", err);
            }
        }
        // ------------------------------------------------

        // Convert internal message format to history format for service
        // Append context injection to the last user message for the LLM
        const history = messages.map(m => ({ role: m.role, text: m.text }));
        
        // Pass the modified prompt with data injection to Gemini
        const finalPrompt = contextInjection ? `${userMsg.text}\n\n${contextInjection}` : userMsg.text;

        const responseText = await GeminiService.analyzeFinancialQuery(history, finalPrompt);

        const botMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: responseText,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, botMsg]);
    } catch (error) {
        const errorMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: "I encountered an error connecting to the analysis engine. Please try again.",
            timestamp: new Date(),
            isError: true
        };
        setMessages(prev => [...prev, errorMsg]);
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
                <Sparkles className="w-3 h-3"/> Agentic Mode
            </span>
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        {messages.map((msg) => (
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
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
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
                 <div className="w-10 flex-shrink-0"></div> {/* Spacer */}
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
                    <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                    </div>
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
                    placeholder="Try: 'What is the current price of AAPL?' or 'Explain EBITDA'"
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
