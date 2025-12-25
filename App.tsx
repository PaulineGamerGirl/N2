
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PanelLeft } from 'lucide-react';
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
import { View } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  
  const toggleSidebar = () => setIsSidebarVisible(!isSidebarVisible);

  return (
    <div className="min-h-screen font-sans selection:bg-coquette-accent selection:text-white overflow-hidden relative transition-colors duration-500 bg-coquette-bg text-coquette-text">
      {/* Background Layer */}
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

        {/* Floating Sidebar Restore Tab */}
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

        <main 
          className={`
            flex-1 overflow-y-auto transition-all duration-500 scrollbar-thin scrollbar-thumb-coquette-accent
            ${isSidebarVisible ? 'pl-20 lg:pl-64' : 'pl-0'}
            ${currentView === 'theater' ? 'bg-black' : ''}
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
          {currentView === 'syntax' && <SyntaxArchive />}
          {currentView === 'inventory' && <KeepsakesTab />}
          {currentView === 'messenger' && <MessengerTab />}
          {currentView === 'activity' && <ActivityLogTab />}
        </main>

        <SenseiChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      </div>

      <LogModal isOpen={isLogModalOpen} onClose={() => setIsLogModalOpen(false)} />
    </div>
  );
};

export default App;
