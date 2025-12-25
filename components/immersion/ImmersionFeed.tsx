
import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MOCK_IMMERSION_VIDEOS } from '../../data/immersionData';
import ImmersionStage from './ImmersionStage';
import TheaterLanding from './TheaterLanding';
import UploadGateway from './UploadGateway';
import { useImmersionStore } from '../../store/useImmersionStore';

interface ImmersionFeedProps {
  isSidebarVisible: boolean;
  onToggleSidebar: () => void;
}

const ImmersionFeed: React.FC<ImmersionFeedProps> = ({ isSidebarVisible, onToggleSidebar }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { playlist, activeIndex, setActiveIndex } = useImmersionStore();
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const scrollPos = containerRef.current.scrollTop;
    const height = containerRef.current.clientHeight;
    const newIndex = Math.round(scrollPos / height);
    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex);
    }
  };

  const hasPlaylist = playlist.length > 0;

  return (
    <div className="h-screen w-full relative overflow-hidden bg-[#fffcfc]">
      <AnimatePresence mode="wait">
        {!hasPlaylist ? (
          <motion.div 
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="h-full w-full"
          >
            <TheaterLanding onOpenUpload={() => setIsUploadOpen(true)} />
          </motion.div>
        ) : (
          <motion.div 
            key="active-feed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            ref={containerRef}
            onScroll={handleScroll}
            className="h-screen overflow-y-scroll snap-y snap-mandatory scroll-smooth scrollbar-hide"
          >
            {playlist.map((video, idx) => (
              <ImmersionStage 
                key={video.videoId} 
                video={video} 
                isActive={activeIndex === idx} 
                index={idx}
                total={playlist.length}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <UploadGateway isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
    </div>
  );
};

export default ImmersionFeed;
