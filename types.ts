
import React from 'react';

// FIX: Ensure 'react' is properly resolved for module augmentation.
declare module 'react' {
    interface InputHTMLAttributes<T> {
        webkitdirectory?: string;
        directory?: string;
    }
}

declare global {
    interface AIStudio {
        hasSelectedApiKey: () => Promise<boolean>;
        openSelectKey: () => Promise<void>;
    }
    interface Window {
        aistudio?: AIStudio;
    }
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp?: number;
  sources?: { title: string; uri: string }[];
  files?: { name: string; isImage: boolean; isVideo: boolean; }[];
  diagnostics?: CodeDiagnostic[];
  feedback?: 'good' | 'bad';
}

export type FileNode = { [key: string]: string | FileNode };

export type TechValue = 
    'React' | 'Vue' | 'Angular' | 'Svelte' | 
    'Node.js' | 'Python' | 'Go' | 'Java' |
    'PostgreSQL' | 'MongoDB' | 'MySQL' | 'Redis' |
    'React Native' | 'Flutter' | 'Swift' | 'Kotlin' |
    'Docker' | 'Kubernetes' | 'GitHub Actions' | 'Jenkins' |
    'None';

export type TechCategory = 'frontend' | 'backend' | 'database' | 'mobile' | 'devops';

export interface TechOption {
    name: TechValue;
    icon: React.FC<{ className?: string }>;
    description: string;
}

export interface TechStack {
    frontend: TechValue;
    backend: TechValue;
    database: TechValue;
    mobile: TechValue;
    devops: TechValue[];
}

export type AnalysisCategory = 'Seguridad' | 'Análisis de Dependencias' | 'Calidad' | 'Mejores Prácticas' | 'Optimización de Dependencias' | 'Infraestructura' | 'Licenciamiento' | 'Detección de Secretos';

export interface AnalysisIssue {
    filePath: string;
    line: number;
    severity: 'Crítica' | 'Alta' | 'Media' | 'Baja' | 'Informativa';
    title: string;
    description: string;
    suggestion: string;
    category: AnalysisCategory;
    isResolved?: boolean;
}

export interface UIMagicianResult {
    filePath: string;
    content: string;
    explanation: string;
}

export interface ImageEditResult {
    editedImage: {
        base64: string;
        mimeType: string;
    } | null;
    text: string | null;
}

export type WireframeElementType = 'container' | 'text' | 'button' | 'input' | 'image' | 'icon';
export type IconName = 'menu' | 'user' | 'search' | 'close' | 'arrow-left' | 'arrow-right' | 'image' | 'home' | 'settings' | 'copy' | 'send';

export interface WireframeElement {
    type: WireframeElementType;
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    backgroundColor?: string;
    borderColor?: string;
    borderRadius?: number;
    text?: string;
    fontSize?: number;
    fontWeight?: 'normal' | 'bold';
    textAlign?: 'left' | 'center' | 'right';
    iconName?: IconName;
    children?: WireframeElement[];
    hoverBackgroundColor?: string;
    hoverBorderColor?: string;
    activeBackgroundColor?: string;
    activeBorderColor?: string;
}

export interface WireframeData {
    canvas: {
        width: number;
        height: number;
        backgroundColor: string;
    };
    elements: WireframeElement[];
    explanation: string;
}

export interface WireframeCodeResult {
    filePath: string;
    content: string;
    explanation: string;
}

export type DeploymentPlatform = 'Google Cloud Run' | 'Vercel' | 'AWS Elastic Beanstalk' | 'AWS Lambda (Serverless)' | 'Docker Compose';

export interface DeploymentFile {
    path: string;
    content: string;
    explanation: string;
    nextSteps: string;
}

export interface TechStackInfo {
    frontend?: string[];
    backend?: string[];
    cms?: string[];
    analytics?: string[];
    server?: string;
    javascriptLibraries?: string[];
}

export interface SecurityInfo {
    usesHttps: boolean;
    httpsDetails?: string;
    securityHeaders: { name: string; present: boolean; details: string }[];
    vulnerabilitySummary: string;
}

export interface LinkAnalysisResult {
    url: string;
    summary: string;
    techStack: TechStackInfo;
    security: SecurityInfo;
    metadata: {
        title: string;
        description: string;
    };
    structureSummary: string;
    interactiveElements: {
        hasForms: boolean;
        formDetails: string;
    };
}

export interface HistoryItem {
    url: string;
    analysisResult: LinkAnalysisResult;
    timestamp: number;
}

export type NotificationEvent =
    | 'projectGenerated'
    | 'analysisComplete'
    | 'codeGenerated'
    | 'deploymentFilesGenerated'; 

export interface NotificationPreferences {
    enabled: boolean;
    soundEnabled: boolean;
    events: {
        [key in NotificationEvent]: boolean;
    };
}

export interface DNDSettings {
    enabled: boolean;
    startTime: string; 
    endTime: string;   
}

export interface AppSettings {
    notificationPreferences: NotificationPreferences;
    dndSettings: DNDSettings;
}

export interface CommunityUser {
    id: string;
    username: string;
    isCurrentUser?: boolean;
    lang?: 'es' | 'en'; 
    persona?: 'Desarrollador' | 'QA' | 'DevOps';
}

export interface ChatRoom {
    id: string;
    name: string;
    description: string;
}

export interface CommunityMessage {
    id: string;
    roomId: string;
    user: CommunityUser;
    text: string;
    timestamp: number;
    type: 'message' | 'system';
    lang: 'es' | 'en'; 
    translatedText?: string;
    isTranslating?: boolean;
    reactions?: { [emoji: string]: string[] }; 
}

export interface CodeTranslatorResult {
    translatedCode: string;
    explanation: string;
}

export interface VideoFrame {
    timestamp: number; 
    data: string;      
}

export type VideoAnalysisType = 'summary' | 'scene_description' | 'ocr' | 'object_search' | 'transcription' | 'scene_detection';

export type AspectRatio = '16:9' | '9:16';

export interface VideoAnalysisResult {
    id: string;
    type: VideoAnalysisType;
    prompt: string;
    timestamp?: number; 
    resultText: string;
}

// RESTORATION: Added 'guardian' back to Mode
export type Mode = 'chat' | 'architect' | 'doctor' | 'tutor' | 'magician' | 'deployer' | 'community' | 'wireframe' | 'translator' | 'donation' | 'videoAnalyst' | 'codeCopilot' | 'navigator' | 'liveChat' | 'guardian' | 'baza';

export type CodeLanguage = 'JavaScript' | 'TypeScript' | 'Python' | 'Go' | 'Java' | 'HTML' | 'CSS';

export interface CodeCompletionSuggestion {
    id: string;
    text: string;
    description?: string;
    relevance?: 'high' | 'normal';
}

export interface CodeDiagnostic {
    line: number;
    startChar: number;
    endChar: number;
    severity: 'Error' | 'Warning' | 'Information' | 'Hint';
    message: string;
    suggestion?: string;
}

export interface User {
    uid?: string; 
    username: string;
    email?: string; 
    lang: 'es' | 'en';
    persona: 'Desarrollador' | 'QA' | 'DevOps';
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  timestamp: number;
}

export type ModalType = 
  | 'settings'
  | 'auth'
  | 'chatHistory'
  | 'fixSuggestion'
  | 'tutor'
  | 'linkHistory'
  | 'killcontra'
  | 'support'
  | 'linkAnalysis'
  | 'baza'
  | 'agentModal'
  | 'designModal'; 

export type LinkAnalysisModalTab = 'url-analysis' | 'file-analysis';

export interface ProjectFile { 
    path: string;
    content: string;
}

export interface ModalPayload {
  settings: { speechHook: any };
  auth: {};
  chatHistory: {
    conversations: Conversation[];
    onLoadConversation: (id: string) => void;
    onDeleteConversation: (id: string) => void;
    onNewChat: () => void;
  };
  fixSuggestion: {
    fix: { issue: AnalysisIssue; originalContent: string; fixedContent: string };
    onApply: () => void;
  };
  tutor: {
    history: ChatMessage[];
    onSendMessage: (message: string) => void;
    isLoading: boolean;
    issue: AnalysisIssue | null;
  };
  linkHistory: {
      history: HistoryItem[];
      onLoad: (item: HistoryItem) => void;
      onClear: () => void;
  };
  killcontra: {
    title: string;
    message: React.ReactNode;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
  };
  support: {};
  linkAnalysis: {
      onAnalyzeFilesInDoctor: (files: ProjectFile[], techStack: TechStack, projectName: string) => void;
  }; 
  baza: {};
  agentModal: {};
  designModal: {};
}
