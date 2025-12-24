import React, { useState } from 'react';
import { Database, RefreshCw, CheckCircle2, AlertTriangle, Calendar, Settings, Server, ArrowRight, Plus, X } from 'lucide-react';
import { DataConnector } from '../../types';

export const DataConnectors: React.FC = () => {
  const [connectors, setConnectors] = useState<DataConnector[]>([
    { id: '1', name: 'SAP S/4HANA', type: 'ERP', status: 'connected', lastSync: 'Today 04:00 AM', schedule: 'Daily' },
    { id: '2', name: 'Oracle NetSuite', type: 'ERP', status: 'connected', lastSync: 'Today 05:30 AM', schedule: 'Daily' },
    { id: '3', name: 'QuickBooks Online', type: 'Accounting', status: 'error', lastSync: 'Yesterday 11:00 PM', schedule: 'Weekly' },
    { id: '4', name: 'Chase Commercial', type: 'Bank', status: 'disconnected', lastSync: 'Never', schedule: 'Manual' },
  ]);

  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newConnectorName, setNewConnectorName] = useState('');
  const [newConnectorType, setNewConnectorType] = useState<'ERP' | 'Accounting' | 'Bank'>('ERP');

  const handleSync = (id: string) => {
    setSyncingId(id);
    // Simulate process
    setTimeout(() => {
      setConnectors(prev => prev.map(c => {
        if (c.id === id) {
          return { ...c, status: 'connected', lastSync: 'Just now' };
        }
        return c;
      }));
      setSyncingId(null);
    }, 2500);
  };

  const handleAddConnector = (e: React.FormEvent) => {
    e.preventDefault();
    if(!newConnectorName) return;

    const newConnector: DataConnector = {
        id: Date.now().toString(),
        name: newConnectorName,
        type: newConnectorType,
        status: 'disconnected',
        lastSync: 'Never',
        schedule: 'Manual'
    };
    
    setConnectors([...connectors, newConnector]);
    setShowAddModal(false);
    setNewConnectorName('');
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-50 relative">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
          <Database className="w-8 h-8 text-emerald-600" />
          Data Integration Hub
        </h1>
        <p className="text-slate-500 mt-1">
          Automated extraction, cleaning, and standardization pipelines for financial data sources.
        </p>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {connectors.map((connector) => (
          <div key={connector.id} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all animate-fadeIn">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    connector.type === 'ERP' ? 'bg-blue-100 text-blue-600' :
                    connector.type === 'Accounting' ? 'bg-green-100 text-green-600' :
                    'bg-purple-100 text-purple-600'
                }`}>
                    <Server className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{connector.name}</h3>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                    {connector.type}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                 {connector.status === 'connected' && <span className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded"><CheckCircle2 className="w-3 h-3 mr-1"/> Active</span>}
                 {connector.status === 'error' && <span className="flex items-center text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded"><AlertTriangle className="w-3 h-3 mr-1"/> Error</span>}
                 {connector.status === 'disconnected' && <span className="flex items-center text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">Inactive</span>}
              </div>
            </div>

            <div className="space-y-4 mb-6">
                {/* Pipeline Steps Simulation */}
                <div className="relative pt-2">
                    <div className="flex justify-between text-xs text-slate-400 mb-2 uppercase font-semibold tracking-wider">
                        <span>Extract</span>
                        <span>Clean</span>
                        <span>Load</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        {syncingId === connector.id ? (
                            <div className="h-full bg-emerald-500 rounded-full animate-progress"></div>
                        ) : (
                            <div className={`h-full rounded-full ${connector.status === 'connected' ? 'bg-emerald-500 w-full' : connector.status === 'error' ? 'bg-rose-500 w-1/3' : 'bg-slate-300 w-0'}`}></div>
                        )}
                    </div>
                    <div className="mt-2 text-xs text-slate-500 flex justify-between">
                        <span>Last sync: {connector.lastSync}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {connector.schedule}</span>
                    </div>
                </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button 
                    onClick={() => handleSync(connector.id)}
                    disabled={syncingId === connector.id}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                >
                    {syncingId === connector.id ? <RefreshCw className="w-4 h-4 animate-spin"/> : <RefreshCw className="w-4 h-4"/>}
                    {syncingId === connector.id ? 'Syncing...' : 'Sync Now'}
                </button>
                <button className="px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
                    <Settings className="w-4 h-4" />
                </button>
            </div>
          </div>
        ))}
        
        {/* Add New Connector Button */}
        <button 
            onClick={() => setShowAddModal(true)}
            className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-400 hover:bg-emerald-50/50 transition-all group min-h-[250px]"
        >
            <div className="w-16 h-16 rounded-full bg-slate-100 group-hover:bg-emerald-100 flex items-center justify-center mb-4 transition-colors">
                <Plus className="w-8 h-8 text-slate-400 group-hover:text-emerald-600" />
            </div>
            <h3 className="font-semibold text-lg mb-1">Add Data Source</h3>
            <p className="text-sm text-center max-w-xs">Connect to a new ERP, CRM, or Bank Feed to automate data ingestion.</p>
        </button>
      </div>

      {/* Extraction Log */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
         <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
             <h3 className="font-semibold text-slate-800">Recent Extraction Logs</h3>
             <button className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1">View Full Log <ArrowRight className="w-3 h-3"/></button>
         </div>
         <table className="w-full text-sm text-left">
             <thead className="bg-slate-50 text-slate-500 font-medium">
                 <tr>
                     <th className="px-6 py-3">Source</th>
                     <th className="px-6 py-3">Timestamp</th>
                     <th className="px-6 py-3">Records Extracted</th>
                     <th className="px-6 py-3">Data Quality</th>
                     <th className="px-6 py-3">Status</th>
                 </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
                 <tr>
                     <td className="px-6 py-3 font-medium text-slate-900">SAP S/4HANA</td>
                     <td className="px-6 py-3 text-slate-500">Today, 04:00:23 AM</td>
                     <td className="px-6 py-3">142,050</td>
                     <td className="px-6 py-3 text-emerald-600 font-medium">99.8% Clean</td>
                     <td className="px-6 py-3"><span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs">Success</span></td>
                 </tr>
                 <tr>
                     <td className="px-6 py-3 font-medium text-slate-900">Oracle NetSuite</td>
                     <td className="px-6 py-3 text-slate-500">Today, 05:30:11 AM</td>
                     <td className="px-6 py-3">45,200</td>
                     <td className="px-6 py-3 text-emerald-600 font-medium">100% Clean</td>
                     <td className="px-6 py-3"><span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs">Success</span></td>
                 </tr>
                 <tr>
                     <td className="px-6 py-3 font-medium text-slate-900">QuickBooks Online</td>
                     <td className="px-6 py-3 text-slate-500">Yesterday, 11:00:05 PM</td>
                     <td className="px-6 py-3">0</td>
                     <td className="px-6 py-3 text-slate-400">-</td>
                     <td className="px-6 py-3"><span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full text-xs">Auth Failed</span></td>
                 </tr>
             </tbody>
         </table>
      </div>

      {/* Add Connector Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-fadeIn">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-900">Connect Data Source</h3>
                    <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5"/>
                    </button>
                </div>
                <form onSubmit={handleAddConnector} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Source Name</label>
                        <input 
                            type="text" 
                            required
                            value={newConnectorName}
                            onChange={(e) => setNewConnectorName(e.target.value)}
                            placeholder="e.g., Salesforce CRM"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Source Type</label>
                        <select 
                            value={newConnectorType}
                            onChange={(e) => setNewConnectorType(e.target.value as any)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                        >
                            <option value="ERP">ERP System</option>
                            <option value="Accounting">Accounting Software</option>
                            <option value="Bank">Bank Feed</option>
                        </select>
                    </div>
                    <div className="pt-2">
                        <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 rounded-lg transition-colors">
                            Add Connection
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      <style>{`
        @keyframes progress {
          0% { width: 0% }
          50% { width: 70% }
          100% { width: 100% }
        }
        .animate-progress {
            animation: progress 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
