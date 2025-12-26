
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Download, Upload, Database, Check, AlertCircle, 
  FileJson, RefreshCw, Save, ShieldCheck, Sparkles, 
  History, Info, Package, Users, Clapperboard, BookOpen,
  // Fix: Added missing Loader2 import
  Loader2
} from 'lucide-react';
import { useProgressStore } from '../store/progressStore';
import { useImmersionStore } from '../store/useImmersionStore';
import { dictionaryService } from '../services/dictionaryService';

interface DataManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TARGET_KEYS = [
  'nihongo-nexus-storage', 
  'nihongo-nexus-immersion-v3', // Added v3 immersion store
  'messenger_contacts',    
  'messenger_history',     
  'messenger_total_time',  
  'grammar_total_time',    
  'anki_total_time',       
  'immersion_total_time',  
  'mission_scenarios'      
];

const DataManagementModal: React.FC<DataManagementModalProps> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'processing'>('idle');
  const [statusMsg, setStatusMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const resetToSeed = useProgressStore(state => state.resetToSeed);
  const { minedCards, series } = useImmersionStore();
  const { manualVocabCount, masteredChapters } = useProgressStore();

  const [inventory, setInventory] = useState({
    personas: 0,
    mined: 0,
    episodes: 0,
    seriesCount: 0
  });

  // Calculate inventory whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      const calculateInventory = async () => {
        const contacts = JSON.parse(localStorage.getItem('messenger_contacts') || '{}');
        const episodeMeta = await dictionaryService.getAllEpisodesMetadata();
        
        setInventory({
          personas: Object.keys(contacts).length,
          mined: minedCards.length,
          episodes: episodeMeta.length,
          seriesCount: series.length
        });
      };
      calculateInventory();
    }
  }, [isOpen, minedCards.length, series.length]);

  const handleExport = async () => {
    setStatus('processing');
    setStatusMsg('Compiling Deep Chronicle...');
    
    try {
      const backupData: Record<string, any> = {};
      
      // 1. Capture LocalStorage Keys
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

      // 2. Capture IndexedDB Episode Metadata (The "Vault")
      const vaultMetadata = await dictionaryService.getAllEpisodesMetadata();
      backupData['indexed_db_vault'] = vaultMetadata;

      const payload = {
        meta: {
          app: 'nihongo-nexus',
          version: 3, // Increment version for full sync
          timestamp: new Date().toISOString(),
          deviceName: navigator.userAgent.split(') ')[0].split(' (')[1] || 'Unknown Device',
          inventory: inventory
        },
        data: backupData
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `nexus-full-sync-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setStatus('success');
      setStatusMsg('Deep Chronicle safely archived.');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (e) {
      console.error(e);
      setStatus('error');
      setStatusMsg('Failed to compile archive.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!json.meta || json.meta.app !== 'nihongo-nexus' || !json.data) {
          throw new Error("Invalid format.");
        }
        await performSmartMerge(json.data);
      } catch (e) {
        console.error(e);
        setStatus('error');
        setStatusMsg('Corrupt or incompatible backup file.');
      }
    };
    reader.readAsText(file);
  };

  const performSmartMerge = async (incomingData: Record<string, any>) => {
    setStatus('processing');
    setStatusMsg('Merging Timelines...');
    
    let mergeCount = 0;

    // A. Restore Timers & Simple Keys
    ['messenger_total_time', 'grammar_total_time', 'anki_total_time', 'immersion_total_time', 'mission_scenarios'].forEach(key => {
        if (incomingData[key]) {
            localStorage.setItem(key, String(incomingData[key]));
            mergeCount++;
        }
    });

    // B. Restore Persona System
    if (incomingData['messenger_contacts']) {
        localStorage.setItem('messenger_contacts', JSON.stringify(incomingData['messenger_contacts']));
        mergeCount++;
    }

    if (incomingData['messenger_history']) {
        localStorage.setItem('messenger_history', JSON.stringify(incomingData['messenger_history']));
        mergeCount++;
    }

    // C. Restore Core Progress & Immersion Stores
    if (incomingData['nihongo-nexus-storage']) {
        localStorage.setItem('nihongo-nexus-storage', JSON.stringify(incomingData['nihongo-nexus-storage']));
        mergeCount++;
    }

    if (incomingData['nihongo-nexus-immersion-v3']) {
        localStorage.setItem('nihongo-nexus-immersion-v3', JSON.stringify(incomingData['nihongo-nexus-immersion-v3']));
        mergeCount++;
    }

    // D. Restore IndexedDB Vault (Episode Analyses)
    if (incomingData['indexed_db_vault'] && Array.isArray(incomingData['indexed_db_vault'])) {
        await dictionaryService.saveEpisodesMetadataBulk(incomingData['indexed_db_vault']);
        mergeCount++;
    }

    setStatus('success');
    setStatusMsg(`Restore Complete. Integrated ${mergeCount} modules.`);
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
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
             
             {/* DATA INVENTORY SUMMARY */}
             <div className="bg-white border border-rose-100 rounded-3xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4 text-xs font-black uppercase tracking-widest text-coquette-subtext">
                   <Package className="w-3 h-3" /> Chronicle Inventory
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-pink-50 rounded-xl text-coquette-accent"><Users className="w-4 h-4" /></div>
                      <div>
                         <p className="text-[10px] font-black uppercase tracking-tight text-gray-400 leading-none">Personas</p>
                         <p className="text-lg font-bold font-coquette-header text-gray-800">{inventory.personas}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-50 rounded-xl text-emerald-400"><Clapperboard className="w-4 h-4" /></div>
                      <div>
                         <p className="text-[10px] font-black uppercase tracking-tight text-gray-400 leading-none">Series</p>
                         <p className="text-lg font-bold font-coquette-header text-gray-800">{inventory.seriesCount}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-rose-50 rounded-xl text-rose-400"><Sparkles className="w-4 h-4" /></div>
                      <div>
                         <p className="text-[10px] font-black uppercase tracking-tight text-gray-400 leading-none">Mined Cards</p>
                         <p className="text-lg font-bold font-coquette-header text-gray-800">{inventory.mined}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 rounded-xl text-indigo-400"><BookOpen className="w-4 h-4" /></div>
                      <div>
                         <p className="text-[10px] font-black uppercase tracking-tight text-gray-400 leading-none">AI Analyses</p>
                         <p className="text-lg font-bold font-coquette-header text-gray-800">{inventory.episodes}</p>
                      </div>
                   </div>
                </div>
                
                <div className="mt-5 p-3 rounded-xl bg-rose-50/50 flex items-start gap-3 border border-rose-100">
                   <Info className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                   <p className="text-[10px] leading-relaxed text-rose-900/60 font-medium">
                     Backups capture all textual data and AI analysis. Binaries (screenshots/audio) are transient; use "Export to Anki" for permanent media storage.
                   </p>
                </div>
             </div>

             {status !== 'idle' && (
               // Fix: Corrected invalid component injection in className template literal and used Loader2 correctly
               <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-bold shadow-sm border ${status === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : status === 'processing' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-red-50 text-red-500 border-red-100'}`}>
                 {status === 'success' ? <ShieldCheck className="w-5 h-5" /> : status === 'processing' ? <Loader2 className="w-5 h-5 animate-spin" /> : <AlertCircle className="w-5 h-5" />}
                 {statusMsg}
                 {status === 'success' && <RefreshCw className="w-4 h-4 animate-spin ml-auto" />}
               </motion.div>
             )}

             <div className="grid grid-cols-2 gap-4">
                <button onClick={handleExport} disabled={status === 'processing'} className="group flex flex-col items-center justify-center p-6 rounded-[24px] border border-rose-100 bg-white hover:border-rose-300 hover:shadow-lg transition-all gap-2 disabled:opacity-50">
                  <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-400 group-hover:bg-rose-400 group-hover:text-white transition-all"><Download className="w-6 h-6" /></div>
                  <div className="text-center">
                    <h3 className="font-bold text-gray-700 text-xs font-coquette-header">Full Backup</h3>
                    <p className="text-[8px] text-gray-400 uppercase tracking-widest">Global State Export</p>
                  </div>
                </button>

                <button onClick={() => fileInputRef.current?.click()} disabled={status === 'processing'} className="group flex flex-col items-center justify-center p-6 rounded-[24px] border border-dashed border-gray-200 bg-gray-50/30 hover:border-rose-400 hover:bg-rose-50 transition-all gap-2 disabled:opacity-50">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-gray-400 group-hover:text-rose-500 transition-all"><Upload className="w-6 h-6" /></div>
                  <div className="text-center">
                    <h3 className="font-bold text-gray-700 text-xs font-coquette-header">Full Restore</h3>
                    <p className="text-[8px] text-gray-400 uppercase tracking-widest">State Restoration</p>
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".json" className="hidden" />
                </button>
             </div>

             <button 
                onClick={handleResetToSeed}
                disabled={status === 'processing'}
                className="w-full group p-6 rounded-[32px] border-2 border-rose-100 bg-pink-50/20 hover:bg-rose-50 hover:border-rose-300 transition-all flex flex-col items-center gap-3 relative overflow-hidden disabled:opacity-50"
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
          </div>
          <div className="p-5 bg-gray-50/50 border-t border-rose-50 text-center">
             <span className="text-[9px] text-gray-400 font-black uppercase tracking-[0.3em]">Nihongo Nexus Global Sync v3.0 (Deep Restore)</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DataManagementModal;
