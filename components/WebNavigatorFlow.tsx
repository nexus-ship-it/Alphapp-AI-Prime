import React, { useState } from 'react';
import { useWebNavigatorContext } from '../contexts/WebNavigatorContext';
import { Loader } from './ui/Loader';
import { BrowserIcon, SendIcon, ShieldCheckIcon, BookOpenIcon, MessageSquareIcon, AlertTriangleIcon, SpinnerIcon, RefreshIcon, HistoryIcon, StethoscopeIcon, LightbulbIcon, ExternalLinkIcon, CheckCircleIcon } from './ui/icons';
import { LinkAnalysisResult, HistoryItem, ProjectFile, TechStack } from '../types';
import ReactMarkdown from 'react-markdown';
import { useToastContext } from '../contexts/ToastContext';
import { TechDisplay } from './ui/WebTechIcons';
import { useI18n } from '../contexts/I18nContext';
import { TranslationKey } from '../i18n/translations';

const SecurityHeaderItem: React.FC<{ header: { name: string; present: boolean; details: string; } }> = ({ header }) => {
    return (
         <div className="flex items-center gap-2 text-sm">
            <span className={`w-3 h-3 rounded-full flex-shrink-0 ${header.present ? 'bg-success' : 'bg-error'}`} title={header.present ? 'Presente' : 'Ausente'}></span>
            <span className="font-mono">{header.name}</span>
        </div>
    );
};

const SecurityScoreGauge: React.FC<{ score: number }> = ({ score }) => {
    // Implementation matches other gauges
    let colorClass = 'text-success';
    if (score < 40) colorClass = 'text-error';
    else if (score < 75) colorClass = 'text-warning';

    return (
        <div className="relative w-28 h-28 flex items-center justify-center border-4 rounded-full border-current" style={{color: score < 40 ? 'var(--color-error)' : score < 75 ? 'var(--color-warning)' : 'var(--color-success)'}}>
             <span className={`text-3xl font-bold ${colorClass}`}>{score}</span>
        </div>
    );
};

const ResultDashboard: React.FC<{ result: LinkAnalysisResult; onSendToDoctor: (result: LinkAnalysisResult) => void; }> = ({ result, onSendToDoctor }) => {
    const { t } = useI18n();
    
    const calculateSecurityScore = (security: LinkAnalysisResult['security']): number => {
        let score = 0;
        if (security.usesHttps) score += 50;
        if (security.securityHeaders.find(h => h.name === 'Strict-Transport-Security')?.present) score += 20;
        if (security.securityHeaders.find(h => h.name === 'Content-Security-Policy')?.present) score += 20;
        if (security.securityHeaders.find(h => h.name === 'X-Frame-Options')?.present) score += 10;
        return Math.min(100, score);
    };

    const securityScore = calculateSecurityScore(result.security);
    
    const allTech = Array.from(new Set([
        ...(result.techStack.frontend || []), ...(result.techStack.backend || []), ...(result.techStack.cms || []),
        ...(result.techStack.analytics || []), ...(result.techStack.javascriptLibraries || []),
        ...(result.techStack.server ? [result.techStack.server] : []),
    ]));

    return (
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
            <div className="md:col-span-2 lg:col-span-4 bg-surface/50 border border-border/70 rounded-lg p-4">
                <h3 className="text-lg font-bold text-accent mb-2">{t('navigator.analysisPanel' as TranslationKey)}</h3>
                <p className="text-text-secondary text-sm">{result.summary}</p>
            </div>
             <div className="md:col-span-1 lg:col-span-2 bg-surface/50 border border-border/70 rounded-lg p-4 flex flex-col">
                <h3 className="text-lg font-bold text-accent mb-3 flex items-center gap-2"><ShieldCheckIcon /> {t('analysis.category.security' as TranslationKey)}</h3>
                <div className="flex-grow flex flex-col sm:flex-row items-center gap-4">
                    <SecurityScoreGauge score={securityScore} />
                    <div className="flex-1 space-y-2">
                        <p className="text-sm text-text-secondary">{result.security.vulnerabilitySummary}</p>
                         <div className="space-y-1 pt-2">
                             {result.security.securityHeaders.map(header => <SecurityHeaderItem key={header.name} header={header} />)}
                         </div>
                    </div>
                </div>
            </div>
            <div className="md:col-span-1 lg:col-span-2 bg-surface/50 border border-border/70 rounded-lg p-4">
                 <h3 className="text-lg font-bold text-accent mb-3">{t('analysis.category.techStack' as TranslationKey)}</h3>
                 <div className="flex flex-wrap gap-2">
                    {allTech.length > 0 ? allTech.map((tech, i) => <TechDisplay key={i} techName={tech} />) : <p className="text-text-secondary text-sm">No se detectaron tecnologías específicas.</p>}
                </div>
            </div>
             <div className="md:col-span-2 lg:col-span-4 bg-surface/50 border border-border/70 rounded-lg p-4">
                <h3 className="text-lg font-bold text-accent mb-3">{t('common.actions' as TranslationKey)}</h3>
                <div className="flex flex-col sm:flex-row gap-4">
                     <button onClick={() => onSendToDoctor(result)} className="flex-1 px-4 py-3 bg-info/20 text-info font-semibold rounded-lg hover:bg-info/40 transition-colors flex items-center justify-center gap-2">
                        <StethoscopeIcon className="w-5 h-5" /> {t('doctor.analyzeWithDoctor' as TranslationKey)}
                    </button>
                </div>
            </div>
        </div>
    );
};

interface WebNavigatorFlowProps {
    onSendToDoctor: (result: LinkAnalysisResult) => void;
    onAnalyzeFilesInDoctor: (files: ProjectFile[], techStack: TechStack, projectName: string) => void;
}

const WebNavigatorFlow: React.FC<WebNavigatorFlowProps> = ({ onSendToDoctor, onAnalyzeFilesInDoctor }) => {
    const { t } = useI18n();
    const { 
        currentUrl, viewMode, isLoading, loadingText, error, preflightResult, 
        readerContent, isReaderLoading, queryHistory, isQueryLoading, 
        summaryContent, isSummarizing, suggestedQueries,
        setUrlAndAnalyze, switchToView, sendQuery, summarizeReaderContent, 
        loadFromHistory, clearHistory, history
    } = useWebNavigatorContext();

    const [urlInput, setUrlInput] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(urlInput.trim()) {
            setUrlAndAnalyze(urlInput);
        }
    };

    return (
        <div className="flex flex-col h-full w-full">
            {isLoading && <Loader text={loadingText} />}
            <main className="w-full max-w-7xl mx-auto flex-grow flex flex-col mt-4 px-4">
                <div className="w-full text-center sm:text-left mb-6">
                    <h2 className="text-4xl md:text-5xl font-bold text-text-primary flex items-center justify-center sm:justify-start gap-2">
                        <BrowserIcon className="w-10 h-10 text-primary" />
                        {t('navigator.title' as TranslationKey)}
                    </h2>
                    <p className="text-lg text-text-secondary mt-2">{t('navigator.description' as TranslationKey)}</p>
                </div>

                <form onSubmit={handleSubmit} className="mb-6">
                    <div className="flex items-center gap-2 p-1.5 bg-surface border-2 border-border rounded-xl focus-within:ring-2 focus-within:ring-primary">
                        <input
                            type="text"
                            value={urlInput}
                            onChange={(e) => setUrlInput(e.target.value)}
                            placeholder={t('navigator.placeholder' as TranslationKey)}
                            className="w-full p-2 bg-transparent text-text-primary placeholder-text-tertiary outline-none"
                        />
                        <button type="submit" disabled={isLoading || !urlInput.trim()} className="p-2 rounded-lg bg-primary text-white hover:bg-primary-focus disabled:opacity-50">
                            {isLoading ? <SpinnerIcon className="w-5 h-5"/> : <SendIcon className="w-5 h-5" />}
                        </button>
                    </div>
                </form>

                {error && <div className="bg-error/10 border border-error/30 text-red-300 px-4 py-3 rounded-lg mb-4">{error}</div>}

                {preflightResult && (
                    <div className="space-y-6">
                        <ResultDashboard result={preflightResult} onSendToDoctor={onSendToDoctor} />
                        
                        <div className="bg-surface/50 border border-border rounded-lg overflow-hidden flex flex-col h-[600px]">
                            <div className="flex border-b border-border bg-surface">
                                <button onClick={() => switchToView('standard')} className={`flex-1 p-3 text-sm font-semibold flex items-center justify-center gap-2 ${viewMode === 'standard' ? 'text-primary border-b-2 border-primary' : 'text-text-secondary hover:text-white'}`}>
                                    <BrowserIcon className="w-4 h-4"/> {t('navigator.view.browser' as TranslationKey)}
                                </button>
                                <button onClick={() => switchToView('reader')} className={`flex-1 p-3 text-sm font-semibold flex items-center justify-center gap-2 ${viewMode === 'reader' ? 'text-primary border-b-2 border-primary' : 'text-text-secondary hover:text-white'}`}>
                                    <BookOpenIcon className="w-4 h-4"/> {t('navigator.view.reader' as TranslationKey)}
                                </button>
                                <button onClick={() => switchToView('query')} className={`flex-1 p-3 text-sm font-semibold flex items-center justify-center gap-2 ${viewMode === 'query' ? 'text-primary border-b-2 border-primary' : 'text-text-secondary hover:text-white'}`}>
                                    <MessageSquareIcon className="w-4 h-4"/> {t('navigator.view.query' as TranslationKey)}
                                </button>
                            </div>

                            <div className="flex-grow overflow-auto relative bg-white">
                                {viewMode === 'standard' && (
                                    <iframe src={currentUrl} title="Browser View" className="w-full h-full border-0" sandbox="allow-scripts allow-same-origin" />
                                )}
                                {viewMode === 'reader' && (
                                    <div className="p-6 max-w-3xl mx-auto bg-white text-gray-900 h-full overflow-y-auto">
                                        {isReaderLoading ? <div className="flex justify-center p-8"><SpinnerIcon className="w-8 h-8 text-primary"/></div> : (
                                            <>
                                                <div className="flex justify-end mb-4">
                                                    <button onClick={summarizeReaderContent} disabled={isSummarizing} className="px-3 py-1.5 bg-primary/10 text-primary rounded-md text-sm font-semibold hover:bg-primary/20 flex items-center gap-2">
                                                        {isSummarizing ? <SpinnerIcon className="w-4 h-4"/> : <LightbulbIcon className="w-4 h-4"/>}
                                                        {isSummarizing ? t('navigator.reader.summarizing' as TranslationKey) : t('navigator.reader.summarize' as TranslationKey)}
                                                    </button>
                                                </div>
                                                {summaryContent && (
                                                    <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-md">
                                                        <h4 className="font-bold text-yellow-800 mb-2">{t('navigator.reader.summaryTitle' as TranslationKey)}</h4>
                                                        <p className="text-sm text-yellow-900">{summaryContent}</p>
                                                    </div>
                                                )}
                                                <article className="prose prose-lg max-w-none">
                                                    <ReactMarkdown>{readerContent || ''}</ReactMarkdown>
                                                </article>
                                            </>
                                        )}
                                    </div>
                                )}
                                {viewMode === 'query' && (
                                    <div className="h-full bg-background flex flex-col">
                                        <div className="flex-grow overflow-y-auto p-4">
                                            {queryHistory.map((msg, i) => (
                                                <div key={i} className={`flex items-start gap-3 mb-4 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                                                    <div className={`p-3 rounded-xl max-w-md ${msg.sender === 'user' ? 'bg-primary text-white' : 'bg-surface text-text-primary'}`}>
                                                        <div className="prose prose-invert prose-sm">
                                                            <ReactMarkdown>{msg.text}</ReactMarkdown>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {isQueryLoading && <div className="flex justify-start p-4"><SpinnerIcon className="w-6 h-6 text-accent"/></div>}
                                        </div>
                                        <div className="p-4 border-t border-border bg-surface/50">
                                            {suggestedQueries.length > 0 && (
                                                <div className="flex gap-2 overflow-x-auto pb-2 mb-2">
                                                    {suggestedQueries.map((q, i) => (
                                                        <button key={i} onClick={() => sendQuery(q)} className="whitespace-nowrap px-3 py-1 rounded-full bg-surface border border-border text-xs hover:bg-border transition-colors">
                                                            {q}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Ask about the page..."
                                                    className="flex-grow p-2 rounded-md bg-background border border-border focus:ring-1 focus:ring-primary outline-none"
                                                    onKeyDown={(e) => {
                                                        if(e.key === 'Enter') {
                                                            sendQuery((e.target as HTMLInputElement).value);
                                                            (e.target as HTMLInputElement).value = '';
                                                        }
                                                    }}
                                                />
                                                <button className="p-2 bg-primary text-white rounded-md"><SendIcon className="w-5 h-5"/></button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default WebNavigatorFlow;
