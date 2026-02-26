import React, { createContext, ReactNode, useContext, useMemo } from 'react';
import { useLiveChat } from '../hooks/useLiveChat';
import { ChatMessage } from '../types';

interface LiveChatContextType {
    isConnected: boolean;
    isConnecting: boolean;
    isListening: boolean;
    isSpeaking: boolean;
    aiIsTyping: boolean;
    liveError: string | null;
    transcriptHistory: ChatMessage[];
    startConversation: () => Promise<void>;
    stopConversation: () => void;
    sendUserText: (text: string) => void;
    clearHistory: () => void;
    apiKeyError: string | null;
    promptApiKeySelection: () => Promise<void>;
}

const LiveChatContext = createContext<LiveChatContextType | undefined>(undefined);

export const LiveChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Define the system instruction for the live chat
    const systemInstruction = "You are a friendly and helpful AI assistant designed for real-time voice conversations. Respond concisely and naturally. Your main goal is to assist the user through voice commands and spoken responses.";

    const liveChat = useLiveChat(systemInstruction);

    const value = useMemo(() => liveChat, [liveChat]);

    return <LiveChatContext.Provider value={value}>{children}</LiveChatContext.Provider>;
};

export const useLiveChatContext = () => {
    const context = useContext(LiveChatContext);
    if (context === undefined) {
        throw new Error('useLiveChatContext must be used within a LiveChatProvider');
    }
    return context;
};
