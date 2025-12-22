import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Upload, Database, Check, AlertCircle, FileJson, RefreshCw, Save, ShieldCheck, Sparkles, History } from 'lucide-react';
import { useProgressStore } from '../store/progressStore';

interface DataManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TARGET_KEYS = [
  'nihongo-nexus-storage', 
  'messenger_contacts',    
  'messenger_history',     
  'messenger_total_time',  
  'grammar_total_time',    
  'anki_total_time',       
  'immersion_total_time',  
  'mission_scenarios'      
];

const DataManagementModal: React.FC<DataManagementModalProps> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const resetToSeed = useProgressStore(state => state.resetToSeed);

  const handleExport = () => {
    try {
      const backupData: Record<string, any> = {};
      
      TARGET_KEYS.forEach(key => {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            backupData[key] = JSON.parse(raw);
          } catch {
            backupData[key] = raw;
          }
        }
      });

      const payload = {
        meta: {
          app: 'nihongo-nexus',
          version: 2,
          timestamp: new Date().toISOString(),
          deviceName: navigator.userAgent.split(') ')[0].split(' (')[1] || 'Unknown Device'
        },
        data: backupData
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `nihongo-nexus-sync-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setStatus('success');
      setStatusMsg('Chronicle safely archived to disk.');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (e) {
      console.error(e);
      setStatus('error');
      setStatusMsg('The archive failed to compile.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!json.meta || json.meta.app !== 'nihongo-nexus' || !json.data) {
          throw new Error("Invalid format.");
        }
        performSmartMerge(json.data);
      } catch (e) {
        console.error(e);
        setStatus('error');
        setStatusMsg('Corrupt or incompatible backup file.');
      }
    };
    reader.readAsText(file);
  };

  const performSmartMerge = (incomingData: Record<string, any>) => {
    let mergeCount = 0;

    ['messenger_total_time', 'grammar_total_time', 'anki_total_time', 'immersion_total_time'].forEach(key => {
        if (incomingData[key]) {
            const current = Number(localStorage.getItem(key) || 0);
            const incoming = Number(incomingData[key]);
            if (!isNaN(incoming) && incoming > current) {
                localStorage.setItem(key, incoming.toString());
                mergeCount++;
            }
        }
    });

    if (incomingData['messenger_contacts']) {
        const current = JSON.parse(localStorage.getItem('messenger_contacts') || '{}');
        const merged = { ...current, ...incomingData['messenger_contacts'] };
        localStorage.setItem('messenger_contacts', JSON.stringify(merged));
        mergeCount++;
    }

    if (incomingData['messenger_history']) {
        const current = JSON.parse(localStorage.getItem('messenger_history') || '{}');
        const incoming = incomingData['messenger_history'];
        Object.keys(incoming).forEach(contactId => {
            const currentMsgs = current[contactId] || [];
            const incomingMsgs = incoming[contactId] || [];
            const msgMap = new Map();
            currentMsgs.forEach((m: any) => msgMap.set(m.id, m));
            incomingMsgs.forEach((m: any) => msgMap.set(m.id, m));
            current[contactId] = Array.from(msgMap.values()).sort((a: any, b: any) => 
               (a.createdAt || 0) > (b.createdAt || 0) ? 1 : -1
            );
        });
        localStorage.setItem('messenger_history', JSON.stringify(current));
        mergeCount++;
    }

    if (incomingData['nihongo-nexus-storage']) {
        const rawCurrent = localStorage.getItem('nihongo-nexus-storage');
        const currentObj = rawCurrent ? JSON.parse(rawCurrent) : { state: {} };
        const incomingObj = incomingData['nihongo-nexus-storage'];
        
        const incomingState = typeof incomingObj === 'string' ? JSON.parse(incomingObj).state : incomingObj.state;
        const currentState = currentObj.state || {};

        if (incomingState) {
            currentState.vocabCount = Math.max(currentState.vocabCount || 0, incomingState.vocabCount || 0);
            currentState.immersionMinutes = Math.max(currentState.immersionMinutes || 0, incomingState.immersionMinutes || 0);
            currentState.grammarPoints = Math.max(currentState.grammarPoints || 0, incomingState.grammarPoints || 0);
            currentState.streak = Math.max(currentState.streak || 0, incomingState.streak || 0);

            ['logs', 'keepsakes', 'activityLogs'].forEach(arrKey => {
                const currentArr = currentState[arrKey] || [];
                const incomingArr = incomingState[arrKey] || [];
                const map = new Map();
                currentArr.forEach((item: any) => { if(item.id) map.set(item.id, item); });
                incomingArr.forEach((item: any) => { if(item.id) map.set(item.id, item); });
                currentState[arrKey] = Array.from(map.values()).sort((a:any, b:any) => (b.timestamp || b.date) > (a.timestamp || a.date) ? 1 : -1);
            });

            const chapters = new Set([...(currentState.masteredChapters || []), ...(incomingState.masteredChapters || [])]);
            currentState.masteredChapters = Array.from(chapters);

            currentState.completedDates = { ...(currentState.completedDates || {}), ...(incomingState.completedDates || {}) };
            currentState.dailyChecklist = { ...(currentState.dailyChecklist || {}), ...(incomingState.dailyChecklist || {}) };
            currentState.grammarDatabase = { ...(currentState.grammarDatabase || {}), ...(incomingState.grammarDatabase || {}) };
            
            if ((incomingState.grammarContext || '').length > (currentState.grammarContext || '').length) {
              currentState.grammarContext = incomingState.grammarContext;
            }

            currentObj.state = currentState;
            localStorage.setItem('nihongo-nexus-storage', JSON.stringify(currentObj));
            mergeCount++;
        }
    }

    setStatus('success');
    setStatusMsg(`Sync Successful. Integrated ${mergeCount} modules.`);
    setTimeout(() => { window.location.reload(); }, 1500);
  };

  const handleResetToSeed = () => {
    if (confirm("This will replace your current progress with Pauline's original mastery stats. Continue?")) {
      resetToSeed();
      setStatus('success');
      setStatusMsg('Restored Pauline\'s Chronicle.');
      setTimeout(() => { window.location.reload(); }, 1000);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
        <motion.div initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 30 }} className="relative w-full max-w-lg bg-[#fffcfc] rounded-[40px] shadow-2xl overflow-hidden border border-coquette-border flex flex-col max-h-[90vh]">
          
          <div className="p-7 border-b border-rose-100 bg-rose-50/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="p-2.5 bg-white rounded-2xl border border-rose-100 text-rose-500 shadow-sm"><Database className="w-5 h-5" /></div>
               <div>
                 <h2 className="text-xl font-bold font-coquette-header text-gray-800">The Data Vault</h2>
                 <p className="text-[10px] text-rose-400 font-bold uppercase tracking-[0.2em] mt-0.5">Persistence Control</p>
               </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white text-gray-300 hover:text-rose-400 transition-all"><X className="w-5 h-5" /></button>
          </div>

          <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
             {status !== 'idle' && (
               <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-bold shadow-sm border ${status === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-500 border-red-100'}`}>
                 {status === 'success' ? <ShieldCheck className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                 {statusMsg}
                 {status === 'success' && <RefreshCw className="w-4 h-4 animate-spin ml-auto" />}
               </motion.div>
             )}

             <div className="grid grid-cols-2 gap-4">
                <button onClick={handleExport} className="group flex flex-col items-center justify-center p-6 rounded-[24px] border border-rose-100 bg-white hover:border-rose-300 hover:shadow-lg transition-all gap-2">
                  <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-400 group-hover:bg-rose-400 group-hover:text-white transition-all"><Download className="w-6 h-6" /></div>
                  <div className="text-center">
                    <h3 className="font-bold text-gray-700 text-xs font-coquette-header">Backup</h3>
                    <p className="text-[8px] text-gray-400 uppercase tracking-widest">To .JSON</p>
                  </div>
                </button>

                <button onClick={() => fileInputRef.current?.click()} className="group flex flex-col items-center justify-center p-6 rounded-[24px] border border-dashed border-gray-200 bg-gray-50/30 hover:border-rose-400 hover:bg-rose-50 transition-all gap-2">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-gray-400 group-hover:text-rose-500 transition-all"><Upload className="w-6 h-6" /></div>
                  <div className="text-center">
                    <h3 className="font-bold text-gray-700 text-xs font-coquette-header">Restore</h3>
                    <p className="text-[8px] text-gray-400 uppercase tracking-widest">Merge Sync</p>
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".json" className="hidden" />
                </button>
             </div>

             {/* SPECIAL RESET TO SEED BUTTON */}
             <button 
                onClick={handleResetToSeed}
                className="w-full group p-6 rounded-[32px] border-2 border-rose-100 bg-pink-50/20 hover:bg-rose-50 hover:border-rose-300 transition-all flex flex-col items-center gap-3 relative overflow-hidden"
             >
                <div className="absolute top-[-20%] left-[-10%] w-32 h-32 bg-white/40 blur-3xl rounded-full"></div>
                <div className="w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform relative z-10">
                   <History className="w-8 h-8" />
                   <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-coquette-gold animate-pulse" />
                </div>
                <div className="text-center relative z-10">
                   <h3 className="font-bold text-rose-900 font-coquette-header text-lg">Restore Pauline's Archive</h3>
                   <p className="text-[10px] text-coquette-subtext mt-1 uppercase font-bold tracking-[0.2em]">Reset to Master Seeds</p>
                </div>
             </button>

             <div className="bg-[#fffdfd] p-5 rounded-[24px] border border-rose-50 shadow-inner">
                <div className="flex items-start gap-4">
                   <div className="p-2 bg-rose-50 rounded-lg text-rose-300 mt-0.5"><FileJson className="w-4 h-4" /></div>
                   <div>
                     <h4 className="text-xs font-black text-rose-400 uppercase tracking-widest mb-1.5">Persistence Logic</h4>
                     <p className="text-[11px] text-coquette-subtext leading-relaxed font-coquette-body italic">
                       New visitors automatically load Pauline's progress. Use the Archive button above if you wish to reset your local cache back to these original master stats.
                     </p>
                   </div>
                </div>
             </div>
          </div>

          <div className="p-5 bg-gray-50/50 border-t border-rose-50 text-center">
             <span className="text-[9px] text-gray-400 font-black uppercase tracking-[0.3em]">Nihongo Nexus Protocol v2.1 (Seeded)</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DataManagementModal;