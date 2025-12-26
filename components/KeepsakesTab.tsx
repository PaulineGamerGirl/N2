
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Library, Clock, BookOpen, Plus, Square, Link as LinkIcon, Coffee, ChevronRight } from 'lucide-react';
import { useProgressStore, MediaType } from '../store/progressStore';
import MediaCard from './MediaCard';
import MiningCollection from './immersion/MiningCollection';
import LogMemoryModal from './LogMemoryModal';
import { containerVariants } from '../constants';

const KeepsakesTab: React.FC = () => {
  const { keepsakes, addActivityLog, addMinutesToKeepsake } = useProgressStore();
  const [viewMode, setViewMode] = useState<'GALLERY' | 'DECK'>('GALLERY');
  const [activeTab, setActiveTab] = useState<'ALL' | MediaType>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);

  // --- PERSISTENT IMMERSION TIMER STATE ---
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [displaySeconds, setDisplaySeconds] = useState(0);
  const [linkedItemId, setLinkedItemId] = useState<string>('');

  useEffect(() => {
    const updateTimerDisplay = () => {
      const startTime = localStorage.getItem('immersion_session_start');
      const savedLinkedId = localStorage.getItem('immersion_linked_id');
      if (startTime) {
        setIsTimerRunning(true);
        const duration = Math.floor((Date.now() - Number(startTime)) / 1000);
        setDisplaySeconds(Math.max(0, duration));
        if (savedLinkedId) setLinkedItemId(savedLinkedId);
      } else {
        setIsTimerRunning(false);
        setDisplaySeconds(0);
        setLinkedItemId('');
      }
    };

    updateTimerDisplay();
    const interval = setInterval(updateTimerDisplay, 1000);
    return () => clearInterval(interval);
  }, []);

  const startTimerWithSelection = (id: string) => {
    localStorage.setItem('immersion_session_start', Date.now().toString());
    if (id) {
      localStorage.setItem('immersion_linked_id', id);
      setLinkedItemId(id);
    } else {
      localStorage.removeItem('immersion_linked_id');
      setLinkedItemId('');
    }
    setIsTimerRunning(true);
    setIsSelectionModalOpen(false);
    window.dispatchEvent(new Event('storage-update'));
  };

  const toggleTimer = () => {
    if (isTimerRunning) {
      const startTime = Number(localStorage.getItem('immersion_session_start'));
      const sessionSeconds = Math.floor((Date.now() - startTime) / 1000);
      const savedLinkedId = localStorage.getItem('immersion_linked_id');
      
      if (sessionSeconds >= 60) {
        const sessionMins = Math.floor(sessionSeconds / 60);
        let summary = 'Active Immersion Session (Timer)';
        
        if (savedLinkedId) {
          const item = keepsakes.find(k => k.id === savedLinkedId);
          if (item) {
            addMinutesToKeepsake(savedLinkedId, sessionMins);
            summary = `Immersed with ${item.title} for ${sessionMins}m`;
          }
        }

        addActivityLog({
          timestamp: Date.now(),
          category: 'IMMERSION',
          durationMinutes: sessionMins,
          summary: summary
        });
      }
      
      const total = Number(localStorage.getItem('immersion_total_time') || 0);
      localStorage.setItem('immersion_total_time', (total + sessionSeconds).toString());
      localStorage.removeItem('immersion_session_start');
      localStorage.removeItem('immersion_linked_id');
      window.dispatchEvent(new Event('storage-update'));
      setIsTimerRunning(false);
      setDisplaySeconds(0);
      setLinkedItemId('');
    } else {
      setIsSelectionModalOpen(true);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const filteredItems = activeTab === 'ALL' 
    ? keepsakes 
    : keepsakes.filter(item => item.type === activeTab);

  const ongoingItems = keepsakes.filter(k => k.status === 'ONGOING');

  const calculateStats = () => {
    let totalHours = 0;
    let totalVolumes = 0;
    keepsakes.forEach(item => {
      if (item.type === 'MANGA') totalVolumes += item.durationOrVolumes || 0;
      else totalHours += (item.durationOrVolumes || 0) / 60;
    });
    const savedTotalSecs = Number(localStorage.getItem('immersion_total_time') || 0);
    totalHours += (savedTotalSecs + displaySeconds) / 3600;
    return { hours: Math.round(totalHours), volumes: totalVolumes, titles: keepsakes.length };
  };

  const currentStats = calculateStats();
  const stats = [
    { label: 'Hours', value: currentStats.hours.toString(), icon: Clock },
    { label: 'Volumes', value: currentStats.volumes.toString(), icon: BookOpen },
    { label: 'Titles', value: currentStats.titles.toString(), icon: Library },
  ];

  const tabs = [
    { id: 'ALL', label: 'All' },
    { id: 'ANIME', label: 'Anime' },
    { id: 'MANGA', label: 'Manga' },
    { id: 'GAME', label: 'Games' },
    { id: 'SHOW', label: 'Shows' },
  ];

  const openAddModal = () => { setEditingId(null); setIsModalOpen(true); };
  const openEditModal = (id: string) => { setEditingId(id); setIsModalOpen(true); };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="p-6 lg:p-8 w-full max-w-[1600px] mx-auto min-h-full flex flex-col">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 border-b pb-6 gap-6 border-coquette-gold/30">
        <div className="flex-1 w-full lg:max-w-4xl">
           <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-pink-50 text-coquette-accent flex-shrink-0"><Sparkles className="w-5 h-5" /></div>
              <h1 className="text-3xl lg:text-4xl font-bold font-coquette-header text-coquette-text whitespace-nowrap">My Keepsakes</h1>
              <div className="ml-8 flex bg-rose-50 p-1 rounded-2xl border border-rose-100">
                 <button onClick={() => setViewMode('GALLERY')} className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'GALLERY' ? 'bg-white text-rose-500 shadow-sm' : 'text-rose-300 hover:text-rose-400'}`}>Library</button>
                 <button onClick={() => setViewMode('DECK')} className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'DECK' ? 'bg-white text-rose-500 shadow-sm' : 'text-rose-300 hover:text-rose-400'}`}>Mined Deck</button>
              </div>
           </div>
           
           <div className="flex flex-col md:flex-row md:items-center gap-6">
             <p className="text-sm font-coquette-body text-coquette-subtext italic min-w-[200px] leading-relaxed">{viewMode === 'GALLERY' ? "A treasured archive of the worlds I've explored." : "Fragments of language gathered from cinematic journeys."}</p>
             <div className="hidden md:block w-px h-8 bg-coquette-border flex-shrink-0"></div>
             {viewMode === 'GALLERY' && (
                <div className="flex flex-nowrap gap-2 overflow-x-auto scrollbar-hide pb-1">
                  {tabs.map(tab => (<button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-5 py-2 rounded-full text-xs font-bold tracking-wider transition-all border ${activeTab === tab.id ? 'bg-coquette-accent text-white border-coquette-accent shadow-md' : 'bg-white text-gray-400 hover:text-coquette-text border-gray-100 hover:border-coquette-border'}`}>{tab.label}</button>))}
                </div>
             )}
           </div>
        </div>

        <div className="flex items-center gap-4 self-center lg:self-center flex-shrink-0">
          <div className="mr-2 flex flex-col items-end flex-shrink-0">
            <span className="text-[9px] font-black text-coquette-subtext uppercase tracking-widest mb-1.5 px-1">Immersion Timer</span>
            <div className="flex items-center gap-2">
              <AnimatePresence>
                {isTimerRunning && linkedItemId && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="text-[10px] font-black uppercase tracking-tighter text-rose-400 bg-rose-50 px-3 py-2 rounded-full border border-rose-100 flex items-center gap-2 shadow-sm">
                     <LinkIcon className="w-2.5 h-2.5" /> {keepsakes.find(k => k.id === linkedItemId)?.title || 'Active Session'}
                  </motion.div>
                )}
              </AnimatePresence>
              <button onClick={toggleTimer} className={`group flex items-center gap-2.5 px-5 py-2 rounded-full font-bold text-xs transition-all shadow-md border ${isTimerRunning ? 'bg-rose-50 text-rose-500 border-rose-200 animate-pulse' : 'bg-white border-coquette-accent text-coquette-accent hover:bg-coquette-accent hover:text-white'}`}>
                {isTimerRunning ? <><Square className="w-3.5 h-3.5 fill-current" /> <span className="font-mono text-sm">{formatTime(displaySeconds)}</span></> : <><Plus className="w-3.5 h-3.5" /> <span className="uppercase tracking-widest font-black text-[10px]">Start Focus</span></>}
              </button>
            </div>
          </div>
          {stats.map((stat, idx) => (
             <div key={idx} className="w-16 h-16 lg:w-20 lg:h-20 rounded-full flex flex-col items-center justify-center relative border bg-white border-dashed border-coquette-gold/30 shadow-sm flex-shrink-0">
                <div className="absolute -top-2 p-1 rounded-full border bg-white border-coquette-gold/30 text-coquette-gold"><stat.icon className="w-2.5 h-2.5" /></div>
                <span className="text-lg lg:text-xl font-bold leading-none mt-1 font-coquette-header text-coquette-text">{stat.value}</span>
                <span className="text-[8px] lg:text-[9px] uppercase tracking-widest mt-1 text-coquette-subtext">{stat.label}</span>
             </div>
          ))}
          <button onClick={openAddModal} className="w-16 h-16 lg:w-20 lg:h-20 rounded-full flex flex-col items-center justify-center transition-all duration-300 bg-coquette-accent hover:bg-[#ff9eb0] text-white shadow-lg flex-shrink-0"><Plus className="w-6 h-6 lg:w-8 lg:h-8" /><span className="text-[8px] lg:text-[9px] font-bold uppercase mt-1">Add</span></button>
        </div>
      </div>

      <div className="flex-1 min-0">
        <AnimatePresence mode='wait'>
          {viewMode === 'GALLERY' ? (
            <motion.div key="gallery" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20 auto-rows-fr">
              {filteredItems.map((item) => (<MediaCard key={item.id} item={item as any} onEdit={openEditModal} />))}
            </motion.div>
          ) : (
            <motion.div key="deck" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full pb-20">
              <MiningCollection />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isSelectionModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsSelectionModalOpen(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden bg-white border border-coquette-border flex flex-col max-h-[85vh]">
              <div className="p-8 border-b border-rose-50 bg-rose-50/20"><h2 className="text-3xl font-bold font-coquette-header text-gray-800">What are you exploring?</h2><p className="text-sm font-coquette-body text-coquette-subtext italic mt-1">Select a companion for your journey or start a generic session.</p></div>
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <button onClick={() => startTimerWithSelection('')} className="group flex flex-col items-center justify-center p-8 rounded-[32px] border-2 border-dashed border-gray-200 bg-gray-50/30 hover:border-coquette-accent hover:bg-rose-50/50 transition-all duration-300 gap-4"><div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-gray-400 group-hover:text-coquette-accent group-hover:scale-110 transition-all shadow-sm"><Coffee className="w-8 h-8" /></div><div className="text-center"><h3 className="font-bold text-gray-700 font-coquette-header">Quick Session</h3><p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-widest">Generic Immersion</p></div></button>
                   {ongoingItems.map(item => (
                     <button key={item.id} onClick={() => startTimerWithSelection(item.id)} className="group flex items-center gap-4 p-4 rounded-[28px] border border-gray-100 bg-white hover:border-coquette-accent hover:shadow-lg transition-all duration-300 text-left"><div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 shadow-sm border border-rose-50"><img src={item.coverUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /></div><div className="flex-1 min-w-0"><h4 className="font-bold text-gray-800 font-coquette-header truncate text-sm">{item.title}</h4><div className="flex items-center gap-2 mt-1"><span className="text-[9px] font-black uppercase text-rose-300 tracking-wider px-1.5 py-0.5 rounded bg-rose-50/50 border border-rose-100/30">{item.type}</span><span className="text-[10px] text-gray-400 font-medium italic">{item.durationOrVolumes} {item.type === 'MANGA' ? 'Vols' : 'Mins'}</span></div></div><div className="w-8 h-8 rounded-full flex items-center justify-center text-gray-200 group-hover:text-coquette-accent transition-all"><ChevronRight className="w-5 h-5" /></div></button>
                   ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <LogMemoryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} editingId={editingId} />
    </motion.div>
  );
};

export default KeepsakesTab;
