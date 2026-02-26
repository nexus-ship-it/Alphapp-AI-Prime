




import React, { useState, FormEvent, useEffect, useRef, useCallback, useMemo } from 'react';
import { useWebNavigatorContext } from '../../contexts/WebNavigatorContext';
import { useI18n } from '../../contexts/I18nContext';
import { HistoryIcon, SendIcon, BrowserIcon, AlertTriangleIcon, SpinnerIcon, CheckCircleIcon, ExternalLinkIcon, StethoscopeIcon, CodeIcon, BugIcon, LightbulbIcon, ShieldCheckIcon } from '../ui/icons';
import { LinkAnalysisResult, HistoryItem, LinkAnalysisModalTab, ProjectFile, TechStack, AnalysisIssue, AnalysisCategory } from '../../types';
import { TechDisplay } from '../ui/WebTechIcons'; 
import { TranslationKey } from '../../i18n/translations'; // Explicitly import TranslationKey
import * as fileUtils from '../../services/fileUtils';
import * as geminiService from '../../services/geminiService';
import { useToastContext } from '../../contexts/ToastContext';
import { getCategoryInfo } from '../ui/AnalysisComponents';

interface LinkAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAnalyzeFilesInDoctor: (files: ProjectFile[], techStack: TechStack, projectName: string) => void;
}

const SecurityScoreGauge: React.FC<{ score: number }> = ({ score }) => {
    const radius = 30;
    const circumference = 2 * Math.PI * radius;
    const [offset, setOffset] = useState(circumference);

    useEffect(() => {
        const scoreOffset = circumference - (score / 100) * circumference;
        const timer = setTimeout(() => setOffset(scoreOffset), 100);
        return () => clearTimeout(timer);
    }, [score, circumference]);

    let colorClass = 'text-success';
    if (score < 40) colorClass = 'text-error';
    else if (score < 75) colorClass = 'text-warning';

    return (
        <div className="relative w-16 h-16 flex-shrink-0">
            <svg className="w-full h-full" viewBox="0 0 80 80">
                <circle className="text-border/30" strokeWidth="8" stroke="currentColor" fill="transparent" r={radius} cx="40" cy="40" />
                <circle
                    className={`${colorClass} transition-stroke-dashoffset duration-1000 ease-out`}
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    style={{ strokeDashoffset: offset }}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="40"
                    cy="40"
                    transform="rotate(-90 40 40)"
                />
            </svg>
            <span className={`absolute inset-0 flex items-center justify-center text-xl font-bold ${colorClass}`}>{score}</span>
        </div>
    );
};

const LinkAnalysisModal: React.FC<LinkAnalysisModalProps> = ({ isOpen, onClose, onAnalyzeFilesInDoctor }) => {
    const { t } = useI18n();
    const { addToast } = useToastContext();
    const {
        currentUrl,
        setUrlAndAnalyze,
        isLoading,
        loadingText,
        error,
        preflightResult,
        history,
        loadFromHistory,
        clearHistory,
    } = useWebNavigatorContext();

    const [activeTab, setActiveTab] = useState<LinkAnalysisModalTab>('url-analysis');
    const [urlInput, setUrlInput] = useState(currentUrl);

    // File Analysis States
    const [localUploadedFiles, setLocalUploadedFiles] = useState<ProjectFile[] | null>(null);
    const [localFileAnalysisReport, setLocalFileAnalysisReport] = useState<AnalysisIssue[] | null>(null);
    const [isFileAnalysisLoading, setIsFileAnalysisLoading] = useState(false);
    const [isFileUploadLoading, setIsFileUploadLoading] = useState(false);
    const [fileAnalysisError, setFileAnalysisError] = useState<string | null>(null);
    const [localDetectedTechStack, setLocalDetectedTechStack] = useState<TechStack | null>(null);
    const [localProjectName, setLocalProjectName] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);


    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
        }
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    useEffect(() => {
        if (!isLoading) { // Update input field when context finishes loading or is reset
            setUrlInput(currentUrl);
        }
    }, [currentUrl, isLoading]);

    const handleSubmitUrl = async (e: FormEvent) => {
        e.preventDefault();
        if (urlInput.trim()) {
            await setUrlAndAnalyze(urlInput.trim());
        }
    };

    const handleLoadHistoryItem = (item: HistoryItem) => {
        loadFromHistory(item);
        setUrlInput(item.url); // Also update local input
    };

    const calculateSecurityScore = (security: LinkAnalysisResult['security']): number => {
        let score = 0;
        if (security.usesHttps) score += 50;
        if (security.securityHeaders.find(h => h.name === 'Strict-Transport-Security')?.present) score += 20;
        if (security.securityHeaders.find(h => h.name === 'Content-Security-Policy')?.present) score += 20;
        if (security.securityHeaders.find(h => h.name === 'X-Frame-Options')?.present) score += 10;
        return Math.min(100, score);
    };

    // --- File Analysis Handlers ---
    const handleDrag = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
    const handleDragIn = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
    const handleDragOut = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileSelectAndAnalyze(e.dataTransfer.files);
        }
    };

    const handleFileSelectAndAnalyze = useCallback(async (fileList: FileList) => {
        setIsFileUploadLoading(true);
        setFileAnalysisError(null);
        setLocalUploadedFiles(null);
        setLocalFileAnalysisReport(null);
        setLocalDetectedTechStack(null);
        setLocalProjectName(null);

        try {
            const files = await fileUtils.readFilesFromUpload(fileList);
            if (files.length === 0) {
                throw new Error(t('linkAnalysis.file.noFilesLoaded' as TranslationKey));
            }
            setLocalUploadedFiles(files);
            addToast({ type: 'info', title: t('common.add' as TranslationKey), message: t('linkAnalysis.file.filesLoaded' as TranslationKey, {count: files.length.toString()}) });

            const folderName = (fileList[0] as any).webkitRelativePath?.split('/')[0] || 'uploaded-project';
            setLocalProjectName(folderName);
            
            setIsFileUploadLoading(false);
            setIsFileAnalysisLoading(true);

            // Detect tech stack
            const detectedStack = await geminiService.detectProjectTechStack(files);
            setLocalDetectedTechStack(detectedStack);

            // Run a lighter analysis for modal display (e.g., only security, dependencies, quality)
            const analysisResult = await geminiService.generateFullCodeAnalysis(files, detectedStack);
            const report: AnalysisIssue[] = [
                ...analysisResult.security.map((i): AnalysisIssue => ({ ...i, category: 'Seguridad' })),
                ...analysisResult.dependencies.map((i): AnalysisIssue => ({ ...i, category: 'Análisis de Dependencias' })),
                ...analysisResult.quality.map((i): AnalysisIssue => ({ ...i, category: 'Calidad' })),
            ];
            setLocalFileAnalysisReport(report);
            
            addToast({ type: 'success', title: t('common.analysisComplete' as TranslationKey), message: t('linkAnalysis.file.issuesFound' as TranslationKey, {count: report.length.toString()}) });

        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : t('linkAnalysis.file.uploadError' as TranslationKey);
            setFileAnalysisError(errorMessage);
            addToast({ type: 'error', title: t('common.error' as TranslationKey), message: errorMessage });
        } finally {
            setIsFileUploadLoading(false);
            setIsFileAnalysisLoading(false);
        }
    }, [addToast, t]);

    const handleOpenInCodeDoctor = useCallback(() => {
        if (localUploadedFiles && localDetectedTechStack && localProjectName) {
            onAnalyzeFilesInDoctor(localUploadedFiles, localDetectedTechStack, localProjectName);
        } else {
            addToast({type: 'warning', title: t('common.warning' as TranslationKey), message: t('linkAnalysis.file.noFilesLoaded' as TranslationKey)});
        }
    }, [localUploadedFiles, localDetectedTechStack, localProjectName, onAnalyzeFilesInDoctor, addToast, t]);

    const fileAnalysisSummary = useMemo(() => {
        if (!localFileAnalysisReport) return null;
        const initial = { 'Crítica': 0, 'Alta': 0, 'Media': 0, 'Baja': 0, 'Informativa': 0, total: 0 };
        const counts = localFileAnalysisReport.reduce((acc, issue) => {
            acc[issue.severity] = (acc[issue.severity] || 0) + 1;
            acc.total++;
            return acc;
        }, initial);
        return counts;
    }, [localFileAnalysisReport]);

    const categoryInfo = getCategoryInfo(t);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50">
            <div className="fixed inset-0 bg-background/80 animate-fade-in z-40" onClick={onClose} />
            <div className="flex items-center justify-center h-full">
                <div
                    className="bg-surface border border-border rounded-lg shadow-xl w-full max-w-4xl h-[90vh] m-4 transform transition-all animate-slide-up flex flex-col relative z-50"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute top-3 right-3 p-1 rounded-full text-text-secondary hover:bg-border/50 text-2xl leading-none w-8 h-8 flex items-center justify-center z-10"
                        aria-label={t('common.close' as TranslationKey)}
                    >
                        &times;
                    </button>
                    <div className="p-4 border-b border-border">
                        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                            <BrowserIcon className="w-6 h-6" /> {t('navigator.analysisPanel' as TranslationKey)}
                        </h2>
                        <p className="text-sm text-text-secondary mt-1">{t('navigator.description' as TranslationKey)}</p>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex border-b border-border">
                        <button
                            onClick={() => setActiveTab('url-analysis')}
                            className={`flex-1 flex items-center justify-center gap-2 p-3 text-sm font-semibold border-b-2 transition-colors duration-200 ${activeTab === 'url-analysis' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-white'}`}
                        >
                            <BrowserIcon className="w-5 h-5" /> {t('linkAnalysis.tab.urlAnalysis' as TranslationKey)}
                        </button>
                        <button
                            onClick={() => setActiveTab('file-analysis')}
                            className={`flex-1 flex items-center justify-center gap-2 p-3 text-sm font-semibold border-b-2 transition-colors duration-200 ${activeTab === 'file-analysis' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-white'}`}
                        >
                            <CodeIcon className="w-5 h-5" /> {t('linkAnalysis.tab.fileAnalysis' as TranslationKey)}
                        </button>
                    </div>

                    <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 p-4 overflow-hidden min-h-0">
                        {/* Left Panel: URL Input & Current Analysis / File Upload & Analysis */}
                        {activeTab === 'url-analysis' && (
                            <div className="flex flex-col bg-background rounded-lg p-4 border border-border/50 h-full">
                                <h3 className="text-lg font-semibold text-accent mb-3">{t('navigator.analysisPanel' as TranslationKey)}</h3>
                                <form onSubmit={handleSubmitUrl} className="flex items-center gap-2 mb-4">
                                    <input
                                        type="text"
                                        value={urlInput}
                                        onChange={(e) => setUrlInput(e.target.value)}
                                        placeholder={t('navigator.placeholder' as TranslationKey)}
                                        className="w-full p-2 bg-surface/50 border border-border rounded-md text-sm text-text-primary focus:ring-2 focus:ring-primary focus:outline-none"
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="submit"
                                        disabled={isLoading || !urlInput.trim()}
                                        className="p-2 rounded-md bg-primary text-white hover:bg-primary-focus disabled:opacity-50"
                                    >
                                        {isLoading ? <SpinnerIcon className="w-5 h-5" /> : <SendIcon className="w-5 h-5" />}
                                    </button>
                                </form>

                                {error && <div className="bg-error/10 border border-error/30 text-red-300 px-3 py-2 rounded-lg text-sm mb-4 flex items-center gap-2"><AlertTriangleIcon className="w-4 h-4" /> {error}</div>}
                                
                                {isLoading && (
                                    <div className="flex items-center justify-center h-full text-text-secondary">
                                        <SpinnerIcon className="w-6 h-6 mr-2" /> {loadingText}
                                    </div>
                                )}

                                {!isLoading && preflightResult && (
                                    <div className="space-y-4 pt-2">
                                        <h4 className="font-bold text-text-primary text-center">
                                            <a href={preflightResult.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center justify-center gap-2">
                                                {preflightResult.metadata.title || preflightResult.url} <ExternalLinkIcon className="w-4 h-4" />
                                            </a>
                                        </h4>
                                        <p className="text-sm text-text-secondary text-center italic">{preflightResult.summary}</p>
                                        
                                        <div className="flex flex-col items-center gap-3 bg-surface/50 p-3 rounded-lg border border-border/50">
                                            <h5 className="font-semibold text-accent text-sm">{t('analysis.category.security' as TranslationKey)}</h5>
                                            <SecurityScoreGauge score={calculateSecurityScore(preflightResult.security)} />
                                            <p className="text-xs text-text-tertiary text-center">{preflightResult.security.vulnerabilitySummary}</p>
                                        </div>
                                        <div className="bg-surface/50 p-3 rounded-lg border border-border/50">
                                            <h5 className="font-semibold text-accent text-sm mb-2">{t('analysis.category.techStack' as TranslationKey)}</h5>
                                            <div className="flex flex-wrap gap-2 justify-center">
                                                {Array.from(new Set([
                                                    ...(preflightResult.techStack.frontend || []),
                                                    ...(preflightResult.techStack.backend || []),
                                                    ...(preflightResult.techStack.cms || []),
                                                    ...(preflightResult.techStack.analytics || []),
                                                    ...(preflightResult.techStack.javascriptLibraries || []),
                                                    ...(preflightResult.techStack.server ? [preflightResult.techStack.server] : []),
                                                ])).map((tech, i) => <TechDisplay key={i} techName={tech} />)}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'file-analysis' && (
                            <div className="flex flex-col bg-background rounded-lg p-4 border border-border/50 h-full">
                                <h3 className="text-lg font-semibold text-accent mb-3">{t('linkAnalysis.tab.fileAnalysis' as TranslationKey)}</h3>
                                {localUploadedFiles === null ? (
                                    <div 
                                        onDragEnter={handleDragIn} onDragLeave={handleDragOut} onDragOver={handleDrag} onDrop={handleDrop}
                                        className={`w-full h-48 border-4 border-dashed rounded-xl flex flex-col items-center justify-center transition-colors duration-300 backdrop-blur-sm ${isDragging ? 'border-primary bg-primary/10' : 'border-border bg-surface/50'}`}
                                    >
                                        <input 
                                            ref={fileInputRef} 
                                            type="file" 
                                            {...({ webkitdirectory: "true", directory: "true" } as any)}
                                            multiple 
                                            className="hidden" 
                                            onChange={(e) => e.target.files && handleFileSelectAndAnalyze(e.target.files)} 
                                            disabled={isFileUploadLoading || isFileAnalysisLoading} 
                                        />
                                        <CodeIcon className="w-12 h-12 text-text-tertiary mb-2" />
                                        <p className="text-lg font-semibold text-text-secondary">{t('linkAnalysis.file.dropFolder' as TranslationKey)}</p>
                                        <button 
                                            type="button" 
                                            onClick={() => fileInputRef.current?.click()} 
                                            className="mt-2 px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-focus transition-colors"
                                            disabled={isFileUploadLoading || isFileAnalysisLoading}
                                        >
                                            {t('linkAnalysis.file.selectFolder' as TranslationKey)}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex-grow space-y-4 pt-2">
                                        <h4 className="font-bold text-text-primary text-center flex items-center justify-center gap-2">
                                            <CodeIcon className="w-5 h-5"/> {t('linkAnalysis.file.projectName' as TranslationKey, { projectName: localProjectName || 'N/A' })}
                                        </h4>
                                        <p className="text-sm text-text-secondary text-center">
                                            {t('linkAnalysis.file.filesLoaded' as TranslationKey, { count: localUploadedFiles.length.toString() })}
                                        </p>

                                        {fileAnalysisError && <div className="bg-error/10 border border-error/30 text-red-300 px-3 py-2 rounded-lg text-sm mb-4 flex items-center gap-2"><AlertTriangleIcon className="w-4 h-4" /> {fileAnalysisError}</div>}
                                        
                                        {(isFileUploadLoading || isFileAnalysisLoading) && (
                                            <div className="flex items-center justify-center h-full text-text-secondary">
                                                <SpinnerIcon className="w-6 h-6 mr-2" /> {isFileUploadLoading ? t('linkAnalysis.file.uploading' as TranslationKey) : t('linkAnalysis.file.analyzing' as TranslationKey)}
                                            </div>
                                        )}

                                        {!isFileUploadLoading && !isFileAnalysisLoading && localFileAnalysisReport && (
                                            <>
                                                <div className="bg-surface/50 p-3 rounded-lg border border-border/50">
                                                    <h5 className="font-semibold text-accent text-sm mb-2">{t('linkAnalysis.file.summaryTitle' as TranslationKey)}</h5>
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex justify-between items-center text-sm text-text-primary">
                                                            <span>{t('linkAnalysis.file.totalIssues' as TranslationKey)}:</span>
                                                            <span className="font-bold">{fileAnalysisSummary?.total || 0}</span>
                                                        </div>
                                                        {(['Crítica', 'Alta', 'Media'] as AnalysisIssue['severity'][]).map(severity => {
                                                            const count = fileAnalysisSummary?.[severity] || 0;
                                                            if (count > 0) {
                                                                const info = categoryInfo['Seguridad']; // Using Security for color representation
                                                                let color = 'text-gray-400';
                                                                if (severity === 'Crítica' || severity === 'Alta') color = 'text-red-400';
                                                                else if (severity === 'Media') color = 'text-yellow-400';
                                                                return (
                                                                    <div key={severity} className="flex justify-between items-center text-xs">
                                                                        <span className={color}>{t(severity as TranslationKey)}:</span>
                                                                        <span className={`${color} font-semibold`}>{count}</span>
                                                                    </div>
                                                                );
                                                            }
                                                            return null;
                                                        })}
                                                    </div>
                                                </div>
                                                {localDetectedTechStack && (
                                                    <div className="bg-surface/50 p-3 rounded-lg border border-border/50">
                                                        <h5 className="font-semibold text-accent text-sm mb-2">{t('linkAnalysis.file.techStack' as TranslationKey)}</h5>
                                                        <div className="flex flex-wrap gap-2 justify-center">
                                                            {(Object.values(localDetectedTechStack) as (string | string[])[]).flat().filter(t => t !== 'None').map((tech, i) => <TechDisplay key={i} techName={tech as string} />)}
                                                        </div>
                                                    </div>
                                                )}
                                                <button onClick={handleOpenInCodeDoctor} className="w-full px-4 py-2 bg-info/20 text-info font-semibold rounded-lg hover:bg-info/30 transition-colors flex items-center justify-center gap-2">
                                                    <StethoscopeIcon className="w-5 h-5" /> {t('linkAnalysis.file.openInDoctor' as TranslationKey)}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Right Panel: History */}
                        <div className="flex flex-col bg-background rounded-lg p-4 border border-border/50 h-full">
                            <div className="flex justify-between items-center mb-3 border-b border-border/50 pb-2">
                                <h3 className="text-lg font-semibold text-accent flex items-center gap-2"><HistoryIcon className="w-6 h-6" /> {t('modal.history.title' as TranslationKey)}</h3>
                                <button
                                    onClick={clearHistory}
                                    disabled={history.length === 0}
                                    className="px-3 py-1 bg-error/10 text-error rounded-md text-sm hover:bg-error/20 disabled:opacity-50"
                                >
                                    {t('modal.history.clear' as TranslationKey)}
                                </button>
                            </div>
                            <div className="flex-grow overflow-y-auto pr-2">
                                {history.length === 0 ? (
                                    <p className="text-text-tertiary text-center py-8">{t('modal.history.empty' as TranslationKey)}</p>
                                ) : (
                                    <ul className="space-y-2">
                                        {history.map((item, index) => (
                                            <li key={item.timestamp} onClick={() => handleLoadHistoryItem(item)} className="p-3 rounded-md transition-colors duration-200 hover:bg-border/50 cursor-pointer border border-transparent hover:border-primary/50">
                                                <p className="font-semibold text-text-primary truncate">{item.analysisResult.metadata.title || item.url}</p>
                                                <p className="text-xs text-text-secondary truncate">{item.url}</p>
                                                <p className="text-xs text-text-tertiary mt-1">{new Date(item.timestamp).toLocaleString()}</p>
                                                <p className="text-sm text-text-tertiary mt-2 line-clamp-2">{item.analysisResult.summary}</p>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-background/50 rounded-b-lg text-right border-t border-border">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-border text-white font-semibold rounded-lg hover:bg-border/70 transition-colors duration-200"
                        >
                            {t('common.close' as TranslationKey)}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LinkAnalysisModal;