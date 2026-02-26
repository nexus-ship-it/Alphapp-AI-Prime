import React, { useEffect, useState, useRef, useCallback } from 'react';

// The message can now be any renderable content
export type ToastMessage = React.ReactNode;

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message: ToastMessage;
  onClose: (id: string) => void;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const icons = {
  success: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>,
  error: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>,
  info: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>,
  warning: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>,
};

const toastColors: Record<ToastType, { gradient: string; bg: string; icon: string; title: string; message: string; close: string; progress: string; action: string }> = {
  success: { gradient: 'from-success/50 to-accent/50', bg: 'bg-surface/90', icon: 'text-success', title: 'text-text-primary', message: 'text-text-secondary', close: 'text-text-tertiary hover:text-white', progress: 'bg-success', action: 'ring-success/50 text-success' },
  error: { gradient: 'from-error/50 to-red-600/50', bg: 'bg-surface/90', icon: 'text-error', title: 'text-text-primary', message: 'text-text-secondary', close: 'text-text-tertiary hover:text-white', progress: 'bg-error', action: 'ring-error/50 text-error' },
  info: { gradient: 'from-primary/50 to-blue-500/50', bg: 'bg-surface/90', icon: 'text-primary', title: 'text-text-primary', message: 'text-text-secondary', close: 'text-text-tertiary hover:text-white', progress: 'bg-primary', action: 'ring-primary/50 text-primary' },
  warning: { gradient: 'from-warning/50 to-amber-600/50', bg: 'bg-surface/90', icon: 'text-warning', title: 'text-text-primary', message: 'text-text-secondary', close: 'text-text-tertiary hover:text-white', progress: 'bg-warning', action: 'ring-warning/50 text-warning' },
};


export const Toast: React.FC<ToastProps> = ({ id, type, title, message, onClose, duration = 5000, action }) => {
  const [isExiting, setIsExiting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const timerRef = useRef<number | null>(null);
  const remainingTimeRef = useRef(duration);
  const startTimeRef = useRef(Date.now());

  const handleClose = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsExiting(true);
  }, []);
  
  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
        remainingTimeRef.current -= (Date.now() - startTimeRef.current);
      }
    } else {
      startTimeRef.current = Date.now();
      timerRef.current = window.setTimeout(handleClose, remainingTimeRef.current);
    }
    
    return () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
    }
  }, [isPaused, handleClose]);

  const handleAnimationEnd = () => {
    if (isExiting) {
      onClose(id);
    }
  };
  
  const colors = toastColors[type];
  const a11yRoles = {
      role: type === 'error' || type === 'warning' ? 'alert' : 'status',
      'aria-live': type === 'error' ? 'assertive' : 'polite' as 'assertive' | 'polite'
  };

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onAnimationEnd={handleAnimationEnd}
      className={`relative w-full max-w-sm p-px rounded-lg shadow-2xl shadow-black/30 overflow-hidden transition-all duration-300 ease-in-out bg-gradient-to-br ${colors.gradient} ${isExiting ? 'animate-toast-out' : 'animate-toast-in'}`}
      {...a11yRoles}
    >
        <div className={`rounded-[7px] ${colors.bg} backdrop-blur-lg`}>
            <div className="p-4">
                <div className="flex items-start">
                    <div className={`flex-shrink-0 ${colors.icon}`}>
                        {icons[type]}
                    </div>
                    <div className="ml-3 w-0 flex-1 pt-0.5">
                        <p className={`text-sm font-bold ${colors.title}`}>{title}</p>
                        <div className={`mt-1 text-sm ${colors.message}`}>{message}</div>
                        {action && (
                        <div className="mt-3">
                            <button
                            onClick={() => {
                                action.onClick();
                                handleClose();
                            }}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md bg-surface ring-1 ring-inset ${colors.action} hover:opacity-80 transition-opacity`}
                            >
                            {action.label}
                            </button>
                        </div>
                        )}
                    </div>
                    <div className="ml-4 flex-shrink-0 flex">
                        <button
                        onClick={handleClose}
                        className={`inline-flex rounded-md p-1 ${colors.close} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface focus:ring-white transition-colors`}
                        >
                        <span className="sr-only">Close</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 10.5858L14.8284 7.75736L16.2426 9.17157L13.4142 12L16.2426 14.8284L14.8284 16.2426L12 13.4142L9.17157 16.2426L7.75736 14.8284L10.5858 12L7.75736 9.17157L9.17157 7.75736L12 10.5858Z"></path></svg>
                        </button>
                    </div>
                </div>
            </div>
            <div
                className={`absolute bottom-0 left-0 h-1.5 ${colors.progress}`}
                style={{
                    boxShadow: `0 0 10px rgb(var(--color-${type}))`,
                    animation: `progressBar ${duration}ms linear forwards`,
                    animationPlayState: isPaused ? 'paused' : 'running',
                }}
            />
        </div>
    </div>
  );
};


export const ToastContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div
            aria-live="polite"
            className="fixed inset-0 flex items-end justify-center px-4 py-6 pointer-events-none sm:p-6 sm:items-end sm:justify-end z-[9999]"
        >
            <div className="max-w-sm w-full space-y-4">
                {children}
            </div>
        </div>
    );
};