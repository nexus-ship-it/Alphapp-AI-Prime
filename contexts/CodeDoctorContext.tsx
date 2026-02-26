import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect, useRef } from 'react';
import { AnalysisIssue, FileNode, TechStack, TechValue, TechCategory, ChatMessage, LinkAnalysisResult } from '../types';
import * as geminiService from '../services/geminiService';
import { useToastContext } from './ToastContext';
import { useProjectContext } from './ProjectContext'; 
import { useSettingsContext } from './SettingsContext';
import { readFilesFromUpload, buildFileTree, flattenFileTree } from '../services/fileUtils';
import { Chat } from '@google/genai';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

type DoctorStep = 'upload' | 'analyzing' | 'report';
type ProposedFix = { issue: AnalysisIssue; originalContent: string; fixedContent: string };

interface CodeDoctorContextType {
    doctorStep: DoctorStep;
    uploadedFiles: { path: string; content: string }[];
    fileTree: FileNode | null;
    techStack: TechStack;
    analysisReport: AnalysisIssue[] | null;
    isLoading: boolean;
    loadingText: string;
    isDetectingStack: boolean;
    stackWasAutoDetected: boolean;
    error: string | null;
    fixingIssueId: string | null;
    proposedFix: ProposedFix | null;
    projectName: string | null;
    autoAnalyze: boolean;
    analysisContext: LinkAnalysisResult | null;
    contextualSummary: string | null;
    isTutorModalOpen: boolean;
    isTutorLoading: boolean;
    tutorChatHistory: ChatMessage[];
    currentTutorIssue: AnalysisIssue | null;
    setUploadedFilesAndDetectStack: (files: FileList) => Promise<void>;
    handleTechSelect: (category: Exclude<TechCategory, 'mobile' | 'devops'>, value: TechValue) => void;
    runAnalysis: () => Promise<void>;
    runBestPracticesAnalysis: () => Promise<void>;
    runDependencyAnalysis: () => Promise<void>;
    generateAndShowFix: (issue: AnalysisIssue) => Promise<ProposedFix | undefined>;
    applyProposedFix: () => void;
    startTutorSession: (issue: AnalysisIssue) => Promise<void>;
    sendTutorMessage: (message: string) => Promise<void>;
    closeTutorSession: () => void;
    resetDoctor: () => void;
    loadAnalysisContext: (context: LinkAnalysisResult) => void;
    sendToDeployer: () => void;
    setAutoAnalyze: React.Dispatch<React.SetStateAction<boolean>>;
}

const CodeDoctorContext = createContext<CodeDoctorContextType | undefined>(undefined);

export const CodeDoctorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [doctorStep, setDoctorStep] = useState<DoctorStep>('upload');
    const [uploadedFiles, setUploadedFiles] = useState<{ path: string; content: string }[]>([]);
    const [fileTree, setFileTree] = useState<FileNode | null>(null);
    const [techStack, setTechStackState] = useState<TechStack>({
        frontend: 'None', backend: 'None', database: 'None', mobile: 'None', devops: []
    });
    const [analysisReport, setAnalysisReport] = useState<AnalysisIssue[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingText, setLoadingText] = useState('');
    const [isDetectingStack, setIsDetectingStack] = useState(false);
    const [stackWasAutoDetected, setStackWasAutoDetected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fixingIssueId, setFixingIssueId] = useState<string | null>(null);
    const [proposedFix, setProposedFix] = useState<ProposedFix | null>(null);
    const [projectName, setProjectName] = useState<string | null>(null);
    const [autoAnalyze, setAutoAnalyze] = useState(false);
    const [analysisContext, setAnalysisContext] = useState<LinkAnalysisResult | null>(null);
    const [contextualSummary, setContextualSummary] = useState<string | null>(null);
    const [isTutorModalOpen, setIsTutorModalOpen] = useState(false);
    const [isTutorLoading, setIsTutorLoading] = useState(false);
    const [tutorChatHistory, setTutorChatHistory] = useState<ChatMessage[]>([]);
    const [currentTutorIssue, setCurrentTutorIssue] = useState<AnalysisIssue | null>(null);
    const tutorChatSessionRef = useRef<Chat | null>(null);

    const { addToast } = useToastContext();
    const { loadProject, projectFiles: contextProjectFiles, techStack: contextTechStack, projectName: contextProjectName, analysisReport: contextAnalysisReport, clearProject } = useProjectContext();
    const { notify } = useSettingsContext();

    const runAnalysisInternal = useCallback(async (files: {path: string, content: string}[], tech: TechStack, analysisType: 'full' | 'best_practices' | 'dependencies' = 'full'): Promise<void> => {
        setIsLoading(true);
        setError(null);
        setAnalysisReport(null);
        let report: AnalysisIssue[] = [];

        try {
            if (analysisType === 'full') {
                setLoadingText('Realizando análisis profundo con IA...');
                const analysisResult = await geminiService.generateFullCodeAnalysis(files, tech);
                report = [
                    ...analysisResult.security.map((i: any): AnalysisIssue => ({ ...i, category: 'Seguridad' })),
                    ...analysisResult.dependencies.map((i: any): AnalysisIssue => ({ ...i, category: 'Análisis de Dependencias' })),
                    ...analysisResult.quality.map((i: any): AnalysisIssue => ({ ...i, category: 'Calidad' })),
                    ...analysisResult.best_practices.map((i: any): AnalysisIssue => ({ ...i, category: 'Mejores Prácticas' })),
                    ...analysisResult.dependency_optimization.map((i: any): AnalysisIssue => ({ ...i, category: 'Optimización de Dependencias' })),
                    ...analysisResult.infraestructura.map((i: any): AnalysisIssue => ({ ...i, category: 'Infraestructura' })),
                    ...analysisResult.licenciamiento.map((i: any): AnalysisIssue => ({ ...i, category: 'Licenciamiento' })),
                    ...analysisResult.deteccion_de_secretos.map((i: any): AnalysisIssue => ({ ...i, category: 'Detección de Secretos' })),
                ];
                notify('analysisComplete', { title: 'Chequeo Médico Completo', body: `Se detectaron ${report.length} hallazgos.`});
            } else if (analysisType === 'best_practices') {
                setLoadingText('Analizando mejores prácticas...');
                const bestPracticeIssues = await geminiService.generateBestPracticesAnalysis(files, tech);
                report = bestPracticeIssues.map((i): AnalysisIssue => ({ ...i, category: 'Mejores Prácticas' }));
            } else if (analysisType === 'dependencies') {
                setLoadingText('Auditando dependencias...');
                const result = await geminiService.generateDependencyAnalysis(files, tech);
                report = [
                    ...result.dependencies.map((i): AnalysisIssue => ({ ...i, category: 'Análisis de Dependencias' })),
                    ...result.dependency_optimization.map((i): AnalysisIssue => ({ ...i, category: 'Optimización de Dependencias' }))
                ];
            }

            setAnalysisReport(report);
            setDoctorStep('report');
            addToast({ type: 'success', title: 'Análisis Exitoso', message: `Reporte generado con ${report.length} incidencias.` });

            if (analysisContext && !contextualSummary) {
                 const summary = await geminiService.generateContextualAnalysisSummary(report, analysisContext);
                 setContextualSummary(summary);
            }
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Error en el motor de diagnóstico.';
            setError(errorMessage);
            addToast({ type: 'error', title: 'Error Clínico', message: errorMessage });
            setDoctorStep('upload');
        } finally {
            setIsLoading(false);
            setLoadingText('');
        }
    }, [addToast, analysisContext, contextualSummary, notify]);

    const runAnalysis = useCallback(async (): Promise<void> => {
        if (!uploadedFiles.length || !techStack) return;
        await runAnalysisInternal(uploadedFiles, techStack, 'full');
    }, [uploadedFiles, techStack, runAnalysisInternal]);

    const runBestPracticesAnalysis = useCallback(async (): Promise<void> => {
        if (!uploadedFiles.length || !techStack) return;
        await runAnalysisInternal(uploadedFiles, techStack, 'best_practices');
    }, [uploadedFiles, techStack, runAnalysisInternal]);

    const runDependencyAnalysis = useCallback(async (): Promise<void> => {
        if (!uploadedFiles.length || !techStack) return;
        await runAnalysisInternal(uploadedFiles, techStack, 'dependencies');
    }, [uploadedFiles, techStack, runAnalysisInternal]);

    useEffect(() => {
        if (contextProjectFiles && contextTechStack && doctorStep === 'upload') {
            setUploadedFiles(contextProjectFiles);
            setFileTree(buildFileTree(contextProjectFiles));
            setTechStackState(contextTechStack);
            setProjectName(contextProjectName);
            if (contextAnalysisReport) {
                setAnalysisReport(contextAnalysisReport);
                setDoctorStep('report');
            }
            setStackWasAutoDetected(true);
            addToast({ type: 'info', title: 'Paciente Trasladado', message: 'Proyecto del Arquitecto recibido para diagnóstico.' });
            clearProject();
        }
    }, [contextProjectFiles, contextTechStack, contextProjectName, contextAnalysisReport, doctorStep, addToast, clearProject]);

    const loadAnalysisContext = useCallback(async (context: LinkAnalysisResult) => {
        setAnalysisContext(context);
        addToast({ type: 'info', title: 'Ficha Técnica Cargada', message: `Analizando contexto para ${new URL(context.url).hostname}.`});
        setDoctorStep('upload');
        setAnalysisReport(null);
        setContextualSummary(null);
    }, [addToast]);

    const setUploadedFilesAndDetectStack = useCallback(async (fileList: FileList) => {
        setIsLoading(true);
        setLoadingText('Preparando quirófano...');
        setError(null);
        setAnalysisReport(null);
        setContextualSummary(null);

        try {
            const files = await readFilesFromUpload(fileList);
            if (files.length === 0) throw new Error("La carpeta parece estar vacía o no contiene archivos legibles.");
            
            setUploadedFiles(files);
            setFileTree(buildFileTree(files));
            setProjectName((fileList[0] as any).webkitRelativePath?.split('/')[0] || 'analized-project');
            
            setIsDetectingStack(true);
            setLoadingText('Detectando ADN tecnológico...');
            const detectedStack = await geminiService.detectProjectTechStack(files);
            setTechStackState(detectedStack);
            setStackWasAutoDetected(true);
            
            addToast({ type: 'success', title: 'Historia Clínica Creada', message: `${files.length} archivos escaneados.` });

            if (autoAnalyze) {
                await runAnalysisInternal(files, detectedStack, 'full');
            } else {
                setDoctorStep('upload');
            }
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Error al procesar el proyecto.';
            setError(errorMessage);
            addToast({ type: 'error', title: 'Error', message: errorMessage });
        } finally {
            setIsLoading(false);
            setIsDetectingStack(false);
        }
    }, [addToast, autoAnalyze, runAnalysisInternal]);

    const handleTechSelect = useCallback((category: Exclude<TechCategory, 'mobile' | 'devops'>, value: TechValue) => {
        setTechStackState(prev => {
            const newStack = { ...prev, [category]: value };
            if (category === 'frontend' && value !== 'None') newStack.backend = 'None';
            else if (category === 'backend' && value !== 'None') newStack.frontend = 'None';
            return newStack;
        });
    }, []);
    
    const generateAndShowFix = useCallback(async (issue: AnalysisIssue): Promise<ProposedFix | undefined> => {
        if (!uploadedFiles.length) return undefined;
        const issueId = `${issue.filePath}-${issue.line}-${issue.title}`;
        setFixingIssueId(issueId);
        setError(null);
        try {
            const fileToFix = uploadedFiles.find(f => f.path === issue.filePath);
            if (!fileToFix) throw new Error(`Archivo extraviado: ${issue.filePath}`);
            
            setIsLoading(true);
            setLoadingText(`Sintetizando antídoto para ${issue.title}...`);
            const fixedContent = await geminiService.generateCodeFix(fileToFix.path, fileToFix.content, issue);
            const fix = { issue, originalContent: fileToFix.content, fixedContent };
            setProposedFix(fix);
            return fix;
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Fallo en la síntesis de la solución.';
            setError(errorMessage);
            addToast({ type: 'error', title: 'Error de IA', message: errorMessage });
            return undefined;
        } finally {
            setFixingIssueId(null);
            setIsLoading(false);
            setLoadingText('');
        }
    }, [uploadedFiles, addToast]);

    const applyProposedFix = useCallback(() => {
        if (!fileTree || !proposedFix) return;
        const { issue, fixedContent } = proposedFix;

        const updatedFiles = uploadedFiles.map(file => 
            file.path === issue.filePath ? { ...file, content: fixedContent } : file
        );
        setUploadedFiles(updatedFiles);
        setFileTree(buildFileTree(updatedFiles));

        setAnalysisReport(prev => prev?.map(r => 
            (r.filePath === issue.filePath && r.line === issue.line && r.title === issue.title) 
            ? { ...r, isResolved: true } 
            : r
        ) ?? null);
        
        addToast({ type: 'success', title: 'Tratamiento Aplicado', message: `${issue.filePath} ha sido actualizado.` });
        setProposedFix(null);
    }, [fileTree, proposedFix, uploadedFiles, addToast]);

    const startTutorSession = useCallback(async (issue: AnalysisIssue) => {
        setIsTutorLoading(true);
        setCurrentTutorIssue(issue);
        setIsTutorModalOpen(true);
        const session = geminiService.startCodeDoctorTutorChat();
        tutorChatSessionRef.current = session;

        setTutorChatHistory([{ id: generateId(), sender: 'user', text: `Explícame el problema: ${issue.title}` }]);
        try {
            const prompt = `Mentor, explícame este problema paso a paso:\n${issue.description}\nSugerencia: ${issue.suggestion}`;
            const stream = await geminiService.sendMessageToAI(session, prompt);
            let fullResponse = '';
            setTutorChatHistory(prev => [...prev, { id: generateId(), sender: 'ai', text: '' }]);
            for await (const chunk of stream) {
                if (chunk.text) {
                    fullResponse += chunk.text;
                    setTutorChatHistory(prev => {
                        const newHistory = [...prev];
                        newHistory[newHistory.length - 1].text = fullResponse;
                        return newHistory;
                    });
                }
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Tutor desconectado.');
        } finally {
            setIsTutorLoading(false);
        }
    }, []);

    const sendTutorMessage = useCallback(async (message: string) => {
        if (!tutorChatSessionRef.current || !message.trim()) return;
        setTutorChatHistory(prev => [...prev, { id: generateId(), sender: 'user', text: message }, { id: generateId(), sender: 'ai', text: '' }]);
        setIsTutorLoading(true);
        try {
            const stream = await geminiService.sendMessageToAI(tutorChatSessionRef.current, message);
            let fullResponse = '';
            for await (const chunk of stream) {
                if (chunk.text) {
                    fullResponse += chunk.text;
                    setTutorChatHistory(prev => {
                        const newHistory = [...prev];
                        newHistory[newHistory.length - 1].text = fullResponse;
                        return newHistory;
                    });
                }
            }
        } finally {
            setIsTutorLoading(false);
        }
    }, []);

    const resetDoctor = useCallback(() => {
        setDoctorStep('upload');
        setUploadedFiles([]);
        setFileTree(null);
        setTechStackState({ frontend: 'None', backend: 'None', database: 'None', mobile: 'None', devops: [] });
        setAnalysisReport(null);
        setProposedFix(null);
        setContextualSummary(null);
    }, []);

    const sendToDeployer = useCallback(() => {
        if (!uploadedFiles.length || !techStack || !projectName) return;
        loadProject(uploadedFiles, techStack, projectName, analysisReport);
    }, [uploadedFiles, techStack, projectName, analysisReport, loadProject]);

    const value = {
        doctorStep, uploadedFiles, fileTree, techStack, analysisReport, isLoading, loadingText, isDetectingStack, stackWasAutoDetected,
        error, fixingIssueId, proposedFix, projectName, autoAnalyze, analysisContext, contextualSummary, isTutorModalOpen, isTutorLoading,
        tutorChatHistory, currentTutorIssue, setUploadedFilesAndDetectStack, handleTechSelect, runAnalysis, runBestPracticesAnalysis,
        runDependencyAnalysis, generateAndShowFix, applyProposedFix, startTutorSession, sendTutorMessage, closeTutorSession: () => setIsTutorModalOpen(false),
        resetDoctor, loadAnalysisContext, sendToDeployer, setAutoAnalyze,
    };

    return <CodeDoctorContext.Provider value={value}>{children}</CodeDoctorContext.Provider>;
};

export const useCodeDoctorContext = () => {
    const context = useContext(CodeDoctorContext);
    if (!context) throw new Error('useCodeDoctorContext must be used within CodeDoctorProvider');
    return context;
};
