import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLiveChatContext } from '../contexts/LiveChatContext';
import { Loader } from './ui/Loader';
import { ChatMessage } from '../types';
import { MicrophoneIcon, SpeakerOnIcon, PlayCircleIcon, PauseCircleIcon, StopCircleIcon, RefreshIcon, AlertTriangleIcon, CheckCircleIcon, SendIcon, SpinnerIcon, HelpCircleIcon } from './ui/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useI18n } from '../contexts/I18nContext';
import { TranslationKey } from '../i18n/translations';

const LiveChatMessage: React.FC<{ message: ChatMessage }> = React.memo(({ message }) => {
    return (
        <div className={`flex items-start gap-3 my-2 animate-fade-in ${message.sender === 'user' ? 'justify-end' : ''}`}>
            {message.sender === 'ai' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex-shrink-0 flex items-center justify-center font-bold text-white text-md shadow-md">
                    AI
                </div>
            )}
            <div className={`px-3 py-2 rounded-xl max-w-md md:max-w-lg shadow-sm ${message.sender === 'user' ? 'bg-primary/80 text-white rounded-br-none' : 'bg-surface text-text-primary rounded-bl-none'}`}>
                <article className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.text}</ReactMarkdown>
                </article>
                {message.timestamp && (
                    <div className={`text-xs text-text-tertiary mt-1.5 ${message.sender === 'user' ? 'mr-1' : 'ml-1'}`}>
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                )}
            </div>
        </div>
    );
});

const LiveChatFlow: React.FC = () => {
    const { t } = useI18n();
    const {
        isConnected, isConnecting, isListening, isSpeaking, aiIsTyping, liveError,
        transcriptHistory, startConversation, stopConversation, sendUserText, clearHistory,
        apiKeyError, promptApiKeySelection
    } = useLiveChatContext();

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [manualInput, setManualInput] = useState('');

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcriptHistory]);

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (manualInput.trim()) {
            sendUserText(manualInput);
            setManualInput('');
        }
    };

    return (
        <div className="flex flex-col h-full w-full items-center p-4">
            {(isConnecting) && (
                <Loader text={t('liveChat.connecting' as TranslationKey)} />
            )}
            <main className="w-full max-w-3xl mx-auto flex-grow flex flex-col mt-4 px-4">
                <div className="w-full text-center sm:text-left mb-6">
                    <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-2 flex items-center justify-center gap-2">
                        <MicrophoneIcon className="w-10 h-10 text-primary" />
                        {t('liveChat.title' as TranslationKey)}
                    </h2>
                    <p className="text-lg text-text-secondary mt-2">{t('liveChat.description' as TranslationKey)}</p>
                </div>

                {apiKeyError && (
                    <div className="bg-warning/10 border border-warning/30 text-yellow-300 px-4 py-3 rounded-lg relative my-4 w-full flex items-center gap-3" role="alert">
                        <AlertTriangleIcon className="w-6 h-6 text-warning flex-shrink-0" />
                        <div>
                            <p className="font-bold">{t('liveChat.apiWarningTitle' as TranslationKey)}</p>
                            <p className="text-sm">{apiKeyError}</p>
                            <p className="text-xs mt-1">
                                {t('liveChat.apiBillingInfo' as TranslationKey)}{" "}
                                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                    ai.google.dev/gemini-api/docs/billing
                                </a>
                            </p>
                            <button onClick={promptApiKeySelection} className="mt-2 text-sm font-semibold underline hover:text-white flex items-center gap-1">
                                <HelpCircleIcon className="w-4 h-4"/> {t('liveChat.apiSelectKey' as TranslationKey)}
                            </button>
                        </div>
                    </div>
                )}
                
                {liveError && (
                    <div className="bg-error/10 border border-error/30 text-red-300 px-4 py-3 rounded-lg relative my-4 w-full flex items-center gap-3" role="alert">
                        <AlertTriangleIcon className="w-6 h-6 text-error flex-shrink-0" />
                        <p>{liveError}</p>
                    </div>
                )}

                <div className="bg-surface/50 border border-border rounded-lg flex-grow overflow-hidden flex flex-col backdrop-blur-sm shadow-lg">
                    <div className="flex-grow p-4 overflow-y-auto space-y-3">
                        {transcriptHistory.length === 0 ? (
                            <div className="text-center text-text-tertiary p-8">
                                <p>{t('liveChat.historyPlaceholder' as TranslationKey)}</p>
                            </div>
                        ) : (
                            transcriptHistory.map((msg, index) => (
                                <LiveChatMessage key={msg.id || index} message={msg} />
                            ))
                        )}
                        {aiIsTyping && (
                            <div className="flex items-start gap-3 justify-start">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex-shrink-0 flex items-center justify-center font-bold text-white text-md shadow-md">AI</div>
                                <div className="px-3 py-2 rounded-xl bg-surface text-text-primary rounded-bl-none">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-accent rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                                        <div className="w-2 h-2 bg-accent rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                                        <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="p-3 border-t border-border flex-shrink-0 bg-surface/80">
                        <form onSubmit={handleManualSubmit} className="flex items-center gap-2">
                            <input
                                type="text"
                                value={manualInput}
                                onChange={(e) => setManualInput(e.target.value)}
                                placeholder={t('liveChat.manualPlaceholder' as TranslationKey)}
                                className="flex-grow p-2 rounded-md bg-background border border-border text-text-primary text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                disabled={!isConnected || isSpeaking || isListening}
                            />
                            <button
                                type="submit"
                                className="p-2 rounded-md bg-primary text-white hover:bg-primary-focus disabled:opacity-50"
                                disabled={!isConnected || isSpeaking || isListening || !manualInput.trim()}
                            >
                                <SendIcon className="w-5 h-5" />
                            </button>
                        </form>
                    </div>
                </div>

                <div className="mt-6 flex justify-center items-center gap-4">
                    {!isConnected ? (
                        <button
                            onClick={startConversation}
                            disabled={isConnecting}
                            className="px-6 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-focus transition-all transform hover:scale-105 duration-300 shadow-lg shadow-primary/30 flex items-center gap-2"
                        >
                            {isConnecting ? <SpinnerIcon className="w-5 h-5" /> : <PlayCircleIcon className="w-5 h-5" />}
                            {isConnecting ? t('liveChat.connecting' as TranslationKey) : t('liveChat.start' as TranslationKey)}
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={stopConversation}
                                className="px-6 py-3 bg-error text-white font-bold rounded-lg hover:bg-red-700 transition-all transform hover:scale-105 duration-300 shadow-lg shadow-error/30 flex items-center gap-2"
                            >
                                <StopCircleIcon className="w-5 h-5" />
                                {t('liveChat.stop' as TranslationKey)}
                            </button>
                            <button
                                onClick={clearHistory}
                                className="px-4 py-2 bg-surface text-text-secondary rounded-lg hover:bg-border/50 transition-colors flex items-center gap-2"
                            >
                                <RefreshIcon className="w-4 h-4" />
                                {t('liveChat.clearHistory' as TranslationKey)}
                            </button>
                        </>
                    )}
                </div>

                <div className="mt-4 flex items-center justify-center gap-4 text-sm text-text-secondary">
                    <div className={`flex items-center gap-1 ${isListening ? 'text-primary' : ''}`}>
                        <MicrophoneIcon className={`w-4 h-4 ${isListening ? 'animate-pulse' : ''}`} />
                        <span>{isListening ? t('liveChat.listening' as TranslationKey) : t('liveChat.microphoneOff' as TranslationKey)}</span>
                    </div>
                    <div className={`flex items-center gap-1 ${isSpeaking || aiIsTyping ? 'text-accent' : ''}`}>
                        <SpeakerOnIcon className={`w-4 h-4 ${isSpeaking ? 'animate-pulse' : ''}`} />
                        <span>{isSpeaking || aiIsTyping ? t('liveChat.speaking' as TranslationKey) : t('liveChat.speakerIdle' as TranslationKey)}</span>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default LiveChatFlow;