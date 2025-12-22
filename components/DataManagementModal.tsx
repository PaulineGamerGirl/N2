
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Upload, Database, Check, AlertCircle, FileJson, RefreshCw, Save, ShieldCheck } from 'lucide-react';

interface DataManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * The complete list of keys to backup/restore.
 * Ensures the Quick Translator environment, Messenger history, 
 * Activity Logs, and all persistent study timers are preserved.
 */
const TARGET_KEYS = [
  'nihongo-nexus-storage', // Zustand Store (Stats, Keepsakes, Logs, Activity Logs, Calendar, Grammar DB)
  'messenger_contacts',    // Custom Personas & System Instructions
  'messenger_history',     // All Chat Logs with Personas
  'messenger_total_time',  // Output Practice Timer Total
  'grammar_total_time',    // Grammar Study Timer Total
  'anki_total_time',       // Anki Focus Timer Total
  'immersion_total_time',  // Immersion Tracker Total
  'mission_scenarios'      // Dynamic Roleplay Scenarios
];

const DataManagementModal: React.FC<DataManagementModalProps> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- EXPORT LOGIC ---
  const handleExport = () => {
    try {
      const backupData: Record<string, any> = {};
      
      TARGET_KEYS.forEach(key => {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            // Attempt to parse JSON to store as objects in the backup for readability
            backupData[key] = JSON.parse(raw);
          } catch {
            // Fallback to raw string if not JSON
            backupData[key] = raw;
          }
        }
      });

      const payload = {
        meta: {
          app: 'nihongo-nexus',
          version: 2, // Increment version for new features
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

  // --- IMPORT LOGIC (SMART MERGE) ---
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

    // 1. TIMERS (Additive/Max logic)
    // We assume study time is cumulative unless the incoming is significantly higher (likely a full restore)
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

    // 2. MESSENGER (Persona and History merge)
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

    // 3. MAIN ZUSTAND STORE (Deduplicated merge for Version 6)
    if (incomingData['nihongo-nexus-storage']) {
        const rawCurrent = localStorage.getItem('nihongo-nexus-storage');
        const currentObj = rawCurrent ? JSON.parse(rawCurrent) : { state: {} };
        const incomingObj = incomingData['nihongo-nexus-storage'];
        
        // Handle both stringified and object formats from older backups
        const incomingState = typeof incomingObj === 'string' ? JSON.parse(incomingObj).state : incomingObj.state;
        const currentState = currentObj.state || {};

        if (incomingState) {
            // Stats (Take the highest to prevent progress loss)
            currentState.vocabCount = Math.max(currentState.vocabCount || 0, incomingState.vocabCount || 0);
            currentState.immersionMinutes = Math.max(currentState.immersionMinutes || 0, incomingState.immersionMinutes || 0);
            currentState.grammarPoints = Math.max(currentState.grammarPoints || 0, incomingState.grammarPoints || 0);
            currentState.streak = Math.max(currentState.streak || 0, incomingState.streak || 0);

            // Lists (Merge and Deduplicate by ID)
            ['logs', 'keepsakes', 'activityLogs'].forEach(arrKey => {
                const currentArr = currentState[arrKey] || [];
                const incomingArr = incomingState[arrKey] || [];
                const map = new Map();
                currentArr.forEach((item: any) => { if(item.id) map.set(item.id, item); });
                incomingArr.forEach((item: any) => { if(item.id) map.set(item.id, item); });
                currentState[arrKey] = Array.from(map.values()).sort((a:any, b:any) => (b.timestamp || b.date) > (a.timestamp || a.date) ? 1 : -1);
            });

            // Mastered Chapters (Union Set)
            const chapters = new Set([...(currentState.masteredChapters || []), ...(incomingState.masteredChapters || [])]);
            currentState.masteredChapters = Array.from(chapters);

            // Objects (Merge Keys)
            currentState.completedDates = { ...(currentState.completedDates || {}), ...(incomingState.completedDates || {}) };
            currentState.dailyChecklist = { ...(currentState.dailyChecklist || {}), ...(incomingState.dailyChecklist || {}) };
            currentState.grammarDatabase = { ...(currentState.grammarDatabase || {}), ...(incomingState.grammarDatabase || {}) };
            
            // Context String
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
    // Hard refresh ensures Zustand reloads the new localStorage state immediately
    setTimeout(() => { window.location.reload(); }, 1500);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
        <motion.div initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 30 }} className="relative w-full max-w-lg bg-[#fffcfc] rounded-[40px] shadow-2xl overflow-hidden border border-coquette-border">
          
          {/* Header */}
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

          <div className="p-8 space-y-8">
             {status !== 'idle' && (
               <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-bold shadow-sm border ${status === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-500 border-red-100'}`}>
                 {status === 'success' ? <ShieldCheck className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                 {statusMsg}
                 {status === 'success' && <RefreshCw className="w-4 h-4 animate-spin ml-auto" />}
               </motion.div>
             )}

             <div className="grid grid-cols-2 gap-6">
                {/* EXPORT ACTION */}
                <button 
                  onClick={handleExport} 
                  className="group flex flex-col items-center justify-center p-8 rounded-[32px] border-2 border-rose-50 bg-white hover:border-rose-300 hover:shadow-xl hover:shadow-rose-100/50 transition-all duration-500 gap-4"
                >
                  <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-400 group-hover:scale-110 group-hover:bg-rose-400 group-hover:text-white transition-all duration-500">
                    <Download className="w-8 h-8" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-bold text-gray-700 font-coquette-header">Backup</h3>
                    <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-widest">To .JSON File</p>
                  </div>
                </button>

                {/* IMPORT ACTION */}
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  className="group flex flex-col items-center justify-center p-8 rounded-[32px] border-2 border-dashed border-gray-200 bg-gray-50/30 hover:border-rose-400 hover:bg-rose-50 transition-all duration-500 gap-4"
                >
                  <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-gray-400 group-hover:text-rose-500 group-hover:shadow-md transition-all duration-500">
                    <Upload className="w-8 h-8" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-bold text-gray-700 font-coquette-header">Restore</h3>
                    <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-widest">Merge Sync</p>
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".json" className="hidden" />
                </button>
             </div>

             <div className="bg-[#fffdfd] p-5 rounded-[24px] border border-rose-50 shadow-inner">
                <div className="flex items-start gap-4">
                   <div className="p-2 bg-rose-50 rounded-lg text-rose-300 mt-0.5"><FileJson className="w-4 h-4" /></div>
                   <div>
                     <h4 className="text-xs font-black text-rose-400 uppercase tracking-widest mb-1.5">Smart Sync Architecture</h4>
                     <p className="text-[11px] text-coquette-subtext leading-relaxed font-coquette-body italic">
                       The Vault uses a non-destructive merge algorithm. It preserves your existing chats, syncs the newest activity logs, and retains your highest achieved levels and streak history.
                     </p>
                   </div>
                </div>
             </div>
          </div>

          <div className="p-5 bg-gray-50/50 border-t border-rose-50 text-center">
             <span className="text-[9px] text-gray-400 font-black uppercase tracking-[0.3em]">Nihongo Nexus Data Protocol v2.0</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DataManagementModal;
