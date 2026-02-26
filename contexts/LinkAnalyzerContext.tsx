import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { LinkAnalysisResult } from '../types';
import * as geminiService from '../services/geminiService';
import { useToastContext } from './ToastContext';

const SESSION_KEY = 'alphapp-link-analyzer-session';
const HISTORY_KEY = 'alphapp-link-analyzer-history';
const MAX_HISTORY_ITEMS = 10;

export interface HistoryItem {
    url: string;
    analysisResult: LinkAnalysisResult;
    timestamp: number;
}

interface LinkAnalyzerContextType {
    url: string;
    setUrl: (url: string) => void;
    isLoading: boolean;
    analysisResult: LinkAnalysisResult | null;
    error: string | null;
    history: HistoryItem[];
    analyzeUrl: () => Promise<void>;
    resetAnalyzer: () => void;
    loadFromHistory: (item: HistoryItem) => void;
    clearHistory: () => void;
}

const LinkAnalyzerContext = createContext<LinkAnalyzerContextType | undefined>(undefined);

export const LinkAnalyzerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const getInitialState = <T,>(key: string, fallback: T): T => {
        try {
            const saved = window.localStorage.getItem(key);
            return saved ? JSON.parse(saved) : fallback;
        } catch (e) {
            console.error(`Failed to load ${key}:`, e);
            return fallback;
        }
    };
    
    const initialSession = getInitialState<{ url: string, analysisResult: LinkAnalysisResult | null }>(SESSION_KEY, { url: '', analysisResult: null });
    
    const [url, setUrl] = useState<string>(initialSession.url);
    const [isLoading, setIsLoading] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<LinkAnalysisResult | null>(initialSession.analysisResult);
    const [error, setError] = useState<string | null>(null);
    const [history, setHistory] = useState<HistoryItem[]>(() => getInitialState(HISTORY_KEY, []));

    const { addToast } = useToastContext();

    useEffect(() => {
        try {
            if (url || analysisResult) {
                const sessionData = JSON.stringify({ url, analysisResult });
                window.localStorage.setItem(SESSION_KEY, sessionData);
            } else {
                window.localStorage.removeItem(SESSION_KEY);
            }
        } catch (e) {
            console.error("Failed to save session:", e);
        }
    }, [url, analysisResult]);

    const analyzeUrl = useCallback(async () => {
        if (!url.trim()) {
            addToast({ type: 'warning', title: 'URL Vacía', message: 'Por favor, introduce una URL para analizar.' });
            return;
        }
        
        let validUrl = url;
        if (!/^https?:\/\//i.test(validUrl)) {
            validUrl = 'https://' + validUrl;
        }
        setUrl(validUrl);

        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);

        try {
            const resultData = await geminiService.analyzeLink(validUrl);
            const result: LinkAnalysisResult = { ...resultData, url: validUrl };
            setAnalysisResult(result);
            
            // Add to history
            const newItem: HistoryItem = { url: validUrl, analysisResult: result, timestamp: Date.now() };
            setHistory(prevHistory => {
                const newHistory = [newItem, ...prevHistory.filter(item => item.url !== validUrl)].slice(0, MAX_HISTORY_ITEMS);
                try {
                    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
                } catch (e) {
                    console.error("Failed to save history:", e);
                }
                return newHistory;
            });

        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Ocurrió un error desconocido.';
            setError(errorMessage);
            addToast({ type: 'error', title: 'Error de Análisis', message: errorMessage });
        } finally {
            setIsLoading(false);
        }
    }, [url, addToast]);
    
    const resetAnalyzer = useCallback(() => {
        setUrl('');
        setIsLoading(false);
        setAnalysisResult(null);
        setError(null);
        window.localStorage.removeItem(SESSION_KEY);
    }, []);

    const loadFromHistory = useCallback((item: HistoryItem) => {
        setUrl(item.url);
        setAnalysisResult(item.analysisResult);
        setError(null);
        addToast({ type: 'info', title: 'Historial Cargado', message: `Mostrando análisis para ${item.url}`});
    }, [addToast]);
    
    const clearHistory = useCallback(() => {
        setHistory([]);
        try {
            window.localStorage.removeItem(HISTORY_KEY);
            addToast({ type: 'success', title: 'Historial Borrado', message: 'Se ha borrado el historial de análisis.' });
        } catch (e) {
             console.error("Failed to clear history:", e);
        }
    }, [addToast]);

    const value = { url, setUrl, isLoading, analysisResult, error, history, analyzeUrl, resetAnalyzer, loadFromHistory, clearHistory };
    
    return <LinkAnalyzerContext.Provider value={value}>{children}</LinkAnalyzerContext.Provider>;
};

export const useLinkAnalyzerContext = () => {
    const context = useContext(LinkAnalyzerContext);
    if (!context) {
        throw new Error('useLinkAnalyzerContext must be used within a LinkAnalyzerProvider');
    }
    return context;
};