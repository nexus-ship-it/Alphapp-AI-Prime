import React, { createContext, useState, useContext, ReactNode, useCallback, useRef, useEffect } from 'react';
import { CodeLanguage, CodeCompletionSuggestion, CodeDiagnostic } from '../types';
import * as geminiService from '../services/geminiService';
import { useToastContext } from './ToastContext';

// Hook for debouncing
const useDebounce = (callback: (...args: any[]) => void, delay: number) => {
    const timeoutRef = useRef<number | null>(null);

    const debouncedFunction = useCallback((...args: any[]) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = window.setTimeout(() => {
            callback(...args);
        }, delay);
    }, [callback, delay]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return debouncedFunction;
};

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);


interface CodeCopilotContextType {
    code: string;
    language: CodeLanguage;
    suggestions: CodeCompletionSuggestion[];
    diagnostics: CodeDiagnostic[];
    isCompleting: boolean;
    isDiagnosing: boolean;

    setCode: (code: string, cursorPosition?: number) => void;
    setLanguage: (lang: CodeLanguage) => void;
    applySuggestion: (suggestion: CodeCompletionSuggestion, cursorPosition: number) => string;
    resetCopilot: () => void;
}

const CodeCopilotContext = createContext<CodeCopilotContextType | undefined>(undefined);

export const CodeCopilotProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [code, setCodeState] = useState('');
    const [language, setLanguage] = useState<CodeLanguage>('TypeScript');
    const [suggestions, setSuggestions] = useState<CodeCompletionSuggestion[]>([]);
    const [diagnostics, setDiagnostics] = useState<CodeDiagnostic[]>([]);
    const [isCompleting, setIsCompleting] = useState(false);
    const [isDiagnosing, setIsDiagnosing] = useState(false);
    const { addToast } = useToastContext();

    const fetchCompletions = useCallback(async (currentCode: string, lang: CodeLanguage, cursor: number) => {
        setIsCompleting(true);
        try {
            const result = await geminiService.getCodeCompletions(currentCode, lang, cursor);
            setSuggestions(result.map(s => ({ ...s, id: generateId() })));
        } catch (e) {
            console.error(e);
            addToast({ type: 'error', title: 'Error de Completado', message: 'No se pudieron obtener las sugerencias.' });
        } finally {
            setIsCompleting(false);
        }
    }, [addToast]);
    
    const fetchDiagnostics = useCallback(async (currentCode: string, lang: CodeLanguage) => {
        if (!currentCode.trim()) {
            setDiagnostics([]);
            return;
        }
        setIsDiagnosing(true);
        try {
            const result = await geminiService.getRealtimeDiagnostics(currentCode, lang);
            setDiagnostics(result);
        } catch (e) {
            console.error(e);
             addToast({ type: 'error', title: 'Error de Diagnóstico', message: 'No se pudieron obtener los diagnósticos.' });
        } finally {
            setIsDiagnosing(false);
        }
    }, [addToast]);

    const debouncedFetchCompletions = useDebounce(fetchCompletions, 500);
    const debouncedFetchDiagnostics = useDebounce(fetchDiagnostics, 1500);

    const setCode = (newCode: string, cursorPosition?: number) => {
        setCodeState(newCode);
        if (cursorPosition !== undefined) {
            debouncedFetchCompletions(newCode, language, cursorPosition);
        }
        debouncedFetchDiagnostics(newCode, language);
    };

    const applySuggestion = (suggestion: CodeCompletionSuggestion, cursorPosition: number): string => {
        const newCode = code.substring(0, cursorPosition) + suggestion.text + code.substring(cursorPosition);
        setCodeState(newCode);
        setSuggestions([]);
        debouncedFetchDiagnostics(newCode, language);
        return newCode;
    };

    const resetCopilot = useCallback(() => {
        setCodeState('');
        setSuggestions([]);
        setDiagnostics([]);
        setIsCompleting(false);
        setIsDiagnosing(false);
    }, []);

    const value = {
        code,
        language,
        suggestions,
        diagnostics,
        isCompleting,
        isDiagnosing,
        setCode,
        setLanguage,
        applySuggestion,
        resetCopilot
    };

    return <CodeCopilotContext.Provider value={value}>{children}</CodeCopilotContext.Provider>;
};

export const useCodeCopilotContext = () => {
    const context = useContext(CodeCopilotContext);
    if (context === undefined) {
        throw new Error('useCodeCopilotContext must be used within a CodeCopilotProvider');
    }
    return context;
};