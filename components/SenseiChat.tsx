import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Activity, Sparkles, BookHeart } from 'lucide-react';
import { ChatMessage } from '../types';
import { talkToSensei, initSensei } from '../services/aiSensei';

interface SenseiChatProps {
  isOpen: boolean;
  onClose: () => void;
}

// Typewriter Effect Component
const Typewriter: React.FC<{ text: string; speed?: number }> = ({ text, speed = 20 }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let i = 0;
    setDisplayedText('');
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayedText((prev) => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return <span>{displayedText}</span>;
};

const SenseiChat: React.FC<SenseiChatProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Initialize and Auto-Greet
  useEffect(() => {
    if (isOpen && !hasInitialized) {
      initSensei();
      if (messages.length === 0) {
         const initialMsg: ChatMessage = {
             id: 'init',
             role: 'model',
             text: "Greetings, dear student. How may I assist your studies today?",
             timestamp: Date.now()
         };
         setMessages([initialMsg]);
      }
      setHasInitialized(true);
    }
  }, [isOpen, hasInitialized, messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (overrideText?: string, hiddenPrompt?: string) => {
    const textToSend = overrideText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Use hidden prompt if provided (for gamification buttons), otherwise user text
    const prompt = hiddenPrompt || textToSend;
    
    const responseText = await talkToSensei(prompt);

    const botMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, botMsg]);
    setIsLoading(false);
  };

  const handleMotivation = () => {
    handleSend("✨ Inspiration", "Give me a sweet, poetic, and encouraging quote about learning Japanese. Keep it short and elegant.");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop (Mobile only) */}
          <motion.div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Slide-over Panel */}
          <motion.div
            className="fixed right-0 top-0 h-screen w-full lg:w-[450px] z-40 flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-[#fffcfc] border-l-4 border-double border-coquette-gold/30"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Header */}
            <div className="p-4 flex justify-between items-center bg-pink-50/50 border-b border-coquette-border">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center border bg-white border-coquette-gold/30 text-coquette-accent">
                    <BookHeart className="w-5 h-5" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 animate-pulse bg-coquette-sage border-white"></div>
                </div>
                <div>
                  <h3 className="font-bold tracking-wider text-sm font-coquette-header text-coquette-text">
                    Sensei's Study
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-coquette-subtext font-coquette-body">
                    <Activity className="w-3 h-3" />
                    Guidance Available
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-full transition-colors hover:bg-coquette-bg text-coquette-subtext hover:text-coquette-text">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-coquette-accent/50 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]">
              {messages.map((msg, index) => {
                const isLatestModel = msg.role === 'model' && index === messages.length - 1 && !isLoading;
                
                // Coquette Styles
                const coquetteUser = 'bg-coquette-accent text-white rounded-br-none border border-coquette-accent shadow-sm';
                const coquetteModel = 'bg-white border border-coquette-border text-coquette-text rounded-bl-none shadow-[0_2px_10px_rgba(244,172,183,0.1)]';

                return (
                  <div 
                    key={msg.id} 
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] rounded-2xl p-4 text-sm backdrop-blur-sm leading-relaxed ${
                      msg.role === 'user' ? coquetteUser : coquetteModel
                    } font-coquette-body`}>
                      
                      {msg.role === 'model' && (
                          <div className="flex items-center gap-2 mb-2 text-[10px] font-bold uppercase tracking-widest border-b pb-1 text-coquette-gold border-coquette-gold/20">
                              <Sparkles className="w-3 h-3" />
                              Sensei
                          </div>
                      )}
                      
                      <div>
                        {/* Only use Typewriter for the very latest message from Sensei */}
                        {isLatestModel ? (
                           <Typewriter text={msg.text} />
                        ) : (
                           msg.text
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {isLoading && (
                 <div className="flex justify-start">
                    <div className="rounded-2xl p-4 rounded-bl-none flex items-center gap-2 border bg-white border-coquette-border">
                        <span className="flex gap-1">
                          {[0, 1, 2].map(i => (
                             <span key={i} className="w-1.5 h-1.5 rounded-full animate-bounce bg-coquette-accent" style={{ animationDelay: `${-0.3 + (i * 0.15)}s` }}></span>
                          ))}
                        </span>
                    </div>
                 </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t bg-white border-coquette-border">
              <div className="relative flex gap-2">
                <button
                   onClick={handleMotivation}
                   disabled={isLoading}
                   className="p-3 rounded-xl border transition-all group bg-pink-50 border-coquette-accent/30 text-coquette-accent hover:bg-coquette-accent hover:text-white"
                   title="Inspire Me"
                >
                   <Sparkles className="w-5 h-5" />
                </button>
                <div className="flex-1 relative">
                    <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask Sensei..."
                    className="w-full rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:ring-1 transition-all text-sm bg-[#fffcfc] border border-gray-200 text-coquette-text focus:border-coquette-accent focus:ring-coquette-accent placeholder:text-gray-400 font-coquette-body"
                    disabled={isLoading}
                    />
                    <button 
                    onClick={() => handleSend()}
                    disabled={isLoading || !input.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded transition-colors disabled:opacity-50 bg-coquette-accent text-white hover:bg-coquette-subtext"
                    >
                    <Send className="w-4 h-4" />
                    </button>
                </div>
              </div>
              <div className="mt-2 text-center">
                 <span className="text-[10px] uppercase tracking-widest text-coquette-subtext font-coquette-body italic">
                   Your journey is unique.
                 </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SenseiChat;