import React, { useState, FormEvent, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AnalysisIssue, ChatMessage } from '../../types';
import { SendIcon } from '../ui/icons';
import { useI18n } from '../../contexts/I18nContext';
import { TranslationKey } from '../../i18n/translations';

const TutorMessage = React.memo<{ msg: ChatMessage }>(({ msg }) => (
    <div className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
        {msg.sender === 'ai' && <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex-shrink-0 flex items-center justify-center font-bold text-white text-lg shadow-md shadow-primary/20">AI</div>}
        <div className={`max-w-md lg:max-w-lg px-4 py-3 rounded-2xl ${msg.sender === 'user' ? 'bg-primary text-white rounded-br-none' : 'bg-surface text-text-primary rounded-bl-none'}`}>
            <article className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
            </article>
        </div>
    </div>
));

export const TutorChatModal: React.FC<{
    isOpen: boolean; onClose: () => void; history: ChatMessage[]; onSendMessage: (message: string) => void; isLoading: boolean; issue: AnalysisIssue | null;
}> = ({ isOpen, onClose, history, onSendMessage, isLoading, issue }) => {
    const { t } = useI18n();
    const [input, setInput] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);
    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [history]);
    if (!isOpen) return null;
    const handleSubmit = (e: FormEvent) => { e.preventDefault(); if (input.trim() && !isLoading) { onSendMessage(input.trim()); setInput(''); } };
    return (
        <div className="fixed inset-0 z-50">
            <div className="fixed inset-0 bg-background/80 animate-fade-in z-40" onClick={onClose} />
            <div className="flex items-center justify-center h-full">
                <div className="bg-surface border border-border rounded-lg shadow-xl w-full max-w-2xl h-[80vh] m-4 transform transition-all animate-slide-up flex flex-col relative z-50" onClick={e => e.stopPropagation()}>
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute top-3 right-3 p-1 rounded-full text-text-secondary hover:bg-border/50 text-2xl leading-none w-8 h-8 flex items-center justify-center z-10"
                        aria-label={t('common.close' as TranslationKey)}
                    >
                        &times;
                    </button>
                    <div className="p-4 border-b border-border">
                        <h2 className="text-xl font-bold text-text-primary">{t('modal.tutor.title' as TranslationKey)}</h2>
                        <p className="text-sm text-text-secondary mt-1 truncate">{t('modal.tutor.explaining' as TranslationKey, { title: issue?.title || '' })}</p>
                    </div>
                    <div className="flex-grow p-4 overflow-y-auto space-y-6">
                        {history.map(msg => <TutorMessage key={msg.id} msg={msg} />)}
                        {isLoading && history.length > 0 && history[history.length - 1].sender === 'user' && (
                            <div className="flex items-start gap-3 justify-start">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex-shrink-0 flex items-center justify-center font-bold text-white text-lg shadow-md shadow-primary/20">AI</div>
                                <div className="px-4 py-3 rounded-2xl bg-surface text-text-primary rounded-bl-none">
                                    <div className="flex items-center gap-2"><div className="w-2 h-2 bg-accent rounded-full animate-pulse [animation-delay:-0.3s]"></div><div className="w-2 h-2 bg-accent rounded-full animate-pulse [animation-delay:-0.15s]"></div><div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div></div>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>
                    <form onSubmit={handleSubmit} className="p-2 border-t border-border">
                        <div className="flex items-center gap-2 p-1.5 bg-surface/80 border-2 border-border rounded-xl focus-within:ring-2 focus-within:ring-primary">
                            <input value={input} onChange={e => setInput(e.target.value)} placeholder={t('modal.tutor.placeholder' as TranslationKey)} className="w-full p-1 bg-transparent text-text-primary placeholder-text-tertiary outline-none" disabled={isLoading} />
                            <button type="submit" disabled={isLoading || !input.trim()} className="p-2 rounded-lg bg-primary text-white hover:bg-primary-focus disabled:bg-border disabled:cursor-not-allowed"><SendIcon className="w-5 h-5" /></button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};