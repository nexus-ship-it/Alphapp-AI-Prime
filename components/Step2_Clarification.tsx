

import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import { useArchitectContext } from '../contexts/ArchitectContext';
import { SendIcon } from './ui/icons';

interface Step2ClarificationProps {
    onSubmit: (fullHistory: ChatMessage[]) => void;
    initialHistory: ChatMessage[];
}

const ClarificationMessage = React.memo<{ msg: ChatMessage }>(({ msg }) => {
    return (
        <div className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.sender === 'ai' && (
                 <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex-shrink-0 flex items-center justify-center font-bold text-white text-lg shadow-md shadow-primary/20">
                    AI
                </div>
            )}
            <div className={`max-w-md lg:max-w-lg px-4 py-3 rounded-2xl shadow-md ${msg.sender === 'user' ? 'bg-primary text-white rounded-br-none' : 'bg-surface text-text-primary rounded-bl-none'}`}>
                <p className="text-base whitespace-pre-wrap">{msg.text}</p>
            </div>
        </div>
    );
});


const Step2Clarification: React.FC<Step2ClarificationProps> = ({ onSubmit, initialHistory }) => {
    const { 
        clarificationHistory, 
        sendClarificationMessage, 
        isLoading 
    } = useArchitectContext();
    
    const [userInput, setUserInput] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [clarificationHistory]);
    
    const handleUserSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || isLoading) return;
        
        const currentInput = userInput;
        setUserInput('');
        
        await sendClarificationMessage(currentInput, onSubmit);
    };
    
    const allQuestionsAnswered = clarificationHistory.some(m => m.text.toLowerCase().includes("gracias") || m.text.toLowerCase().includes("perfecto"));

    return (
        <div className="w-full max-w-3xl mx-auto flex flex-col h-[75vh] animate-slide-up">
            <div className="text-center mb-8">
                <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-primary mb-2 drop-shadow-text-glow-primary">Paso 2: Aclaración</h1>
                <p className="text-lg text-text-secondary">Responde a las preguntas de la IA para refinar los detalles de tu proyecto.</p>
            </div>
            <div className="flex-grow bg-surface/30 border border-border/50 rounded-t-lg p-6 overflow-y-auto space-y-6 backdrop-blur-sm">
                {clarificationHistory.map((msg) => (
                    <ClarificationMessage key={msg.id} msg={msg} />
                ))}
                 {isLoading && !allQuestionsAnswered && (
                    <div className="flex items-start gap-3 justify-start">
                         <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex-shrink-0 flex items-center justify-center font-bold text-white text-lg shadow-md shadow-primary/20">
                                AI
                         </div>
                         <div className="px-4 py-3 rounded-2xl bg-surface text-text-primary rounded-bl-none">
                             <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-accent rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                                <div className="w-2 h-2 bg-accent rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                                <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                             </div>
                         </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleUserSubmit} className="p-4 bg-surface/30 border-t-2 border-border/50 backdrop-blur-sm rounded-b-lg">
                <div className="flex items-center gap-2 p-1.5 bg-surface/80 border-2 border-border/50 rounded-xl focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-all duration-300">
                    <input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder={isLoading ? "La IA está pensando..." : "Escribe tu respuesta..."}
                        className="w-full p-1 bg-transparent text-text-primary placeholder-text-tertiary outline-none"
                        disabled={isLoading || allQuestionsAnswered}
                        autoFocus
                    />
                     <button
                        type="submit"
                        disabled={isLoading || !userInput.trim() || allQuestionsAnswered}
                        className="p-2.5 rounded-lg bg-primary text-primary-content hover:bg-primary-focus transition-all disabled:bg-border disabled:cursor-not-allowed flex-shrink-0"
                        aria-label="Send message"
                    >
                        <SendIcon className="w-5 h-5" />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Step2Clarification;