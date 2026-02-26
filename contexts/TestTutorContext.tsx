import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { ChatMessage, TechStack, TechCategory, TechValue } from '../types';
import * as geminiService from '../services/geminiService';
import { useToastContext } from './ToastContext';
import { Chat } from '@google/genai';

type TutorStep = 'input' | 'tutoring';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

interface TestTutorContextType {
    // State
    tutorStep: TutorStep;
    userCode: string;
    techStack: TechStack;
    tutorHistory: ChatMessage[];
    isLoading: boolean;
    error: string | null;
    analysisFeedback: string | null;
    isAnalyzing: boolean;


    // Functions
    startTutoring: (code: string, tech: TechStack) => Promise<void>;
    sendTutorMessage: (message: string) => Promise<void>;
    handleTechSelect: (category: TechCategory, value: TechValue) => void;
    getAnalysis: (code: string, tech: TechStack) => Promise<void>;
    resetTutor: () => void;
}

const TestTutorContext = createContext<TestTutorContextType | undefined>(undefined);

export const TestTutorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [tutorStep, setTutorStep] = useState<TutorStep>('input');
    const [userCode, setUserCode] = useState('');
    const [techStack, setTechStack] = useState<TechStack>({
        frontend: 'React', backend: 'None', database: 'None', mobile: 'None', devops: []
    });
    const [tutorHistory, setTutorHistory] = useState<ChatMessage[]>([]);
    const [chatSession, setChatSession] = useState<Chat | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [analysisFeedback, setAnalysisFeedback] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const { addToast } = useToastContext();

    const getAnalysis = useCallback(async (code: string, tech: TechStack) => {
        setIsAnalyzing(true);
        setError(null);
        setAnalysisFeedback(null);
        try {
            const feedback = await geminiService.getQuickCodeAnalysis(code, tech);
            setAnalysisFeedback(feedback);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Ocurrió un error en el análisis.';
            setError(errorMessage);
            addToast({ type: 'error', title: 'Error de Análisis', message: errorMessage });
        } finally {
            setIsAnalyzing(false);
        }
    }, [addToast]);


    const startTutoring = useCallback(async (code: string, tech: TechStack) => {
        setIsLoading(true);
        setError(null);
        setUserCode(code);
        setTechStack(tech);

        const session = geminiService.startTestTutorChat();
        setChatSession(session);

        const relevantTech = tech.frontend !== 'None' ? tech.frontend : tech.backend;
        const initialPrompt = `Hola, quiero aprender a escribir pruebas para el siguiente código usando ${relevantTech}. Por favor, guíame paso a paso.\n\n\`\`\`\n${code}\n\`\`\``;

        setTutorHistory([{ id: generateId(), sender: 'user', text: "Comencemos a escribir algunas pruebas." }]);
        setTutorStep('tutoring');

        try {
            const stream = await geminiService.sendMessageToAI(session, initialPrompt);
            let fullResponse = '';
            setTutorHistory(prev => [...prev, { id: generateId(), sender: 'ai', text: '' }]);
            for await (const chunk of stream) {
                if (chunk.text) {
                    fullResponse += chunk.text;
                    setTutorHistory(prev => {
                        const newHistory = [...prev];
                        const lastIndex = newHistory.length - 1;
                        if (lastIndex >= 0 && newHistory[lastIndex].sender === 'ai') {
                            newHistory[lastIndex] = { ...newHistory[lastIndex], text: fullResponse };
                        }
                        return newHistory;
                    });
                }
            }
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Ocurrió un error desconocido.';
            setError(errorMessage);
            setTutorHistory(prev => [...prev, { id: generateId(), sender: 'ai', text: `Lo siento, hubo un error. _${errorMessage}_` }]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const sendTutorMessage = useCallback(async (message: string) => {
        if (!chatSession || !message.trim()) return;

        const userMessage: ChatMessage = { id: generateId(), sender: 'user', text: message };
        setTutorHistory(prev => [...prev, userMessage, { id: generateId(), sender: 'ai', text: '' }]);
        setIsLoading(true);
        setError(null);

        try {
            const stream = await geminiService.sendMessageToAI(chatSession, message);
            let fullResponse = '';
            for await (const chunk of stream) {
                if (chunk.text) {
                    fullResponse += chunk.text;
                    setTutorHistory(prev => {
                        const newHistory = [...prev];
                        const lastIndex = newHistory.length - 1;
                        if (lastIndex >= 0 && newHistory[lastIndex].sender === 'ai') {
                            newHistory[lastIndex] = { ...newHistory[lastIndex], text: fullResponse };
                        }
                        return newHistory;
                    });
                }
            }
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Ocurrió un error desconocido.';
            setError(errorMessage);
            setTutorHistory(prev => {
                const newHistory = [...prev];
                const lastIndex = newHistory.length - 1;
                if (lastIndex >= 0 && newHistory[lastIndex].sender === 'ai') {
                    newHistory[lastIndex] = { ...newHistory[lastIndex], text: `Lo siento, hubo un error. _${errorMessage}_` };
                }
                return newHistory;
            });
        } finally {
            setIsLoading(false);
        }
    }, [chatSession]);

    const handleTechSelect = (category: TechCategory, value: TechValue) => {
        const newStack: TechStack = { frontend: 'None', backend: 'None', database: 'None', mobile: 'None', devops: [] };
        if (category === 'frontend' || category === 'backend') {
            newStack[category] = value;
        }
        setTechStack(newStack);
    };

    const resetTutor = useCallback(() => {
        setTutorStep('input');
        setUserCode('');
        setTechStack({ frontend: 'React', backend: 'None', database: 'None', mobile: 'None', devops: [] });
        setTutorHistory([]);
        setChatSession(null);
        setIsLoading(false);
        setError(null);
        setAnalysisFeedback(null);
        setIsAnalyzing(false);
    }, []);

    const value = {
        tutorStep, userCode, techStack, tutorHistory, isLoading, error, analysisFeedback, isAnalyzing,
        startTutoring, sendTutorMessage, handleTechSelect, getAnalysis, resetTutor
    };

    return <TestTutorContext.Provider value={value}>{children}</TestTutorContext.Provider>;
};

export const useTestTutorContext = () => {
    const context = useContext(TestTutorContext);
    if (context === undefined) {
        throw new Error('useTestTutorContext must be used within a TestTutorProvider');
    }
    return context;
};