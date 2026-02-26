


import React from 'react';

interface LoaderProps {
  text?: string;
  progress?: number;
}

export const Loader: React.FC<LoaderProps> = ({ text = "Procesando...", progress }) => {
  const styles: React.CSSProperties = {
    strokeDasharray: 440,
    strokeDashoffset: 440,
    animation: 'draw 2s ease-in-out infinite alternate',
  };
  
  return (
    <div className="fixed inset-0 bg-background bg-opacity-90 flex flex-col items-center justify-center z-60 backdrop-blur-sm">
      <style>
        {`
          @keyframes draw {
            to {
              stroke-dashoffset: 0;
            }
          }
        `}
      </style>
      <svg width="80" height="80" viewBox="-5 -5 110 110" fill="none">
        <rect x="0" y="0" width="100" height="100" rx="5" className="stroke-primary" strokeWidth="4" style={{...styles}} />
        <rect x="15" y="15" width="70" height="70" rx="5" className="stroke-highlight" strokeWidth="4" style={{...styles, animationDirection: 'alternate-reverse', animationDelay: '-1s' }} />
        <rect x="30" y="30" width="40" height="40" rx="5" className="stroke-primary" strokeWidth="4" style={{...styles, animationDelay: '-0.5s'}} />
      </svg>
      <p className="mt-4 text-lg text-accent font-semibold drop-shadow-text-glow-highlight animate-pulse">{text}</p>
      {progress !== undefined && (
        <div className="w-64 mt-4 bg-border/50 rounded-full h-4 relative overflow-hidden">
            <div className="bg-primary h-4 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.2s ease-out' }}></div>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-sm">{progress.toFixed(0)}%</span>
        </div>
      )}
    </div>
  );
};