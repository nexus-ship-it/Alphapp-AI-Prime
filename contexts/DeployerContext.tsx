import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { TechStack, DeploymentPlatform, DeploymentFile, AnalysisIssue } from '../types';
import * as geminiService from '../services/geminiService';
import { useToastContext } from './ToastContext';
import { useProjectContext } from './ProjectContext';
import { readFilesFromUpload } from '../services/fileUtils';

type DeployerStep = 'upload' | 'configure' | 'result';
export type EnvVar = { id: number; key: string; value: string };

interface DeployerContextType {
    step: DeployerStep;
    projectFiles: { path: string; content: string }[];
    techStack: TechStack | null;
    projectName: string | null;
    selectedPlatforms: DeploymentPlatform[];
    deploymentFiles: DeploymentFile[] | null;
    analysisReport: AnalysisIssue[] | null;
    isLoading: boolean;
    loadingText: string;
    error: string | null;

    // Config options state
    nodeVersion: string;
    pythonVersion: string;
    port: string;
    envVars: EnvVar[];

    // Functions
    setProjectFromUpload: (files: FileList) => Promise<void>;
    setSelectedPlatforms: React.Dispatch<React.SetStateAction<DeploymentPlatform[]>>;
    generateFiles: () => Promise<void>;
    resetDeployer: () => void;
    
    // Config options setters
    setNodeVersion: React.Dispatch<React.SetStateAction<string>>;
    setPythonVersion: React.Dispatch<React.SetStateAction<string>>;
    setPort: React.Dispatch<React.SetStateAction<string>>;
    setEnvVars: React.Dispatch<React.SetStateAction<EnvVar[]>>;
}

const DeployerContext = createContext<DeployerContextType | undefined>(undefined);

export const DeployerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [step, setStep] = useState<DeployerStep>('upload');
    const [projectFiles, setProjectFiles] = useState<{ path: string; content: string }[]>([]);
    const [techStack, setTechStack] = useState<TechStack | null>(null);
    const [projectName, setProjectName] = useState<string | null>(null);
    const [analysisReport, setAnalysisReport] = useState<AnalysisIssue[] | null>(null);

    const [selectedPlatforms, setSelectedPlatforms] = useState<DeploymentPlatform[]>([]);
    const [deploymentFiles, setDeploymentFiles] = useState<DeploymentFile[] | null>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [loadingText, setLoadingText] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Config options
    const [nodeVersion, setNodeVersion] = useState('20');
    const [pythonVersion, setPythonVersion] = useState('3.11');
    const [port, setPort] = useState('8080');
    const [envVars, setEnvVars] = useState<EnvVar[]>([]);

    const { addToast } = useToastContext();
    const { 
        projectFiles: contextFiles, 
        techStack: contextTechStack, 
        projectName: contextProjectName,
        analysisReport: contextAnalysisReport,
        isProjectLoaded,
        clearProject
    } = useProjectContext();
    
    useEffect(() => {
        if (isProjectLoaded && contextFiles && contextTechStack && step === 'upload') {
            setProjectFiles(contextFiles);
            setTechStack(contextTechStack);
            setProjectName(contextProjectName);
            setAnalysisReport(contextAnalysisReport); // Load analysis report if available
            setStep('configure');
            addToast({ type: 'success', title: 'Proyecto Cargado', message: 'Listo para configurar el despliegue.' });
        }
    }, [isProjectLoaded, contextFiles, contextTechStack, contextProjectName, contextAnalysisReport, step, addToast]);

    const setProjectFromUpload = async (fileList: FileList) => {
        setIsLoading(true);
        setLoadingText('Analizando proyecto...');
        setError(null);

        try {
            const files = await readFilesFromUpload(fileList);
            if (files.length === 0) {
                throw new Error("No se encontraron archivos válidos en la carpeta.");
            }
            
            setProjectFiles(files);
            
            const folderName = (fileList[0] as any).webkitRelativePath?.split('/')[0] || 'deployer-project';
            setProjectName(folderName);
            
            const detectedStack = await geminiService.detectProjectTechStack(files);
            setTechStack(detectedStack);
            
            setStep('configure');
            addToast({ type: 'success', title: 'Proyecto Cargado', message: `${files.length} archivos cargados y stack tecnológico detectado.` });

        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Ocurrió un error al procesar el proyecto.';
            setError(errorMessage);
            addToast({ type: 'error', title: 'Error', message: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };

    const generateFiles = async () => {
        if (projectFiles.length === 0 || !techStack || selectedPlatforms.length === 0) {
            addToast({type: 'warning', title: 'Falta Información', message: 'Asegúrate de haber cargado un proyecto y seleccionado al menos una plataforma.'});
            return;
        }
        setIsLoading(true);
        setLoadingText('Generando archivos de despliegue...');
        setError(null);

        try {
            const config = {
                nodeVersion,
                pythonVersion,
                port,
                envVars: envVars.filter(v => v.key.trim() && v.value.trim())
            };
            const files = await geminiService.generateDeploymentFiles(projectFiles, techStack, selectedPlatforms, analysisReport, config);
            setDeploymentFiles(files);
            setStep('result');

        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'No se pudieron generar los archivos de despliegue.';
            setError(errorMessage);
            addToast({type: 'error', title: 'Error de IA', message: errorMessage});
        } finally {
            setIsLoading(false);
        }
    };

    const resetDeployer = useCallback(() => {
        setStep('upload');
        setProjectFiles([]);
        setTechStack(null);
        setProjectName(null);
        setSelectedPlatforms([]);
        setDeploymentFiles(null);
        setIsLoading(false);
        setLoadingText('');
        setError(null);
        clearProject();
        setAnalysisReport(null);
        // Reset config options
        setNodeVersion('20');
        setPythonVersion('3.11');
        setPort('8080');
        setEnvVars([]);
    }, [clearProject]);

    const value = {
        step,
        projectFiles,
        techStack,
        projectName,
        selectedPlatforms,
        deploymentFiles,
        analysisReport,
        isLoading,
        loadingText,
        error,
        nodeVersion,
        pythonVersion,
        port,
        envVars,
        setProjectFromUpload,
        setSelectedPlatforms,
        generateFiles,
        resetDeployer,
        setNodeVersion,
        setPythonVersion,
        setPort,
        setEnvVars,
    };

    return <DeployerContext.Provider value={value}>{children}</DeployerContext.Provider>;
};

export const useDeployerContext = () => {
    const context = useContext(DeployerContext);
    if (context === undefined) {
        throw new Error('useDeployerContext must be used within a DeployerProvider');
    }
    return context;
};