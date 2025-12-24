import React, { useState } from 'react';
import { FileText, Bot, Sparkles, AlertCircle, Quote, TrendingUp, ChevronRight, Eraser, PlayCircle } from 'lucide-react';
import { GeminiService } from '../../services/geminiService';
import ReactMarkdown from 'react-markdown';

const SAMPLE_TRANSCRIPT = `
TechNova Inc. (TNVA) Q3 2024 Earnings Call Transcript

Operator: Good afternoon, and welcome to the TechNova Q3 2024 Earnings Conference Call. Joining us today is CEO Sarah Jenks and CFO Mike Ross.

Sarah Jenks (CEO): Thank you. We are pleased to report a record quarter. Q3 revenue grew 18% year-over-year to $4.2 billion, driven by exceptional demand for our new AI infrastructure platform, NovaCore. While the broader hardware market remains soft, our enterprise software segment expanded 25%. However, we are seeing some supply chain tightness in Asia which may impact Q4 margins slightly. We remain confident in our long-term strategy.

Mike Ross (CFO): Let's look at the numbers. Gross margin came in at 62%, up 100 basis points. Operating expenses were $1.1 billion. For Q4, we are guiding revenue between $4.3 and $4.5 billion. We expect supply chain costs to impact EPS by approximately $0.05. We are also announcing a new $500 million share buyback program effective immediately.

Q&A Session:
Analyst: Can you speak to the sustainability of NovaCore growth?
Sarah Jenks: We believe this is a multi-year cycle. The shift to generative AI is just beginning.
Analyst: Are you worried about the new regulations in Europe?
Sarah Jenks: We are monitoring it closely, but we believe our privacy-first architecture positions us well.
`;

export const DocumentAnalysis: React.FC = () => {
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'sentiment' | 'risks' | 'guidance'>('summary');

  const handleAnalyze = async (type: 'summary' | 'sentiment' | 'risks' | 'guidance') => {
    if (!text.trim()) return;
    setActiveTab(type);
    setLoading(true);
    setResult('');
    
    try {
        const analysis = await GeminiService.analyzeDocument(text, type);
        setResult(analysis);
    } catch (e) {
        setResult("Error analyzing document. Please try again.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex h-full bg-slate-50 overflow-hidden">
        {/* Left Panel: Input */}
        <div className="w-1/2 flex flex-col border-r border-slate-200 bg-white p-6">
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-6 h-6 text-emerald-600" />
                    Document Intelligence
                </h1>
                <p className="text-slate-500 text-sm mt-1">
                    Paste earnings transcripts, news articles, or reports to extract insights.
                </p>
            </header>
            
            <div className="flex-1 relative">
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Paste text here..."
                    className="w-full h-full p-4 rounded-xl border border-slate-200 bg-slate-50 resize-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none font-mono text-sm leading-relaxed"
                />
                {!text && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                         <div className="text-center text-slate-400">
                             <Quote className="w-10 h-10 mx-auto mb-2 opacity-20" />
                             <p>Paste text to begin analysis</p>
                         </div>
                    </div>
                )}
            </div>

            <div className="mt-4 flex justify-between items-center">
                <button 
                    onClick={() => setText(SAMPLE_TRANSCRIPT)}
                    className="text-sm text-slate-500 hover:text-emerald-600 flex items-center gap-1 font-medium transition-colors"
                >
                    <PlayCircle className="w-4 h-4"/> Load Sample Transcript
                </button>
                <button 
                    onClick={() => setText('')}
                    className="text-sm text-slate-400 hover:text-rose-500 flex items-center gap-1 transition-colors"
                >
                    <Eraser className="w-4 h-4"/> Clear
                </button>
            </div>
        </div>

        {/* Right Panel: Analysis */}
        <div className="w-1/2 flex flex-col bg-slate-50/50 p-6">
             <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                 <TabButton active={activeTab === 'summary'} onClick={() => handleAnalyze('summary')} label="Executive Summary" icon={FileText} />
                 <TabButton active={activeTab === 'guidance'} onClick={() => handleAnalyze('guidance')} label="Extract Guidance" icon={TrendingUp} />
                 <TabButton active={activeTab === 'risks'} onClick={() => handleAnalyze('risks')} label="Risk Factors" icon={AlertCircle} />
                 <TabButton active={activeTab === 'sentiment'} onClick={() => handleAnalyze('sentiment')} label="Sentiment" icon={Sparkles} />
             </div>

             <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                 <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                     <h3 className="font-bold text-slate-700 uppercase text-xs tracking-wider flex items-center gap-2">
                        <Bot className="w-4 h-4 text-emerald-600" />
                        AI Analysis Results
                     </h3>
                     {loading && <span className="text-xs text-emerald-600 font-medium animate-pulse">Processing...</span>}
                 </div>
                 
                 <div className="flex-1 p-6 overflow-y-auto">
                     {loading ? (
                         <div className="space-y-4 animate-pulse">
                             <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                             <div className="h-4 bg-slate-100 rounded w-full"></div>
                             <div className="h-4 bg-slate-100 rounded w-5/6"></div>
                             <div className="h-20 bg-slate-100 rounded w-full mt-6"></div>
                         </div>
                     ) : result ? (
                         <div className="prose prose-slate prose-sm max-w-none">
                             <ReactMarkdown>{result}</ReactMarkdown>
                         </div>
                     ) : (
                         <div className="h-full flex flex-col items-center justify-center text-slate-400">
                             <Sparkles className="w-12 h-12 mb-4 opacity-20" />
                             <p>Select an analysis type above to generate insights.</p>
                         </div>
                     )}
                 </div>
             </div>
        </div>
    </div>
  );
};

const TabButton = ({ active, onClick, label, icon: Icon }: any) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
            active 
            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' 
            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
        }`}
    >
        <Icon className="w-4 h-4" />
        {label}
    </button>
);
