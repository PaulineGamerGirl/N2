import React, { useState, useEffect } from 'react';

// JLPT N2 Target Date: July 5, 2026, 1:00 PM (Asia/Manila time approx)
const TARGET_DATE = new Date('2026-07-05T13:00:00+08:00');

const Countdown: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number }>({ days: 0, hours: 0, minutes: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
        const now = new Date();
        const difference = TARGET_DATE.getTime() - now.getTime();
        
        if (difference > 0) {
          setTimeLeft({
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((difference / 1000 / 60) % 60),
          });
        } else {
           setTimeLeft({ days: 0, hours: 0, minutes: 0 });
        }
    };

    // Update immediately
    calculateTimeLeft();
    
    // Then every minute
    const timer = setInterval(calculateTimeLeft, 60000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-end">
    <div className="text-[10px] tracking-widest text-rose-900/60 font-coquette-body mb-2 uppercase font-bold text-center w-full">
        TIME BEFORE JLPT N2 EXAM
    </div>
    <div className="flex space-x-3 text-center">
        {['Days', 'Hours', 'Mins'].map((label, idx) => {
        const val = idx === 0 ? timeLeft.days : idx === 1 ? timeLeft.hours : timeLeft.minutes;
        return (
            <div key={label} className="flex flex-col items-center justify-center w-[70px] h-[90px] bg-white border border-coquette-gold/40 rounded-[45%] shadow-sm relative">
            {/* Ornate detail */}
            <div className="absolute top-1 w-1 h-1 rounded-full bg-coquette-gold/50"></div>
            <span className="text-2xl font-coquette-header font-bold text-coquette-text">{val}</span>
            <span className="text-[10px] text-coquette-subtext uppercase font-coquette-body tracking-wider">{label}</span>
            <div className="absolute bottom-1 w-1 h-1 rounded-full bg-coquette-gold/50"></div>
            </div>
        );
        })}
    </div>
    </div>
  );
};

export default Countdown;