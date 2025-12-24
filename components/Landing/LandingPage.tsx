import React from 'react';
import { ArrowRight, BarChart2, Bot, Database, ShieldCheck, Globe, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const onEnter = () => navigate('/app/dashboard');

  return (
    <div className="min-h-screen bg-slate-900 text-white overflow-hidden relative selection:bg-emerald-500/30">
      
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex justify-between items-center px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center text-slate-900 font-bold text-xl">
                F
            </div>
            <span className="text-xl font-bold tracking-tight">FinSight AI</span>
        </div>
        <div className="flex gap-6 text-sm font-medium text-slate-400">
            <a href="#" className="hover:text-white transition-colors">Features</a>
            <a href="#" className="hover:text-white transition-colors">Security</a>
            <a href="#" className="hover:text-white transition-colors">Pricing</a>
        </div>
        <button 
            onClick={onEnter}
            className="hidden md:flex bg-white/10 hover:bg-white/20 border border-white/10 px-4 py-2 rounded-lg text-sm font-medium transition-all backdrop-blur-sm"
        >
            Sign In
        </button>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-8 pt-20 pb-32 text-center lg:text-left lg:flex items-center justify-between gap-12">
        <div className="lg:w-1/2 space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="w-3 h-3" />
                Now with Gemini 2.0 Flash
            </div>
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight leading-tight">
                The Intelligent <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">CFO Agent</span>
            </h1>
            <p className="text-lg text-slate-400 max-w-xl leading-relaxed">
                Automate financial modeling, variance analysis, and market research with a secure, AI-powered workstation designed for modern finance teams.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button 
                    onClick={onEnter}
                    className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:-translate-y-1"
                >
                    Launch Workstation <ArrowRight className="w-5 h-5" />
                </button>
                <button className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-xl font-medium text-lg transition-all border border-slate-700">
                    Watch Demo
                </button>
            </div>

            <div className="flex items-center gap-6 pt-8 text-sm text-slate-500">
                <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-500"/> SOC2 Compliant</span>
                <span className="flex items-center gap-2"><Globe className="w-4 h-4 text-blue-500"/> Real-time Data</span>
            </div>
        </div>

        {/* Hero Visual / Dashboard Preview */}
        <div className="lg:w-1/2 mt-16 lg:mt-0 relative group">
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-blue-500/20 rounded-2xl blur-2xl group-hover:blur-3xl transition-all duration-700"></div>
            <div className="relative bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden transform group-hover:scale-[1.01] transition-transform duration-500">
                <div className="h-8 bg-slate-900 border-b border-slate-700 flex items-center px-4 gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                </div>
                <div className="p-6 grid grid-cols-2 gap-4 opacity-90">
                    {/* Fake UI elements for preview */}
                    <div className="col-span-2 h-32 bg-slate-700/50 rounded-lg animate-pulse"></div>
                    <div className="h-24 bg-slate-700/50 rounded-lg"></div>
                    <div className="h-24 bg-slate-700/50 rounded-lg"></div>
                </div>
                {/* Overlay Badge */}
                <div className="absolute bottom-6 right-6 bg-slate-900/90 backdrop-blur border border-emerald-500/30 px-4 py-2 rounded-lg flex items-center gap-3 shadow-xl">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                    <span className="text-emerald-400 font-mono text-sm">AI Agent Active</span>
                </div>
            </div>
        </div>
      </main>

      {/* Feature Grid */}
      <section className="bg-slate-950 py-24 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
                icon={<BarChart2 className="w-6 h-6 text-blue-400"/>}
                title="Automated Valuation"
                desc="Run DCF and sensitivity analysis in seconds. Auto-generate driver assumptions from historical data."
            />
            <FeatureCard 
                icon={<Bot className="w-6 h-6 text-emerald-400"/>}
                title="AI Financial Analyst"
                desc="Chat with your data. Ask 'Why did margins drop?' and get answers backed by your ERP and live market sources."
            />
            <FeatureCard 
                icon={<Database className="w-6 h-6 text-purple-400"/>}
                title="Live Data Connectors"
                desc="Seamlessly sync with QuickBooks, Xero, and SAP. No more manual CSV exports."
            />
        </div>
      </section>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }: any) => (
    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors group">
        <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            {icon}
        </div>
        <h3 className="text-xl font-bold mb-2 text-slate-100">{title}</h3>
        <p className="text-slate-400 leading-relaxed">{desc}</p>
    </div>
);