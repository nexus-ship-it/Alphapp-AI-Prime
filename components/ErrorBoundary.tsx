
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangleIcon, RefreshIcon } from './ui/icons';
import { I18nContext } from '../contexts/I18nContext';
import { TranslationKey } from '../i18n/translations';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// FIX: Extending the Component class directly ensures correct generic inheritance and visibility of 'props'/'state'.
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  constructor(props: ErrorBoundaryProps) {
    super(props);
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    window.location.reload();
  };

  render(): ReactNode {
    // FIX: Destructure inherited props and state explicitly.
    const { hasError, error } = this.state;
    const { children } = this.props;

    if (hasError) {
      return (
        <I18nContext.Consumer>
          {(i18n) => {
            const t = i18n?.t || ((key: string) => key);
            return (
              <div className="min-h-screen w-full flex items-center justify-center bg-background p-6 font-sans">
                {/* Background Decorations */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                  <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-error/10 rounded-full blur-[120px] animate-pulse"></div>
                  <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
                </div>

                <div className="relative z-10 w-full max-w-2xl bg-surface/40 backdrop-blur-xl border border-error/30 rounded-2xl p-8 md:p-12 shadow-2xl shadow-error/10 animate-fade-in text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-error/20 border-2 border-error/40 mb-8 shadow-glow-primary">
                    <AlertTriangleIcon className="w-10 h-10 text-error" />
                  </div>

                  <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-4 drop-shadow-text-glow-primary">
                    {t('errorBoundary.title' as TranslationKey)}
                  </h1>
                  
                  <p className="text-lg text-text-secondary mb-8 leading-relaxed">
                    {t('errorBoundary.description' as TranslationKey)}
                  </p>

                  <div className="bg-black/40 rounded-xl p-6 mb-8 border border-white/5 text-left overflow-hidden">
                    <p className="text-xs font-bold text-error/70 uppercase tracking-widest mb-3">
                      {t('errorBoundary.details' as TranslationKey)}
                    </p>
                    <div className="font-mono text-sm text-error/90 break-words max-h-40 overflow-y-auto custom-scrollbar">
                      {error?.message || t('errorBoundary.unknown' as TranslationKey)}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      onClick={this.handleReset}
                      className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-error to-primary text-white font-bold rounded-lg hover:brightness-110 transition-all transform hover:scale-105 shadow-lg shadow-error/20"
                    >
                      <RefreshIcon className="w-5 h-5" />
                      {t('errorBoundary.reload' as TranslationKey)}
                    </button>
                    <a 
                      href="/"
                      className="inline-flex items-center justify-center px-8 py-3 bg-surface border border-border text-text-primary font-semibold rounded-lg hover:bg-border transition-all"
                    >
                      Ir al Inicio
                    </a>
                  </div>
                </div>
              </div>
            );
          }}
        </I18nContext.Consumer>
      );
    }

    return children;
  }
}
