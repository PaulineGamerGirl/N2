
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PanelLeft, Loader2, Sparkles } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import QuestMap from './components/QuestMap';
import SenseiChat from './components/SenseiChat';
import LogModal from './components/LogModal';
import SyntaxArchive from './components/SyntaxArchive';
import KeepsakesTab from './components/KeepsakesTab';
import MessengerTab from './components/MessengerTab';
import ActivityLogTab from './components/ActivityLogTab';
import ImmersionFeed from './components/immersion/ImmersionFeed';
import AnimeStage from './components/anime/AnimeStage';
import GlobalNotification from './components/GlobalNotification';
import { View } from './types';
import { useImmersionStore } from './store/useImmersionStore';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  
  const { playlist, activeIndex, isAnalyzing } = useImmersionStore();
  
  const toggleSidebar = () => setIsSidebarVisible(!isSidebarVisible);

  return (
    <div className="min-h-screen font-sans selection:bg-coquette-accent selection:text-white overflow-hidden relative transition-colors duration-500 bg-coquette-bg text-coquette-text">
      <div className="fixed inset-0 z-0 bg-coquette-bg">
         <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]"></div>
         <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-pink-200/20 rounded-full blur-[100px]"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-coquette-gold/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-10 flex h-screen">
        <Sidebar 
          currentView={currentView} 
          onViewChange={setCurrentView}
          onSummonSensei={() => setIsChatOpen(true)}
          isHidden={!isSidebarVisible}
          onToggleHide={toggleSidebar}
        />

        <AnimatePresence>
          {!isSidebarVisible && (
            <motion.button
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -50, opacity: 0 }}
              onClick={toggleSidebar}
              className="fixed left-0 top-1/2 -translate-y-1/2 z-[70] bg-white border-y border-r border-rose-100 p-3 rounded-r-2xl shadow-xl text-rose-300 hover:text-rose-500 hover:pl-5 transition-all group"
              title="Show Sidebar"
            >
              <PanelLeft className="w-5 h-5" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Global Background Task Indicator */}
        <AnimatePresence>
          {isAnalyzing && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="fixed bottom-6 right-6 z-[70] bg-white/80 backdrop-blur-md border border-rose-100 px-5 py-3 rounded-full shadow-lg flex items-center gap-3"
            >
               <Loader2 className="w-4 h-4 text-rose-400 animate-spin" />
               <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Chronicle Syncing...</span>
               <Sparkles className="w-3 h-3 text-rose-300 animate-pulse" />
            </motion.div>
          )}
        </AnimatePresence>

        <main 
          className={`
            flex-1 overflow-y-auto transition-all duration-500 scrollbar-thin scrollbar-thumb-coquette-accent
            ${isSidebarVisible ? 'pl-20 lg:pl-64' : 'pl-0'}
            ${currentView === 'theater' || currentView === 'anime' ? 'bg-black' : ''}
          `}
        >
          {currentView === 'dashboard' && <Dashboard onOpenLogModal={() => setIsLogModalOpen(true)} />}
          {currentView === 'questmap' && <QuestMap />}
          {currentView === 'theater' && (
            <ImmersionFeed 
              isSidebarVisible={isSidebarVisible} 
              onToggleSidebar={toggleSidebar} 
            />
          )}
          {currentView === 'anime' && (
            <AnimeStage 
              video={playlist[activeIndex] || playlist[0]} 
              index={activeIndex} 
              total={playlist.length} 
            />
          )}
          {currentView === 'syntax' && <SyntaxArchive />}
          {currentView === 'inventory' && <KeepsakesTab />}
          {currentView === 'messenger' && <MessengerTab />}
          {currentView === 'activity' && <ActivityLogTab />}
        </main>

        <SenseiChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      </div>

      <LogModal isOpen={isLogModalOpen} onClose={() => setIsLogModalOpen(false)} />
      
      {/* Global Sync Notification */}
      <GlobalNotification />
    </div>
  );
};

export default App;
