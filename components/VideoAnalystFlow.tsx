import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useVideoAnalystContext } from '../contexts/VideoAnalystContext';
import { Loader } from './ui/Loader';
import { VideoAnalystIcon, RefreshIcon, PlayCircleIcon, PauseCircleIcon, SendIcon, SpinnerIcon, ImageIcon, CodeIcon } from './ui/icons';
import { VideoAnalysisResult, VideoFrame, AspectRatio } from '../types';
import { useToastContext } from '../contexts/ToastContext';
import { useI18n } from '../contexts/I18nContext';
import { TranslationKey } from '../i18n/translations';

const formatTime = (time: number) => {
  if (isNaN(time)) return '00:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]); // Remove the "data:mime/type;base64," prefix
        };
        reader.onerror = (error) => reject(error);
    });

const TabButton: React.FC<{ label: string; icon: React.FC<{ className?: string }>; isActive: boolean; onClick: () => void; }> = ({ label, icon: Icon, isActive, onClick }) => (
    <button onClick={onClick} className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors duration-200 ${isActive ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-white'}`}>
        <Icon className="w-5 h-5" />
        <span>{label}</span>
    </button>
);


const UploadView: React.FC<{
    onFileSelect: (file: File) => void;
    onUrlSubmit: (e: React.FormEvent) => Promise<void>;
    urlValue: string;
    onUrlChange: (value: string) => void;
    isFetchingUrl: boolean;
}> = ({ onFileSelect, onUrlSubmit, urlValue, onUrlChange, isFetchingUrl }) => {
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const { t } = useI18n();

    const handleFileChange = (files: FileList | null) => {
        if (files && files[0]) {
            if (!files[0].type.startsWith('video/')) {
                alert('Por favor, sube un archivo de video válido.');
                return;
            }
            onFileSelect(files[0]);
        }
    };

    const handleDrag = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
    const handleDragIn = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
    const handleDragOut = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileChange(e.dataTransfer.files);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onFileSelect(e.target.files[0]); // Pass only the first file
        }
    };

    return (
        <div className="w-full max-w-3xl mx-auto text-center animate-fade-in">
            <VideoAnalystIcon className="w-20 h-20 text-primary mx-auto mb-4" />
            <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">{t('video.title' as TranslationKey)}</h2>
            <p className="text-lg text-text-secondary mb-8">{t('video.description' as TranslationKey)}</p>
            <div onDragEnter={handleDragIn} onDragLeave={handleDragOut} onDragOver={handleDrag} onDrop={handleDrop} className={`w-full h-64 border-4 border-dashed rounded-xl flex flex-col items-center justify-center transition-colors duration-300 backdrop-blur-sm ${isDragging ? 'border-primary bg-primary/10' : 'border-border bg-surface/50'}`}>
                <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={(e) => handleFileChange(e.target.files)} />
                <p className="text-xl font-semibold text-text-secondary">{t('video.drop' as TranslationKey)}</p>
                <p className="text-text-tertiary mt-2">{t('video.or' as TranslationKey)}</p>
                <button type="button" onClick={() => inputRef.current?.click()} className="mt-2 px-6 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-focus transition-colors">
                    {t('common.selectFile' as TranslationKey)}
                </button>
                 <p className="text-xs text-text-tertiary mt-4">{t('video.maxSize' as TranslationKey)}</p>
            </div>
             <div className="flex items-center my-6">
                <div className="flex-grow border-t border-border/50"></div>
                <span className="flex-shrink mx-4 text-text-tertiary">{t('video.or' as TranslationKey)}</span>
                <div className="flex-grow border-t border-border/50"></div>
            </div>

            <form onSubmit={onUrlSubmit} className="w-full">
                <div className="flex items-center gap-2 p-1.5 bg-surface border-2 border-border rounded-xl focus-within:ring-2 focus-within:ring-primary transition-all duration-300">
                    <input
                        type="url"
                        value={urlValue}
                        onChange={(e) => onUrlChange(e.target.value)}
                        placeholder={t('video.fromUrl' as TranslationKey)}
                        className="w-full p-2 bg-transparent text-text-primary placeholder-text-tertiary outline-none"
                        disabled={isFetchingUrl}
                    />
                    <button
                        type="submit"
                        disabled={isFetchingUrl || !urlValue.trim()}
                        className="p-3 rounded-lg bg-primary text-white hover:bg-primary-focus transition-all disabled:bg-border disabled:cursor-wait flex-shrink-0"
                        aria-label={t('video.analyzeUrl' as TranslationKey)}
                    >
                        {isFetchingUrl ? <SpinnerIcon className="w-5 h-5" /> : <SendIcon className="w-5 h-5" />}
                    </button>
                </div>
            </form>
        </div>
    );
};

const SceneDetectionResult: React.FC<{ text: string; onSeek: (time: number) => void }> = ({ text, onSeek }) => {
    try {
        const cleanedText = text.replace(/```json\n?/, '').replace(/```/, '').trim();
        const timestamps = JSON.parse(cleanedText);
        if (!Array.isArray(timestamps) || !timestamps.every(t => typeof t === 'number')) {
            return <p className="text-sm text-text-secondary">{text}</p>;
        }

        return (
            <div className="flex flex-wrap gap-2 pt-2">
                {timestamps.map((time, index) => (
                    <button
                        key={index}
                        onClick={() => onSeek(time)}
                        className="px-2 py-1 bg-border/50 hover:bg-border text-xs font-mono rounded-md transition-colors"
                    >
                        {formatTime(time)}
                    </button>
                ))}
            </div>
        );
    } catch (error) {
        console.error("Failed to parse scene detection timestamps:", error);
        return <p className="text-sm text-text-secondary">{text}</p>;
    }
};

const PlayerView: React.FC = () => {
    const { videoSrc, analyzeVideo, analysisResults, isLoading: isAnalyzing, loadingText } = useVideoAnalystContext();
    const { addToast } = useToastContext();
    const { t } = useI18n();

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isProcessingFrames, setIsProcessingFrames] = useState(false);
    const [processingProgress, setProcessingProgress] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleLoadedMetadata = () => setDuration(video.duration);
        const handleTimeUpdate = () => setCurrentTime(video.currentTime);

        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('timeupdate', handleTimeUpdate);

        return () => {
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('timeupdate', handleTimeUpdate);
        };
    }, []);
    
    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) videoRef.current.pause();
            else videoRef.current.play();
            setIsPlaying(!isPlaying);
        }
    };
    
    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (videoRef.current) {
            const time = parseFloat(e.target.value);
            videoRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };
    
    const seekToTime = (time: number) => {
        if (videoRef.current) {
            videoRef.current.currentTime = time;
            setCurrentTime(time);
            if(videoRef.current.paused) {
                 videoRef.current.play().then(() => {
                    videoRef.current?.pause();
                });
            }
        }
    };

    const extractFrames = useCallback(async (options: { sampleRate?: number, specificTime?: number, numFrames?: number }): Promise<VideoFrame[]> => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || video.readyState < 1) {
            addToast({type: 'error', title: 'Error', message: 'El video no está listo para procesar.'});
            return [];
        }
        
        setIsProcessingFrames(true);
        setProcessingProgress(0);

        const frames: VideoFrame[] = [];
        const { sampleRate = 5, specificTime, numFrames = 15 } = options;
        const videoDuration = video.duration;

        let timestamps: number[] = [];
        if (specificTime !== undefined) {
            timestamps = [specificTime];
        } else {
            const interval = videoDuration > (numFrames * sampleRate) ? sampleRate : videoDuration / numFrames;
            for (let i = 0; i < numFrames; i++) {
                timestamps.push(Math.min(i * interval, videoDuration));
            }
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return [];
        
        let processedCount = 0;

        for (const time of timestamps) {
            await new Promise<void>(resolve => {
                const onSeeked = () => {
                    video.removeEventListener('seeked', onSeeked);
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const data = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
                    frames.push({ timestamp: time, data });
                    processedCount++;
                    setProcessingProgress((processedCount / timestamps.length) * 100);
                    resolve();
                };
                video.addEventListener('seeked', onSeeked, { once: true });
                video.currentTime = time;
            });
        }
        setIsProcessingFrames(false);
        return frames;
    }, [addToast, duration]);

    const handleSummarize = async () => {
        const frames = await extractFrames({ numFrames: 20 });
        if (frames.length > 0) {
            analyzeVideo('summary', 'Resume el contenido completo de este video basándote en esta secuencia de fotogramas.', frames);
        }
    };

    const handleDescribeScene = async () => {
        const time = videoRef.current?.currentTime || 0;
        const frames = await extractFrames({ specificTime: time });
        if (frames.length > 0) {
            analyzeVideo('scene_description', `Describe detalladamente la escena en el timestamp ${formatTime(time)}.`, frames, time);
        }
    };
    
    const handleExtractText = async () => {
        const frames = await extractFrames({ sampleRate: 1, numFrames: Math.min(25, Math.floor(duration)) });
        if (frames.length > 0) {
            analyzeVideo('ocr', 'Extrae todo el texto visible en estos fotogramas. Indica el timestamp aproximado donde aparece cada texto.', frames);
        }
    };
    
    const handleTranscribe = async () => {
        const frames = await extractFrames({ sampleRate: 1, numFrames: Math.min(60, Math.floor(duration * 2)) });
        if (frames.length > 0) {
            analyzeVideo('transcription', 'Transcribe el diálogo hablado en estos fotogramas. Incluye también sonidos o acciones importantes. Formatea la respuesta como una transcripción con timestamps (ej: [00:15] Hombre: ¿Qué es eso?).', frames);
        }
    };
    
    const handleDetectScenes = async () => {
        const frames = await extractFrames({ numFrames: 30 });
        if (frames.length > 0) {
            analyzeVideo('scene_detection', 'Analiza esta secuencia de fotogramas e identifica los timestamps (en segundos) de los cambios de escena más importantes. Responde ÚNICAMENTE con un array JSON de números. Ejemplo: [10.5, 25.2, 55.1]', frames);
        }
    };

    const handleObjectSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        const frames = await extractFrames({ numFrames: 20 });
        if (frames.length > 0) {
            analyzeVideo('object_search', `Busca todas las apariciones de "${searchQuery}" en el video. Lista los timestamps donde se encuentra.`, frames);
        }
    };

    return (
        <div className="w-full flex-grow grid grid-cols-1 lg:grid-cols-12 gap-6 h-full p-4 animate-fade-in">
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Left Panel: Video Player */}
            <div className="lg:col-span-8 flex flex-col bg-surface/50 border border-border rounded-lg h-full overflow-hidden">
                <div className="relative flex-grow bg-black flex items-center justify-center">
                    <video ref={videoRef} src={videoSrc!} className="max-w-full max-h-full" onClick={togglePlay} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} />
                    {(isProcessingFrames || isAnalyzing) && 
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4">
                            <SpinnerIcon className="w-12 h-12 text-primary mb-4" />
                            <p className="text-lg font-semibold text-text-primary mb-2">{isAnalyzing ? loadingText : t('video.processing' as TranslationKey)}</p>
                            {isProcessingFrames && <p className="text-sm text-text-secondary">{t('video.extractingFrames' as TranslationKey, {progress: processingProgress.toFixed(0)})}</p>}
                        </div>
                    }
                </div>
                <div className="p-4 space-y-3 flex-shrink-0">
                    <input type="range" min="0" max={duration} value={currentTime} onChange={handleSeek} className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-primary" />
                    <div className="flex justify-between items-center text-sm text-text-secondary font-mono">
                        <span>{formatTime(currentTime)}</span>
                        <button onClick={togglePlay} className="p-2 text-white rounded-full bg-primary hover:bg-primary-focus">
                            {isPlaying ? <PauseCircleIcon className="w-6 h-6"/> : <PlayCircleIcon className="w-6 h-6"/>}
                        </button>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>
            </div>

            {/* Right Panel: Analysis */}
            <div className="lg:col-span-4 flex flex-col gap-4 h-full">
                <div className="bg-surface/50 border border-border rounded-lg p-4 flex-shrink-0">
                    <h3 className="text-xl font-bold text-accent mb-3">{t('video.actions' as TranslationKey)}</h3>
                    <div className="space-y-3">
                         <div className="grid grid-cols-2 gap-2 text-sm">
                            <button onClick={handleSummarize} disabled={isAnalyzing || isProcessingFrames} className="p-2 bg-border/50 hover:bg-border rounded-md transition-colors disabled:opacity-50">{t('video.summarize' as TranslationKey)}</button>
                            <button onClick={handleDescribeScene} disabled={isAnalyzing || isProcessingFrames} className="p-2 bg-border/50 hover:bg-border rounded-md transition-colors disabled:opacity-50">{t('video.describeScene' as TranslationKey)}</button>
                            <button onClick={handleExtractText} disabled={isAnalyzing || isProcessingFrames} className="p-2 bg-border/50 hover:bg-border rounded-md transition-colors disabled:opacity-50">{t('video.ocr' as TranslationKey)}</button>
                            <button onClick={handleTranscribe} disabled={isAnalyzing || isProcessingFrames} className="p-2 bg-border/50 hover:bg-border rounded-md transition-colors disabled:opacity-50">{t('video.transcribe' as TranslationKey)}</button>
                            <button onClick={handleDetectScenes} disabled={isAnalyzing || isProcessingFrames} className="p-2 bg-border/50 hover:bg-border rounded-md transition-colors disabled:opacity-50 col-span-2">{t('video.detectScenes' as TranslationKey)}</button>
                        </div>
                        <form onSubmit={handleObjectSearch}>
                            <div className="flex items-center gap-2 p-1 bg-surface border-2 border-border rounded-lg focus-within:ring-2 focus-within:ring-primary">
                                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={t('video.objectSearch' as TranslationKey)} className="w-full p-1 bg-transparent text-sm outline-none" />
                                <button type="submit" disabled={isAnalyzing || isProcessingFrames || !searchQuery.trim()} className="p-1.5 rounded-md bg-primary text-white hover:bg-primary-focus disabled:bg-border">
                                    <SendIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
                 <div className="bg-surface/50 border border-border rounded-lg p-4 flex-grow flex flex-col min-h-0">
                    <h3 className="text-xl font-bold text-accent mb-2 flex-shrink-0">{t('video.results' as TranslationKey)}</h3>
                    <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                        {analysisResults.length === 0 && <p className="text-sm text-text-tertiary text-center pt-8">{t('video.resultsPlaceholder' as TranslationKey)}</p>}
                        {analysisResults.map(result => (
                             <div key={result.id} className="bg-surface p-3 rounded-lg border border-border/50 animate-fade-in">
                                <p className="text-sm font-semibold text-primary mb-1">{result.prompt}</p>
                                {result.resultText === 'Procesando...' ? (
                                    <div className="flex items-center gap-2 text-text-secondary text-sm">
                                        <SpinnerIcon className="w-4 h-4"/> <span>{t('video.processing' as TranslationKey)}</span>
                                    </div>
                                ) : result.type === 'scene_detection' ? (
                                    <SceneDetectionResult text={result.resultText} onSeek={seekToTime} />
                                ) : (
                                    <article className="prose prose-invert prose-sm max-w-none"><ReactMarkdown remarkPlugins={[remarkGfm]}>{result.resultText}</ReactMarkdown></article>
                                )}
                            </div>
                        ))}
                    </div>
                 </div>
            </div>
        </div>
    );
}

const VideoGenerationView: React.FC = () => {
    const { generateVideo, isLoading, loadingText, generatedVideoUrl, videoGenerationProgress } = useVideoAnalystContext();
    const { addToast } = useToastContext();
    const { t } = useI18n();

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
    const imageInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    
    const handleImageFileChange = (files: FileList | null) => {
        if (files && files[0]) {
            const file = files[0];
            if (!file.type.startsWith('image/')) {
                addToast({ type: 'error', title: t('common.invalidFile' as TranslationKey), message: t('common.imageFileRequired' as TranslationKey) });
                return;
            }
            setImageFile(file);
            setImagePreviewUrl(URL.createObjectURL(file));
        }
    };
    
    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!imageFile || !prompt.trim()) {
            addToast({ type: 'warning', title: t('video.generation.missingInfo' as TranslationKey), message: t('video.generation.imagePromptRequired' as TranslationKey) });
            return;
        }

        try {
            const base64Image = await fileToBase64(imageFile);
            await generateVideo(base64Image, imageFile.type, prompt, aspectRatio);
        } catch (e) {
            console.error("Error generating video:", e);
            // Error handling is already done in context
        }
    };

    const handleDownloadVideo = () => {
        if (generatedVideoUrl) {
            const a = document.createElement('a');
            a.href = generatedVideoUrl;
            a.download = `generated-video-${Date.now()}.mp4`;
            document.body.appendChild(a);
            document.body.removeChild(a);
            addToast({ type: 'success', title: t('common.downloadComplete' as TranslationKey), message: t('video.generation.videoDownloaded' as TranslationKey) });
        }
    };

    const handleDrag = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
    const handleDragIn = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
    const handleDragOut = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleImageFileChange(e.dataTransfer.files);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto text-center animate-fade-in flex flex-col gap-6">
            <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">{t('video.generation.title' as TranslationKey)}</h2>
            <p className="text-lg text-text-secondary mb-8">{t('video.generation.description' as TranslationKey)}</p>

            <form onSubmit={handleGenerate} className="space-y-6">
                {/* Image Upload */}
                <div onDragEnter={handleDragIn} onDragLeave={handleDragOut} onDragOver={handleDrag} onDrop={handleDrop} className={`w-full h-64 border-4 border-dashed rounded-xl flex flex-col items-center justify-center transition-colors duration-300 backdrop-blur-sm ${isDragging ? 'border-primary bg-primary/10' : 'border-border bg-surface/50'}`}>
                    <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageFileChange(e.target.files)} />
                    {imagePreviewUrl ? (
                        <img src={imagePreviewUrl} alt="Preview" className="max-h-full max-w-full object-contain rounded-md" />
                    ) : (
                        <>
                            <ImageIcon className="w-16 h-16 text-text-tertiary mb-4" />
                            <p className="text-xl font-semibold text-text-secondary">{t('magician.dropImage' as TranslationKey)}</p>
                            <p className="text-text-tertiary mt-2">{t('video.or' as TranslationKey)}</p>
                            <button type="button" onClick={() => imageInputRef.current?.click()} className="mt-2 px-6 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-focus transition-colors">
                                {t('common.selectFile' as TranslationKey)}
                            </button>
                        </>
                    )}
                </div>

                {/* Prompt Input */}
                <div>
                    <label htmlFor="video-prompt" className="block text-lg font-bold text-text-primary mb-2 text-left">{t('video.generation.prompt' as TranslationKey)}</label>
                    <textarea
                        id="video-prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={t('video.generation.promptPlaceholder' as TranslationKey)}
                        className="w-full h-32 p-3 bg-surface border-2 border-border rounded-md text-text-primary focus:ring-2 focus:ring-primary focus:outline-none transition-colors resize-none"
                        required
                    />
                </div>

                {/* Aspect Ratio */}
                <div className="text-left">
                    <label className="block text-lg font-bold text-text-primary mb-2">{t('video.generation.aspectRatio' as TranslationKey)}</label>
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => setAspectRatio('16:9')}
                            className={`flex-1 px-4 py-2 rounded-lg border-2 font-semibold transition-colors ${aspectRatio === '16:9' ? 'bg-primary border-primary text-white' : 'bg-surface border-border text-text-secondary hover:border-primary/50'}`}
                        >
                            16:9 ({t('video.generation.landscape' as TranslationKey)})
                        </button>
                        <button
                            type="button"
                            onClick={() => setAspectRatio('9:16')}
                            className={`flex-1 px-4 py-2 rounded-lg border-2 font-semibold transition-colors ${aspectRatio === '9:16' ? 'bg-primary border-primary text-white' : 'bg-surface border-border text-text-secondary hover:border-primary/50'}`}
                        >
                            9:16 ({t('video.generation.portrait' as TranslationKey)})
                        </button>
                    </div>
                </div>

                {/* Generate Button */}
                <button
                    type="submit"
                    disabled={isLoading || !imageFile || !prompt.trim()}
                    className="w-full px-10 py-4 bg-accent text-white font-bold text-lg rounded-lg hover:bg-accent-focus transition-transform transform hover:scale-105 duration-300 shadow-lg shadow-accent/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isLoading ? <SpinnerIcon className="w-6 h-6" /> : <PlayCircleIcon className="w-6 h-6" />}
                    {isLoading ? t('video.generation.generating' as TranslationKey) : t('video.generation.generate' as TranslationKey)}
                </button>
            </form>

            {/* Generated Video Display */}
            {generatedVideoUrl && (
                <div className="mt-8 bg-surface/50 border border-border rounded-lg p-4 flex flex-col gap-4">
                    <h3 className="text-xl font-bold text-accent">{t('video.generation.result' as TranslationKey)}</h3>
                    <video controls src={generatedVideoUrl} className="w-full rounded-md shadow-lg"></video>
                    <button
                        onClick={handleDownloadVideo}
                        className="w-full px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-focus transition-colors flex items-center justify-center gap-2"
                    >
                        <ImageIcon className="w-5 h-5" /> {t('common.download' as TranslationKey)}
                    </button>
                    <p className="text-xs text-text-tertiary">
                        {t('video.generation.billingInfo' as TranslationKey)}{" "}
                        <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            ai.google.dev/gemini-api/docs/billing
                        </a>
                    </p>
                </div>
            )}
        </div>
    );
};


const VideoAnalystFlow: React.FC = () => {
    const { videoFile, setVideoFile, isLoading, loadingText, error, resetAnalyst, generatedVideoUrl, videoGenerationProgress } = useVideoAnalystContext();
    const { addToast } = useToastContext();
    const { t } = useI18n();

    const [videoUrl, setVideoUrl] = useState('');
    const [isFetchingUrl, setIsFetchingUrl] = useState(false);
    const [fetchProgress, setFetchProgress] = useState<number | undefined>(undefined);
    const [activeTab, setActiveTab] = useState<'analysis' | 'generation'>('analysis');
    
    const handleUrlSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!videoUrl.trim()) {
            addToast({ type: 'warning', title: t('video.generation.missingInfo' as TranslationKey), message: t('video.generation.imagePromptRequired' as TranslationKey) });
            return;
        }
    
        setIsFetchingUrl(true);
        setFetchProgress(0);
        addToast({ type: 'info', title: t('video.downloading' as TranslationKey), message: t('video.fetchingUrl' as TranslationKey) });
    
        try {
            const response = await fetch(videoUrl);
            if (!response.ok) {
                throw new Error(`Error al obtener el video: ${response.statusText}`);
            }
    
            if (!response.body) {
                throw new Error('El stream del cuerpo de la respuesta no está disponible.');
            }
            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.startsWith('video/')) {
                throw new Error('La URL no apunta a un archivo de video válido.');
            }
    
            const contentLength = response.headers.get('content-length');
            if (!contentLength) {
                console.warn('Content-Length header not found. Progress will not be available.');
                setFetchProgress(undefined);
                const blob = await response.blob();
                
                const urlParts = new URL(videoUrl).pathname.split('/');
                const filename = urlParts[urlParts.length - 1] || 'video_from_url';
                const file = new File([blob], filename, { type: blob.type });
                setVideoFile(file);
                return;
            }
    
            const totalLength = parseInt(contentLength, 10);
            let receivedLength = 0;
            const chunks: Uint8Array[] = [];
            const reader = response.body.getReader();
    
            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    break;
                }
                chunks.push(value);
                receivedLength += value.length;
                const progress = (receivedLength / totalLength) * 100;
                setFetchProgress(progress);
            }
    
            const blob = new Blob(chunks, { type: contentType });
            
            const urlParts = new URL(videoUrl).pathname.split('/');
            const filename = urlParts[urlParts.length - 1] || 'video_from_url';
            const file = new File([blob], filename, { type: blob.type });
            setVideoFile(file);
    
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido.';
            console.error("Error fetching video from URL:", err);
            addToast({ type: 'error', title: 'Error al Cargar Video', message: `${t('video.fetchError' as TranslationKey)}: ${errorMessage}` });
        } finally {
            setIsFetchingUrl(false);
            setFetchProgress(undefined);
        }
    };
    
    return (
        <div className="flex flex-col h-full w-full items-center justify-center">
            {(isLoading || isFetchingUrl) && <Loader text={isFetchingUrl ? t('video.downloading' as TranslationKey) : loadingText} progress={videoGenerationProgress > 0 ? videoGenerationProgress : fetchProgress} />}
            <main className="w-full flex-grow flex flex-col items-center justify-center">
                 {error && <div className="bg-error/10 border border-error/30 text-red-300 px-4 py-3 rounded-lg relative my-4 w-full max-w-3xl" role="alert">{error}</div>}
                
                 {!videoFile && !generatedVideoUrl ? (
                    <UploadView
                        onFileSelect={setVideoFile}
                        onUrlSubmit={handleUrlSubmit}
                        urlValue={videoUrl}
                        onUrlChange={setVideoUrl}
                        isFetchingUrl={isFetchingUrl}
                    />
                 ) : (
                    <>
                        <div className="w-full flex justify-between items-center p-2 absolute top-0 right-0 z-10">
                            <div className="flex border-b-0">
                                <TabButton label={t('video.analysis.tab' as TranslationKey)} icon={VideoAnalystIcon} isActive={activeTab === 'analysis'} onClick={() => setActiveTab('analysis')} />
                                <TabButton label={t('video.generation.tab' as TranslationKey)} icon={ImageIcon} isActive={activeTab === 'generation'} onClick={() => setActiveTab('generation')} />
                            </div>
                            <button onClick={resetAnalyst} className="flex items-center gap-2 px-3 py-1.5 bg-surface/80 text-text-secondary font-semibold rounded-lg hover:bg-border/80 hover:text-white transition-colors text-sm">
                                <RefreshIcon className="w-4 h-4" />
                                {t('video.loadAnother' as TranslationKey)}
                            </button>
                        </div>
                        {activeTab === 'analysis' && <PlayerView />}
                        {activeTab === 'generation' && <VideoGenerationView />}
                    </>
                 )}
            </main>
        </div>
    );
};

export default VideoAnalystFlow;