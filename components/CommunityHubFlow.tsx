
import React, { useState, useEffect, useRef } from 'react';
import { useCommunityHub } from '../contexts/CommunityHubContext';
import { CommunityMessage, CommunityUser } from '../types';
import { SendIcon, BotIcon } from './ui/icons';
import { useModalContext } from '../contexts/ModalContext';
import ReactMarkdown from 'react-markdown';
import { Loader } from './ui/Loader';

const getAvatarColor = (username: string) => {
    const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-indigo-500', 'bg-pink-500'];
    const charCodeSum = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[charCodeSum % colors.length];
}

const Message: React.FC<{ message: CommunityMessage; currentUser: CommunityUser }> = React.memo(({ message, currentUser }) => {
    const [showOriginal, setShowOriginal] = useState(false);
    const isCurrentUser = message.user.id === currentUser.id;
    const isBot = message.user.id.startsWith('bot-');

    if (message.type === 'system') {
        return <div className="text-center my-4"><span className="text-[10px] font-black text-text-tertiary bg-surface/50 px-3 py-1 rounded-full uppercase tracking-widest border border-border/30">{message.text}</span></div>;
    }

    return (
        <div className={`flex items-start gap-3 my-6 animate-fade-in ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
             <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center font-bold text-white shadow-lg ${isBot ? 'bg-primary border-2 border-accent' : getAvatarColor(message.user.username)}`}>
                {isBot ? <BotIcon className="w-6 h-6"/> : message.user.username.charAt(0).toUpperCase()}
            </div>
            <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'} max-w-[80%]`}>
                <div className="flex items-center gap-2 mb-1 px-1">
                    <span className="text-xs font-black text-text-primary uppercase tracking-tighter">{message.user.username}</span>
                    <span className="text-[9px] text-text-tertiary">{new Date(message.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                </div>
                <div className={`px-4 py-3 rounded-2xl shadow-xl border border-white/5 ${isCurrentUser ? 'bg-primary text-white rounded-tr-none' : 'bg-surface/80 text-text-primary rounded-tl-none backdrop-blur-md'}`}>
                     <ReactMarkdown className="prose prose-invert prose-sm">{message.translatedText && !showOriginal ? message.translatedText : message.text}</ReactMarkdown>
                </div>
                {message.translatedText && (
                    <button onClick={() => setShowOriginal(!showOriginal)} className="text-[9px] text-accent mt-1 hover:underline uppercase font-bold tracking-widest">{showOriginal ? 'Ver Traducción' : 'Ver Original'}</button>
                )}
            </div>
        </div>
    );
});

const CommunityHubFlow: React.FC = () => {
    const { connectionState, currentUser, rooms, messagesByRoom, activeRoomId, joinRoom, sendMessage } = useCommunityHub();
    const { openModal } = useModalContext();
    const [msgInput, setMsgInput] = useState('');
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messagesByRoom, activeRoomId]);
    
    useEffect(() => {
        if (!currentUser && connectionState === 'disconnected') openModal('auth', {});
        if (connectionState === 'connected' && rooms.length > 0 && !activeRoomId) joinRoom(rooms[0].id);
    }, [currentUser, connectionState, rooms, activeRoomId, openModal, joinRoom]);

    if (!currentUser || !activeRoomId) return <Loader text="Entrando en la red..." />;

    return (
        <div className="h-full flex overflow-hidden bg-background/50">
            <aside className="w-64 border-r border-border/30 p-4 hidden md:flex flex-col gap-6 bg-surface/20">
                <h2 className="text-xs font-black text-text-tertiary uppercase tracking-[0.3em] px-2">Canales Centrales</h2>
                <nav className="flex-col gap-1 flex">
                    {rooms.map(r => (
                        <button key={r.id} onClick={() => joinRoom(r.id)} className={`p-3 rounded-xl text-left transition-all ${activeRoomId === r.id ? 'bg-primary/20 border border-primary/30 text-white shadow-inner' : 'text-text-secondary hover:bg-border/30'}`}>
                            <div className="font-black text-sm">{r.name}</div>
                            <div className="text-[10px] opacity-60 truncate">{r.description}</div>
                        </button>
                    ))}
                </nav>
            </aside>
            <main className="flex-1 flex flex-col">
                <div className="flex-grow p-4 overflow-y-auto custom-scrollbar">
                    {messagesByRoom[activeRoomId]?.map(m => <Message key={m.id} message={m} currentUser={currentUser} />)}
                    <div ref={endRef} />
                </div>
                <div className="p-4 border-t border-border/30 bg-surface/10 backdrop-blur-xl">
                    <form onSubmit={e => { e.preventDefault(); if (msgInput.trim()) { sendMessage(msgInput); setMsgInput(''); } }} className="flex items-center gap-2 bg-surface/80 p-1.5 rounded-2xl border border-border/50 focus-within:border-primary/50 transition-all">
                        <input value={msgInput} onChange={e => setMsgInput(e.target.value)} placeholder="Escribe un mensaje al Hub..." className="w-full bg-transparent p-2 outline-none text-sm" />
                        <button type="submit" className="p-3 bg-primary text-white rounded-xl shadow-lg shadow-primary/20"><SendIcon className="w-5 h-5"/></button>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default CommunityHubFlow;
