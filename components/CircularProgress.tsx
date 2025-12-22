import React from 'react';
import { motion } from 'framer-motion';

interface CircularProgressProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color?: string; // Default color logic overrides this if needed
  label: string;
  subLabel?: string;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  max,
  size = 200,
  strokeWidth = 12,
  color: propColor,
  label,
  subLabel
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const offset = circumference - (percentage / 100) * circumference;

  // Theme-based colors (Coquette only)
  const activeColor = propColor || '#f4acb7';
  const trackColor = '#fde2e4';
  const textColor = '#5c4d49';
  const subTextColor = '#9d8189';

  return (
    <div className="relative flex flex-col items-center justify-center group" style={{ width: size, height: size }}>
      
      {/* Decorative Wreath for Coquette Mode */}
      <div className="absolute inset-[-20px] rounded-full border border-coquette-gold/20 opacity-50 group-hover:scale-105 transition-transform duration-700"></div>

      <svg width={size} height={size} className="rotate-[-90deg] overflow-visible z-10">
        {/* Background Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress Circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={activeColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeLinecap="round" // Round caps for softness
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{ 
            filter: 'none'
          }}
        />
      </svg>
      <div className="absolute flex flex-col items-center text-center z-20">
        <span className="text-3xl font-bold font-coquette-header" style={{ color: textColor }}>
          {value.toLocaleString()}
        </span>
        <span className="text-xs uppercase tracking-wider mt-1 font-coquette-body font-bold" style={{ color: subTextColor }}>
           {label}
        </span>
        {subLabel && (
           <span className="text-[10px]" style={{ color: subTextColor, opacity: 0.8 }}>{subLabel}</span>
        )}
      </div>
    </div>
  );
};

export default CircularProgress;