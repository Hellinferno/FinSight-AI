import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileText, Send, Bot, Loader2, UploadCloud, Eraser, User } from 'lucide-react';
import { GeminiService } from '../../services/geminiService';
import { extractTextFromPDF } from '../../utils/pdfUtils';
import ReactMarkdown from 'react-markdown';
import { useStore } from '../../store/useStore';
import { PricingModal } from '../Subscription/PricingModal';

export const DocumentAnalysis: React.FC = () => {
  const { isPro } = useStore();
  const [showUpgrade, setShowUpgrade] = useState(false);
  
  const [fileContent, setFileContent] = useState('');
  const [messages, setMessages] = useState<{role: string, text: string}[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [processingFile, setProcessingFile] = useState(false);

  // Dropzone Handler
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setProcessingFile(true);
    try {
        if (file.type === 'application/pdf') {
            const extractedText = await extractTextFromPDF(file);
            setFileContent(extractedText);
        } else {
            // Fallback for text files
            const text = await file.text();
            setFileContent(text);
        }
        // Reset chat on new file
        setMessages([{
            role: 'model',
            text: `I've analyzed **${file.name}**. I'm ready to answer questions about revenue, risk factors, or financial guidance found in the document.`
        }]);
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

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    
    // PAYWALL CHECK: Free users get 2 messages per document
    if (!isPro && messages.filter(m => m.role === 'user').length >= 2) {
        setShowUpgrade(true);
        return;
    }

    const userMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
        // We pass the ENTIRE document context + history + new question
        // This is "Long Context Chat"
        const contextPrompt = `
          DOCUMENT CONTEXT:
          ${fileContent.substring(0, 500000)} 
          
          CHAT HISTORY:
          ${JSON.stringify(messages.slice(-5))}
          
          USER QUESTION:
          ${userMsg.text}
          
          Answer as a financial analyst referencing the document above. Be specific and cite numbers where possible.
        `;
        
        const response = await GeminiService.generateReport(contextPrompt); // Re-using generate method for simplicity
        setMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (err) {
        setMessages(prev => [...prev, { role: 'model', text: "Error analyzing document context." }]);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
       <PricingModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />
       
       {/* Left: Document Viewer (Simplified/Preview) */}
       <div className="hidden md:flex w-1/3 border-r border-slate-200 bg-white p-6 flex-col">
          <header className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-6 h-6 text-emerald-600" />
                    Doc Intelligence
                </h1>
                <p className="text-slate-500 text-sm mt-1">
                    Chat with Earnings Calls (PDF), 10-K reports, or transcripts using Gemini 1.5 Pro Long Context.
                </p>
            </header>

          <div className="flex-1 bg-slate-50 rounded-xl border border-slate-200 p-4 overflow-y-auto">
             <h3 className="font-bold text-xs uppercase text-slate-400 mb-2 sticky top-0 bg-slate-50 pb-2">Extracted Context Preview</h3>
             <div className="text-xs text-slate-500 font-mono whitespace-pre-wrap leading-relaxed">
                {fileContent ? fileContent.substring(0, 3000) + "..." : "No document loaded. Upload a file to see preview."}
             </div>
          </div>
          
          {fileContent && (
             <button 
                onClick={() => { setFileContent(''); setMessages([]); }}
                className="mt-4 flex items-center justify-center gap-2 text-sm text-rose-600 hover:bg-rose-50 p-2 rounded-lg transition-colors"
             >
                <Eraser className="w-4 h-4"/> Clear Document
             </button>
          )}
       </div>

       {/* Right: Chat Interface */}
       <div className="flex-1 flex flex-col relative bg-slate-50/50">
          {!fileContent ? (
             <div className="flex-1 flex flex-col items-center justify-center p-8">
                <div 
                    {...getRootProps()} 
                    className={`max-w-xl w-full border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all p-12 ${
                        isDragActive ? 'border-emerald-500 bg-emerald-50 scale-105' : 'border-slate-300 hover:border-emerald-400 hover:bg-white'
                    }`}
                >
                    <input {...getInputProps()} />
                    {processingFile ? (
                        <div className="text-center">
                            <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
                            <p className="text-slate-800 font-bold text-lg">Extracting Data...</p>
                            <p className="text-slate-500 text-sm">Processing PDF layout and text</p>
                        </div>
                    ) : (
                        <div className="text-center">
                            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <UploadCloud className="w-10 h-10 text-emerald-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-800 mb-2">Upload Financial Document</h3>
                            <p className="text-slate-500 mb-6">Drag & drop PDF, TXT, or CSV files here</p>
                            <button className="bg-slate-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-slate-800 transition-colors">
                                Browse Files
                            </button>
                        </div>
                    )}
                </div>
             </div>
          ) : (
             <>
               <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {messages.map((m, i) => (
                      <div key={i} className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''} max-w-3xl mx-auto w-full`}>
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${m.role === 'user' ? 'bg-slate-200' : 'bg-emerald-600 text-white'}`}>
                             {m.role === 'user' ? <User className="w-4 h-4 text-slate-600"/> : <Bot className="w-4 h-4"/>}
                         </div>
                         <div className={`p-5 rounded-2xl shadow-sm leading-relaxed text-sm ${
                             m.role === 'user' 
                             ? 'bg-slate-800 text-white rounded-tr-none' 
                             : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                         }`}>
                             <ReactMarkdown>{m.text}</ReactMarkdown>
                         </div>
                      </div>
                  ))}
                  {loading && (
                      <div className="flex gap-4 max-w-3xl mx-auto w-full">
                          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0"><Bot className="w-4 h-4"/></div>
                          <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-2 shadow-sm">
                             <span className="text-sm text-slate-500">Analyzing document context...</span>
                             <Loader2 className="w-4 h-4 animate-spin text-emerald-500"/>
                          </div>
                      </div>
                  )}
               </div>

               <div className="p-4 bg-white border-t border-slate-200">
                  <div className="max-w-3xl mx-auto relative">
                      <form onSubmit={handleChat}>
                        <input 
                            value={input} 
                            onChange={e => setInput(e.target.value)}
                            placeholder={isPro ? "Ask about revenue, risks, or guidance..." : "Ask a question (2 free messages remaining)..."}
                            disabled={loading}
                            className="w-full pl-6 pr-14 py-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none shadow-sm text-slate-800 placeholder-slate-400 bg-slate-50 focus:bg-white transition-all"
                        />
                        <button 
                            type="submit" 
                            disabled={!input.trim() || loading}
                            className="absolute right-2 top-2 p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                      </form>
                  </div>
               </div>
             </>
          )}
       </div>
    </div>
  );
};