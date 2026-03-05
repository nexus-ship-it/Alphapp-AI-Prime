import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    StethoscopeIcon, CheckCircleIcon, LightbulbIcon, UploadIcon, 
    SpinnerIcon, ShieldCheckIcon, BugIcon, ZapIcon, BarChartIcon,
    MagicWandIcon, ActivityIcon, PackageIcon, RefreshIcon, SendIcon, XCircleIcon
} from './ui/icons';
import { useCodeDoctorContext } from '../contexts/CodeDoctorContext';
import { AnalysisIssueCard, getCategoryInfo } from './ui/AnalysisComponents';
import { useI18n } from '../contexts/I18nContext';
import Markdown from 'react-markdown';

const HealthDashboard: React.FC = () => {
    const { healthScore } = useCodeDoctorContext();
    if (!healthScore) return null;

    const stats = [
        { label: 'Seguridad', value: healthScore.security, icon: ShieldCheckIcon, color: 'text-red-400' },
        { label: 'Calidad', value: healthScore.quality, icon: CheckCircleIcon, color: 'text-emerald-400' },
        { label: 'Rendimiento', value: healthScore.performance, icon: ZapIcon, color: 'text-yellow-400' },
        { label: 'Mantenibilidad', value: healthScore.maintainability, icon: BarChartIcon, color: 'text-blue-400' },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="md:col-span-1 bg-surface/40 border border-border/50 rounded-2xl p-6 flex flex-col items-center justify-center backdrop-blur-md relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10 text-center">
                    <span className="text-xs font-black uppercase tracking-widest text-text-tertiary mb-2 block">Omni-Health Score</span>
                    <div className="text-6xl font-black text-primary mb-2 drop-shadow-[0_0_15px_rgba(var(--color-primary),0.3)]">
                        {healthScore.overall}%
                    </div>
                    <div className="w-full bg-border/30 h-1.5 rounded-full overflow-hidden mt-4">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${healthScore.overall}%` }}
                            className="h-full bg-primary"
                        />
                    </div>
                </div>
            </div>
            <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((stat, idx) => (
                    <div key={idx} className="bg-surface/30 border border-border/30 rounded-2xl p-4 flex flex-col items-center justify-center backdrop-blur-sm hover:border-primary/30 transition-all group">
                        <stat.icon className={`w-6 h-6 ${stat.color} mb-2 group-hover:scale-110 transition-transform`} />
                        <span className="text-[10px] font-bold uppercase tracking-tighter text-text-tertiary mb-1">{stat.label}</span>
                        <span className="text-xl font-black text-text-primary">{stat.value}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const AnalysisModes: React.FC = () => {
    const { runAnalysis, runBestPracticesAnalysis, runDependencyAnalysis, runRefactoringAnalysis, isLoading } = useCodeDoctorContext();
    
    const modes = [
        { id: 'full', label: 'Omni-Audit', icon: ActivityIcon, action: runAnalysis, color: 'from-primary to-accent' },
        { id: 'best', label: 'Prácticas', icon: LightbulbIcon, action: runBestPracticesAnalysis, color: 'from-blue-500 to-indigo-500' },
        { id: 'deps', label: 'Dependencias', icon: PackageIcon, action: runDependencyAnalysis, color: 'from-orange-500 to-red-500' },
        { id: 'refactor', label: 'Refactor', icon: MagicWandIcon, action: runRefactoringAnalysis, color: 'from-emerald-500 to-teal-500' },
    ];

    return (
        <div className="flex flex-wrap gap-3 mb-8">
            {modes.map((mode) => (
                <button
                    key={mode.id}
                    onClick={mode.action}
                    disabled={isLoading}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border border-white/5 bg-gradient-to-r ${mode.color} bg-opacity-10 hover:bg-opacity-20 transition-all disabled:opacity-50 group`}
                >
                    <mode.icon className="w-4 h-4 text-white group-hover:rotate-12 transition-transform" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">{mode.label}</span>
                </button>
            ))}
        </div>
    );
};

const CodeDoctorFlow: React.FC = () => {
    const { 
        doctorStep, uploadedFiles, analysisReport, isLoading, loadingText, 
        error, fixingIssueId, proposedFix, projectName,
        setUploadedFilesAndDetectStack, runAnalysis, generateAndShowFix, 
        applyProposedFix, closeFixPreview, startTutorSession, resetDoctor,
        isTutorModalOpen, isTutorLoading, tutorChatHistory, currentTutorIssue,
        sendTutorMessage, closeTutorSession
    } = useCodeDoctorContext();
    const { t } = useI18n();
    const [tutorInput, setTutorInput] = useState('');

    const categoryInfo = useMemo(() => getCategoryInfo(t), [t]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) setUploadedFilesAndDetectStack(e.target.files);
    };

    const handleTutorSend = () => {
        if (tutorInput.trim()) {
            sendTutorMessage(tutorInput);
            setTutorInput('');
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/30 shadow-[0_0_30px_rgba(var(--color-primary),0.2)]">
                        <StethoscopeIcon className="w-9 h-9 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-text-primary tracking-tighter uppercase italic">Doctor de Código</h1>
                        <p className="text-text-tertiary font-medium tracking-widest text-xs uppercase mt-1">Sovereign Diagnostic Protocol v4.0</p>
                    </div>
                </div>
                {doctorStep !== 'upload' && (
                    <button 
                        onClick={resetDoctor}
                        className="flex items-center gap-2 px-6 py-3 bg-surface border border-border rounded-xl text-text-secondary hover:text-primary hover:border-primary transition-all font-bold uppercase tracking-widest text-xs"
                    >
                        <RefreshIcon className="w-4 h-4" />
                        Nuevo Diagnóstico
                    </button>
                )}
            </header>

            <AnimatePresence mode="wait">
                {doctorStep === 'upload' && (
                    <motion.div 
                        key="upload"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="max-w-2xl mx-auto"
                    >
                        <div className="bg-surface/40 border-2 border-dashed border-border/50 rounded-3xl p-12 text-center backdrop-blur-xl hover:border-primary/50 transition-all group relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <UploadIcon className="w-20 h-20 text-text-tertiary mx-auto mb-6 group-hover:text-primary group-hover:scale-110 transition-all duration-500" />
                            <h2 className="text-2xl font-black text-text-primary mb-3 uppercase italic">Ingresar Proyecto para Triaje</h2>
                            <p className="text-text-secondary mb-8 max-w-md mx-auto font-medium">Sube tu carpeta de proyecto para un análisis clínico profundo de seguridad, calidad y arquitectura.</p>
                            
                            <label className="inline-flex items-center gap-3 px-10 py-5 bg-primary text-white font-black rounded-2xl hover:brightness-110 transition-all cursor-pointer shadow-xl shadow-primary/20 active:scale-95 uppercase tracking-widest">
                                <UploadIcon className="w-6 h-6" />
                                Seleccionar Carpeta
                                <input 
                                    type="file" 
                                    className="hidden" 
                                    webkitdirectory="" 
                                    directory="" 
                                    multiple 
                                    onChange={handleFileUpload} 
                                />
                            </label>
                            
                            <div className="mt-10 flex items-center justify-center gap-8 text-[10px] font-bold text-text-tertiary uppercase tracking-[0.2em]">
                                <span className="flex items-center gap-2"><ShieldCheckIcon className="w-4 h-4 text-emerald-500" /> Seguridad Omni</span>
                                <span className="flex items-center gap-2"><BugIcon className="w-4 h-4 text-orange-500" /> Auditoría de Bugs</span>
                                <span className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-blue-500" /> QA Protocol</span>
                            </div>
                        </div>
                    </motion.div>
                )}

                {doctorStep === 'report' && (
                    <motion.div 
                        key="report"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-8"
                    >
                        <HealthDashboard />
                        
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h2 className="text-2xl font-black text-text-primary uppercase italic flex items-center gap-3">
                                    Hallazgos Clínicos
                                    <span className="bg-primary/20 text-primary text-xs px-3 py-1 rounded-full not-italic font-black">
                                        {analysisReport?.length || 0}
                                    </span>
                                </h2>
                                <p className="text-text-tertiary text-xs font-bold uppercase tracking-widest mt-1">Proyecto: {projectName}</p>
                            </div>
                            <AnalysisModes />
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            {analysisReport?.map((issue, idx) => (
                                <AnalysisIssueCard 
                                    key={idx}
                                    issue={issue}
                                    onCardClick={() => {}}
                                    onGenerateFix={generateAndShowFix}
                                    onExplain={startTutorSession}
                                    isFixing={fixingIssueId === `${issue.filePath}-${issue.line}-${issue.title}`}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Fix Preview Modal */}
            <AnimatePresence>
                {proposedFix && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-surface border border-border rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl shadow-primary/20"
                        >
                            <div className="p-6 border-b border-border flex justify-between items-center bg-surface/50">
                                <div>
                                    <h3 className="text-xl font-black text-text-primary uppercase italic">Antídoto Sintetizado</h3>
                                    <p className="text-xs text-text-tertiary font-bold uppercase tracking-widest">{proposedFix.issue.title}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button onClick={() => applyProposedFix()} className="px-6 py-3 bg-primary text-white font-black rounded-xl hover:brightness-110 transition-all uppercase tracking-widest text-xs">
                                        Aplicar Tratamiento
                                    </button>
                                    <button onClick={() => closeFixPreview()} className="p-3 bg-surface border border-border rounded-xl text-text-tertiary hover:text-error hover:border-error transition-all">
                                        <XCircleIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex-grow overflow-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-3 flex items-center gap-2">
                                        <XCircleIcon className="w-3 h-3" /> Estado Actual
                                    </h4>
                                    <pre className="bg-black/40 p-4 rounded-xl text-xs font-mono text-red-200/70 overflow-auto border border-red-900/20 h-[400px]">
                                        {proposedFix.originalContent}
                                    </pre>
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-3 flex items-center gap-2">
                                        <CheckCircleIcon className="w-3 h-3" /> Estado Corregido
                                    </h4>
                                    <pre className="bg-black/40 p-4 rounded-xl text-xs font-mono text-emerald-200/70 overflow-auto border border-emerald-900/20 h-[400px]">
                                        {proposedFix.fixedContent}
                                    </pre>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Tutor Modal */}
            <AnimatePresence>
                {isTutorModalOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-surface border border-border rounded-3xl w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl"
                        >
                            <div className="p-6 border-b border-border flex justify-between items-center bg-surface/50">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-info/20 rounded-xl flex items-center justify-center border border-info/30">
                                        <LightbulbIcon className="w-6 h-6 text-info" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-text-primary uppercase italic">Mentor de Código</h3>
                                        <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-widest">Explicación Interactiva</p>
                                    </div>
                                </div>
                                <button onClick={closeTutorSession} className="p-2 hover:bg-surface-lighter rounded-full transition-colors">
                                    <XCircleIcon className="w-6 h-6 text-text-tertiary" />
                                </button>
                            </div>
                            
                            <div className="flex-grow overflow-y-auto p-6 space-y-6">
                                {tutorChatHistory.map((msg) => (
                                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] p-4 rounded-2xl ${
                                            msg.sender === 'user' 
                                            ? 'bg-primary/10 border border-primary/20 text-text-primary rounded-tr-none' 
                                            : 'bg-surface-lighter border border-border/50 text-text-secondary rounded-tl-none'
                                        }`}>
                                            <div className="markdown-body prose prose-invert prose-sm max-w-none">
                                                <Markdown>{msg.text}</Markdown>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {isTutorLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-surface-lighter border border-border/50 p-4 rounded-2xl rounded-tl-none flex items-center gap-3">
                                            <SpinnerIcon className="w-4 h-4 animate-spin text-primary" />
                                            <span className="text-xs font-bold text-text-tertiary uppercase tracking-widest animate-pulse">Analizando...</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 bg-surface/50 border-t border-border">
                                <div className="relative">
                                    <input 
                                        type="text"
                                        value={tutorInput}
                                        onChange={(e) => setTutorInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleTutorSend()}
                                        placeholder="Haz una pregunta sobre este problema..."
                                        className="w-full bg-black/20 border border-border/50 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-primary/50 transition-all pr-16"
                                    />
                                    <button 
                                        onClick={handleTutorSend}
                                        className="absolute right-2 top-2 bottom-2 px-4 bg-primary text-white rounded-xl hover:brightness-110 transition-all"
                                    >
                                        <SendIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Loading Overlay */}
            <AnimatePresence>
                {isLoading && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center bg-background/80 backdrop-blur-md"
                    >
                        <div className="text-center">
                            <div className="relative w-24 h-24 mx-auto mb-8">
                                <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                                <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                                <StethoscopeIcon className="absolute inset-0 m-auto w-10 h-10 text-primary animate-pulse" />
                            </div>
                            <h3 className="text-2xl font-black text-text-primary uppercase italic tracking-widest mb-2">{loadingText}</h3>
                            <p className="text-text-tertiary text-xs font-bold uppercase tracking-[0.3em] animate-pulse">Sovereign AI Engine Active</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CodeDoctorFlow;
