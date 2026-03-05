

import React, { useState, useRef, useMemo, FormEvent, useCallback, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CameraIcon, CopyIcon, ImageIcon, MagicWandIcon, SendIcon, LightbulbIcon, DownloadIcon, CodeIcon, StethoscopeIcon, ShieldCheckIcon, PackageIcon, CheckCircleIcon, EditIcon, DeployIcon, FileIcon, SpinnerIcon, UndoIcon, RedoIcon, BugIcon, RefreshIcon, PlayCircleIcon, PauseCircleIcon } from './ui/icons';
import { useToastContext } from '../contexts/ToastContext';
import * as geminiService from '../services/geminiService';
import { UIMagicianResult, AnalysisIssue, AnalysisCategory, TechStack, ImageEditResult } from '../types';
import { useI18n } from '../contexts/I18nContext';
import { useModalContext } from '../contexts/ModalContext';
import { getCategoryInfo, AnalysisIssueCard } from './ui/AnalysisComponents';
import { Loader } from './ui/Loader';
import { TranslationKey } from '../i18n/translations';

// --- File Utilities ---

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
    
const base64ToFile = (dataUrl: string, filename: string): Promise<File> => {
    return fetch(dataUrl)
        .then(res => res.blob())
        .then(blob => new File([blob], filename, { type: blob.type }));
};

const MAX_DIMENSION = 1280; // Max width/height for resizing

const resizeImage = (file: File, maxDimension: number): Promise<File> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const { width, height } = img;
                if (width <= maxDimension && height <= maxDimension) {
                    resolve(file); // No resizing needed
                    return;
                }

                let newWidth, newHeight;
                if (width > height) {
                    newWidth = maxDimension;
                    newHeight = (height * maxDimension) / width;
                } else {
                    newHeight = maxDimension;
                    newWidth = (width * maxDimension) / height;
                }

                const canvas = document.createElement('canvas');
                canvas.width = newWidth;
                canvas.height = newHeight;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Could not get canvas context'));
                    return;
                }
                ctx.drawImage(img, 0, 0, newWidth, newHeight);

                canvas.toBlob((blob) => {
                    if (blob) {
                        const resizedFile = new File([blob], file.name, {
                            type: 'image/png', // Always convert to PNG for quality after resize
                            lastModified: Date.now(),
                        });
                        resolve(resizedFile);
                    } else {
                        reject(new Error('Canvas toBlob failed'));
                    }
                }, 'image/png', 0.95);
            };
            img.onerror = reject;
            img.src = event.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

const generateIframeContent = (componentCode: string, componentName: string): string => {
    const codeToRender = `
      const React = window.React;
      const ReactDOM = window.ReactDOM;
      try {
        ${componentCode}
        const container = document.getElementById('root');
        if (container) {
          const root = ReactDOM.createRoot(container);
          root.render(React.createElement(${componentName}));
        }
      } catch (e) {
        const root = document.getElementById('root');
        if (root) {
          root.innerHTML = '<div style="color: red; font-family: sans-serif; padding: 1rem;"><h3>Error de Renderizado</h3><pre>' + e.message + '\\n' + e.stack + '</pre></div>';
        }
        console.error(e);
      }
    `;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://unpkg.com/react@19/umd/react.development.js" crossorigin></script>
        <script src="https://unpkg.com/react-dom@19/umd/react-dom.development.js" crossorigin></script>
        <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
        <style> body { background-color: #ffffff; padding: 1rem; } </style>
      </head>
      <body>
        <div id="root"></div>
        <script type="text/babel" data-presets="react,typescript">
          ${codeToRender}
        </script>
      </body>
      </html>
    `;
};

const TabButton: React.FC<{
    label: string;
    icon: React.FC<{ className?: string }>;
    isActive: boolean;
    onClick: () => void;
}> = ({ label, icon: Icon, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors duration-200 ${
            isActive
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-white'
        }`}
    >
        <Icon className="w-5 h-5" />
        <span>{label}</span>
    </button>
);

const SkeletonLoader: React.FC<{ text: string }> = ({ text }) => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-background/80 rounded-lg backdrop-blur-sm">
        <svg className="animate-spin h-10 w-10 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-accent font-semibold animate-pulse">{text}</p>
    </div>
);

const ModeCard: React.FC<{
    onClick: () => void;
    icon: React.ReactNode;
    title: string;
    description: string;
    glowColorClass: string;
}> = ({ onClick, icon, title, description, glowColorClass }) => {
    return (
        <div className="relative group h-full">
            <div className={`absolute -inset-1 ${glowColorClass} rounded-xl blur-xl opacity-20 group-hover:opacity-40 transition duration-500`}></div>
            <button
                onClick={onClick}
                className="relative w-full h-full bg-surface/60 border border-border/50 rounded-xl p-6 sm:p-8 text-center transition-all duration-300 transform hover:-translate-y-1 backdrop-blur-sm flex flex-col items-center justify-center"
            >
                {icon}
                <h3 className="text-2xl font-bold text-text-primary mb-2 mt-4 group-hover:text-primary transition-colors">{title}</h3>
                <p className="text-text-secondary leading-relaxed">
                    {description}
                </p>
            </button>
        </div>
    );
};


const UIMagicianFlow: React.FC<{ onSendToDoctor: (result: UIMagicianResult) => void; }> = ({ onSendToDoctor }) => {
    // --- Mode Selection ---
    type MagicianMode = 'image-to-code' | 'image-editor' | 'ui-critique' | null;
    const [magicianMode, setMagicianMode] = useState<MagicianMode>(null);

    // --- Image-to-Code State ---
    const [image, setImage] = useState<{ src: string; file: File } | null>(null);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [result, setResult] = useState<UIMagicianResult | null>(null);
    const [componentName, setComponentName] = useState<string | null>(null);
    const [refinementHistory, setRefinementHistory] = useState<{ user: string; ai: string }[]>([]);
    // FIX: Declared refinementPrompt state variable
    const [refinementPrompt, setRefinementPrompt] = useState('');


    // --- Image Editor State ---
    const [editHistory, setEditHistory] = useState<{ src: string; file: File }[]>([]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [editPrompt, setEditPrompt] = useState('');
    const [editResult, setEditResult] = useState<ImageEditResult | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    // --- UI Critique State ---
    const [critiqueResult, setCritiqueResult] = useState<string | null>(null);

    // --- Shared State ---
    const [isLoading, setIsLoading] = useState(false);
    const [loadingText, setLoadingText] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'explanation' | 'analysis'>('preview');

    // --- Analysis State ---
    const [analysisReport, setAnalysisReport] = useState<AnalysisIssue[] | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [fixingIssueId, setFixingIssueId] = useState<string | null>(null);

    // --- Refs and Context ---
    const { addToast } = useToastContext();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const { t } = useI18n();
    const { openModal, closeModal } = useModalContext();
    
    // --- Derived State for Image Editor ---
    const currentImageForEdit = editHistory[historyIndex] || null;
    const originalImageForEdit = editHistory[0] || null;
    const canUndo = historyIndex > 0;
    const canRedo = historyIndex < editHistory.length - 1;

    // --- Image & Camera Handling ---

    const handleFileSelect = (files: FileList | null) => {
        if (files && files[0]) {
            const file = files[0];
            if (!file.type.startsWith('image/')) {
                addToast({ type: 'error', title: t('common.invalidFile' as TranslationKey), message: t('common.imageFileRequired' as TranslationKey) });
                return;
            }
            stopCamera();
            setImage({ src: URL.createObjectURL(file), file });
            setResult(null);
            setCritiqueResult(null);
            setAnalysisReport(null);
        }
    };

    const startCamera = async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            addToast({ type: 'error', title: t('common.notSupported' as TranslationKey), message: t('common.cameraNotSupported' as TranslationKey) });
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
                setIsCameraOn(true);
                setImage(null);
                setResult(null);
                setCritiqueResult(null);
                setAnalysisReport(null);
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            addToast({ type: 'error', title: t('common.cameraError' as TranslationKey), message: t('common.cameraAccessError' as TranslationKey) });
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach((track) => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsCameraOn(false);
    };

    const takePicture = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            canvas.toBlob((blob) => {
                if (blob) {
                    const file = new File([blob], 'snapshot.png', { type: 'image/png' });
                    setImage({ src: URL.createObjectURL(file), file });
                }
            }, 'image/png');
            stopCamera();
        }
    };

    // --- AI Generation & Refinement ---

    const handleGenerate = async () => {
        if (!image) return;
        setIsLoading(true);
        setLoadingText(t('magician.generatingCode' as TranslationKey));
        setError(null);
        setResult(null);
        setComponentName(null);
        setRefinementHistory([]);
        setAnalysisReport(null);
        setActiveTab('preview');
        try {
            const base64Image = await fileToBase64(image.file);
            const generatedResult = await geminiService.generateUIFromImage(
                base64Image,
                image.file.type,
                'React + TailwindCSS'
            );
            setResult(generatedResult);
            const name = generatedResult.filePath.split('/').pop()?.replace(/\.(tsx|jsx)$/, '') || 'GeneratedComponent';
            setComponentName(name);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : t('magician.error.generateUI' as TranslationKey);
            setError(errorMessage);
            addToast({ type: 'error', title: t('common.aiError' as TranslationKey), message: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefine = async (e: FormEvent) => {
        e.preventDefault();
        // FIX: Used the declared refinementPrompt state
        if (!image || !result || !refinementPrompt.trim()) return;

        setIsLoading(true);
        setLoadingText(t('magician.applyingChanges' as TranslationKey));
        setError(null);
        const currentPrompt = refinementPrompt;
        setRefinementPrompt('');
        setAnalysisReport(null);
        
        try {
            const base64Image = await fileToBase64(image.file);
            const refinedResult = await geminiService.refineUIGeneration(
                base64Image,
                image.file.type,
                result.content,
                currentPrompt,
                'React + TailwindCSS'
            );
            
            setResult(prev => ({ ...prev!, content: refinedResult.content, explanation: refinedResult.explanation }));
            setRefinementHistory(prev => [...prev, { user: currentPrompt, ai: refinedResult.explanation }]);
            setActiveTab('preview');
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : t('magician.error.refineUI' as TranslationKey);
            setError(errorMessage);
            addToast({ type: 'error', title: t('magician.error.refinement' as TranslationKey), message: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleGenerateCritique = async () => {
        if (!image) return;
        setIsLoading(true);
        setLoadingText(t('magician.analyzingDesign' as TranslationKey));
        setError(null);
        setCritiqueResult(null);
        try {
            const base64Image = await fileToBase64(image.file);
            const critique = await geminiService.getCritiqueForUI(base64Image, image.file.type);
            setCritiqueResult(critique);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : t('magician.error.generateCritique' as TranslationKey);
            setError(errorMessage);
            addToast({ type: 'error', title: t('common.aiError' as TranslationKey), message: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnalyzeCode = async () => {
        if (!result) return;
        setIsAnalyzing(true);
        setAnalysisReport(null);
        setError(null);
        try {
            const techStack: TechStack = {
                frontend: 'React', backend: 'None', database: 'None', mobile: 'None', devops: [],
            };
            const file = { path: result.filePath, content: result.content };
            
            const [qualityIssues, bestPracticeIssues] = await Promise.all([
                geminiService.generateCodeQualityAnalysis([file], techStack),
                geminiService.generateBestPracticesAnalysis([file], techStack),
            ]);

            const report: AnalysisIssue[] = [
                ...qualityIssues.map((i): AnalysisIssue => ({ ...i, category: 'Calidad' })),
                ...bestPracticeIssues.map((i): AnalysisIssue => ({ ...i, category: 'Mejores Prácticas' })),
            ];

            setAnalysisReport(report);
            addToast({ type: 'success', title: t('common.analysisComplete' as TranslationKey), message: t('common.issuesFound' as TranslationKey, {count: report.length.toString()}) });

        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : t('magician.error.analyzeCode' as TranslationKey);
            setError(errorMessage);
            addToast({ type: 'error', title: t('common.analysisError' as TranslationKey), message: errorMessage });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleGenerateFix = useCallback(async (issue: AnalysisIssue) => {
        if (!result) return;
        const issueId = `${issue.filePath}-${issue.line}-${issue.title}`;
        setFixingIssueId(issueId);

        try {
            const fixedContent = await geminiService.generateCodeFix(result.filePath, result.content, issue);
            const fix = { issue, originalContent: result.content, fixedContent };

            const onApply = () => {
                setResult(prev => prev ? { ...prev, content: fixedContent } : null);
                setAnalysisReport(prev => prev?.map(r => 
                    (r.filePath === issue.filePath && r.line === issue.line && r.title === issue.title) 
                    ? { ...r, isResolved: true } 
                    : r
                ) ?? null);
                addToast({ type: 'success', title: t('common.fixApplied' as TranslationKey), message: t('magician.componentCodeUpdated' as TranslationKey) });
                closeModal();
            };

            openModal('fixSuggestion', { fix, onApply });

        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : t('magician.error.generateSolution' as TranslationKey);
            setError(errorMessage);
            addToast({ type: 'error', title: t('common.aiError' as TranslationKey), message: errorMessage });
        } finally {
            setFixingIssueId(null);
        }
    }, [result, addToast, openModal, closeModal, t]);

    const handleCardClick = useCallback((issue: AnalysisIssue) => {
        setActiveTab('code');
    }, []);


    const handleCopyCode = () => {
        if (result?.content) {
            navigator.clipboard.writeText(result.content).then(() => {
                addToast({ type: 'success', title: t('common.copied' as TranslationKey), message: t('magician.codeCopied' as TranslationKey) });
            });
        }
    };

     const handleDownloadFile = () => {
        if (result) {
            const blob = new Blob([result.content], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const filename = result.filePath.split('/').pop() || 'component.tsx';
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            addToast({ type: 'success', title: t('common.downloaded' as TranslationKey), message: t('magician.fileDownloaded' as TranslationKey, { filename }) });
        }
    };
    
    // --- Image Editor Handlers ---

    const handleDrag = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
    const handleDragIn = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
    const handleDragOut = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files?.length) {
            handleEditFileSelect(e.dataTransfer.files);
        }
    };
    
    const handleEditFileSelect = async (files: FileList | null) => {
        if (files && files[0]) {
            const file = files[0];
            if (!file.type.startsWith('image/')) {
                addToast({ type: 'error', title: t('common.invalidFile' as TranslationKey), message: t('common.imageFileRequired' as TranslationKey) });
                return;
            }
            setIsLoading(true);
            setLoadingText(t('magician.preparingImage' as TranslationKey));
            try {
                const resizedFile = await resizeImage(file, MAX_DIMENSION);
                const src = URL.createObjectURL(resizedFile);
                const newImageState = { src, file: resizedFile };
                setEditHistory([newImageState]);
                setHistoryIndex(0);
                setEditResult(null);
            } catch (e) {
                addToast({ type: 'error', title: t('common.imageError' as TranslationKey), message: t('common.imageProcessingError' as TranslationKey) });
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleImageEdit = async (e: FormEvent) => {
        e.preventDefault();
        const currentImage = editHistory[historyIndex];
        if (!currentImage || !editPrompt.trim()) return;

        setIsLoading(true);
        setLoadingText(t('magician.applyingMagicEdit' as TranslationKey));
        setError(null);

        try {
            const base64Image = await fileToBase64(currentImage.file);
            const result = await geminiService.editImage(base64Image, currentImage.file.type, editPrompt);
            setEditResult(result);
            addToast({ type: 'success', title: t('magician.editComplete' as TranslationKey), message: result.text || t('magician.imageModified' as TranslationKey) });

            if (result.editedImage) {
                const newSrc = `data:${result.editedImage.mimeType};base64,${result.editedImage.base64}`;
                // FIX: Corrected newFile.name to be a string.
                const newFile = await base64ToFile(newSrc, `edited-${Date.now()}-${currentImage.file.name}`);
                const newImageState = { src: newSrc, file: newFile };
                const newHistory = [...editHistory.slice(0, historyIndex + 1), newImageState];
                setEditHistory(newHistory);
                setHistoryIndex(newHistory.length - 1);
            }
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : t('magician.error.editImage' as TranslationKey);
            setError(errorMessage);
            addToast({ type: 'error', title: t('magician.error.imageEdit' as TranslationKey), message: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };

    const handleUndo = () => {
        if (canUndo) setHistoryIndex(prev => prev - 1);
        addToast({ type: 'info', title: t('common.undo' as TranslationKey), message: t('magician.undoSuccess' as TranslationKey) });
    };

    const handleRedo = () => {
        if (canRedo) setHistoryIndex(prev => prev + 1);
        addToast({ type: 'info', title: t('common.redo' as TranslationKey), message: t('magician.redoSuccess' as TranslationKey) });
    };
    
    const handleResetToOriginal = () => {
        setHistoryIndex(0);
        addToast({ type: 'info', title: t('common.reset' as TranslationKey), message: t('magician.resetSuccess' as TranslationKey) });
    };
    
    const handleDownloadEditedImage = () => {
        const imageToDownload = editHistory[historyIndex];
        if (imageToDownload) {
            const a = document.createElement('a');
            a.href = imageToDownload.src;
            a.download = `edited-${editHistory[0]?.file.name || 'image.png'}`;
            document.body.appendChild(a);
            document.body.removeChild(a);
            addToast({ type: 'success', title: t('common.downloaded' as TranslationKey), message: t('magician.editedImageSaved' as TranslationKey) });
        }
    };

    // --- Reset & Memoization ---

    const handleStartOver = () => {
        stopCamera();
        setImage(null);
        setResult(null);
        setError(null);
        setComponentName(null);
        setRefinementHistory([]);
        setAnalysisReport(null);
        setMagicianMode(null);
        setEditHistory([]);
        setHistoryIndex(0);
        setEditPrompt('');
        setEditResult(null);
        setCritiqueResult(null);
        // FIX: Reset refinementPrompt when starting over
        setRefinementPrompt('');
    };
    
    const iframeContent = useMemo(() => {
        if (result && componentName) {
            return generateIframeContent(result.content, componentName);
        }
        return '';
    }, [result, componentName]);
    
    const categoryInfo = getCategoryInfo(t);

    const groupedIssues = useMemo(() => {
        if (!analysisReport) return null;
        return analysisReport.reduce((acc, issue) => {
            if (!acc[issue.category]) {
                acc[issue.category] = [];
            }
            acc[issue.category].push(issue);
            return acc;
        }, {} as Record<AnalysisCategory, AnalysisIssue[]>);
    }, [analysisReport]);

    // --- Render Functions ---
    
    const renderModeSelection = () => (
        <div className="w-full max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in">
            <ModeCard
                onClick={() => setMagicianMode('image-to-code')}
                icon={<MagicWandIcon className="w-16 h-16 text-accent" />}
                title={t('magician.mode.imageToCode' as TranslationKey)}
                description={t('magician.mode.imageToCodeDesc' as TranslationKey)}
                glowColorClass="bg-accent"
            />
            <ModeCard
                onClick={() => setMagicianMode('image-editor')}
                icon={<EditIcon className="w-16 h-16 text-fuchsia-400"/>}
                title={t('magician.mode.imageEditor' as TranslationKey)}
                description={t('magician.mode.imageEditorDesc' as TranslationKey)}
                glowColorClass="bg-fuchsia-500"
            />
            <ModeCard
                onClick={() => setMagicianMode('ui-critique')}
                icon={<StethoscopeIcon className="w-16 h-16 text-cyan-400" />}
                title={t('magician.mode.uiCritique' as TranslationKey)}
                description={t('magician.mode.uiCritiqueDesc' as TranslationKey)}
                glowColorClass="bg-cyan-500"
            />
        </div>
    );

    const renderImageToCode = () => (
        result ? renderResultScreen() : renderInitialImageScreen()
    );
    
    const renderInitialImageScreen = () => (
         <div className="w-full max-w-4xl space-y-6 animate-fade-in">
            <div className="bg-surface/50 border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center min-h-[300px] backdrop-blur-sm transition-colors">
                {isCameraOn ? (
                    <video ref={videoRef} className="w-full max-w-md rounded-lg" playsInline autoPlay />
                ) : image ? (
                    <img src={image.src} alt="Preview" className="max-h-80 rounded-lg shadow-lg" />
                ) : (
                    <div className="text-center">
                        <ImageIcon className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
                        <p className="text-xl font-semibold text-text-secondary">{t('magician.dropImage' as TranslationKey)}</p>
                        <p className="text-text-tertiary mt-2">{t('video.or' as TranslationKey)}</p>
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-2 px-6 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-focus transition-colors">
                            {image ? t('common.changeImage' as TranslationKey) : t('common.selectFile' as TranslationKey)}
                        </button>
                        <span className="text-text-tertiary">{t('video.or' as TranslationKey)}</span>
                        <button onClick={startCamera} className="px-6 py-3 bg-surface text-text-primary font-semibold rounded-lg hover:bg-border/50 transition-colors flex items-center gap-2">
                            <CameraIcon className="w-5 h-5" /> {t('common.useCamera' as TranslationKey)}
                        </button>
                    </div>
                )}
            </div>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={(e) => handleFileSelect(e.target.files)} className="hidden" />
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {isCameraOn ? (
                    <>
                        <button onClick={takePicture} className="px-6 py-3 bg-success text-white font-bold rounded-lg hover:bg-success/80 transition-colors flex items-center gap-2">
                            <CameraIcon className="w-5 h-5" /> {t('common.takePhoto' as TranslationKey)}
                        </button>
                         <button onClick={stopCamera} className="px-6 py-3 bg-border text-white font-semibold rounded-lg hover:bg-border/80 transition-colors">{t('common.cancel' as TranslationKey)}</button>
                    </>
                ) : (
                    <>
                        <button onClick={() => fileInputRef.current?.click()} className="px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-focus transition-colors">
                            {image ? t('common.changeImage' as TranslationKey) : t('common.selectFile' as TranslationKey)}
                        </button>
                        <span className="text-text-tertiary">{t('video.or' as TranslationKey)}</span>
                        <button onClick={startCamera} className="px-6 py-3 bg-surface text-text-primary font-semibold rounded-lg hover:bg-border/50 transition-colors flex items-center gap-2">
                            <CameraIcon className="w-5 h-5" /> {t('common.useCamera' as TranslationKey)}
                        </button>
                    </>
                )}
            </div>
            
            <div className="text-center pt-4">
                <button onClick={handleGenerate} disabled={!image || isLoading} className="w-full sm:w-auto px-10 py-4 bg-accent text-white font-bold text-lg rounded-lg hover:bg-accent-focus transition-transform transform hover:scale-105 duration-300 shadow-lg shadow-accent/20 disabled:opacity-50 disabled:cursor-not-allowed">
                   {isLoading ? (
                        <SpinnerIcon className="w-6 h-6 inline-block mr-2" />
                    ) : (
                        <MagicWandIcon className="w-6 h-6 inline-block mr-2" />
                    )}
                   {isLoading ? t('common.generating' as TranslationKey) : t('magician.generateUI' as TranslationKey)}
                </button>
            </div>
        </div>
    );

    const getIssueId = (issue: AnalysisIssue) => `${issue.filePath}-${issue.line}-${issue.title}`;

    const renderResultScreen = () => (
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in h-[80vh]">
            {/* Main Content: Tabs */}
            <div className="lg:col-span-8 flex flex-col bg-surface/50 rounded-lg border border-border backdrop-blur-sm h-full">
                <div className="flex border-b border-border flex-shrink-0">
                    <TabButton label={t('common.preview' as TranslationKey)} icon={ImageIcon} isActive={activeTab === 'preview'} onClick={() => setActiveTab('preview')} />
                    <TabButton label={t('common.code' as TranslationKey)} icon={CodeIcon} isActive={activeTab === 'code'} onClick={() => setActiveTab('code')} />
                    <TabButton label={t('common.explanation' as TranslationKey)} icon={LightbulbIcon} isActive={activeTab === 'explanation'} onClick={() => setActiveTab('explanation')} />
                    <TabButton label={t('doctor.codeReview' as TranslationKey)} icon={StethoscopeIcon} isActive={activeTab === 'analysis'} onClick={() => setActiveTab('analysis')} />
                </div>

                <div className="flex-grow min-h-0 relative">
                    {isLoading ? (
                        <SkeletonLoader text={loadingText} />
                    ) : (
                        <>
                            <div className={`w-full h-full ${activeTab === 'preview' ? 'block' : 'hidden'}`}>
                                <div className="bg-white rounded-b-lg p-2 h-full">
                                    <iframe
                                        srcDoc={iframeContent}
                                        title="Live Preview"
                                        className="w-full h-full border-0 rounded"
                                        sandbox="allow-scripts"
                                    />
                                </div>
                            </div>

                            <div className={`w-full h-full flex-col ${activeTab === 'code' ? 'flex' : 'hidden'}`}>
                                <div className="p-3 border-b border-border/50 flex justify-between items-center bg-surface/80 flex-shrink-0">
                                    <p className="text-sm text-text-secondary font-mono truncate">{result!.filePath}</p>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => onSendToDoctor(result!)} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-info/20 text-info hover:bg-info/30 transition-colors text-xs">
                                            <StethoscopeIcon className="w-4 h-4" /> {t('doctor.analyzeWithDoctor' as TranslationKey)}
                                        </button>
                                        <button onClick={handleCopyCode} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-border/50 text-text-secondary hover:bg-border hover:text-white transition-colors text-xs">
                                            <CopyIcon className="w-4 h-4" /> {t('common.copy' as TranslationKey)}
                                        </button>
                                         <button onClick={handleDownloadFile} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-border/50 text-text-secondary hover:bg-border hover:text-white transition-colors text-xs">
                                            <DownloadIcon className="w-4 h-4" /> {t('common.download' as TranslationKey)}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-grow p-4 overflow-y-auto bg-background rounded-b-lg">
                                    <pre className="text-sm font-mono whitespace-pre-wrap"><code>{result!.content}</code></pre>
                                </div>
                            </div>
                            
                            <div className={`w-full h-full p-6 overflow-y-auto ${activeTab === 'explanation' ? 'block' : 'hidden'}`}>
                                <article className="prose prose-invert max-w-none">
                                     <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {result!.explanation}
                                    </ReactMarkdown>
                                </article>
                            </div>
                            
                            <div className={`w-full h-full p-4 overflow-y-auto ${activeTab === 'analysis' ? 'block' : 'hidden'}`}>
                                {isAnalyzing ? (
                                    <div className="flex items-center justify-center h-full text-text-secondary">
                                        <SpinnerIcon className="w-5 h-5 mr-3" />
                                        <span>{t('magician.analyzingCode' as TranslationKey)}</span>
                                    </div>
                                ) : !analysisReport ? (
                                    <div className="text-center py-12 flex flex-col items-center justify-center h-full">
                                        <h3 className="text-lg font-semibold text-text-primary">{t('magician.aiCodeAnalysis' as TranslationKey)}</h3>
                                        <p className="text-text-secondary max-w-sm mt-2 mb-6">{t('magician.aiCodeAnalysisDesc' as TranslationKey)}</p>
                                        <button onClick={handleAnalyzeCode} disabled={isAnalyzing} className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-focus transition-colors">
                                            {isAnalyzing ? <SpinnerIcon className="w-5 h-5" /> : <StethoscopeIcon className="w-5 h-5" />}
                                            {t('common.executeAnalysis' as TranslationKey)}
                                        </button>
                                    </div>
                                ) : analysisReport.length === 0 ? (
                                    <div className="text-center py-12 flex flex-col items-center justify-center h-full">
                                        <ShieldCheckIcon className="w-16 h-16 text-success mx-auto mb-4"/>
                                        <h3 className="text-lg font-semibold text-text-primary">{t('common.noIssuesFound' as TranslationKey)}</h3>
                                        <p className="text-text-secondary">{t('magician.noSuggestionsFound' as TranslationKey)}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6 pr-2">
                                        {groupedIssues && (Object.keys(groupedIssues) as AnalysisCategory[]).map(category => {
                                            const info = categoryInfo[category]; const issues = groupedIssues[category]; if (!issues || issues.length === 0) return null;
                                            return (
                                                <div key={category}>
                                                    <div className="flex items-center gap-3 mb-3"> <info.icon className={`w-6 h-6 ${info.color}`} /> <h2 className={`text-xl font-bold ${info.color}`}>{info.title} ({issues.length})</h2> </div>
                                                    <div className="space-y-4"> 
                                                        {issues.map((issue, index) => (
                                                            <AnalysisIssueCard 
                                                                key={index} 
                                                                issue={issue}
                                                                onCardClick={handleCardClick}
                                                                onGenerateFix={handleGenerateFix}
                                                                isFixing={fixingIssueId === getIssueId(issue)}
                                                            />
                                                        ))} 
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Right Panel: Image & Refinement Chat */}
            <div className="lg:col-span-4 flex flex-col gap-4 h-full">
                 <div className="bg-surface/50 p-3 rounded-lg border border-border flex-shrink-0">
                    <h3 className="text-sm font-semibold text-accent mb-2 text-center">{t('magician.sourceImage' as TranslationKey)}</h3>
                    <img src={image!.src} alt="Source design" className="rounded-md w-full" />
                </div>
                 <div className="flex-grow flex flex-col bg-surface/50 rounded-lg border border-border backdrop-blur-sm min-h-0">
                    <h3 className="text-base font-bold text-text-primary p-3 border-b border-border">{t('magician.refineComponent' as TranslationKey)}</h3>
                    <div className="flex-grow p-4 overflow-y-auto space-y-4">
                        {refinementHistory.map((entry, index) => (
                            <div key={index} className="space-y-3 animate-fade-in">
                                <div className="flex items-center justify-end">
                                    <div className="flex flex-col w-full max-w-xs leading-1.5 p-3 bg-primary rounded-s-xl rounded-ee-xl">
                                        <p className="text-sm font-normal text-white">{entry.user}</p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <div className="flex flex-col w-full max-w-xs leading-1.5 p-3 bg-surface rounded-e-xl rounded-es-xl prose prose-invert prose-sm max-w-none">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {entry.ai}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {refinementHistory.length === 0 && (
                            <div className="text-xs text-text-tertiary text-center h-full flex items-center justify-center p-4">
                                {t('magician.refinePlaceholder' as TranslationKey)}
                            </div>
                        )}
                    </div>
                    <form onSubmit={handleRefine} className="p-2 border-t border-border">
                        <div className="flex items-center gap-2 p-1.5 bg-surface/80 border-2 border-border rounded-xl focus-within:ring-2 focus-within:ring-primary">
                            {/* FIX: Used declared refinementPrompt state */}
                            <input
                                value={refinementPrompt}
                                onChange={(e) => setRefinementPrompt(e.target.value)}
                                placeholder={t('wireframe.prompt.refine' as TranslationKey)}
                                className="w-full p-1 bg-transparent text-text-primary placeholder-text-tertiary outline-none"
                                disabled={isLoading}
                            />
                            <button type="submit" disabled={isLoading || !refinementPrompt.trim()} className="p-2 rounded-lg bg-primary text-white hover:bg-primary-focus transition-all disabled:bg-border disabled:cursor-not-allowed flex-shrink-0">
                                {isLoading ? <SpinnerIcon className="w-5 h-5" /> : <SendIcon className="w-5 h-5" />}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
    
    const renderImageEditor = () => {
        return (
            <div className="w-full flex-grow flex flex-col">
                {editHistory.length === 0 ? (
                    <div 
                        onDragEnter={handleDragIn} onDragLeave={handleDragOut} onDragOver={handleDrag} onDrop={handleDrop}
                        className="flex-grow flex flex-col items-center justify-center w-full max-w-4xl mx-auto"
                    >
                        <div className={`w-full h-80 border-4 border-dashed rounded-xl flex flex-col items-center justify-center transition-colors duration-300 backdrop-blur-sm ${isDragging ? 'border-primary bg-primary/10' : 'border-border bg-surface/50'}`}>
                            <ImageIcon className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
                            <p className="text-xl font-semibold text-text-secondary">{t('magician.dropImageToEdit' as TranslationKey)}</p>
                             <input type="file" accept="image/*" ref={fileInputRef} onChange={(e) => handleEditFileSelect(e.target.files)} className="hidden" />
                            <button onClick={() => fileInputRef.current?.click()} className="mt-4 px-6 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-focus transition-colors">
                                {t('common.selectFile' as TranslationKey)}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 h-full flex-grow animate-fade-in">
                        {/* Left Panel: Controls */}
                        <div className="lg:col-span-4 flex flex-col gap-6">
                            <div className="bg-surface/50 border border-border rounded-lg p-4 flex flex-col flex-grow">
                                <h3 className="text-xl font-bold text-accent mb-4">{t('magician.controlPanel' as TranslationKey)}</h3>
                                <form onSubmit={handleImageEdit} className="flex flex-col flex-grow">
                                    <label htmlFor="edit-prompt" className="block text-sm font-semibold text-text-secondary mb-2">
                                        {t('magician.describeEdit' as TranslationKey)}
                                    </label>
                                    <textarea
                                        id="edit-prompt"
                                        value={editPrompt}
                                        onChange={(e) => setEditPrompt(e.target.value)}
                                        placeholder={t('magician.editPromptPlaceholder' as TranslationKey)}
                                        className="w-full flex-grow p-3 bg-background border-2 border-border rounded-md text-text-primary focus:ring-2 focus:ring-primary focus:outline-none transition-colors resize-none"
                                        required
                                    />
                                    <button
                                        type="submit"
                                        disabled={isLoading || !editPrompt.trim()}
                                        className="w-full mt-4 px-6 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-focus transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isLoading ? <SpinnerIcon className="w-5 h-5"/> : <MagicWandIcon className="w-5 h-5"/>}
                                        {isLoading ? t('magician.applying' as TranslationKey) : t('magician.applyEdit' as TranslationKey)}
                                    </button>
                                </form>
                                <div className="mt-6 pt-4 border-t border-border/50">
                                    <h4 className="text-sm font-semibold text-text-secondary mb-3">{t('magician.history' as TranslationKey)}</h4>
                                    <div className="flex items-center justify-center gap-4">
                                        <button onClick={handleUndo} disabled={!canUndo} className="p-2 rounded-full bg-border/50 text-text-secondary hover:bg-border hover:text-white disabled:opacity-50 disabled:cursor-not-allowed" title={t('common.undo' as TranslationKey)}>
                                            <UndoIcon className="w-6 h-6"/>
                                        </button>
                                         <button onClick={handleRedo} disabled={!canRedo} className="p-2 rounded-full bg-border/50 text-text-secondary hover:bg-border hover:text-white disabled:opacity-50 disabled:cursor-not-allowed" title={t('common.redo' as TranslationKey)}>
                                            <RedoIcon className="w-6 h-6"/>
                                        </button>
                                        <button onClick={handleResetToOriginal} disabled={!canUndo} className="p-2 rounded-full bg-border/50 text-text-secondary hover:bg-border hover:text-white disabled:opacity-50 disabled:cursor-not-allowed" title={t('magician.resetToOriginal' as TranslationKey)}>
                                             <RefreshIcon className="w-6 h-6"/>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Panel: Image Display */}
                        <div className="lg:col-span-8 flex flex-col gap-4">
                             <div className="flex-grow bg-surface/30 border border-border rounded-lg p-4 flex items-center justify-center relative">
                                {isLoading && <SkeletonLoader text={loadingText} />}
                                {currentImageForEdit && <img src={currentImageForEdit.src} alt={t('magician.editedImage' as TranslationKey)} className="max-w-full max-h-full rounded-md shadow-lg" />}
                            </div>
                            <div className="flex-shrink-0 bg-surface/50 p-3 rounded-lg border border-border flex justify-between items-center">
                                <p className="text-sm text-text-secondary">{editResult?.text || t('magician.readyToEdit' as TranslationKey)}</p>
                                <button
                                    onClick={handleDownloadEditedImage}
                                    className="px-4 py-2 bg-accent text-white font-semibold rounded-lg hover:bg-accent-focus transition-colors flex items-center gap-2"
                                >
                                    <DownloadIcon className="w-5 h-5" />
                                    {t('common.download' as TranslationKey)}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };
    
    const renderUiCritique = () => (
        <div className="w-full flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 h-full animate-fade-in">
             <div className="flex flex-col gap-4">
                <div className="bg-surface/50 border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center flex-grow backdrop-blur-sm transition-colors">
                    {image ? (
                        <img src={image.src} alt="Preview" className="max-h-full max-w-full rounded-lg shadow-lg" />
                    ) : (
                        <div className="text-center">
                            <ImageIcon className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
                            <p className="text-xl font-semibold text-text-secondary">{t('magician.uploadForCritique' as TranslationKey)}</p>
                        </div>
                    )}
                </div>
                 <input type="file" accept="image/*" ref={fileInputRef} onChange={(e) => handleFileSelect(e.target.files)} className="hidden" />
                 <div className="flex-shrink-0 flex items-center justify-center gap-4">
                    <button onClick={() => fileInputRef.current?.click()} className="px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-focus transition-colors">
                        {image ? t('common.changeImage' as TranslationKey) : t('common.selectFile' as TranslationKey)}
                    </button>
                    <button onClick={handleGenerateCritique} disabled={!image || isLoading} className="w-auto px-6 py-3 bg-accent text-white font-bold rounded-lg hover:bg-accent-focus transition-transform duration-300 shadow-lg shadow-accent/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                        {isLoading ? <SpinnerIcon className="w-5 h-5"/> : <StethoscopeIcon className="w-5 h-5"/>}
                        {isLoading ? t('common.analyzing' as TranslationKey) : t('magician.getCritique' as TranslationKey)}
                    </button>
                </div>
            </div>
            <div className="bg-surface/50 border border-border rounded-lg p-4 flex flex-col">
                <h3 className="text-xl font-bold text-accent mb-4 flex-shrink-0">{t('magician.analysisResults' as TranslationKey)}</h3>
                 <div className="flex-grow overflow-y-auto pr-2">
                    {isLoading && <div className="flex h-full items-center justify-center"><SpinnerIcon className="w-10 h-10 text-primary" /></div>}
                    {!isLoading && !critiqueResult && <p className="text-sm text-text-tertiary text-center pt-16">{t('magician.critiquePlaceholder' as TranslationKey)}</p>}
                    {critiqueResult && (
                         <article className="prose prose-invert max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{critiqueResult}</ReactMarkdown>
                        </article>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full w-full items-center justify-center p-4">
            <main className="w-full flex-grow flex flex-col items-center justify-center">
                {isLoading && <Loader text={loadingText} />}
                {error && <div className="bg-error/10 border border-error/30 text-red-300 px-4 py-3 rounded-lg relative my-4 w-full" role="alert">{error}</div>}
                
                {!magicianMode && renderModeSelection()}
                {magicianMode === 'image-to-code' && renderImageToCode()}
                {magicianMode === 'image-editor' && renderImageEditor()}
                {magicianMode === 'ui-critique' && renderUiCritique()}

                {magicianMode && (
                    <div className="mt-6">
                        <button onClick={handleStartOver} className="px-6 py-2 border-2 border-primary text-primary font-semibold rounded-lg hover:bg-primary hover:text-white transition duration-300">
                            {t('common.startOver' as TranslationKey)}
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default UIMagicianFlow;