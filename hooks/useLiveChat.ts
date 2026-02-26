
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChatMessage } from '../types';
import * as geminiService from '../services/geminiService';
import { LiveServerMessage, Modality } from '@google/genai';
import { useToastContext } from '../contexts/ToastContext';
import { useI18n } from '../contexts/I18nContext';
import { TranslationKey } from '../i18n/translations';

// Helper for generating unique IDs
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

interface UseLiveChatResult {
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

export const useLiveChat = (systemInstruction: string): UseLiveChatResult => {
    const { t } = useI18n();
    const { addToast } = useToastContext();

    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [aiIsTyping, setAiIsTyping] = useState(false);
    const [liveError, setLiveError] = useState<string | null>(null);
    const [apiKeyError, setApiKeyError] = useState<string | null>(null);

    const [transcriptHistory, setTranscriptHistory] = useState<ChatMessage[]>([]);
    const sessionRef = useRef<any>(null);

    // Audio context and nodes for input/output
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const outputSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const nextStartTimeRef = useRef(0);

    const currentInputTranscriptionRef = useRef('');
    const currentOutputTranscriptionRef = useRef('');

    const resetAudio = useCallback(() => {
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        if (inputAudioContextRef.current) {
            inputAudioContextRef.current.close();
            inputAudioContextRef.current = null;
        }
        if (outputAudioContextRef.current) {
            outputAudioContextRef.current.close();
            outputAudioContextRef.current = null;
        }
        outputSourcesRef.current.forEach(source => source.stop());
        outputSourcesRef.current.clear();
        nextStartTimeRef.current = 0;
    }, []);

    const promptApiKeySelection = useCallback(async () => {
        setApiKeyError(t('liveChat.apiWarning' as TranslationKey));
        addToast({
            type: 'warning',
            title: t('liveChat.apiWarningTitle' as TranslationKey),
            message: t('liveChat.apiWarning' as TranslationKey),
            duration: 10000,
            action: {
                label: t('liveChat.apiSelectKey' as TranslationKey),
                onClick: async () => {
                    if (window.aistudio && window.aistudio.openSelectKey) {
                        try {
                            await window.aistudio.openSelectKey();
                            setApiKeyError(null);
                        } catch (e) {
                            console.error("Error opening API key selection:", e);
                            setApiKeyError(t('liveChat.apiSelectError' as TranslationKey));
                        }
                    } else {
                        addToast({ type: 'error', title: "Error", message: "API key selection not available." });
                    }
                }
            }
        });
    }, [addToast, t]);

    const startConversation = useCallback(async () => {
        if (isConnecting || isConnected) return;

        setIsConnecting(true);
        setLiveError(null);
        setApiKeyError(null);
        setTranscriptHistory([]);
        currentInputTranscriptionRef.current = '';
        currentOutputTranscriptionRef.current = '';

        if (window.aistudio && window.aistudio.hasSelectedApiKey) {
            const hasKey = await window.aistudio.hasSelectedApiKey();
            if (!hasKey) {
                await promptApiKeySelection();
                setIsConnecting(false);
                return;
            }
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
            inputAudioContextRef.current = new AudioContextClass({ sampleRate: 16000 });
            outputAudioContextRef.current = new AudioContextClass({ sampleRate: 24000 });

            const sessionPromise = geminiService.startLiveChatSession({
                onopen: () => {
                    setIsConnected(true);
                    setIsListening(true);
                    setIsConnecting(false);

                    if (inputAudioContextRef.current && mediaStreamRef.current) {
                        const source = inputAudioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
                        scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = geminiService.createBlob(inputData);
                            sessionRef.current?.sendRealtimeInput({ media: pcmBlob });
                        };
                        source.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);
                    }
                },
                onmessage: async (message: LiveServerMessage) => {
                    if (message.serverContent?.outputTranscription) {
                        currentOutputTranscriptionRef.current += message.serverContent.outputTranscription.text;
                        setAiIsTyping(true);
                    } else if (message.serverContent?.inputTranscription) {
                        currentInputTranscriptionRef.current += message.serverContent.inputTranscription.text;
                        setIsListening(true);
                    }

                    if (message.serverContent?.turnComplete) {
                        const fullInput = currentInputTranscriptionRef.current.trim();
                        const fullOutput = currentOutputTranscriptionRef.current.trim();

                        if (fullInput) {
                            setTranscriptHistory(prev => [...prev, { id: generateId(), sender: 'user', text: fullInput, timestamp: Date.now() }]);
                        }
                        if (fullOutput) {
                            setTranscriptHistory(prev => [...prev, { id: generateId(), sender: 'ai', text: fullOutput, timestamp: Date.now() }]);
                        }
                        currentInputTranscriptionRef.current = '';
                        currentOutputTranscriptionRef.current = '';
                        setAiIsTyping(false);
                        setIsListening(false);
                    }

                    const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                    if (base64Audio && outputAudioContextRef.current) {
                        const audioBuffer = await geminiService.decodeAudioData(
                            geminiService.decode(base64Audio),
                            outputAudioContextRef.current,
                            24000,
                            1,
                        );

                        nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current.currentTime);
                        const source = outputAudioContextRef.current.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(outputAudioContextRef.current.destination);
                        source.addEventListener('ended', () => {
                            outputSourcesRef.current.delete(source);
                            if (outputSourcesRef.current.size === 0) setIsSpeaking(false);
                        });

                        source.start(nextStartTimeRef.current);
                        nextStartTimeRef.current += audioBuffer.duration;
                        outputSourcesRef.current.add(source);
                        setIsSpeaking(true);
                    }

                    if (message.serverContent?.interrupted) {
                        outputSourcesRef.current.forEach(source => source.stop());
                        outputSourcesRef.current.clear();
                        nextStartTimeRef.current = 0;
                        setIsSpeaking(false);
                    }
                },
                onerror: (e: any) => {
                    setLiveError(t('liveChat.liveError' as TranslationKey, { error: e.message || 'unknown' }));
                    stopConversation();
                },
                onclose: (e: any) => {
                    if (e.code === 1006) {
                        setLiveError(t('liveChat.liveDisconnected' as TranslationKey));
                    }
                    stopConversation();
                },
            }, systemInstruction);

            sessionRef.current = await sessionPromise;
            addToast({ type: 'info', title: t('liveChat.liveConnectedTitle' as TranslationKey), message: t('liveChat.liveConnected' as TranslationKey) });

        } catch (e: any) {
            let errorMessage = t('liveChat.startFailed' as TranslationKey, { error: e.message || 'unknown' });
            if (e.message.includes("Requested entity was not found.")) {
                errorMessage = t('liveChat.apiConfigurationError' as TranslationKey);
                promptApiKeySelection();
            }
            setLiveError(errorMessage);
            stopConversation();
        } finally {
            setIsConnecting(false);
        }
    }, [isConnecting, isConnected, systemInstruction, addToast, promptApiKeySelection, t]);

    const stopConversation = useCallback(() => {
        if (sessionRef.current) {
            sessionRef.current.close();
            sessionRef.current = null;
        }
        setIsConnected(false);
        setIsListening(false);
        setIsSpeaking(false);
        setAiIsTyping(false);
        resetAudio();
    }, [resetAudio]);

    const sendUserText = useCallback((text: string) => {
        if (sessionRef.current && text.trim()) {
            setTranscriptHistory(prev => [...prev, { id: generateId(), sender: 'user', text: text.trim(), timestamp: Date.now() }]);
            sessionRef.current.sendRealtimeInput({ text: text.trim() });
        }
    }, []);

    const clearHistory = useCallback(() => {
        setTranscriptHistory([]);
    }, []);

    useEffect(() => {
        return () => stopConversation();
    }, [stopConversation]);

    return {
        isConnected, isConnecting, isListening, isSpeaking, aiIsTyping, liveError,
        transcriptHistory, startConversation, stopConversation, sendUserText, clearHistory,
        apiKeyError, promptApiKeySelection,
    };
};
