import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatRoom, CommunityUser, CommunityMessage } from '../types';
import * as geminiService from '../services/geminiService';

// --- MOCK DATA ---
const BOT_USERS: CommunityUser[] = [
    { id: 'bot-1', username: 'DevBot', lang: 'es', persona: 'Desarrollador' },
    { id: 'bot-2', username: 'QA-Bot', lang: 'es', persona: 'QA' },
    { id: 'bot-3', username: 'DeployBot', lang: 'es', persona: 'DevOps' },
];

const ROOMS: ChatRoom[] = [
    { id: 'general', name: '# general', description: 'Chat general y anuncios' },
    { id: 'development', name: '# development', description: 'Discusiones sobre código y arquitectura' },
    { id: 'random', name: '# random', description: 'Para todo lo demás' },
];

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

// --- THE HOOK ---

export type MockWebSocketEvent = 
    | { type: 'connected'; payload: { rooms: ChatRoom[]; } }
    | { type: 'room-joined'; payload: { roomId: string; users: CommunityUser[]; messages: CommunityMessage[] } }
    | { type: 'message'; payload: CommunityMessage }
    | { type: 'message-updated'; payload: CommunityMessage }
    | { type: 'user-joined'; payload: { roomId: string; user: CommunityUser } }
    | { type: 'user-left'; payload: { roomId: string; userId: string } }
    | { type: 'bot-typing-start'; payload: { roomId: string; user: CommunityUser } }
    | { type: 'bot-typing-stop'; payload: { roomId: string; user: CommunityUser } };
    
export const useMockWebSocket = (onMessage: (event: MockWebSocketEvent) => void) => {
    const [isConnected, setIsConnected] = useState(false);
    const [botChattiness, setBotChattiness] = useState<'low' | 'medium' | 'high'>('medium'); // New state for bot chattiness
    const currentUserRef = useRef<CommunityUser | null>(null);
    const usersByRoomRef = useRef<Record<string, CommunityUser[]>>({ general: [], development: [], random: [] });
    const messagesByRoomRef = useRef<Record<string, CommunityMessage[]>>({ general: [], development: [], random: [] });
    const botTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const broadcast = useCallback((roomId: string, message: CommunityMessage) => {
        const currentMessages = messagesByRoomRef.current[roomId] || [];
        messagesByRoomRef.current[roomId] = [...currentMessages, message];
        onMessage({ type: 'message', payload: message });
    }, [onMessage]);

    const scheduleNextBotMessage = useCallback(() => {
        if (botTimeoutRef.current) {
            clearTimeout(botTimeoutRef.current);
        }
        
        let minDelay, maxDelay;
        switch (botChattiness) {
            case 'low':
                minDelay = 30000; // 30 seconds
                maxDelay = 60000; // 60 seconds
                break;
            case 'high':
                minDelay = 5000;  // 5 seconds
                maxDelay = 15000; // 15 seconds
                break;
            case 'medium':
            default:
                minDelay = 15000; // 15 seconds
                maxDelay = 35000; // 35 seconds
                break;
        }
        const randomDelay = Math.random() * (maxDelay - minDelay) + minDelay;

        botTimeoutRef.current = setTimeout(async () => {
            try {
                const availableRooms = Object.keys(messagesByRoomRef.current).filter(roomId => messagesByRoomRef.current[roomId].length > 0);
                const targetRoomId = availableRooms.length > 0 ? availableRooms[Math.floor(Math.random() * availableRooms.length)] : ROOMS[0].id;
                const targetRoom = ROOMS.find(r => r.id === targetRoomId)!;
                
                const recentMessages = messagesByRoomRef.current[targetRoom.id]?.slice(-5) || [];
                let selectedBot: CommunityUser | undefined;
                let contextMessage = '';

                // Check for keyword-based reactions
                const lastUserMessage = recentMessages.filter(m => m.user.id === currentUserRef.current?.id || !m.user.id.startsWith('bot-')).pop();
                if (lastUserMessage && lastUserMessage.text) {
                    const lowerCaseText = lastUserMessage.text.toLowerCase();
                    if (lowerCaseText.includes('código') || lowerCaseText.includes('desarrollo') || lowerCaseText.includes('frontend') || lowerCaseText.includes('backend')) {
                        selectedBot = BOT_USERS.find(b => b.persona === 'Desarrollador');
                    } else if (lowerCaseText.includes('pruebas') || lowerCaseText.includes('calidad') || lowerCaseText.includes('bugs')) {
                        selectedBot = BOT_USERS.find(b => b.persona === 'QA');
                    } else if (lowerCaseText.includes('despliegue') || lowerCaseText.includes('servidor') || lowerCaseText.includes('cloud') || lowerCaseText.includes('devops')) {
                        selectedBot = BOT_USERS.find(b => b.persona === 'DevOps');
                    }

                    if (selectedBot) {
                        contextMessage = `El último mensaje relevante del usuario fue: "${lastUserMessage.text}"`;
                    }
                }

                if (!selectedBot) {
                    selectedBot = BOT_USERS[Math.floor(Math.random() * BOT_USERS.length)];
                }

                if (!selectedBot?.persona) {
                     scheduleNextBotMessage();
                     return;
                }

                const fullContext = recentMessages.map(m => `${m.user.username}: ${m.text}`).join('\n') + (contextMessage ? `\n${contextMessage}` : '');
                
                onMessage({ type: 'bot-typing-start', payload: { roomId: targetRoom.id, user: selectedBot }});

                // Simulate typing
                await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));

                const generatedText = await geminiService.generateBotMessage(selectedBot.persona, targetRoom.name, fullContext);
                
                onMessage({ type: 'bot-typing-stop', payload: { roomId: targetRoom.id, user: selectedBot }});

                if (!generatedText) {
                    scheduleNextBotMessage();
                    return;
                }

                const message: CommunityMessage = {
                    id: generateId(),
                    roomId: targetRoom.id,
                    user: selectedBot,
                    text: generatedText,
                    timestamp: Date.now(),
                    type: 'message',
                    lang: 'es',
                };
                broadcast(targetRoom.id, message);
            } catch (error) {
                console.error("Error in bot message generation loop:", error);
            } finally {
                scheduleNextBotMessage();
            }
        }, randomDelay);
    }, [broadcast, onMessage, botChattiness, currentUserRef]);
    
    const stopBots = useCallback(() => {
        if (botTimeoutRef.current) {
            clearTimeout(botTimeoutRef.current);
            botTimeoutRef.current = null;
        }
    }, []);

    const connect = useCallback((user: CommunityUser) => {
        if (isConnected) return;
        
        currentUserRef.current = user;
        setIsConnected(true);
        
        ROOMS.forEach(room => {
            usersByRoomRef.current[room.id] = [...BOT_USERS];
        });
        
        onMessage({ type: 'connected', payload: { rooms: ROOMS } });
        scheduleNextBotMessage();
    }, [isConnected, onMessage, scheduleNextBotMessage]);
    
    const joinRoom = useCallback((roomId: string) => {
        if (!isConnected || !currentUserRef.current) return;
        
        Object.keys(usersByRoomRef.current).forEach(rId => {
             const userIndex = usersByRoomRef.current[rId].findIndex(u => u.id === currentUserRef.current!.id);
             if (userIndex > -1) {
                 usersByRoomRef.current[rId].splice(userIndex, 1);
                 const systemMessage: CommunityMessage = {
                     id: generateId(), roomId: rId, user: {id: 'system', username: 'System'},
                     text: `${currentUserRef.current!.username} ha salido de la sala.`,
                     timestamp: Date.now(), type: 'system', lang: 'es'
                 };
                 broadcast(rId, systemMessage);
                 onMessage({ type: 'user-left', payload: { roomId: rId, userId: currentUserRef.current!.id }});
             }
        });
        
        usersByRoomRef.current[roomId].push(currentUserRef.current);
        const systemMessage: CommunityMessage = {
            id: generateId(), roomId: roomId, user: {id: 'system', username: 'System'},
            text: `${currentUserRef.current.username} se ha unido a la sala.`,
            timestamp: Date.now(), type: 'system', lang: 'es'
        };
        broadcast(roomId, systemMessage);
        
        onMessage({ type: 'user-joined', payload: { roomId: roomId, user: currentUserRef.current }});
        
        onMessage({
            type: 'room-joined',
            payload: {
                roomId,
                users: usersByRoomRef.current[roomId],
                messages: messagesByRoomRef.current[roomId],
            }
        });

    }, [isConnected, onMessage, broadcast, currentUserRef]);
    
    const reactToMessage = useCallback((roomId: string, messageId: string, emoji: string, user: CommunityUser) => {
        const roomMessages = messagesByRoomRef.current[roomId];
        const messageIndex = roomMessages.findIndex(m => m.id === messageId);
        if (messageIndex === -1) return;

        const message = { ...roomMessages[messageIndex] };
        message.reactions = { ...(message.reactions || {}) };

        const usersWhoReacted = message.reactions[emoji] || [];
        if (usersWhoReacted.includes(user.username)) {
            message.reactions[emoji] = usersWhoReacted.filter(u => u !== user.username);
        } else {
            message.reactions[emoji] = [...usersWhoReacted, user.username];
        }

        if (message.reactions[emoji].length === 0) {
            delete message.reactions[emoji];
        }

        roomMessages[messageIndex] = message;
        onMessage({ type: 'message-updated', payload: message });
    }, [onMessage]);

    const sendMessage = useCallback((roomId: string, text: string) => {
        if (!isConnected || !currentUserRef.current) return;
        
        const message: CommunityMessage = {
            id: generateId(),
            roomId,
            user: currentUserRef.current,
            text,
            timestamp: Date.now(),
            type: 'message',
            lang: currentUserRef.current.lang || 'es',
        };
        broadcast(roomId, message);
        
        // Bot reaction logic
        setTimeout(() => {
            if (Math.random() < 0.3 && !message.user.id.startsWith('bot-')) { // Bots don't react to bots
                const randomBot = BOT_USERS[Math.floor(Math.random() * BOT_USERS.length)];
                const randomEmoji = ['👍', '❤️', '😂', '🎉'][Math.floor(Math.random() * 4)];
                reactToMessage(roomId, message.id, randomEmoji, randomBot);
            }
        }, Math.random() * 4000 + 2000);

    }, [isConnected, broadcast, reactToMessage, currentUserRef]);
    
    const sendSystemMessage = useCallback((roomId: string, text: string) => {
        if (!isConnected) return;
        
        const message: CommunityMessage = {
            id: generateId(),
            roomId,
            user: { id: 'system', username: 'System' },
            text,
            timestamp: Date.now(),
            type: 'system',
            lang: 'es',
        };
        broadcast(roomId, message);
    }, [isConnected, broadcast]);

    useEffect(() => {
        return () => {
            stopBots();
        };
    }, [stopBots]);

    return { connect, joinRoom, sendMessage, sendSystemMessage, reactToMessage, stopBots, setBotChattiness };
};