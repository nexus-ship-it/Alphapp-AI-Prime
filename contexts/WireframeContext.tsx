

import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { WireframeData, WireframeCodeResult } from '../types';
import * as geminiService from '../services/geminiService';
import { useToastContext } from './ToastContext';

const WIREFRAME_DRAFT_KEY = 'alphapp-wireframe-draft';

interface WireframeContextType {
    wireframeResult: WireframeData | null;
    codeResult: WireframeCodeResult | null;
    isLoading: boolean;
    loadingText: string;
    error: string | null;
    hasDraft: boolean;
    setWireframeResult: React.Dispatch<React.SetStateAction<WireframeData | null>>;
    generateWireframe: (prompt: string) => Promise<void>;
    refineWireframe: (currentWireframe: Omit<WireframeData, 'explanation'>, prompt: string) => Promise<void>;
    generateCode: () => Promise<void>;
    resetWireframe: () => void;
    saveDraft: (wireframe: WireframeData) => void;
    loadDraft: () => void;
    clearDraft: () => void;
}

const WireframeContext = createContext<WireframeContextType | undefined>(undefined);

export const WireframeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [wireframeResult, setWireframeResult] = useState<WireframeData | null>(null);
    const [codeResult, setCodeResult] = useState<WireframeCodeResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingText, setLoadingText] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [hasDraft, setHasDraft] = useState(false);
    const { addToast } = useToastContext();

    useEffect(() => {
        try {
            const savedDraft = window.localStorage.getItem(WIREFRAME_DRAFT_KEY);
            setHasDraft(!!savedDraft);
        } catch (e) {
            console.error("Failed to check for wireframe draft", e);
            setHasDraft(false);
        }
    }, []);

    const generateWireframe = useCallback(async (prompt: string) => {
        setIsLoading(true);
        setLoadingText('Generando wireframe...');
        setError(null);
        setWireframeResult(null);
        setCodeResult(null); // Reset code result when generating a new wireframe
        try {
            const data = await geminiService.generateWireframeFromText(prompt);
            setWireframeResult(data);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Ocurrió un error al generar el wireframe.';
            setError(errorMessage);
            addToast({ type: 'error', title: 'Error de IA', message: errorMessage });
        } finally {
            setIsLoading(false);
        }
    }, [addToast]);
    
    const refineWireframe = useCallback(async (currentWireframe: Omit<WireframeData, 'explanation'>, prompt: string) => {
        setIsLoading(true);
        setLoadingText('Refinando wireframe...');
        setError(null);
        setCodeResult(null); // Reset code result when refining the wireframe
        try {
            const data = await geminiService.refineWireframeData(currentWireframe, prompt);
            setWireframeResult(data);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Ocurrió un error al refinar el wireframe.';
            setError(errorMessage);
            addToast({ type: 'error', title: 'Error de IA', message: errorMessage });
        } finally {
            setIsLoading(false);
        }
    }, [addToast]);

    const generateCode = useCallback(async () => {
        if (!wireframeResult) return;
        setIsLoading(true);
        setLoadingText('Generando código desde el wireframe...');
        setError(null);
        setCodeResult(null);
        try {
            const data = await geminiService.generateCodeFromWireframe(wireframeResult, 'React con TailwindCSS');
            setCodeResult(data);
            addToast({ type: 'success', title: '¡Código Generado!', message: `Se generó el componente ${data.filePath}.` });
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Ocurrió un error al generar el código.';
            setError(errorMessage);
            addToast({ type: 'error', title: 'Error de IA', message: errorMessage });
        } finally {
            setIsLoading(false);
        }
    }, [wireframeResult, addToast]);

    const resetWireframe = useCallback(() => {
        setWireframeResult(null);
        setCodeResult(null);
        setIsLoading(false);
        setLoadingText('');
        setError(null);
    }, []);

    const saveDraft = useCallback((wireframe: WireframeData) => {
        if (!wireframe) {
            addToast({ type: 'warning', title: 'Sin Datos', message: 'No hay wireframe para guardar.' });
            return;
        }
        try {
            window.localStorage.setItem(WIREFRAME_DRAFT_KEY, JSON.stringify(wireframe));
            setHasDraft(true);
            addToast({ type: 'success', title: 'Borrador Guardado', message: 'Tu wireframe ha sido guardado localmente.' });
        } catch (e) {
            console.error("Failed to save wireframe draft", e);
            addToast({ type: 'error', title: 'Error', message: 'No se pudo guardar el borrador.' });
        }
    }, [addToast]);

    const loadDraft = useCallback(() => {
        try {
            const savedDraft = window.localStorage.getItem(WIREFRAME_DRAFT_KEY);
            if (savedDraft) {
                const parsedDraft = JSON.parse(savedDraft);
                setWireframeResult(parsedDraft);
                setCodeResult(null);
                addToast({ type: 'success', title: 'Borrador Cargado', message: 'Se ha cargado tu último borrador.' });
            } else {
                addToast({ type: 'info', title: 'No Encontrado', message: 'No se encontró ningún borrador guardado.' });
            }
        } catch (e) {
            console.error("Failed to load wireframe draft", e);
            addToast({ type: 'error', title: 'Error', message: 'No se pudo cargar el borrador.' });
        }
    }, [addToast]);

    const clearDraft = useCallback(() => {
        try {
            window.localStorage.removeItem(WIREFRAME_DRAFT_KEY);
            setHasDraft(false);
            addToast({ type: 'info', title: 'Borrador Eliminado', message: 'El borrador guardado ha sido eliminado.' });
        } catch (e) {
            console.error("Failed to clear wireframe draft", e);
            addToast({ type: 'error', title: 'Error', message: 'No se pudo eliminar el borrador.' });
        }
    }, [addToast]);

    const value = {
        wireframeResult,
        codeResult,
        isLoading,
        loadingText,
        error,
        hasDraft,
        setWireframeResult,
        generateWireframe,
        refineWireframe,
        generateCode,
        resetWireframe,
        saveDraft,
        loadDraft,
        clearDraft
    };
    
    return <WireframeContext.Provider value={value}>{children}</WireframeContext.Provider>;
};

export const useWireframeContext = () => {
    const context = useContext(WireframeContext);
    if (context === undefined) {
        throw new Error('useWireframeContext must be used within a WireframeProvider');
    }
    return context;
};