
import React, { useRef, useEffect, useCallback, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage, CodeDiagnostic } from '../types';
import { SendIcon, CopyIcon, MicrophoneIcon, PlayCircleIcon, PauseCircleIcon, PaperclipIcon, FileIcon, ImageIcon, RefreshIcon, SettingsIcon, SpeakerOnIcon, SpeakerOffIcon, HistoryIcon, StethoscopeIcon, ThumbsUpIcon, ThumbsDownIcon, CodeIcon, SpinnerIcon } from './ui/icons';
import { useToastContext } from '../contexts/ToastContext';
import { CodeBlock } from './ui/CodeBlock';

type AttachedFile = {
    name: string;
    isImage: boolean;
    isVideo: boolean;
    previewUrl?: string;
    contentSnippet?: string;
    isLoading: boolean;
};

export type ChatContext = 'chat' | 'guardian-threat-modeling' | 'test-tutor';

interface ChatInterfaceProps {
    chatHistory: ChatMessage[];
    onSendMessage: (message: string) => void;
    isLoading: boolean;
    inputValue: string;
    onInputChange: (value: string) => void;
    isListening: boolean;
    startListening: () => void;
    stopListening: () => void;
    onSpeak: (text: string) => void;
    cancelSpeaking: () => void;
    speakingText: string | null;
    attachedFiles: AttachedFile[];
    onAddFiles: (files: FileList) => void;
    onRemoveFile: (name: string) => void;
    onResetChat: () => void;
    isReadOnly?: boolean;
    isTtsEnabled: boolean;
    onToggleTts: () => void;
    onOpenVoiceModal: () => void;
    onOpenHistory: () => void;
    context?: ChatContext;
    followUpSuggestions?: string[];
    setMessageFeedback: (messageId: string, feedback: 'good' | 'bad') => void;
    isProjectLoaded?: boolean;
    isProjectContextEnabled?: boolean;
    onToggleProjectContext?: () => void;
}

const formatDateSeparator = (date: Date) => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Hoy';
    if (date.toDateString() === yesterday.toDateString()) return 'Ayer';
    return date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

const TimeSeparator: React.FC<{ date: Date }> = ({ date }) => (
    <div className="relative my-8">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-border/30" />
        </div>
        <div className="relative flex justify-center">
            <span className="bg-background px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-text-tertiary border border-border/30 rounded-full shadow-sm">
                {formatDateSeparator(date)}
            </span>
        </div>
    </div>
);

const ChatMessageBubble = React.memo(({ msg, onSpeak, cancelSpeaking, speakingText, onSendMessage, setMessageFeedback }: { 
    msg: ChatMessage; 
    onSpeak: (text: string) => void; 
    cancelSpeaking: () => void; 
    speakingText: string | null;
    onSendMessage: (message: string) => void;
    setMessageFeedback: (messageId: string, feedback: 'good' | 'bad') => void;
}) => {
    const isSpeakingThisMessage = speakingText === msg.text;
    const handleSpeakClick = () => isSpeakingThisMessage ? cancelSpeaking() : onSpeak(msg.text);

    return (
        <div className={`flex items-start gap-4 my-6 animate-fade-in ${msg.sender === 'user' ? 'justify-end' : ''}`}>
            {msg.sender === 'ai' && (
                 <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex-shrink-0 flex items-center justify-center font-black text-white text-xs shadow-glow-primary border border-white/20">
                    PRIME
                </div>
            )}
             <div className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-[75%]`}>
                <div className={`px-5 py-4 rounded-2xl shadow-xl group relative transition-all duration-300 border border-white/5
                    ${isSpeakingThisMessage ? 'ring-2 ring-primary shadow-glow-primary' : ''} 
                    ${msg.sender === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-surface/80 backdrop-blur-md text-text-primary rounded-tl-none'}
                `}>
                    {msg.files && msg.files.length > 0 && (
                        <div className="mb-3 border-b border-white/10 pb-3">
                            <p className="text-[10px] font-black uppercase tracking-wider opacity-60 mb-2 text-accent">Adjuntos Detectados</p>
                            <div className="flex flex-wrap gap-2">
                                {msg.files.map(f => (
                                    <div key={f.name} className="flex items-center gap-1.5 bg-black/20 px-2 py-1 rounded-md text-[11px] border border-white/5">
                                        {f.isImage ? <ImageIcon className="w-3.5 h-3.5"/> : <FileIcon className="w-3.5 h-3.5"/>}
                                        <span className="truncate max-w-[120px]">{f.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <article className="prose prose-invert prose-sm max-w-none 
                        prose-headings:text-accent prose-a:text-primary-content prose-strong:text-white
                        prose-p:leading-relaxed prose-li:my-1">
                         <ReactMarkdown 
                            remarkPlugins={[remarkGfm]} 
                            components={{ 
                                code: ({node, className, children, ...props}) => {
                                    const match = /language-(\w+)/.exec(className || '');
                                    const isBlock = match && String(children).includes('\n'); 
                                    return isBlock ? (
                                        <CodeBlock language={match[1]}>{String(children).replace(/\n$/, '')}</CodeBlock>
                                    ) : (
                                        <code className="bg-black/30 text-accent font-mono py-0.5 px-1.5 rounded text-[13px] border border-white/5" {...props}>
                                            {children}
                                        </code>
                                    )
                                }
                            }}
                        >
                            {msg.text || (msg.sender === 'ai' ? '...' : '')}
                         </ReactMarkdown>
                    </article>
                     {msg.sender === 'ai' && msg.text && (
                         <div className="absolute -bottom-4 right-0 flex items-center gap-1 bg-surface border border-border/50 rounded-full px-2 py-1 shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                             <button onClick={handleSpeakClick} className="p-1 rounded-full text-text-secondary hover:text-primary transition-colors">
                                 {isSpeakingThisMessage ? <PauseCircleIcon className="w-5 h-5 text-accent animate-pulse"/> : <PlayCircleIcon className="w-5 h-5"/>}
                             </button>
                             <div className="w-px h-3 bg-border/50 mx-1"></div>
                             <button onClick={() => setMessageFeedback?.(msg.id, 'good')} className={`p-1 rounded-full transition-colors ${msg.feedback === 'good' ? 'text-success' : 'text-text-tertiary hover:text-success'}`}>
                                <ThumbsUpIcon className="w-4 h-4" filled={msg.feedback === 'good'}/>
                             </button>
                             <button onClick={() => setMessageFeedback?.(msg.id, 'bad')} className={`p-1 rounded-full transition-colors ${msg.feedback === 'bad' ? 'text-error' : 'text-text-tertiary hover:text-error'}`}>
                                <ThumbsDownIcon className="w-4 h-4" filled={msg.feedback === 'bad'}/>
                             </button>
                         </div>
                     )}
                </div>
                {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 bg-surface/40 p-3 rounded-xl border border-border/30 w-full animate-slide-up">
                        <p className="text-[10px] font-black uppercase tracking-tighter text-accent mb-2">Conocimiento Web Sincronizado</p>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {msg.sources.map((source, index) => (
                                <li key={index} className="truncate">
                                    <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:text-accent flex items-center gap-2 group">
                                        <div className="w-1 h-1 rounded-full bg-primary group-hover:scale-150 transition-transform"></div>
                                        <span className="truncate">{source.title || source.uri}</span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                <div className={`text-[10px] font-medium text-text-tertiary mt-2 flex items-center gap-1 ${msg.sender === 'user' ? 'mr-1' : 'ml-1'}`}>
                    {new Date(msg.timestamp!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {msg.sender === 'ai' && <span className="opacity-40 uppercase tracking-widest">• Alpha Engine Prime</span>}
                </div>
            </div>
        </div>
    );
});

const AttachmentPreview: React.FC<{
    files: AttachedFile[];
    onRemove: (name: string) => void;
}> = ({ files, onRemove }) => (
    <div className="mb-4 p-3 bg-surface/30 rounded-2xl border border-border/50 backdrop-blur-md">
        <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
            {files.map(file => (
                <div key={file.name} className="relative w-28 h-28 bg-background/80 rounded-xl flex-shrink-0 group shadow-lg border border-white/5 overflow-hidden">
                    <button 
                        onClick={() => onRemove(file.name)} 
                        className="absolute top-1 right-1 z-20 w-6 h-6 bg-error/90 backdrop-blur-sm rounded-full text-white flex items-center justify-center text-lg font-bold opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                    >
                        &times;
                    </button>
                    {file.isLoading ? (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><SpinnerIcon className="w-8 h-8 text-primary animate-spin" /></div>
                    ) : (
                        <>
                            {file.isImage && file.previewUrl && <img src={file.previewUrl} alt={file.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />}
                            {file.isVideo && <div className="w-full h-full flex flex-col items-center justify-center bg-black"><PlayCircleIcon className="w-10 h-10 text-primary"/><p className="text-[10px] text-white/50 mt-1 truncate px-2">{file.name}</p></div>}
                            {!file.isImage && !file.isVideo && (
                                <div className="w-full h-full flex flex-col p-2">
                                    <div className="flex items-center gap-1.5 border-b border-white/5 pb-1 mb-1"><FileIcon className="w-4 h-4 text-primary" /><span className="text-[10px] font-bold truncate text-text-primary">{file.name}</span></div>
                                    <pre className="text-[9px] text-text-tertiary font-mono leading-tight overflow-hidden italic"><code>{file.contentSnippet || '...'}</code></pre>
                                </div>
                            )}
                        </>
                    )}
                </div>
            ))}
        </div>
    </div>
);

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
    chatHistory, onSendMessage, isLoading, inputValue, onInputChange, isListening,
    startListening, stopListening, onSpeak, cancelSpeaking, speakingText,
    attachedFiles, onAddFiles, onRemoveFile, onResetChat, isTtsEnabled, onToggleTts,
    onOpenVoiceModal, onOpenHistory, context = 'chat', followUpSuggestions = [],
    setMessageFeedback, isProjectLoaded = false, isProjectContextEnabled = false, onToggleProjectContext = () => {},
}) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const dragCounter = useRef(0);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory]);

    const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isLoading || (!inputValue?.trim() && attachedFiles.length === 0)) return;
        onSendMessage?.(inputValue);
        onInputChange?.('');
    };
    
    const handleDragEnter = (e: React.DragEvent) => { e.preventDefault(); dragCounter.current++; if (e.dataTransfer.items.length > 0) setIsDragging(true); };
    const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); dragCounter.current--; if (dragCounter.current === 0) setIsDragging(false); };
    const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); dragCounter.current = 0; if (e.dataTransfer.files.length > 0) onAddFiles?.(e.dataTransfer.files); };
    const handlePaste = (e: React.ClipboardEvent) => { if (e.clipboardData.files.length > 0) { e.preventDefault(); onAddFiles?.(e.clipboardData.files); } };

    return (
        <div className="flex flex-col h-full relative" onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={e => e.preventDefault()} onDrop={handleDrop} onPaste={handlePaste}>
            {isDragging && (
                <div className="absolute inset-0 bg-primary/20 border-4 border-dashed border-primary rounded-3xl z-30 flex flex-col items-center justify-center pointer-events-none backdrop-blur-md animate-pulse">
                    <div className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center mb-6"><FileIcon className="w-16 h-16 text-primary" /></div>
                    <p className="text-3xl font-black text-white drop-shadow-lg">Sincronizar Archivos</p>
                </div>
            )}
            
            <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-border/30 bg-background/50 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-success animate-pulse-fast shadow-glow-primary"></div>
                    <h2 className="text-xl font-black text-text-primary tracking-tight uppercase">Prime Workspace</h2>
                </div>
                <div className="flex items-center gap-1.5">
                    <button onClick={onOpenHistory} className="p-2.5 rounded-xl text-text-secondary hover:bg-surface hover:text-white transition-all shadow-sm" title="Historial Neuronal"><HistoryIcon className="w-5 h-5"/></button>
                    <button onClick={onResetChat} className="p-2.5 rounded-xl text-text-secondary hover:bg-surface hover:text-white transition-all shadow-sm" title="Reiniciar Núcleo"><RefreshIcon className="w-5 h-5"/></button>
                    <div className="w-px h-6 bg-border/50 mx-1"></div>
                    <button onClick={onOpenVoiceModal} className="p-2.5 rounded-xl text-text-secondary hover:bg-surface hover:text-white transition-all shadow-sm"><SettingsIcon className="w-5 h-5"/></button>
                    <button onClick={onToggleTts} className={`p-2.5 rounded-xl transition-all shadow-sm ${isTtsEnabled ? 'bg-primary/20 text-primary' : 'text-text-secondary hover:bg-surface hover:text-white'}`}>
                        {isTtsEnabled ? <SpeakerOnIcon className="w-5 h-5"/> : <SpeakerOffIcon className="w-5 h-5"/>}
                    </button>
                </div>
            </div>

            <div className="flex-grow p-4 overflow-y-auto space-y-4 scroll-smooth custom-scrollbar">
                {chatHistory.map((msg, index) => {
                    const currentDate = msg.timestamp ? new Date(msg.timestamp) : null;
                    const prevDate = index > 0 && chatHistory[index-1].timestamp ? new Date(chatHistory[index-1].timestamp!) : null;
                    const showDate = currentDate && (!prevDate || currentDate.toDateString() !== prevDate.toDateString());
                    return (
                        <React.Fragment key={msg.id}>
                            {showDate && <TimeSeparator date={currentDate!} />}
                            <ChatMessageBubble msg={msg} onSpeak={onSpeak} cancelSpeaking={cancelSpeaking} speakingText={speakingText} onSendMessage={onSendMessage} setMessageFeedback={setMessageFeedback} />
                        </React.Fragment>
                    );
                })}
                {isLoading && chatHistory.length > 0 && chatHistory[chatHistory.length - 1]?.sender === 'user' && (
                     <div className="flex items-start gap-4 my-6 animate-fade-in">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex-shrink-0 flex items-center justify-center font-black text-white text-xs shadow-glow-primary border border-white/20">PRIME</div>
                        <div className="px-5 py-4 rounded-2xl bg-surface/60 backdrop-blur-sm border border-white/5">
                            <div className="flex flex-col gap-2">
                                <p className="text-[10px] font-black text-accent uppercase tracking-widest animate-pulse">Procesando Capas Lógicas...</p>
                                <div className="flex gap-1.5">
                                    <div className="w-2 h-2 bg-accent rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="w-2 h-2 bg-accent rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-2 h-2 bg-accent rounded-full animate-bounce"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            
            {followUpSuggestions.length > 0 && !isLoading && (
                <div className="px-6 pb-2 flex-shrink-0 flex flex-wrap gap-2 justify-center animate-slide-up">
                    <p className="w-full text-center text-[10px] font-black text-text-tertiary uppercase tracking-tighter mb-1">Protocolos Sugeridos:</p>
                    {followUpSuggestions.map((s, i) => (
                        <button key={i} onClick={() => onSendMessage?.(s)} className="px-4 py-2 text-xs font-semibold bg-surface/60 border border-border/50 rounded-full hover:bg-primary/20 hover:border-primary/50 text-text-secondary hover:text-primary transition-all shadow-sm">
                            {s}
                        </button>
                    ))}
                </div>
            )}

            <form onSubmit={handleFormSubmit} className="p-4 sm:p-6 flex-shrink-0 bg-gradient-to-t from-background via-background to-transparent">
                {attachedFiles.length > 0 && <AttachmentPreview files={attachedFiles} onRemove={onRemoveFile} />}
                
                {isProjectLoaded && (
                    <div className="flex justify-center mb-3">
                         <button type="button" onClick={onToggleProjectContext} className={`flex items-center gap-2 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full border transition-all ${isProjectContextEnabled ? 'bg-primary/20 border-primary text-primary shadow-glow-primary' : 'bg-surface/50 border-border/50 text-text-tertiary opacity-70'}`}>
                            <CodeIcon className="w-3.5 h-3.5" />
                            <span>Vínculo de Proyecto: {isProjectContextEnabled ? 'Establecido' : 'Inactivo'}</span>
                        </button>
                    </div>
                )}

                <div className="relative group max-w-4xl mx-auto">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
                    <div className="relative flex items-end gap-2 p-2 bg-surface/90 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl focus-within:border-primary/50 transition-all">
                        <input type="file" ref={fileInputRef} onChange={e => e.target.files && onAddFiles?.(e.target.files)} multiple className="hidden"/>
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 rounded-xl text-text-tertiary hover:text-white hover:bg-white/5 transition-all" title="Adjuntar Activo"><PaperclipIcon className="w-5 h-5"/></button>
                        <textarea
                            value={inputValue}
                            onChange={e => onInputChange?.(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (inputValue?.trim() || attachedFiles.length > 0) handleFormSubmit(e as any); } }}
                            placeholder="Describe tu visión técnica..."
                            className="w-full p-3 bg-transparent text-text-primary placeholder-text-tertiary outline-none resize-none max-h-48 min-h-[50px] font-sans text-sm sm:text-base leading-relaxed"
                            rows={1}
                        />
                        <div className="flex items-center gap-1.5 pb-1 pr-1">
                            <button type="button" onClick={isListening ? stopListening : startListening} className={`p-3 rounded-xl transition-all ${isListening ? 'bg-error/20 text-error animate-pulse' : 'text-text-tertiary hover:text-white hover:bg-white/5'}`} title="Dictado Neuronal">
                                <MicrophoneIcon className="w-5 h-5"/>
                            </button>
                            <button type="submit" disabled={isLoading || (!inputValue?.trim() && attachedFiles.length === 0)} className="p-3 rounded-xl bg-primary text-white hover:bg-primary-focus transition-all transform active:scale-90 disabled:opacity-30 disabled:grayscale shadow-lg shadow-primary/20 flex-shrink-0">
                                <SendIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};
