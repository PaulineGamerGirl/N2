
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Library, Clock, BookOpen, Plus, X, Star, Trash2, AlertCircle, Calendar, Play, Square, Link as LinkIcon, Image as ImageIcon, CheckCircle2, Circle, Coffee, ChevronRight, Search } from 'lucide-react';
import { useProgressStore, Keepsake, MediaType, MediaStatus } from '../store/progressStore';
import MediaCard from './MediaCard';
import { containerVariants } from '../constants';

const KeepsakesTab: React.FC = () => {
  const { keepsakes, addKeepsake, updateKeepsake, removeKeepsake, addActivityLog, addMinutesToKeepsake } = useProgressStore();
  const [activeTab, setActiveTab] = useState<'ALL' | MediaType>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
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
      // Stop & Log
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
      // Open selection modal instead of immediately starting
      setIsSelectionModalOpen(true);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // --- Modal Form State ---
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<MediaType>('ANIME');
  const [newStatus, setNewStatus] = useState<MediaStatus>('ONGOING');
  const [newCover, setNewCover] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [newMetric, setNewMetric] = useState('');
  const [newDateCompleted, setNewDateCompleted] = useState('');
  const [newCaption, setNewCaption] = useState('');

  // --- Filter Logic ---
  const filteredItems = activeTab === 'ALL' 
    ? keepsakes 
    : keepsakes.filter(item => item.type === activeTab);

  // For the linked immersion selector: only ongoing items
  const ongoingItems = keepsakes.filter(k => k.status === 'ONGOING');

  const calculateStats = () => {
    let totalHours = 0;
    let totalVolumes = 0;
    keepsakes.forEach(item => {
      if (item.type === 'MANGA') totalVolumes += item.durationOrVolumes || 0;
      else totalHours += (item.durationOrVolumes || 0) / 60;
    });
    // Live calculated total
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

  const resetForm = () => {
    setEditingId(null);
    setConfirmDelete(false);
    setNewTitle('');
    setNewType('ANIME');
    setNewStatus('ONGOING');
    setNewCover('');
    setNewRating(5);
    setNewMetric('');
    setNewDateCompleted(new Date().toISOString().split('T')[0]);
    setNewCaption('');
  };

  const openAddModal = () => { resetForm(); setIsModalOpen(true); };
  const openEditModal = (id: string) => {
    const item = keepsakes.find(k => k.id === id);
    if (!item) return;
    setEditingId(id);
    setConfirmDelete(false);
    setNewTitle(item.title);
    setNewType(item.type);
    setNewStatus(item.status || 'ONGOING');
    setNewCover(item.coverUrl);
    setNewRating(item.rating);
    setNewMetric(item.durationOrVolumes ? item.durationOrVolumes.toString() : '');
    setNewDateCompleted(item.dateCompleted || item.dateAdded);
    setNewCaption(item.caption);
    setIsModalOpen(true);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!editingId) return;
    if (!confirmDelete) { setConfirmDelete(true); return; }
    removeKeepsake(editingId);
    setIsModalOpen(false);
    resetForm();
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const commonData = {
      title: newTitle,
      type: newType,
      status: newStatus,
      coverUrl: newCover || 'https://via.placeholder.com/300x400?text=No+Cover',
      rating: newRating,
      caption: newCaption,
      durationOrVolumes: newMetric === '' ? 0 : Number(newMetric),
      dateCompleted: newDateCompleted,
    };
    if (editingId) updateKeepsake(editingId, commonData);
    else {
      const newItem: Keepsake = {
        id: crypto.randomUUID(),
        ...commonData,
        dateAdded: new Date().toISOString().split('T')[0]
      };
      addKeepsake(newItem);
    }
    setIsModalOpen(false);
    resetForm();
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="p-6 lg:p-8 w-full max-w-[1600px] mx-auto min-h-full flex flex-col">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 border-b pb-6 gap-6 border-coquette-gold/30">
        <div className="flex-1 w-full lg:max-w-4xl">
           <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-pink-50 text-coquette-accent flex-shrink-0"><Sparkles className="w-5 h-5" /></div>
              <h1 className="text-3xl lg:text-4xl font-bold font-coquette-header text-coquette-text whitespace-nowrap">My Keepsakes</h1>
           </div>
           <div className="flex flex-col md:flex-row md:items-center gap-6">
             <p className="text-sm font-coquette-body text-coquette-subtext italic min-w-[200px] leading-relaxed">A treasured archive of the worlds I've explored.</p>
             <div className="hidden md:block w-px h-8 bg-coquette-border flex-shrink-0"></div>
             <div className="flex flex-nowrap gap-2 overflow-x-auto scrollbar-hide pb-1">
               {tabs.map(tab => (
                  <button 
                    key={tab.id} 
                    onClick={() => setActiveTab(tab.id as any)} 
                    className={`px-5 py-2 rounded-full text-xs font-bold tracking-wider transition-all relative overflow-hidden flex-shrink-0 border ${activeTab === tab.id ? 'bg-coquette-accent text-white border-coquette-accent shadow-md' : 'bg-white text-gray-400 hover:text-coquette-text border-gray-100 hover:border-coquette-border'}`}
                  >
                    {tab.label}
                  </button>
               ))}
             </div>
           </div>
        </div>

        {/* COMPACT STATS & IMMERSION TIMER */}
        <div className="flex items-center gap-4 self-center lg:self-center flex-shrink-0">
          {/* Active Immersion Timer Widget */}
          <div className="mr-2 flex flex-col items-end flex-shrink-0">
            <span className="text-[9px] font-black text-coquette-subtext uppercase tracking-widest mb-1.5 px-1">Immersion Timer</span>
            <div className="flex items-center gap-2">
              <AnimatePresence>
                {isTimerRunning && linkedItemId && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="text-[10px] font-black uppercase tracking-tighter text-rose-400 bg-rose-50 px-3 py-2 rounded-full border border-rose-100 flex items-center gap-2 shadow-sm"
                  >
                     <LinkIcon className="w-2.5 h-2.5" />
                     {keepsakes.find(k => k.id === linkedItemId)?.title || 'Active Session'}
                  </motion.div>
                )}
              </AnimatePresence>
              <button
                onClick={toggleTimer}
                className={`group flex items-center gap-2.5 px-5 py-2 rounded-full font-bold text-xs transition-all shadow-md border ${isTimerRunning ? 'bg-rose-50 text-rose-500 border-rose-200 animate-pulse' : 'bg-white border-coquette-accent text-coquette-accent hover:bg-coquette-accent hover:text-white'}`}
              >
                {isTimerRunning ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" /> 
                    <span className="font-mono text-sm">{formatTime(displaySeconds)}</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current group-hover:scale-110 transition-transform" /> 
                    <span className="uppercase tracking-widest font-black text-[10px]">Start Focus</span>
                  </>
                )}
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

      {/* GRID */}
      <AnimatePresence mode='popLayout'>
        <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20 auto-rows-fr">
          {filteredItems.map((item) => <MediaCard key={item.id} item={item as any} onEdit={openEditModal} />)}
        </motion.div>
      </AnimatePresence>

      {/* IMMERSION SELECTION MODAL */}
      <AnimatePresence>
        {isSelectionModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsSelectionModalOpen(false)} />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 20 }} 
              className="relative w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden bg-white border border-coquette-border flex flex-col max-h-[85vh]"
            >
              {/* Header */}
              <div className="p-8 border-b border-rose-50 bg-rose-50/20">
                <div className="flex justify-between items-start mb-2">
                   <div>
                      <h2 className="text-3xl font-bold font-coquette-header text-gray-800">What are you exploring?</h2>
                      <p className="text-sm font-coquette-body text-coquette-subtext italic mt-1">Select a companion for your journey or start a generic session.</p>
                   </div>
                   <button onClick={() => setIsSelectionModalOpen(false)} className="p-2 rounded-full hover:bg-white text-gray-400 hover:text-rose-500 transition-all"><X className="w-6 h-6" /></button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {/* Generic Session Option */}
                   <button 
                     onClick={() => startTimerWithSelection('')}
                     className="group flex flex-col items-center justify-center p-8 rounded-[32px] border-2 border-dashed border-gray-200 bg-gray-50/30 hover:border-coquette-accent hover:bg-rose-50/50 transition-all duration-300 gap-4"
                   >
                     <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-gray-400 group-hover:text-coquette-accent group-hover:scale-110 transition-all shadow-sm">
                        <Coffee className="w-8 h-8" />
                     </div>
                     <div className="text-center">
                        <h3 className="font-bold text-gray-700 font-coquette-header">Quick Session</h3>
                        <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-widest">Generic Immersion</p>
                     </div>
                   </button>

                   {/* Ongoing Content Grid */}
                   {ongoingItems.length === 0 ? (
                      <div className="md:col-span-1 flex flex-col items-center justify-center p-8 rounded-[32px] border-2 border-gray-100 bg-gray-50/10 opacity-60">
                        <Library className="w-10 h-10 text-gray-300 mb-3" />
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center leading-relaxed">No ongoing series found.<br/>Add items as "Ongoing" to link them.</p>
                      </div>
                   ) : (
                     ongoingItems.map(item => (
                       <button 
                         key={item.id}
                         onClick={() => startTimerWithSelection(item.id)}
                         className="group flex items-center gap-4 p-4 rounded-[28px] border border-gray-100 bg-white hover:border-coquette-accent hover:shadow-lg hover:shadow-rose-100/50 transition-all duration-300 text-left"
                       >
                         <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 shadow-sm border border-rose-50">
                            <img src={item.coverUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                         </div>
                         <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-800 font-coquette-header truncate text-sm">{item.title}</h4>
                            <div className="flex items-center gap-2 mt-1">
                               <span className="text-[9px] font-black uppercase text-rose-300 tracking-wider px-1.5 py-0.5 rounded bg-rose-50/50 border border-rose-100/30">{item.type}</span>
                               <span className="text-[10px] text-gray-400 font-medium italic">{item.durationOrVolumes} {item.type === 'MANGA' ? 'Vols' : 'Mins'}</span>
                            </div>
                         </div>
                         <div className="w-8 h-8 rounded-full flex items-center justify-center text-gray-200 group-hover:text-coquette-accent group-hover:bg-rose-50 transition-all">
                            <ChevronRight className="w-5 h-5" />
                         </div>
                       </button>
                     ))
                   )}
                </div>
              </div>

              {/* Footer Indicator */}
              <div className="p-6 bg-gray-50/50 border-t border-rose-50 text-center">
                 <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2">
                    <Sparkles className="w-3 h-3" /> Select to begin your chronicle
                 </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT/LOG MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-lg rounded-[30px] p-8 shadow-2xl overflow-hidden bg-[#fffcfc] border border-coquette-gold/30">
               <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold font-coquette-header text-coquette-text">{editingId ? 'Edit Memory' : 'Log a New Memory'}</h2><button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button></div>
               <form onSubmit={handleSave} className="space-y-5">
                 {/* Status Toggle */}
                 <div className="flex items-center gap-4 bg-gray-50/50 p-2 rounded-2xl border border-gray-100">
                    <button 
                      type="button" 
                      onClick={() => setNewStatus('ONGOING')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${newStatus === 'ONGOING' ? 'bg-white text-emerald-500 shadow-sm border border-emerald-100' : 'text-gray-400'}`}
                    >
                      {newStatus === 'ONGOING' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                      Ongoing
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setNewStatus('FINISHED')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${newStatus === 'FINISHED' ? 'bg-white text-rose-500 shadow-sm border border-rose-100' : 'text-gray-400'}`}
                    >
                      {newStatus === 'FINISHED' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                      Finished
                    </button>
                 </div>

                 <div><label className="block text-xs font-bold uppercase tracking-wider mb-2 text-coquette-subtext">Title</label><input type="text" required value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2 transition-all bg-white border-gray-200 text-coquette-text focus:border-coquette-accent" /></div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-xs font-bold uppercase tracking-wider mb-2 text-coquette-subtext">Category</label><select value={newType} onChange={e => setNewType(e.target.value as MediaType)} className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2 transition-all appearance-none bg-white border-gray-200 text-coquette-text focus:border-coquette-accent"><option value="ANIME">Anime</option><option value="MANGA">Manga</option><option value="GAME">Game</option><option value="SHOW">Show</option></select></div>
                    <div><label className="block text-xs font-bold uppercase tracking-wider mb-2 text-coquette-subtext">Rating</label><div className="flex gap-1 items-center h-[46px]">{[1, 2, 3, 4, 5].map(star => (<button type="button" key={star} onClick={() => setNewRating(star)} className={`transition-colors ${star <= newRating ? 'text-coquette-gold' : 'text-gray-300'}`}><Star className="w-6 h-6 fill-current" /></button>))}</div></div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-coquette-subtext flex items-center gap-1">
                            <ImageIcon className="w-3 h-3" /> Cover URL
                        </label>
                        <div className="flex gap-2">
                           {newCover && (
                               <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 bg-gray-50">
                                   <img src={newCover} alt="Thumb" className="w-full h-full object-cover" onError={(e) => { (e.target as any).src='https://via.placeholder.com/100x100?text=?'; }} />
                               </div>
                           )}
                           <input 
                              type="text" 
                              value={newCover} 
                              onChange={e => setNewCover(e.target.value)} 
                              placeholder="https://..."
                              className="flex-1 p-3 rounded-xl border focus:outline-none focus:ring-2 transition-all bg-white border-gray-200 text-coquette-text focus:border-coquette-accent text-xs" 
                           />
                        </div>
                    </div>
                    <div><label className="block text-xs font-bold uppercase tracking-wider mb-2 text-coquette-subtext">{newType === 'MANGA' ? 'Volumes Read' : 'Total Mins (Immersion)'}</label><input type="number" value={newMetric} onChange={e => setNewMetric(e.target.value)} className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2 transition-all bg-white border-gray-200 text-coquette-text focus:border-coquette-accent" placeholder="e.g. 120" /></div>
                 </div>
                 <div><label className="block text-xs font-bold uppercase tracking-wider mb-2 text-coquette-subtext">Date Logged</label><div className="relative"><input type="date" required value={newDateCompleted} onChange={e => setNewDateCompleted(e.target.value)} className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2 transition-all bg-white border-gray-200 text-coquette-text focus:border-coquette-accent" /><Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" /></div></div>
                 <div><div className="flex justify-between items-center mb-2"><label className="block text-xs font-bold uppercase tracking-wider text-coquette-subtext">Reflections</label><span className={`text-[10px] ${newCaption.length > 75 ? 'text-red-500' : 'text-gray-400'}`}>{newCaption.length}/75</span></div><textarea rows={2} required maxLength={75} value={newCaption} onChange={e => setNewCaption(e.target.value)} placeholder="Write a sweet note..." className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2 transition-all resize-none bg-white border-gray-200 text-coquette-text focus:border-coquette-accent" /></div>
                 <div className="flex gap-4 pt-2">
                    {editingId && (<button type="button" onClick={handleRemove} className={`px-4 py-4 rounded-xl border transition-all duration-200 flex items-center justify-center gap-2 min-w-[60px] ${confirmDelete ? 'bg-red-500 text-white border-red-500' : 'border-red-200 text-red-400 hover:bg-red-50'}`}>{confirmDelete ? <AlertCircle className="w-5 h-5" /> : <Trash2 className="w-5 h-5" />}</button>)}
                    <button type="submit" className="flex-1 py-4 rounded-xl font-bold tracking-wide transition-all shadow-lg bg-coquette-accent text-white hover:bg-[#ff9eb0]">{editingId ? 'Update Entry' : 'Save to Collection'}</button>
                 </div>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default KeepsakesTab;
