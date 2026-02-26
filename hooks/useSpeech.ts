

import { useState, useEffect, useCallback } from 'react';

// --- Type definitions for Web Speech API ---
// These are not included in standard TypeScript DOM typings yet.

interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
    readonly isFinal: boolean;
    readonly length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
}

type SpeechRecognitionErrorCode =
    | 'no-speech'
    | 'aborted'
    | 'audio-capture'
    | 'network'
    | 'not-allowed'
    | 'service-not-allowed'
    | 'bad-grammar'
    | 'language-not-supported';

interface SpeechRecognitionErrorEvent extends Event {
    readonly error: SpeechRecognitionErrorCode;
    readonly message: string;
}

// Types for Speech Synthesis
type SpeechSynthesisErrorCode =
  | 'canceled'
  | 'interrupted'
  | 'audio-busy'
  | 'audio-hardware'
  | 'network'
  | 'synthesis-unavailable'
  | 'synthesis-failed'
  | 'language-unavailable'
  | 'voice-unavailable'
  | 'text-too-long'
  | 'invalid-argument';

interface SpeechSynthesisErrorEvent extends Event {
    readonly utterance: SpeechSynthesisUtterance;
    readonly error: SpeechSynthesisErrorCode;
}

interface SpeechRecognitionStatic {
    new (): SpeechRecognition;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    grammars: any; 
    interimResults: boolean;
    lang: string;
    maxAlternatives: number;
    onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
    onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    abort(): void;
    start(): void;
    stop(): void;
}

declare global {
    interface Window {
        SpeechRecognition: SpeechRecognitionStatic;
        webkitSpeechRecognition: SpeechRecognitionStatic;
    }
}


// Polyfill for cross-browser compatibility
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition: SpeechRecognition | null = SpeechRecognition ? new SpeechRecognition() : null;
const speechSynthesis = window.speechSynthesis;
const VOICE_STORAGE_KEY = 'alphapp-ai-assistant-selected-voice-uri';


if (recognition) {
    recognition.continuous = false; // Stop listening after the user has finished speaking
    recognition.lang = 'es-ES';
    recognition.interimResults = false; // We only want the final result
}

export const useSpeech = () => {
    // --- Speech Recognition State ---
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [speechError, setSpeechError] = useState<string | null>(null);
    
    // --- Speech Synthesis State ---
    const [isTtsEnabled, setIsTtsEnabled] = useState(true);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [speakingText, setSpeakingText] = useState<string | null>(null);
    const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

    // --- Voice Management ---
    const selectVoice = useCallback((voice: SpeechSynthesisVoice) => {
        setSelectedVoice(voice);
        try {
            localStorage.setItem(VOICE_STORAGE_KEY, voice.voiceURI);
        } catch (e) {
            console.error("Could not save voice preference to localStorage.", e);
        }
    }, []);

    const populateVoiceList = useCallback(() => {
        if (!speechSynthesis) return;
        const allVoices = speechSynthesis.getVoices();
        if (allVoices.length === 0) return;

        // Display all available Spanish voices from the user's system.
        const voicesToDisplay = allVoices.filter(v => v.lang.startsWith('es-'));
        
        const recommendedProviders = ['google', 'microsoft'];

        // Sort voices to prioritize recommended and local voices for better quality and performance.
        const sortedVoices = [...voicesToDisplay].sort((a, b) => {
            const aName = a.name.toLowerCase();
            const bName = b.name.toLowerCase();

            const isARecommended = recommendedProviders.some(p => aName.includes(p));
            const isBRecommended = recommendedProviders.some(p => bName.includes(p));

            if (isARecommended && !isBRecommended) return -1;
            if (!isARecommended && isBRecommended) return 1;

            if (a.localService && !b.localService) return -1;
            if (!a.localService && b.localService) return 1;
            
            return a.name.localeCompare(b.name);
        });
        
        setAvailableVoices(sortedVoices);
        
        setSelectedVoice(currentSelected => {
            // Keep the currently selected voice if it's still available
            if (currentSelected && sortedVoices.some(v => v.voiceURI === currentSelected.voiceURI)) {
                return currentSelected;
            }

            // Try to load the saved voice from localStorage
            const savedVoiceURI = localStorage.getItem(VOICE_STORAGE_KEY);
            const savedVoice = sortedVoices.find(v => v.voiceURI === savedVoiceURI);
            
            if (savedVoice) return savedVoice;
            
            // Default to the first available voice from the new sorted list
            if (sortedVoices.length > 0) return sortedVoices[0];

            return null;
        });
    }, []);

    useEffect(() => {
        if (!speechSynthesis) return;
        speechSynthesis.onvoiceschanged = populateVoiceList;
        populateVoiceList();
        return () => {
            speechSynthesis.onvoiceschanged = null;
        };
    }, [populateVoiceList]);

    // --- Speech Recognition (Input) ---
    const startListening = useCallback(() => {
        if (!recognition) {
            setSpeechError("El reconocimiento de voz no es compatible con este navegador.");
            return;
        }
        if (isListening || isSpeaking) return;

        setTranscript('');
        setSpeechError(null);
        setIsListening(true);
        try {
            recognition.start();
        } catch (e) {
            setIsListening(false);
            setSpeechError("El micrófono ya está en uso.");
        }
    }, [isListening, isSpeaking]);

    const stopListening = useCallback(() => {
        if (!recognition || !isListening) return;
        recognition.stop();
        setIsListening(false);
    }, [isListening]);

    // --- Speech Synthesis (Output) ---
    const cancelSpeaking = useCallback(() => {
        if (!speechSynthesis) return;
        speechSynthesis.cancel();
        setIsSpeaking(false);
        setSpeakingText(null);
    }, []);
    
    const speak = useCallback((text: string) => {
        if (!speechSynthesis || !isTtsEnabled) return;
        cancelSpeaking();

        // Strip markdown for cleaner speech. This converts markdown to plain text.
        const plainText = text
            .replace(/```[\s\S]*?```/g, 'Bloque de código.') // Replace code blocks with a placeholder phrase
            .replace(/`([^`]+)`/g, '$1') // Remove backticks from inline code
            .replace(/(\*\*|__)(.*?)\1/g, '$2') // Remove bold markers
            .replace(/(\*|_)(.*?)\1/g, '$2')   // Remove italic markers
            .replace(/!\[(.*?)\]\(.*?\)/g, 'Imagen: $1') // Handle images by reading alt text
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove link markdown, keep text
            .replace(/^#+\s/gm, '')           // Remove heading markers
            .replace(/^\s*[-*+]\s+/gm, '')    // Remove list item markers
            .replace(/^\s*>\s+/gm, '');          // Remove blockquote markers

        const utterance = new SpeechSynthesisUtterance(plainText);
        if (selectedVoice) {
            utterance.voice = selectedVoice;
            utterance.lang = selectedVoice.lang;
        } else {
            utterance.lang = 'es-ES';
        }

        utterance.onstart = () => {
            setIsSpeaking(true);
            setSpeakingText(text); // Keep original text with markdown to match against chat history
        };
        utterance.onend = () => {
            setIsSpeaking(false);
            setSpeakingText(null);
        };
        utterance.onerror = (e) => {
            const errorEvent = e as SpeechSynthesisErrorEvent;
            // 'interrupted' is a common event when we cancel speech to start a new one.
            // We should not treat it as a critical error that is shown to the user.
            if (errorEvent.error === 'interrupted') {
                return;
            }
            console.error("Speech synthesis error:", errorEvent.error, e);
            setIsSpeaking(false);
            setSpeakingText(null);
            setSpeechError(`Error en la síntesis de voz: ${errorEvent.error || 'desconocido'}`);
        };
        speechSynthesis.speak(utterance);
    }, [selectedVoice, cancelSpeaking, isTtsEnabled]);
    
    const previewVoice = useCallback((voice: SpeechSynthesisVoice) => {
        if (!speechSynthesis) return;
        cancelSpeaking();

        const utterance = new SpeechSynthesisUtterance("Hola, así es como sueno.");
        utterance.voice = voice;
        utterance.lang = voice.lang;
        
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = (e) => {
            const errorEvent = e as SpeechSynthesisErrorEvent;
            // 'interrupted' is a common event when we cancel speech to start a new one.
            // We should not treat it as a critical error that is shown to the user.
            if (errorEvent.error === 'interrupted') {
                return;
            }
            console.error("Speech synthesis error during preview:", errorEvent.error, e);
            setIsSpeaking(false);
            setSpeechError(`Error en la previsualización de voz: ${errorEvent.error || 'desconocido'}`);
        };
        speechSynthesis.speak(utterance);
    }, [cancelSpeaking]);

    const toggleTts = useCallback(() => {
        setIsTtsEnabled(prev => {
            if (prev) { // If it was enabled and is now being disabled
                cancelSpeaking();
            }
            return !prev;
        });
    }, [cancelSpeaking]);

    // --- Effects ---
    useEffect(() => {
        if (!recognition) return;

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            const newTranscript = event.results[event.results.length - 1][0].transcript;
            setTranscript(newTranscript);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            if (event.error !== 'no-speech' && event.error !== 'aborted') {
                setSpeechError(event.error);
            }
            setIsListening(false);
        };

        return () => {
            if (recognition) {
                recognition.abort();
            }
            cancelSpeaking();
        };
    }, [cancelSpeaking]);

    return {
        isListening,
        transcript,
        startListening,
        stopListening,
        isTtsEnabled,
        toggleTts,
        isSpeaking,
        speakingText,
        speak,
        cancelSpeaking,
        speechError,
        availableVoices,
        selectedVoice,
        selectVoice,
        previewVoice,
    };
};
