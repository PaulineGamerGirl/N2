
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, RefreshCw, FileText, CheckCircle, ChevronRight, Lightbulb, Sparkles, BookHeart, GraduationCap, Zap } from 'lucide-react';
import { ExamMode, QuizQuestion } from '../types';
import { generateQuiz } from '../services/examService';
import { useProgressStore } from '../store/progressStore';

interface SimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: ExamMode;
  isJLPTMode?: boolean;
  specificPoints?: string[];
}

type SimulationPhase = 'LOADING' | 'BRIEFING' | 'EXAM' | 'RESULTS';
type FeedbackState = 'IDLE' | 'CORRECT' | 'WRONG';

const SimulationModal: React.FC<SimulationModalProps> = ({ 
  isOpen, 
  onClose, 
  mode, 
  isJLPTMode = true, 
  specificPoints = [] 
}) => {
  const { masteredChapters, grammarContext } = useProgressStore();
  
  const [phase, setPhase] = useState<SimulationPhase>('LOADING');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedbackState, setFeedbackState] = useState<FeedbackState>('IDLE');
  const [wrongQuestions, setWrongQuestions] = useState<QuizQuestion[]>([]);
  
  useEffect(() => {
    if (isOpen) {
      loadExamData();
    } else {
      setTimeout(() => {
        setPhase('LOADING');
        setFeedbackState('IDLE');
        setScore(0);
        setCurrentIndex(0);
        setWrongQuestions([]);
      }, 500);
    }
  }, [isOpen]);

  const loadExamData = async () => {
    setPhase('LOADING');
    setWrongQuestions([]);
    try {
      const data = await generateQuiz(masteredChapters, mode, grammarContext, specificPoints, isJLPTMode);
      setQuestions(data);
      setPhase('BRIEFING');
    } catch (e) {
      console.error(e);
      onClose(); 
    }
  };

  const handleStartExam = () => {
    setPhase('EXAM');
  };

  const handleAnswer = (optionIndex: number) => {
    if (feedbackState !== 'IDLE') return;

    const currentQ = questions[currentIndex];
    const isCorrect = optionIndex === currentQ.correctIndex;

    if (isCorrect) {
      setScore(prev => prev + 1);
      setFeedbackState('CORRECT');
      setTimeout(() => advanceQuestion(), 1200);
    } else {
      setFeedbackState('WRONG');
      setWrongQuestions(prev => [...prev, currentQ]);
    }
  };

  const advanceQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setFeedbackState('IDLE');
    } else {
      setPhase('RESULTS');
    }
  };

  const handleResumeMission = () => advanceQuestion();

  const getTacticalTip = () => {
    if (wrongQuestions.length === 0) return null;
    const counts: Record<string, number> = {};
    wrongQuestions.forEach(q => {
      const topic = q.topic || "General Grammar";
      counts[topic] = (counts[topic] || 0) + 1;
    });

    let maxTopic = '';
    let maxCount = 0;
    Object.entries(counts).forEach(([topic, count]) => {
      if (count > maxCount) {
        maxCount = count;
        maxTopic = topic;
      }
    });

    return { weakness: maxTopic, count: maxCount };
  };

  const tacticalData = getTacticalTip();
  const accuracy = questions.length > 0 ? score / questions.length : 0;
  const circumference = 2 * Math.PI * 80;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-white/70">
        
        {phase === 'LOADING' && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center space-y-4"
          >
            <div className="relative w-24 h-24">
                <div className="absolute inset-0 border-4 border-coquette-accent/30 rounded-full animate-ping"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <BookHeart className="w-10 h-10 text-coquette-accent animate-pulse" />
                </div>
            </div>
            <h2 className="font-bold tracking-widest animate-pulse font-coquette-header text-coquette-text text-xl">
              {isJLPTMode ? "Initializing Exam Core..." : "Analyzing Concept Depth..."}
            </h2>
          </motion.div>
        )}

        {phase === 'BRIEFING' && (
           <motion.div 
             initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}
             className="w-full max-w-2xl rounded-[30px] overflow-hidden shadow-2xl relative bg-[#fffcfc] border border-coquette-gold/30"
           >
             <div className="p-8 text-center border-b bg-pink-50/20 border-coquette-border">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6 bg-white shadow-sm text-coquette-accent">
                   {isJLPTMode ? <GraduationCap className="w-8 h-8" /> : <Zap className="w-8 h-8" />}
                </div>
                <h2 className="text-3xl font-bold mb-2 font-coquette-header text-coquette-text">
                   {isJLPTMode ? "JLPT Simulation" : "Deep Understanding Drill"}
                </h2>
                <p className="tracking-widest text-sm mb-6 text-coquette-subtext font-coquette-body font-bold">
                   Topic: {mode} • {specificPoints.length > 0 ? `${specificPoints.length} Selected Points` : 'Entire Chapter Scope'}
                </p>
                <div className="p-6 rounded-lg border text-lg leading-relaxed bg-white border-coquette-border text-gray-600 font-coquette-body italic">
                   {specificPoints.length > 0 ? (
                     <p>Focusing strictly on: <span className="font-bold text-coquette-accent">{specificPoints.join(', ')}</span>.</p>
                   ) : isJLPTMode ? (
                     <p>Exam mode engaged. Focus on pattern recognition and structural accuracy across the selected chapters.</p>
                   ) : (
                     <p>Comprehension mode engaged. Focus on translation, nuance, and active production within the selected scope.</p>
                   )}
                </div>
             </div>
             <div className="p-6 flex justify-center bg-white">
                <button 
                  onClick={handleStartExam}
                  className="w-full max-w-sm py-4 font-bold rounded-xl tracking-wide transition-all transform hover:scale-[1.02] bg-coquette-accent hover:bg-[#ff9eb0] text-white font-coquette-body shadow-[0_4px_20px_rgba(244,172,183,0.4)]"
                >
                  Engage
                </button>
             </div>
           </motion.div>
        )}

        {phase === 'EXAM' && questions[currentIndex] && (
          <motion.div 
            key="exam-container"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="w-full max-w-3xl relative"
          >
            <div className="flex justify-between items-center mb-6 px-2">
               <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-coquette-subtext">
                  <span className={`w-2 h-2 rounded-full ${feedbackState === 'IDLE' ? 'animate-pulse' : ''} bg-coquette-gold`}></span>
                  {isJLPTMode ? 'EXAM IN PROGRESS' : 'DRILL ACTIVE'}
               </div>
               <div className="font-bold text-lg font-coquette-header text-coquette-text">
                 Q-{currentIndex + 1} <span className="opacity-50">/</span> {questions.length}
               </div>
            </div>

            <div className="border rounded-[30px] overflow-hidden shadow-2xl relative min-h-[400px] bg-white border-coquette-border">
              <div className="p-8 lg:p-12 border-b min-h-[250px] flex items-center justify-center bg-[#fffcfc] border-gray-100">
                 <h3 className={`font-serif leading-loose tracking-wide whitespace-pre-wrap
                   ${questions[currentIndex].question.length > 80 ? 'text-lg lg:text-xl text-left' : 'text-2xl lg:text-3xl text-center'}
                   text-coquette-text
                 `}>
                   {questions[currentIndex].question}
                 </h3>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 bg-white">
                {questions[currentIndex].options.map((option, idx) => {
                  let btnStyle = "bg-white border-2 border-gray-100 text-gray-600 hover:border-coquette-accent/50 hover:bg-pink-50/30";
                  if (feedbackState === 'CORRECT' && idx === questions[currentIndex].correctIndex) {
                    btnStyle = "border-coquette-sage bg-coquette-sage/10 text-coquette-sage font-bold shadow-sm";
                  } else if (feedbackState === 'WRONG' && idx !== questions[currentIndex].correctIndex) {
                      btnStyle = "opacity-30 border-gray-100 cursor-not-allowed";
                  }
                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(idx)}
                      disabled={feedbackState !== 'IDLE'}
                      className={`p-5 rounded-2xl border text-left transition-all duration-200 group relative overflow-hidden ${btnStyle}`}
                    >
                      <span className="text-xs opacity-50 mr-2 absolute top-2 left-2 font-sans font-bold">{idx + 1}</span>
                      <span className="font-serif text-lg">{option}</span>
                    </button>
                  );
                })}
              </div>

              <AnimatePresence>
                {feedbackState === 'CORRECT' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-10 flex items-center justify-center backdrop-blur-[2px] bg-white/40">
                    <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1.2, opacity: 1 }} className="rounded-full p-6 shadow-2xl bg-coquette-sage text-white">
                      <CheckCircle className="w-16 h-16" />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {feedbackState === 'WRONG' && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="absolute inset-0 z-20 p-8 flex flex-col items-center justify-center text-center backdrop-blur-md bg-white/90">
                     <div className="max-w-md w-full border rounded-[25px] p-8 relative overflow-hidden bg-red-50 border-red-100 shadow-lg">
                        <div className="flex items-center justify-center gap-2 font-bold tracking-widest mb-4 text-red-400 font-coquette-body">
                           <AlertTriangle className="w-5 h-5" /> Not quite right...
                        </div>
                        <h4 className="font-bold mb-2 text-gray-700">Analysis:</h4>
                        <p className="text-sm leading-relaxed mb-6 text-gray-600">{questions[currentIndex].explanation}</p>
                        <button onClick={handleResumeMission} className="w-full py-3 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors bg-coquette-text text-white hover:bg-gray-700 font-coquette-body">Continue <ChevronRight className="w-4 h-4" /></button>
                     </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {phase === 'RESULTS' && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg border rounded-[40px] p-8 text-center shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] overflow-y-auto custom-scrollbar bg-white border-coquette-gold/30">
            <h2 className="text-3xl font-bold mb-2 font-coquette-header text-coquette-text">Session Complete</h2>
            <div className="text-sm uppercase tracking-widest mb-8 text-coquette-subtext font-coquette-body font-bold">Reviewing your progress</div>
            <div className="flex justify-center mb-8 relative flex-shrink-0">
              <div className="relative w-48 h-48 flex items-center justify-center">
                 <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                   <circle cx="100" cy="100" r="80" stroke="#fde2e4" strokeWidth="12" fill="transparent" />
                   <motion.circle cx="100" cy="100" r="80" stroke={accuracy >= 0.7 ? '#ccd5ae' : '#f4acb7'} strokeWidth="12" fill="transparent" strokeDasharray={circumference} strokeDashoffset={circumference} animate={{ strokeDashoffset: circumference - (circumference * accuracy) }} transition={{ duration: 1.5, ease: "easeOut" }} strokeLinecap="round" />
                 </svg>
                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-bold font-coquette-header text-coquette-text">{Math.round(accuracy * 100)}%</span>
                    <span className="text-xs font-bold mt-1 uppercase text-coquette-subtext">ACCURACY</span>
                 </div>
              </div>
            </div>
            {tacticalData && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="border rounded-2xl p-4 mb-6 text-left relative overflow-hidden bg-red-50 border-red-100">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-200"></div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full mt-1 bg-red-100"><Lightbulb className="w-4 h-4 text-red-400" /></div>
                  <div>
                    <h4 className="font-bold text-sm tracking-wider mb-1 text-red-400 font-coquette-body">Focus Area Identified</h4>
                    <p className="font-bold text-lg mb-1 text-gray-700">{tacticalData.weakness}</p>
                    <p className="text-xs leading-relaxed text-gray-500">It seems this topic was tricky ({tacticalData.count} misses). Let's review it gently!</p>
                  </div>
                </div>
              </motion.div>
            )}
            <p className="mb-8 font-medium text-coquette-text italic">{score === questions.length ? "Absolutely perfect! You are shining today." : score >= questions.length / 2 ? "Good effort! Keep growing." : "Don't be discouraged. Every mistake is a lesson."}</p>
            <div className="flex gap-4 mt-auto">
              <button onClick={onClose} className="flex-1 py-3 rounded-xl border font-bold transition-colors border-gray-200 text-gray-400 hover:text-coquette-text hover:bg-gray-50 font-coquette-body">Close</button>
              <button onClick={loadExamData} className="flex-1 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 bg-coquette-accent hover:bg-[#ff9eb0] text-white font-coquette-body shadow-md"><RefreshCw className="w-4 h-4" />Try Again</button>
            </div>
          </motion.div>
        )}

        <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full transition-colors z-50 bg-white text-gray-400 hover:bg-gray-100 hover:text-gray-600"><X className="w-6 h-6" /></button>
      </div>
    </AnimatePresence>
  );
};

export default SimulationModal;
