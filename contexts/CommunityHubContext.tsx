import React, { createContext, useContext, ReactNode, useCallback, useState, useReducer, useEffect } from 'react';
import { ChatRoom, CommunityUser, CommunityMessage, User } from '../types';
import { useMockWebSocket, MockWebSocketEvent } from '../hooks/useMockWebSocket';
import * as geminiService from '../services/geminiService';


interface CommunityHubState {
    connectionState: 'disconnected' | 'connecting' | 'connected';
    currentUser: CommunityUser | null;
    rooms: ChatRoom[];
    usersByRoom: Record<string, CommunityUser[]>;
    messagesByRoom: Record<string, CommunityMessage[]>;
    activeRoomId: string | null;
    typingUsers: Record<string, CommunityUser[]>;
    unreadRooms: Set<string>;
}

type CommunityHubAction =
    | { type: 'SET_CONNECTION_STATE'; payload: CommunityHubState['connectionState'] }
    | { type: 'SET_CURRENT_USER'; payload: CommunityUser }
    | { type: 'RECEIVE_INITIAL_DATA'; payload: { rooms: ChatRoom[] } }
    | { type: 'SET_ACTIVE_ROOM'; payload: { roomId: string; users: CommunityUser[]; messages: CommunityMessage[] } }
    | { type: 'ADD_MESSAGE'; payload: CommunityMessage }
    | { type: 'UPDATE_MESSAGE'; payload: CommunityMessage }
    | { type: 'ADD_USER_TO_ROOM'; payload: { roomId: string; user: CommunityUser } }
    | { type: 'REMOVE_USER_FROM_ROOM'; payload: { roomId: string; userId: string } }
    | { type: 'SET_MESSAGE_TRANSLATION_STATE'; payload: { roomId: string; messageId: string; isTranslating?: boolean; translatedText?: string } }
    | { type: 'ADD_TYPING_USER'; payload: { roomId: string; user: CommunityUser } }
    | { type: 'REMOVE_TYPING_USER'; payload: { roomId: string; user: CommunityUser } }
    | { type: 'RESET' };

const initialState: CommunityHubState = {
    connectionState: 'disconnected',
    currentUser: null,
    rooms: [],
    usersByRoom: {},
    messagesByRoom: {},
    activeRoomId: null,
    typingUsers: {},
    unreadRooms: new Set(),
};

function communityHubReducer(state: CommunityHubState, action: CommunityHubAction): CommunityHubState {
    switch (action.type) {
        case 'SET_CONNECTION_STATE':
            return { ...state, connectionState: action.payload };
        case 'SET_CURRENT_USER':
            return { ...state, currentUser: action.payload };
        case 'RECEIVE_INITIAL_DATA':
            return { ...state, rooms: action.payload.rooms, connectionState: 'connected' };
        case 'SET_ACTIVE_ROOM': {
            const newUnread = new Set(state.unreadRooms);
            newUnread.delete(action.payload.roomId);
            return {
                ...state,
                activeRoomId: action.payload.roomId,
                usersByRoom: { ...state.usersByRoom, [action.payload.roomId]: action.payload.users },
                messagesByRoom: { ...state.messagesByRoom, [action.payload.roomId]: action.payload.messages },
                unreadRooms: newUnread,
            };
        }
        case 'ADD_MESSAGE': {
            const { roomId } = action.payload;
            const existingMessages = state.messagesByRoom[roomId] || [];
            
            const newState = {
                ...state,
                messagesByRoom: {
                    ...state.messagesByRoom,
                    [roomId]: [...existingMessages, action.payload],
                },
            };

            if (roomId !== state.activeRoomId) {
                const newUnread = new Set(state.unreadRooms);
                newUnread.add(roomId);
                newState.unreadRooms = newUnread;
            }

            return newState;
        }
         case 'UPDATE_MESSAGE': {
            const { roomId, id: messageId } = action.payload;
            const roomMessages = state.messagesByRoom[roomId] || [];
            return {
                ...state,
                messagesByRoom: {
                    ...state.messagesByRoom,
                    [roomId]: roomMessages.map(msg => msg.id === messageId ? action.payload : msg),
                },
            };
        }
        case 'ADD_USER_TO_ROOM': {
            const { roomId, user } = action.payload;
            const existingUsers = state.usersByRoom[roomId] || [];
            if (existingUsers.some(u => u.id === user.id)) return state;
            return {
                ...state,
                usersByRoom: {
                    ...state.usersByRoom,
                    [roomId]: [...existingUsers, user],
                },
            };
        }
        case 'REMOVE_USER_FROM_ROOM': {
            const { roomId, userId } = action.payload;
            const existingUsers = state.usersByRoom[roomId] || [];
            return {
                ...state,
                usersByRoom: {
                    ...state.usersByRoom,
                    [roomId]: existingUsers.filter(u => u.id !== userId),
                },
            };
        }
        case 'SET_MESSAGE_TRANSLATION_STATE': {
            const { roomId, messageId, isTranslating, translatedText } = action.payload;
            const roomMessages = state.messagesByRoom[roomId] || [];
            return {
                ...state,
                messagesByRoom: {
                    ...state.messagesByRoom,
                    [roomId]: roomMessages.map(msg =>
                        msg.id === messageId
                            ? { ...msg, isTranslating: isTranslating, ...(translatedText !== undefined && { translatedText }) }
                            : msg
                    ),
                },
            };
        }
        case 'ADD_TYPING_USER': {
            const { roomId, user } = action.payload;
            const currentTyping = state.typingUsers[roomId] || [];
            if (currentTyping.some(u => u.id === user.id)) return state;
            return { ...state, typingUsers: { ...state.typingUsers, [roomId]: [...currentTyping, user] } };
        }
        case 'REMOVE_TYPING_USER': {
            const { roomId, user } = action.payload;
            const currentTyping = state.typingUsers[roomId] || [];
            return { ...state, typingUsers: { ...state.typingUsers, [roomId]: currentTyping.filter(u => u.id !== user.id) } };
        }
        case 'RESET':
            return initialState;
        default:
            return state;
    }
}


interface CommunityHubContextType extends CommunityHubState {
    connect: (user: User) => void;
    joinRoom: (roomId: string) => void;
    sendMessage: (text: string) => void;
    sendSystemMessage: (roomId: string, text: string) => void;
    reactToMessage: (messageId: string, emoji: string) => void;
    stopBots: () => void;
    setBotChattiness: (chattiness: 'low' | 'medium' | 'high') => void; // Added new function
}

const CommunityHubContext = createContext<CommunityHubContextType | undefined>(undefined);

export const CommunityHubProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(communityHubReducer, initialState);

    const handleWebSocketMessage = useCallback((event: MockWebSocketEvent) => {
        switch (event.type) {
            case 'connected':
                dispatch({ type: 'RECEIVE_INITIAL_DATA', payload: event.payload });
                break;
            case 'room-joined':
                dispatch({ type: 'SET_ACTIVE_ROOM', payload: event.payload });
                break;
            case 'message':
                dispatch({ type: 'ADD_MESSAGE', payload: event.payload });
                break;
             case 'message-updated':
                dispatch({ type: 'UPDATE_MESSAGE', payload: event.payload });
                break;
            case 'user-joined':
                dispatch({ type: 'ADD_USER_TO_ROOM', payload: event.payload });
                break;
            case 'user-left':
                dispatch({ type: 'REMOVE_USER_FROM_ROOM', payload: event.payload });
                break;
            case 'bot-typing-start':
                dispatch({ type: 'ADD_TYPING_USER', payload: event.payload });
                break;
            case 'bot-typing-stop':
                dispatch({ type: 'REMOVE_TYPING_USER', payload: event.payload });
                break;
        }
    }, []);

    const { connect: wsConnect, joinRoom: wsJoinRoom, sendMessage: wsSendMessage, sendSystemMessage: wsSendSystemMessage, reactToMessage: wsReactToMessage, stopBots: wsStopBots, setBotChattiness: wsSetBotChattiness } = useMockWebSocket(handleWebSocketMessage);
    
    // Effect to handle automatic translations
    useEffect(() => {
        if (state.connectionState !== 'connected' || !state.currentUser?.lang) return;
        
        const currentUserLang = state.currentUser.lang;

        const translateNeededMessages = async () => {
            for (const roomId in state.messagesByRoom) {
                const messages = state.messagesByRoom[roomId];
                for (const msg of messages) {
                    const needsTranslation = msg.lang !== currentUserLang && !msg.translatedText && !msg.isTranslating && msg.type === 'message';
                    if (needsTranslation) {
                        dispatch({ type: 'SET_MESSAGE_TRANSLATION_STATE', payload: { roomId, messageId: msg.id, isTranslating: true } });
                        try {
                            const translated = await geminiService.translateText(msg.text, currentUserLang, msg.lang);
                            dispatch({ type: 'SET_MESSAGE_TRANSLATION_STATE', payload: { roomId, messageId: msg.id, isTranslating: false, translatedText: translated } });
                        } catch (e) {
                            console.error("Translation failed for message:", msg.id, e);
                            const failureText = currentUserLang === 'es' ? '(Traducción fallida)' : '(Translation failed)';
                            dispatch({ type: 'SET_MESSAGE_TRANSLATION_STATE', payload: { roomId, messageId: msg.id, isTranslating: false, translatedText: failureText } });
                        }
                    }
                }
            }
        };

        translateNeededMessages();
    }, [state.messagesByRoom, state.currentUser, state.connectionState]);
    
    const connect = useCallback((user: User) => {
        dispatch({ type: 'SET_CONNECTION_STATE', payload: 'connecting' });
        const communityUser: CommunityUser = { ...user, id: user.username, isCurrentUser: true };
        dispatch({ type: 'SET_CURRENT_USER', payload: communityUser });
        wsConnect(communityUser);
    }, [wsConnect]);

    const joinRoom = useCallback((roomId: string) => {
        wsJoinRoom(roomId);
    }, [wsJoinRoom]);
    
    const sendMessage = useCallback((text: string) => {
        if (state.activeRoomId) {
            wsSendMessage(state.activeRoomId, text);
        }
    }, [state.activeRoomId, wsSendMessage]);

    const sendSystemMessage = useCallback((roomId: string, text: string) => {
        wsSendSystemMessage(roomId, text);
    }, [wsSendSystemMessage]);
    
    const reactToMessage = useCallback((messageId: string, emoji: string) => {
        if (state.activeRoomId && state.currentUser) {
            wsReactToMessage(state.activeRoomId, messageId, emoji, state.currentUser);
        }
    }, [state.activeRoomId, state.currentUser, wsReactToMessage]);

    const setBotChattiness = useCallback((chattiness: 'low' | 'medium' | 'high') => {
        wsSetBotChattiness(chattiness);
    }, [wsSetBotChattiness]);

    const value = { ...state, connect, joinRoom, sendMessage, sendSystemMessage, reactToMessage, stopBots: wsStopBots, setBotChattiness };
    
    return (
        <CommunityHubContext.Provider value={value}>
            {children}
        </CommunityHubContext.Provider>
    );
};

export const useCommunityHub = () => {
    const context = useContext(CommunityHubContext);
    if (context === undefined) {
        throw new Error('useCommunityHub must be used within a CommunityHubProvider');
    }
    return context;
};