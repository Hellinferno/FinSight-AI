import React from 'react';
import { Check, X, Zap, Loader2 } from 'lucide-react';
import { useStore } from '../../store/useStore';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose }) => {
  const { setProStatus } = useStore();
  const [loading, setLoading] = React.useState(false);

  if (!isOpen) return null;

  const handleUpgrade = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
        setProStatus(true);
        setLoading(false);
        onClose();
        alert("Welcome to Pro! Premium features unlocked.");
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col md:flex-row border border-slate-200 dark:border-slate-800 relative">
        
        {/* Close Button */}
        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 z-10 p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
            <X className="w-5 h-5" />
        </button>

        {/* Left Side: Value Prop */}
        <div className="p-8 md:w-1/2 bg-slate-50 dark:bg-slate-800/50">
          <div className="uppercase tracking-wide text-sm text-emerald-600 font-bold mb-2 flex items-center gap-2">
            <Zap className="w-4 h-4 fill-emerald-600" /> FinSight Pro
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Unlock the full power of AI Finance.</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
            Stop doing manual data entry. Let our AI Agent handle your modeling, research, and variance analysis with advanced reasoning capabilities.
          </p>
          <div className="space-y-4">
             <FeatureItem text="Unlimited AI Analyst Chats" />
             <FeatureItem text="Export Models to CSV & PDF" />
             <FeatureItem text="Chat with PDF Documents (Long Context)" />
             <FeatureItem text="Real-time Data Connectors" />
          </div>
        </div>

        {/* Right Side: Pricing */}
        <div className="p-8 md:w-1/2 flex flex-col justify-center items-center bg-white dark:bg-slate-900">
           <div className="text-center mb-6">
             <div className="flex items-start justify-center">
                <span className="text-3xl font-medium text-slate-400 mt-2">$</span>
                <span className="text-6xl font-extrabold text-slate-900 dark:text-white">49</span>
             </div>
             <span className="text-slate-500 text-lg font-medium">per month</span>
           </div>
           
           <div className="w-full max-w-xs space-y-4">
               <button 
                   onClick={handleUpgrade}
                   disabled={loading}
                   className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transform transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
               >
                   {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 fill-current" />} 
                   {loading ? 'Upgrading...' : 'Upgrade to Pro'}
               </button>
               <p className="text-center text-slate-400 text-xs">Cancel anytime. 7-day free trial included.</p>
           </div>
        </div>
      </div>
    </div>
  );
};

const FeatureItem = ({ text }: { text: string }) => (
    <div className="flex items-center gap-3">
        <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
            <Check className="w-3.5 h-3.5" />
        </div>
        <span className="text-slate-700 dark:text-slate-300 font-medium">{text}</span>
    </div>
);