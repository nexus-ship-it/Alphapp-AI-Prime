
import { useState, useEffect, useCallback } from 'react';
import { ChatMessage, CodeDiagnostic, Conversation } from '../types';
import * as geminiService from '../services/geminiService';
import { Chat, Part } from '@google/genai';
import { useToastContext } from '../contexts/ToastContext';
import { useProjectContext } from '../contexts/ProjectContext';
import { useI18n } from '../contexts/I18nContext';

type AttachedFile = {
    name: string;
    mimeType: string;
    content: string; 
    isImage: boolean;
    isVideo: boolean;
    previewUrl?: string; 
    contentSnippet?: string; 
    isLoading: boolean;
};

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);
const ACTIVE_CHAT_STORAGE_KEY = 'alphapp-ai-chat-history';
const CHAT_LOG_STORAGE_KEY = 'alphapp-ai-chat-log';

export const useChat = () => {
    const { t } = useI18n();
    const { addToast } = useToastContext();
    const { projectFiles, isProjectLoaded } = useProjectContext();
    const [isProjectContextEnabled, setIsProjectContextEnabled] = useState(false);

    const [chatSession, setChatSession] = useState<Chat | null>(null);
    const [conversationLog, setConversationLog] = useState<Conversation[]>(() => {
        try {
            const savedLog = window.localStorage.getItem(CHAT_LOG_STORAGE_KEY);
            return savedLog ? JSON.parse(savedLog) : [];
        } catch (error) {
            return [];
        }
    });

    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
        try {
            const savedHistory = window.localStorage.getItem(ACTIVE_CHAT_STORAGE_KEY);
            if (savedHistory) {
                const parsedHistory = JSON.parse(savedHistory);
                if (Array.isArray(parsedHistory) && parsedHistory.length > 0) return parsedHistory;
            }
        } catch (error) {}
        // Mensaje inicial de "Nivel Dios"
        return [{ 
            id: generateId(), 
            sender: 'ai', 
            text: "Núcleo Alphapp AI Prime en línea. Protocolo de Sincronía activado. Estoy listo para transmutar tus ideas en arquitecturas de élite. ¿Cuál es el requerimiento del sistema hoy?", 
            timestamp: Date.now() 
        }];
    });

    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
    const [followUpSuggestions, setFollowUpSuggestions] = useState<string[]>([]);
    
    const saveCurrentConversation = useCallback(async () => {
        if (chatHistory.length <= 1 && attachedFiles.length === 0) return;
        let title = "Nueva Conversación";
        let updatedLog = [...conversationLog];

        if (currentConversationId) {
            const index = updatedLog.findIndex(c => c.id === currentConversationId);
            if (index !== -1) {
                updatedLog[index] = { ...updatedLog[index], messages: chatHistory, timestamp: Date.now() };
            }
        } else {
            const firstUserMessage = chatHistory.find(m => m.sender === 'user')?.text;
            if (firstUserMessage) {
                try {
                    title = await geminiService.getQuickAnswer(`Genera un título técnico muy corto y potente para: "${firstUserMessage}"`);
                } catch (e) {
                    title = firstUserMessage.substring(0, 30) + '...';
                }
            }
            const newId = generateId();
            updatedLog.unshift({ id: newId, title, timestamp: Date.now(), messages: chatHistory });
            setCurrentConversationId(newId);
        }
        setConversationLog(updatedLog);
        window.localStorage.setItem(CHAT_LOG_STORAGE_KEY, JSON.stringify(updatedLog));
    }, [chatHistory, conversationLog, currentConversationId, attachedFiles.length]);
    
    useEffect(() => {
        window.localStorage.setItem(ACTIVE_CHAT_STORAGE_KEY, JSON.stringify(chatHistory));
    }, [chatHistory]);

    useEffect(() => {
        setChatSession(geminiService.startChat(chatHistory));
    }, []);

    const addFiles = useCallback((files: FileList) => {
        if (!files) return;
        for (const file of Array.from(files)) {
            const reader = new FileReader();
            const isImage = file.type.startsWith('image/');
            const isVideo = file.type.startsWith('video/');
            setAttachedFiles(prev => [...prev, { name: file.name, mimeType: file.type, content: '', isImage, isVideo, isLoading: true }]);
            reader.onload = (e) => {
                const result = e.target?.result as string;
                setAttachedFiles(prev => prev.map(f => f.name === file.name ? {
                    ...f, content: result.includes(',') ? result.split(',')[1] : result,
                    previewUrl: (isImage || isVideo) ? result : undefined,
                    contentSnippet: (!isImage && !isVideo) ? result.substring(0, 100) : undefined,
                    isLoading: false
                } : f));
            };
            if (isImage || isVideo) reader.readAsDataURL(file);
            else reader.readAsText(file);
        }
    }, []);
    
    const removeFile = useCallback((name: string) => setAttachedFiles(prev => prev.filter(f => f.name !== name)), []);

    const sendMessage = useCallback(async (message: string) => {
        if (isLoading || !chatSession) return;
        setIsLoading(true);
        setError(null);
        setFollowUpSuggestions([]);
        
        const userMessage: ChatMessage = { id: generateId(), sender: 'user', text: message, timestamp: Date.now(), files: attachedFiles.map(f => ({ name: f.name, isImage: f.isImage, isVideo: f.isVideo })) };
        const currentHistoryWithUserMessage = [...chatHistory, userMessage];
        setChatHistory(currentHistoryWithUserMessage);

        const parts: (string | Part)[] = [{ text: message }];
        attachedFiles.forEach(file => parts.push({ inlineData: { mimeType: file.mimeType, data: file.content } }));
        
        if (isProjectContextEnabled && projectFiles?.length) {
            const projectContext = projectFiles.map(f => `--- ${f.path} ---\n${f.content}`).join('\n\n');
            parts.unshift({ text: `Contexto del proyecto actual (Actúa con omnisciencia sobre estos archivos):\n\`\`\`\n${projectContext}\n\`\`\`\n\nInstrucción del usuario:` });
        }
        setAttachedFiles([]);
        const aiMessageId = generateId();
        setChatHistory(prev => [...prev, { id: aiMessageId, sender: 'ai', text: '', sources: [], timestamp: Date.now() }]);

        try {
            const stream = await geminiService.sendMessageToAI(chatSession, parts);
            let fullResponse = '';
            for await (const chunk of stream) {
                const groundingMetadata = chunk.candidates?.[0]?.groundingMetadata;
                if (groundingMetadata?.groundingChunks) {
                    const sources = groundingMetadata.groundingChunks.map(c => c.web).filter(web => web?.uri) as { uri: string; title: string }[];
                    if (sources.length > 0) {
                        setChatHistory(prev => {
                            const newHistory = [...prev];
                            const lastMessage = newHistory[newHistory.length - 1];
                            if (lastMessage?.sender === 'ai') {
                                const existingUris = new Set((lastMessage.sources || []).map(s => s.uri));
                                const newSources = sources.filter(s => !existingUris.has(s.uri));
                                if (newSources.length > 0) lastMessage.sources = [...(lastMessage.sources || []), ...newSources];
                            }
                            return newHistory;
                        });
                    }
                }
                if (chunk.text) {
                    fullResponse += chunk.text;
                    setChatHistory(prev => {
                        const newHistory = [...prev];
                        newHistory[newHistory.length - 1] = { ...newHistory[newHistory.length - 1], text: fullResponse };
                        return newHistory;
                    });
                }
            }
            const suggestions = await geminiService.generateFollowUpSuggestions([...currentHistoryWithUserMessage, { id: aiMessageId, sender: 'ai', text: fullResponse }]);
            setFollowUpSuggestions(suggestions);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Fallo en la conexión neuronal.';
            setChatHistory(prev => prev.map(m => m.id === aiMessageId ? { ...m, text: `Anomalía detectada: ${errorMessage}` } : m));
            addToast({ type: 'error', title: 'Fallo de Contacto', message: errorMessage });
        } finally {
            setIsLoading(false);
            saveCurrentConversation();
        }
    }, [isLoading, chatSession, attachedFiles, isProjectContextEnabled, projectFiles, chatHistory, saveCurrentConversation, addToast]);

    const resetChat = useCallback(async () => {
        await saveCurrentConversation();
        setCurrentConversationId(null);
        setChatHistory([{ id: generateId(), sender: 'ai', text: "Memoria purgada. Núcleo reiniciado. ¿Qué nuevo sistema vamos a arquitectar hoy?", timestamp: Date.now() }]);
        setInputValue('');
        setAttachedFiles([]);
        setFollowUpSuggestions([]);
        setChatSession(geminiService.startChat());
    }, [saveCurrentConversation]);
    
    return {
        chatHistory, 
        onSendMessage: sendMessage,
        isLoading, 
        error, 
        inputValue, 
        onInputChange: setInputValue,
        attachedFiles, 
        onAddFiles: addFiles, 
        onRemoveFile: removeFile, 
        onResetChat: resetChat, 
        conversationLog, 
        loadConversation: (id: string) => {
            const conv = conversationLog.find(c => c.id === id);
            if (conv) { setChatHistory(conv.messages); setCurrentConversationId(id); setChatSession(geminiService.startChat(conv.messages)); }
        }, 
        deleteConversation: (id: string) => {
            const updated = conversationLog.filter(c => c.id !== id);
            setConversationLog(updated); window.localStorage.setItem(CHAT_LOG_STORAGE_KEY, JSON.stringify(updated));
            if (currentConversationId === id) resetChat();
        },
        followUpSuggestions, 
        setMessageFeedback: (mid: string, f: 'good' | 'bad') => setChatHistory(prev => prev.map(m => m.id === mid ? { ...m, feedback: f } : m)),
        isProjectLoaded, 
        isProjectContextEnabled, 
        toggleProjectContext: () => setIsProjectContextEnabled(!isProjectContextEnabled)
    };
};
