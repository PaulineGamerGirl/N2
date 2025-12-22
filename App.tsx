
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import QuestMap from './components/QuestMap';
import SenseiChat from './components/SenseiChat';
import LogModal from './components/LogModal';
import SyntaxArchive from './components/SyntaxArchive';
import KeepsakesTab from './components/KeepsakesTab';
import MessengerTab from './components/MessengerTab';
import ActivityLogTab from './components/ActivityLogTab';
import { View } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  
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
        />

        <main className="flex-1 overflow-y-auto pl-20 lg:pl-64 transition-all duration-300 scrollbar-thin scrollbar-thumb-coquette-accent">
          {currentView === 'dashboard' && <Dashboard onOpenLogModal={() => setIsLogModalOpen(true)} />}
          {currentView === 'questmap' && <QuestMap />}
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
