
import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ImmersionStage from './ImmersionStage';
import TheaterLanding from './TheaterLanding';
import UploadGateway from './UploadGateway';
import AnimeStage from '../anime/AnimeStage';
import SeriesLibrary from './SeriesLibrary';
import { useImmersionStore } from '../../store/useImmersionStore';
import { Library, X, ChevronDown, Smartphone, Clapperboard, Sparkles } from 'lucide-react';

interface ImmersionFeedProps {
  isSidebarVisible: boolean;
  onToggleSidebar: () => void;
}

const ImmersionFeed: React.FC<ImmersionFeedProps> = ({ isSidebarVisible, onToggleSidebar }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { 
    playlist, 
    activeIndex, 
    setActiveIndex, 
    viewMode, 
    activeSeriesId, 
    activeEpisodeNumber, 
    loadEpisodeMetadata, 
    videoSources,
    isLibraryOpen,
    setLibraryOpen
  } = useImmersionStore();
  
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const hasPlaylist = playlist.length > 0;

  // Check if we actually have a video blob for the current item
  const currentVideo = playlist[activeIndex];
  const hasVideoSource = currentVideo ? !!videoSources[currentVideo.videoId || ''] : false;

  const handleScroll = () => {
    if (!containerRef.current || viewMode === 'cinema') return;
    const scrollPos = containerRef.current.scrollTop;
    const height = containerRef.current.clientHeight;
    if (height === 0) return;
    const newIndex = Math.round(scrollPos / height);
    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex);
    }
  };

  // Effect: When an episode is selected, load metadata if needed
  useEffect(() => {
    if (activeSeriesId && activeEpisodeNumber && !hasPlaylist) {
      loadEpisodeMetadata(activeSeriesId, activeEpisodeNumber);
    }
  }, [activeSeriesId, activeEpisodeNumber, hasPlaylist, loadEpisodeMetadata]);

  return (
    <div className={`h-screen w-full relative overflow-hidden bg-[#fffcfc]`}>
      
      {/* LIBRARY DRAWER */}
      <AnimatePresence>
        {isLibraryOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 150, mass: 0.8 }}
            className="absolute inset-0 z-[110] overflow-hidden shadow-2xl bg-[#fffcfc]"
          >
             <div className="h-full relative">
                <SeriesLibrary />
                <button 
                  onClick={() => setLibraryOpen(false)}
                  className="absolute top-8 right-12 z-50 p-3 rounded-full bg-white shadow-xl text-rose-400 hover:text-rose-600 transition-all border border-rose-50 hover:scale-110 active:scale-95"
                >
                  <X className="w-6 h-6" />
                </button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {/* If we have no playlist OR we have a playlist but no video file (JIT Mounting), show landing */}
        {(!hasPlaylist || (viewMode === 'cinema' && !hasVideoSource)) ? (
          <motion.div 
            key={`landing-${viewMode}`}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="h-full w-full"
          >
            <TheaterLanding 
              onOpenUpload={() => setIsUploadOpen(true)} 
              mode={viewMode}
            />
          </motion.div>
        ) : (
          <motion.div 
            key="feed-active"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="h-full w-full relative"
          >
            <div className="h-full w-full overflow-hidden">
              {viewMode === 'standard' ? (
                <div 
                  ref={containerRef}
                  onScroll={handleScroll}
                  className="h-screen overflow-y-auto snap-y snap-mandatory scroll-smooth scrollbar-hide"
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
                </div>
              ) : (
                <AnimeStage 
                  video={playlist[activeIndex] || playlist[0]} 
                  index={activeIndex} 
                  total={playlist.length} 
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <UploadGateway isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
    </div>
  );
};

export default ImmersionFeed;
