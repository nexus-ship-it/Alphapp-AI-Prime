import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { CodeTranslatorResult } from '../types';
import * as geminiService from '../services/geminiService';
import { useToastContext } from './ToastContext';

export type Language = 'React' | 'Vue' | 'Angular' | 'Svelte' | 'JavaScript' | 'TypeScript' | 'Python' | 'Go' | 'Java';

interface CodeTranslatorContextType {
    sourceCode: string;
    sourceLang: Language;
    targetLang: Language;
    translationResult: CodeTranslatorResult | null;
    isLoading: boolean;
    error: string | null;

    setSourceCode: (code: string) => void;
    setSourceLang: (lang: Language) => void;
    setTargetLang: (lang: Language) => void;
    translateCode: () => Promise<void>;
    resetTranslator: () => void;
}

const CodeTranslatorContext = createContext<CodeTranslatorContextType | undefined>(undefined);

export const CodeTranslatorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [sourceCode, setSourceCode] = useState('');
    const [sourceLang, setSourceLang] = useState<Language>('React');
    const [targetLang, setTargetLang] = useState<Language>('Vue');
    const [translationResult, setTranslationResult] = useState<CodeTranslatorResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { addToast } = useToastContext();

    const translateCode = useCallback(async () => {
        if (!sourceCode.trim()) {
            addToast({ type: 'warning', title: 'Código Vacío', message: 'Por favor, introduce el código que quieres traducir.' });
            return;
        }
        if (sourceLang === targetLang) {
            addToast({ type: 'warning', title: 'Mismo Lenguaje', message: 'El lenguaje de origen y destino no pueden ser el mismo.' });
            return;
        }

        setIsLoading(true);
        setError(null);
        setTranslationResult(null);

        try {
            const result = await geminiService.translateCode(sourceCode, sourceLang, targetLang);
            setTranslationResult(result);
            addToast({ type: 'success', title: '¡Traducción Completa!', message: `Código traducido de ${sourceLang} a ${targetLang}.` });
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Ocurrió un error al traducir el código.';
            setError(errorMessage);
            addToast({ type: 'error', title: 'Error de Traducción', message: errorMessage });
        } finally {
            setIsLoading(false);
        }
    }, [sourceCode, sourceLang, targetLang, addToast]);

    const resetTranslator = useCallback(() => {
        setSourceCode('');
        setTranslationResult(null);
        setError(null);
        setIsLoading(false);
    }, []);

    const value = {
        sourceCode,
        sourceLang,
        targetLang,
        translationResult,
        isLoading,
        error,
        setSourceCode,
        setSourceLang,
        setTargetLang,
        translateCode,
        resetTranslator
    };

    return (
        <CodeTranslatorContext.Provider value={value}>
            {children}
        </CodeTranslatorContext.Provider>
    );
};

export const useCodeTranslatorContext = () => {
    const context = useContext(CodeTranslatorContext);
    if (context === undefined) {
        throw new Error('useCodeTranslatorContext must be used within a CodeTranslatorProvider');
    }
    return context;
};