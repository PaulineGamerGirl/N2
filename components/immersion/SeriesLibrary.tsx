
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Library, 
  Tv, 
  Trash2, 
  ChevronRight, 
  CheckCircle2, 
  Film, 
  Download, 
  Upload, 
  Heart,
  Circle,
  FileJson,
  X,
  Sparkles,
  RefreshCcw,
  Zap,
  Loader2,
  Database,
  Wrench,
  AlertTriangle,
  Layers,
  AlertCircle
} from 'lucide-react';
import { useImmersionStore } from '../../store/useImmersionStore';
import { useProgressStore } from '../../store/progressStore';
import { dictionaryService } from '../../services/dictionaryService';
import LogMemoryModal from '../LogMemoryModal';
import UploadGateway from './UploadGateway'; 

// Sub-component for Lexical Scan within Library
const LexicalScanPanel = () => {
  const [isHydrated, setIsHydrated] = React.useState(false);
  const [isImporting, setIsImporting] = React.useState(false);

  React.useEffect(() => {
    dictionaryService.isHydrated().then(setIsHydrated);
  }, []);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    try {
      await dictionaryService.importJPDB(file);
      setIsHydrated(true);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="bg-white border border-rose-100 rounded-3xl p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-rose-50 rounded-xl text-rose-400">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Lexical Engine</h3>
          <p className="text-[10px] text-rose-300 font-bold uppercase tracking-widest">Frequency Analysis</p>
        </div>
      </div>
      
      {!isHydrated ? (
        <label className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border-2 border-dashed border-rose-100 text-rose-300 hover:border-rose-300 hover:text-rose-400 cursor-pointer transition-all text-[10px] font-black uppercase tracking-widest">
          {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
          {isImporting ? 'Ingesting...' : 'Mount Dictionary'}
          <input type="file" className="hidden" accept=".json" onChange={handleImport} />
        </label>
      ) : (
        <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
           <CheckCircle2 className="w-5 h-5 text-emerald-500" />
           <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Dictionary Linked</span>
        </div>
      )}
    </div>
  );
};

const DeleteConfirmation: React.FC<{
  isOpen: boolean;
  epNum: number | null;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ isOpen, epNum, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-rose-950/40 backdrop-blur-sm" />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-sm bg-white rounded-[40px] shadow-2xl p-10 text-center border border-rose-100"
      >
        <div className="p-4 rounded-full bg-red-50 text-red-400 w-16 h-16 mx-auto mb-6 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-bold font-coquette-header text-gray-800 mb-3">Delete Metadata?</h3>
        <p className="text-sm text-gray-500 font-coquette-body italic mb-8 leading-relaxed">
          "This will wipe the AI analysis and translations for Episode {epNum}. You'll need to re-upload the subtitle to restore it."
        </p>
        <div className="flex flex-col gap-3">
          <button onClick={onConfirm} className="w-full py-4 rounded-2xl bg-red-500 text-white font-black uppercase tracking-widest text-xs shadow-lg hover:bg-red-600 transition-all active:scale-95 flex items-center justify-center gap-2">
            <Trash2 className="w-4 h-4" /> Yes, Delete
          </button>
          <button onClick={onCancel} className="w-full py-4 rounded-2xl bg-gray-50 text-gray-400 font-bold text-xs hover:bg-gray-100 transition-all uppercase tracking-widest">
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const SeriesLibrary: React.FC = () => {
  const { 
    series, 
    removeSeries, 
    metadataHydratedIds, 
    setActiveSession, 
    markEpisodesAsHydrated,
    syncSeriesWithKeepsakes,
    subtitleOffset,
    deleteEpisode,
    ingestionQueue
  } = useImmersionStore();
  
  const { keepsakes } = useProgressStore();
  
  const [isAdding, setIsAdding] = useState(false);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);
  
  // Modes
  const [isExportMode, setIsExportMode] = useState(false);
  const [isManageMode, setIsManageMode] = useState(false); 
  
  const [selectedExportEps, setSelectedExportEps] = useState<Set<number>>(new Set());
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const importInputRef = useRef<HTMLInputElement>(null);

  // Deletion State
  const [deleteTargetEp, setDeleteTargetEp] = useState<number | null>(null);

  // Batch Upload State
  const [isBatchUploadOpen, setIsBatchUploadOpen] = useState(false);

  const selectedSeries = series.find(s => s.id === selectedSeriesId);

  const handleManualSync = () => {
    syncSeriesWithKeepsakes(keepsakes);
    setImportStatus('success');
    setTimeout(() => setImportStatus('idle'), 2000);
  };

  const toggleExportEpisode = (epNum: number) => {
    const next = new Set(selectedExportEps);
    if (next.has(epNum)) next.delete(epNum);
    else next.add(epNum);
    setSelectedExportEps(next);
  };

  const handleDeleteConfirm = async () => {
    if (selectedSeriesId && deleteTargetEp) {
      await deleteEpisode(selectedSeriesId, deleteTargetEp);
      setDeleteTargetEp(null);
    }
  };

  const handleDownloadSelection = async () => {
    if (!selectedSeriesId || selectedExportEps.size === 0) return;
    
    try {
      const episodeNumbers: number[] = Array.from(selectedExportEps);
      const metadata = await dictionaryService.getEpisodesMetadataBulk(selectedSeriesId, episodeNumbers);
      
      const payload = {
        meta: {
          app: 'nihongo-nexus-metadata',
          seriesId: selectedSeriesId,
          seriesTitle: selectedSeries?.title,
          exportDate: new Date().toISOString(),
          version: 2,
          globalOffset: subtitleOffset
        },
        episodes: metadata
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedSeries?.title?.replace(/\s+/g, '_')}_Archive.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setIsExportMode(false);
      setSelectedExportEps(new Set());
    } catch (e) {
      console.error("Export Protocol Failure:", e);
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedSeriesId) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        
        if (json.meta?.app !== 'nihongo-nexus-metadata' || !Array.isArray(json.episodes)) {
          throw new Error("Incorrect archive format.");
        }

        const sanitizedEpisodes = json.episodes.map((ep: any) => ({
          ...ep,
          seriesId: selectedSeriesId,
          subtitleOffset: json.meta.globalOffset !== undefined ? json.meta.globalOffset : ep.subtitleOffset
        }));

        await dictionaryService.saveEpisodesMetadataBulk(sanitizedEpisodes);
        
        const epNums: number[] = sanitizedEpisodes.map((ep: any) => Number(ep.episodeNumber));
        markEpisodesAsHydrated(selectedSeriesId, epNums);

        setImportStatus('success');
        setTimeout(() => setImportStatus('idle'), 3000);
      } catch (e) {
        setImportStatus('error');
        setTimeout(() => setImportStatus('idle'), 3000);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="h-full flex flex-col bg-[#fffcfc]">
      <header className="px-12 py-8 border-b border-rose-100 flex items-center justify-between bg-white/50 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-rose-50 rounded-2xl text-rose-400 shadow-sm border border-rose-100">
             <Library className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-coquette-header text-gray-800">Chronicle Library</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-rose-400 font-bold mt-1">Series Metadata Vault</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 mr-16">
          <button 
            onClick={handleManualSync}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-rose-400 hover:bg-rose-50 transition-all border border-rose-100"
          >
            <RefreshCcw className="w-4 h-4" /> Sync Archive
          </button>
          <button onClick={() => setIsAdding(true)} className="w-16 h-16 rounded-full flex flex-col items-center justify-center bg-coquette-accent hover:bg-[#ff9eb0] text-white shadow-lg"><Plus className="w-6 h-6" /><span className="text-[8px] font-bold uppercase mt-1">Add</span></button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-12 py-10 custom-scrollbar">
        <AnimatePresence mode="wait">
          {!selectedSeriesId ? (
            <motion.div key="series-grid" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-10">
              {series.length === 0 ? (
                <div className="col-span-full py-40 flex flex-col items-center justify-center text-center opacity-30">
                  <Film className="w-20 h-20 mb-6" />
                  <p className="font-coquette-header text-3xl italic">The archives are empty...</p>
                </div>
              ) : (
                series.map(s => (
                  <motion.div key={s.id} layoutId={s.id} onClick={() => setSelectedSeriesId(s.id)} className="group cursor-pointer">
                    <div className="aspect-[2/3] rounded-[40px] overflow-hidden border border-rose-100 shadow-sm group-hover:shadow-2xl transition-all relative mb-4 bg-gray-50">
                       <img src={s.coverUrl} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                       <div className="absolute inset-0 bg-gradient-to-t from-rose-900/40 via-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <h3 className="font-bold text-xl text-gray-800 font-coquette-header truncate px-2">{s.title}</h3>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] px-2 mt-1">{s.totalEpisodes} Episodes</p>
                  </motion.div>
                ))
              )}
            </motion.div>
          ) : (
            <motion.div key="episode-grid" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12">
                <div className="lg:col-span-3 flex items-center gap-8 bg-white/40 p-8 rounded-[40px] border border-rose-50 shadow-sm relative overflow-hidden">
                  <button onClick={() => { setSelectedSeriesId(null); setIsExportMode(false); setIsManageMode(false); setIsBatchUploadOpen(false); }} className="p-4 rounded-full bg-white shadow-md text-rose-300 hover:text-rose-500 transition-all"><ChevronRight className="w-8 h-8 rotate-180" /></button>
                  <div className="w-32 h-44 rounded-3xl overflow-hidden shadow-xl flex-shrink-0"><img src={selectedSeries?.coverUrl} className="w-full h-full object-cover" /></div>
                  <div className="flex-1">
                    <h2 className="text-5xl font-bold font-coquette-header text-gray-800 italic leading-tight">{selectedSeries?.title}</h2>
                    <div className="flex flex-wrap items-center gap-4 mt-6">
                        <button onClick={() => { setIsExportMode(!isExportMode); setIsManageMode(false); }} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isExportMode ? 'bg-rose-500 text-white shadow-lg' : 'bg-white border border-rose-200 text-rose-400'}`}><Download className="w-4 h-4" /> {isExportMode ? 'Cancel Selection' : 'Export / Upload'}</button>
                        
                        <button onClick={() => { setIsManageMode(!isManageMode); setIsExportMode(false); }} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isManageMode ? 'bg-red-500 text-white shadow-lg' : 'bg-white border border-rose-200 text-rose-400'}`}><Wrench className="w-4 h-4" /> {isManageMode ? 'Done Managing' : 'Manage Episodes'}</button>
                        
                        {isExportMode && selectedExportEps.size > 0 && (
                          <div className="flex items-center gap-2">
                             <button onClick={handleDownloadSelection} className="flex items-center gap-2 px-6 py-2 rounded-xl bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-emerald-600 transition-all"><FileJson className="w-4 h-4" /> Save Metadata</button>
                             <button onClick={() => setIsBatchUploadOpen(true)} className="flex items-center gap-2 px-6 py-2 rounded-xl bg-violet-500 text-white font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-violet-600 transition-all"><Layers className="w-4 h-4" /> Batch Upload ({selectedExportEps.size})</button>
                          </div>
                        )}
                        
                        {!isExportMode && !isManageMode && <button onClick={() => importInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-rose-200 text-rose-400 text-[10px] font-black uppercase tracking-widest"><Upload className="w-4 h-4" /> Import JSON Archive<input type="file" ref={importInputRef} onChange={handleImportFile} accept=".json" className="hidden" /></button>}
                    </div>
                  </div>
                </div>
                <LexicalScanPanel />
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-5">
                {Array.from({ length: selectedSeries?.totalEpisodes || 0 }).map((_, i) => {
                  const epNum = i + 1;
                  const isHydrated = metadataHydratedIds.has(`${selectedSeriesId}_ep_${epNum}`);
                  const isSelectedForExport = selectedExportEps.has(epNum);
                  
                  // Check Queue Status
                  // Note: Queue Title format is `${seriesTitle} - Ep ${epNum}`
                  const queueItem = ingestionQueue.find(q => q.title === `${selectedSeries?.title} - Ep ${epNum}`);
                  const isProcessing = queueItem?.status === 'processing';
                  const isPending = queueItem?.status === 'pending';
                  const isError = queueItem?.status === 'error';
                  
                  return (
                    <motion.button
                      key={epNum}
                      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        if (isManageMode) {
                          if (isHydrated) setDeleteTargetEp(epNum);
                        } else if (isExportMode) {
                          toggleExportEpisode(epNum);
                        } else {
                          setActiveSession(selectedSeriesId, epNum);
                        }
                      }}
                      className={`
                        aspect-square rounded-[24px] border-2 flex flex-col items-center justify-center gap-1 transition-all relative overflow-hidden group
                        ${isManageMode && isHydrated ? 'border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-400 cursor-pointer animate-pulse' : ''}
                        ${isExportMode 
                          ? (isSelectedForExport ? 'bg-rose-500 border-rose-600 text-white shadow-lg scale-105' : (isHydrated ? 'bg-rose-100 border-rose-300 text-rose-500 shadow-md ring-2 ring-rose-200' : 'bg-white border-dashed border-gray-100 text-gray-400'))
                          : (!isManageMode && isHydrated ? 'bg-rose-50 border-rose-200 text-rose-600 shadow-md ring-2 ring-rose-100 ring-offset-2' : (!isManageMode ? 'bg-white border-dashed border-gray-100 text-gray-300 hover:border-rose-200 hover:text-rose-400' : 'bg-white border-dashed border-gray-100 text-gray-300 opacity-50 cursor-not-allowed'))
                        }
                      `}
                    >
                      <span className="text-2xl font-bold font-coquette-header">{epNum}</span>
                      
                      {/* Status Icon Area */}
                      <div className="h-4 flex items-center justify-center">
                        {isProcessing ? (
                           <div className="flex flex-col items-center gap-1">
                              <Loader2 className="w-3 h-3 animate-spin text-rose-400" />
                              <span className="text-[7px] font-black text-rose-400">{queueItem?.progress}%</span>
                           </div>
                        ) : isPending ? (
                           <Layers className="w-3 h-3 text-rose-300" />
                        ) : isError ? (
                           <AlertCircle className="w-3 h-3 text-red-400" />
                        ) : isManageMode && isHydrated ? (
                           <Trash2 className="w-4 h-4 text-red-400" />
                        ) : isExportMode ? (
                          isSelectedForExport ? <CheckCircle2 className="w-4 h-4 text-white" /> : (isHydrated ? <CheckCircle2 className="w-4 h-4 text-rose-400" /> : <Circle className="w-3 h-3 opacity-20" />)
                        ) : (
                          isHydrated ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <div className="w-3 h-3 rounded-full border-2 border-current opacity-10" />
                        )}
                      </div>
                      
                      {/* Active Progress Overlay */}
                      {isProcessing && (
                         <div className="absolute bottom-0 left-0 w-full h-1 bg-rose-100">
                            <div className="h-full bg-rose-400 transition-all duration-300" style={{ width: `${queueItem?.progress}%` }} />
                         </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
              <div className="h-20" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <LogMemoryModal isOpen={isAdding} onClose={() => setIsAdding(false)} editingId={null} forcedTheaterMode={true} />
      <DeleteConfirmation isOpen={!!deleteTargetEp} epNum={deleteTargetEp} onConfirm={handleDeleteConfirm} onCancel={() => setDeleteTargetEp(null)} />
      
      {selectedSeriesId && (
        <UploadGateway 
          isOpen={isBatchUploadOpen} 
          onClose={() => setIsBatchUploadOpen(false)} 
          targetEpisodes={{
            seriesId: selectedSeriesId,
            seriesTitle: selectedSeries?.title || 'Unknown Series',
            episodeNumbers: Array.from(selectedExportEps).sort((a: number, b: number) => a - b)
          }}
        />
      )}
    </div>
  );
};

export default SeriesLibrary;
