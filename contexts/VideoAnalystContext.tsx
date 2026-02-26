import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { VideoAnalysisResult, VideoFrame, VideoAnalysisType, AspectRatio } from '../types';
import * as geminiService from '../services/geminiService';
import { useToastContext } from './ToastContext';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

interface VideoAnalystContextType {
    videoFile: File | null;
    videoSrc: string | null;
    isLoading: boolean;
    loadingText: string;
    error: string | null;
    analysisResults: VideoAnalysisResult[];
    generatedVideoUrl: string | null;
    videoGenerationProgress: number;

    setVideoFile: (file: File | null) => void;
    analyzeVideo: (type: VideoAnalysisType, prompt: string, frames: VideoFrame[], timestamp?: number) => Promise<void>;
    generateVideo: (imageBytes: string, imageMimeType: string, prompt: string, aspectRatio: AspectRatio) => Promise<void>;
    resetAnalyst: () => void;
}

const VideoAnalystContext = createContext<VideoAnalystContextType | undefined>(undefined);

export const VideoAnalystProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [videoFile, setVideoFileState] = useState<File | null>(null);
    const [videoSrc, setVideoSrc] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingText, setLoadingText] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [analysisResults, setAnalysisResults] = useState<VideoAnalysisResult[]>([]);
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
    const [videoGenerationProgress, setVideoGenerationProgress] = useState(0);

    const { addToast } = useToastContext();

    const setVideoFile = useCallback((file: File | null) => {
        if (videoSrc) {
            URL.revokeObjectURL(videoSrc);
        }
        if (file) {
            setVideoFileState(file);
            setVideoSrc(URL.createObjectURL(file));
            setAnalysisResults([]);
            setGeneratedVideoUrl(null);
            setError(null);
            setVideoGenerationProgress(0);
        } else {
            setVideoFileState(null);
            setVideoSrc(null);
            setGeneratedVideoUrl(null);
        }
    }, [videoSrc]);
    
    const analyzeVideo = useCallback(async (type: VideoAnalysisType, prompt: string, frames: VideoFrame[], timestamp?: number) => {
        setIsLoading(true);
        setLoadingText('Analizando video con IA...');
        setError(null);

        const userRequest: VideoAnalysisResult = {
            id: generateId(),
            type: type,
            prompt: prompt,
            timestamp: timestamp,
            resultText: 'Procesando...'
        };
        setAnalysisResults(prev => [userRequest, ...prev]);

        try {
            const resultText = await geminiService.analyzeVideoFrames(frames, prompt);
            setAnalysisResults(prev => prev.map(r => r.id === userRequest.id ? { ...r, resultText } : r));
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Ocurrió un error en el análisis.';
            setError(errorMessage);
            setAnalysisResults(prev => prev.map(r => r.id === userRequest.id ? { ...r, resultText: `Error: ${errorMessage}` } : r));
            addToast({ type: 'error', title: 'Error de Análisis', message: errorMessage });
        } finally {
            setIsLoading(false);
        }
    }, [addToast]);

    const generateVideo = useCallback(async (imageBytes: string, imageMimeType: string, prompt: string, aspectRatio: AspectRatio) => {
        setIsLoading(true);
        setLoadingText('Preparando generación de video...');
        setError(null);
        setGeneratedVideoUrl(null);
        setVideoGenerationProgress(0);

        try {
            const videoUrl = await geminiService.generateVideoFromImageAndPrompt(
                imageBytes,
                imageMimeType,
                prompt,
                aspectRatio,
                (progress: number, message: string) => {
                    setVideoGenerationProgress(progress);
                    setLoadingText(message);
                }
            );
            setGeneratedVideoUrl(videoUrl);
            addToast({ type: 'success', title: '¡Video Generado!', message: 'Tu video está listo.' });
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Error desconocido al generar el video.';
            setError(errorMessage);
            addToast({ type: 'error', title: 'Error de Generación de Video', message: errorMessage });
        } finally {
            setIsLoading(false);
            setLoadingText('');
            setVideoGenerationProgress(0);
        }
    }, [addToast]);

    const resetAnalyst = useCallback(() => {
        setVideoFile(null);
        setAnalysisResults([]);
        setGeneratedVideoUrl(null);
        setIsLoading(false);
        setError(null);
        setVideoGenerationProgress(0);
    }, [setVideoFile]);

    const value = {
        videoFile, videoSrc, isLoading, loadingText, error, analysisResults, generatedVideoUrl, videoGenerationProgress,
        setVideoFile, analyzeVideo, generateVideo, resetAnalyst
    };
    
    return <VideoAnalystContext.Provider value={value}>{children}</VideoAnalystContext.Provider>;
};

export const useVideoAnalystContext = () => {
    const context = useContext(VideoAnalystContext);
    if (!context) {
        throw new Error('useVideoAnalystContext must be used within a VideoAnalystProvider');
    }
    return context;
};