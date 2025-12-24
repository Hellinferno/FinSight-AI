import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileText, Bot, Sparkles, AlertCircle, TrendingUp, Eraser, UploadCloud, Loader2 } from 'lucide-react';
import { GeminiService } from '../../services/geminiService';
import { extractTextFromPDF } from '../../utils/pdfUtils';
import ReactMarkdown from 'react-markdown';

export const DocumentAnalysis: React.FC = () => {
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [processingFile, setProcessingFile] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'sentiment' | 'risks' | 'guidance'>('summary');

  // Dropzone Handler
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setProcessingFile(true);
    try {
        if (file.type === 'application/pdf') {
            const extractedText = await extractTextFromPDF(file);
            setText(extractedText);
        } else {
            // Fallback for text files
            const text = await file.text();
            setText(text);
        }
    } catch (err) {
        alert("Failed to parse file. Please upload a valid PDF or Text file.");
    } finally {
        setProcessingFile(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: { 
        'application/pdf': ['.pdf'], 
        'text/plain': ['.txt', '.md', '.csv'] 
    },
    multiple: false
  });

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
                    Upload Earnings Calls (PDF), 10-K reports, or transcripts.
                </p>
            </header>
            
            {/* The Drop Zone Area */}
            <div className="flex-1 flex flex-col gap-4 min-h-0">
                {!text ? (
                    <div 
                        {...getRootProps()} 
                        className={`flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                            isDragActive ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 hover:border-emerald-400 hover:bg-slate-50'
                        }`}
                    >
                        <input {...getInputProps()} />
                        {processingFile ? (
                            <div className="text-center">
                                <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto mb-4" />
                                <p className="text-slate-600 font-medium">Extracting text from PDF...</p>
                            </div>
                        ) : (
                            <div className="text-center p-8">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <UploadCloud className="w-8 h-8 text-slate-400" />
                                </div>
                                <p className="text-lg font-semibold text-slate-700">Click to upload or drag & drop</p>
                                <p className="text-sm text-slate-500 mt-2">PDF or TXT files supported</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex-1 relative">
                         <div className="absolute top-2 right-2 z-10">
                            <button 
                                onClick={() => setText('')} 
                                className="bg-slate-800 text-white text-xs px-3 py-1.5 rounded-full hover:bg-rose-600 transition-colors shadow-sm flex items-center gap-1"
                            >
                                <Eraser className="w-3 h-3" /> Clear & Upload New
                            </button>
                         </div>
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            className="w-full h-full p-4 rounded-xl border border-slate-200 bg-slate-50 resize-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none font-mono text-xs leading-relaxed"
                        />
                    </div>
                )}
            </div>
        </div>

        {/* Right Panel: Analysis */}
        <div className="w-1/2 flex flex-col bg-slate-50/50 p-6">
             <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
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
                     {loading && <span className="text-xs text-emerald-600 font-medium animate-pulse">Processing 50+ pages...</span>}
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
                             <p>Upload a document and select an analysis type.</p>
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
