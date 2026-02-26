import React, { createContext, useState, useContext, ReactNode, useCallback, useMemo } from 'react';
import { AnalysisIssue, TechStack } from '../types';

type ProjectFile = { path: string; content: string };

interface ProjectContextType {
    projectFiles: ProjectFile[] | null;
    techStack: TechStack | null;
    projectName: string | null;
    analysisReport: AnalysisIssue[] | null;
    loadProject: (files: ProjectFile[], tech: TechStack, name: string, report?: AnalysisIssue[] | null) => void;
    clearProject: () => void;
    isProjectLoaded: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [projectFiles, setProjectFiles] = useState<ProjectFile[] | null>(null);
    const [techStack, setTechStack] = useState<TechStack | null>(null);
    const [projectName, setProjectName] = useState<string | null>(null);
    const [analysisReport, setAnalysisReport] = useState<AnalysisIssue[] | null>(null);

    const loadProject = useCallback((files: ProjectFile[], tech: TechStack, name: string, report: AnalysisIssue[] | null = null) => {
        setProjectFiles(files);
        setTechStack(tech);
        setProjectName(name);
        setAnalysisReport(report);
    }, []);

    const clearProject = useCallback(() => {
        setProjectFiles(null);
        setTechStack(null);
        setProjectName(null);
        setAnalysisReport(null);
    }, []);
    
    const isProjectLoaded = !!projectFiles;

    const value = useMemo(() => ({ projectFiles, techStack, projectName, analysisReport, loadProject, clearProject, isProjectLoaded }), 
        [projectFiles, techStack, projectName, analysisReport, loadProject, clearProject, isProjectLoaded]
    );

    return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
};

export const useProjectContext = () => {
    const context = useContext(ProjectContext);
    if (context === undefined) {
        throw new Error('useProjectContext must be used within a ProjectProvider');
    }
    return context;
};