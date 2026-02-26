import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { ChatMessage, LinkAnalysisResult, HistoryItem } from '../types';
import * as geminiService from '../services/geminiService';
import { useToastContext } from './ToastContext';
import { Chat } from '@google/genai';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

type ViewMode = 'standard' | 'reader' | 'query';
type PreflightStatus = 'idle' | 'loading' | 'complete' | 'error';

const HISTORY_KEY = 'alphapp-navigator-history';
const MAX_HISTORY_ITEMS = 20;


interface WebNavigatorContextType {
    currentUrl: string;
    viewMode: ViewMode;
    isLoading: boolean; // Main loading state for pre-flight
    loadingText: string;
    error: string | null;

    preflightResult: LinkAnalysisResult | null;
    preflightStatus: PreflightStatus;

    readerContent: string | null;
    isReaderLoading: boolean;
    summaryContent: string | null;
    isSummarizing: boolean;
    
    queryHistory: ChatMessage[];
    isQueryLoading: boolean;
    suggestedQueries: string[];

    setUrlAndAnalyze: (url: string) => Promise<void>;
    
    switchToView: (view: ViewMode) => void;
    
    sendQuery: (prompt: string) => Promise<void>;
    summarizeReaderContent: () => Promise<void>;
    setSummaryContent: (content: string | null) => void;
    resetNavigator: () => void;
    history: HistoryItem[];
    loadFromHistory: (item: HistoryItem) => void;
    clearHistory: () => void;
}

const WebNavigatorContext = createContext<WebNavigatorContextType | undefined>(undefined);

export const WebNavigatorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentUrl, setCurrentUrl] = useState('');
    const [viewMode, setViewMode] = useState<ViewMode>('standard');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingText, setLoadingText] = useState('');
    const [error, setError] = useState<string | null>(null);

    const [preflightResult, setPreflightResult] = useState<LinkAnalysisResult | null>(null);
    const [preflightStatus, setPreflightStatus] = useState<PreflightStatus>('idle');
    
    const [readerContent, setReaderContent] = useState<string | null>(null);
    const [isReaderLoading, setIsReaderLoading] = useState(false);
    const [summaryContent, setSummaryContent] = useState<string | null>(null);
    const [isSummarizing, setIsSummarizing] = useState(false);

    const [queryHistory, setQueryHistory] = useState<ChatMessage[]>([]);
    const [isQueryLoading, setIsQueryLoading] = useState(false);
    const [queryChatSession, setQueryChatSession] = useState<Chat | null>(null);
    const [suggestedQueries, setSuggestedQueries] = useState<string[]>([]);
    
    const [history, setHistory] = useState<HistoryItem[]>(() => {
        try {
            const saved = window.localStorage.getItem(HISTORY_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });

    const { addToast } = useToastContext();
    
    const updateHistory = (newItem: HistoryItem) => {
        setHistory(prevHistory => {
            const newHistory = [newItem, ...prevHistory.filter(item => item.url !== newItem.url)].slice(0, MAX_HISTORY_ITEMS);
            try {
                window.localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
            } catch (e) {
                console.error("Failed to save history:", e);
            }
            return newHistory;
        });
    };

    const resetNavigator = useCallback(() => {
        setCurrentUrl('');
        setViewMode('standard');
        setIsLoading(false);
        setLoadingText('');
        setError(null);
        setPreflightResult(null);
        setPreflightStatus('idle');
        setReaderContent(null);
        setIsReaderLoading(false);
        setSummaryContent(null);
        setIsSummarizing(false);
        setQueryHistory([]);
        setIsQueryLoading(false);
        setQueryChatSession(null);
        setSuggestedQueries([]);
    }, []);

    const setUrlAndAnalyze = useCallback(async (url: string) => {
        let validUrl = url;
        if (!/^https?:\/\//i.test(validUrl)) {
            validUrl = 'https://' + validUrl;
        }
        
        resetNavigator();
        setCurrentUrl(validUrl);
        
        setIsLoading(true);
        setPreflightStatus('loading');
        setLoadingText('Analizando URL...');
        setError(null);

        try {
            const resultData = await geminiService.analyzeLink(validUrl);
            const result: LinkAnalysisResult = { ...resultData, url: validUrl };
            setPreflightResult(result);
            setPreflightStatus('complete');

            updateHistory({ url: validUrl, analysisResult: result, timestamp: Date.now() });
            
            const queries = await geminiService.generateSuggestedQueries(result.summary);
            setSuggestedQueries(queries);

        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Ocurrió un error desconocido.';
            setError(errorMessage);
            setPreflightStatus('error');
            addToast({ type: 'error', title: 'Error de Análisis', message: errorMessage });
        } finally {
            setIsLoading(false);
        }
    }, [addToast, resetNavigator]);
    
    const summarizeReaderContent = useCallback(async () => {
        if (!readerContent) return;
        setIsSummarizing(true);
        setSummaryContent(null);
        setError(null);
        try {
            const summary = await geminiService.summarizeText(readerContent);
            setSummaryContent(summary);
        } catch (e) {
             const errorMessage = e instanceof Error ? e.message : 'Error al generar el resumen.';
             setError(errorMessage);
             addToast({ type: 'error', title: 'Error de IA', message: errorMessage });
        } finally {
            setIsSummarizing(false);
        }
    }, [readerContent, addToast]);

    const switchToView = useCallback(async (view: ViewMode) => {
        setViewMode(view);
        if (view === 'reader' && !readerContent && currentUrl) {
            setIsReaderLoading(true);
            setSummaryContent(null);
            try {
                const content = await geminiService.getReadableContent(currentUrl);
                setReaderContent(content);
            } catch (e) {
                const errorMessage = e instanceof Error ? e.message : 'Error al cargar la vista de lectura.';
                setError(errorMessage);
                addToast({ type: 'error', title: 'Error de Vista de Lectura', message: errorMessage });
            } finally {
                setIsReaderLoading(false);
            }
        }
        if (view === 'query' && !queryChatSession && preflightResult) {
            const session = geminiService.startWebQueryChat(currentUrl, preflightResult.summary);
            setQueryChatSession(session);
            setQueryHistory([{id: generateId(), sender: 'ai', text: `Listo para responder preguntas sobre ${new URL(currentUrl).hostname}. ¿Qué te gustaría saber?`}]);
        }
    }, [currentUrl, readerContent, addToast, preflightResult, queryChatSession]);
    
    const sendQuery = useCallback(async (prompt: string) => {
        if (!queryChatSession || !prompt.trim()) return;

        const userMessage: ChatMessage = { id: generateId(), sender: 'user', text: prompt };
        setQueryHistory(prev => [...prev, userMessage, {id: generateId(), sender: 'ai', text: '', sources: []}]);
        setIsQueryLoading(true);
        setSuggestedQueries([]);
        
        try {
            const stream = await queryChatSession.sendMessageStream({ message: prompt });
            let fullResponse = '';
            for await (const chunk of stream) {
                 const groundingMetadata = chunk.candidates?.[0]?.groundingMetadata;
                if (groundingMetadata && groundingMetadata.groundingChunks) {
                    const sources = groundingMetadata.groundingChunks
                        .map(c => c.web)
                        .filter(web => web && web.uri) as { uri: string; title: string }[];
                    
                    if (sources.length > 0) {
                        setQueryHistory(prev => {
                            const newHistory = [...prev];
                            const lastMessage = newHistory[newHistory.length - 1];
                            if (lastMessage && lastMessage.sender === 'ai') {
                                const existingUris = new Set((lastMessage.sources || []).map(s => s.uri));
                                const newSources = sources.filter(s => !existingUris.has(s.uri));
                                if (newSources.length > 0) {
                                    newHistory[newHistory.length - 1] = {
                                        ...lastMessage,
                                        sources: [...(lastMessage.sources || []), ...newSources],
                                    };
                                }
                            }
                            return newHistory;
                        });
                    }
                }
                
                if (chunk.text) {
                    fullResponse += chunk.text;
                    setQueryHistory(prev => {
                        const newHistory = [...prev];
                        newHistory[newHistory.length - 1] = { ...newHistory[newHistory.length - 1], text: fullResponse };
                        return newHistory;
                    });
                }
            }
        } catch(e) {
             const errorMessage = e instanceof Error ? e.message : 'Ocurrió un error desconocido.';
             setQueryHistory(prev => {
                const newHistory = [...prev];
                newHistory[newHistory.length - 1] = { ...newHistory[newHistory.length - 1], text: `Error: ${errorMessage}` };
                return newHistory;
            });
        } finally {
            setIsQueryLoading(false);
        }

    }, [queryChatSession]);

    const loadFromHistory = useCallback((item: HistoryItem) => {
        setUrlAndAnalyze(item.url);
    }, [setUrlAndAnalyze]);

    const clearHistory = useCallback(() => {
        setHistory([]);
         try {
            window.localStorage.removeItem(HISTORY_KEY);
        } catch (e) {
            console.error("Failed to clear history:", e);
        }
    }, []);

    const value = {
        currentUrl, viewMode, isLoading, loadingText, error, preflightResult, preflightStatus, readerContent, isReaderLoading, queryHistory, isQueryLoading, summaryContent, isSummarizing, suggestedQueries,
        setUrlAndAnalyze, switchToView, sendQuery, resetNavigator, summarizeReaderContent, setSummaryContent,
        history, loadFromHistory, clearHistory
    };
    
    return <WebNavigatorContext.Provider value={value}>{children}</WebNavigatorContext.Provider>;
};

export const useWebNavigatorContext = () => {
    const context = useContext(WebNavigatorContext);
    if (!context) {
        throw new Error('useWebNavigatorContext must be used within a WebNavigatorProvider');
    }
    return context;
};
