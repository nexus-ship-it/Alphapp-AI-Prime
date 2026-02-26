
import React, { useState, useEffect, useRef, lazy, Suspense, useCallback } from 'react';
import { ChatMessage, FileNode, TechStack, Mode, User, Conversation, LinkAnalysisResult, UIMagicianResult, WireframeCodeResult, ProjectFile } from './types';
import { ChatInterface } from './components/ChatInterface';
import { ToastProvider, useToastContext } from './contexts/ToastContext';
import { useSpeech } from './hooks/useSpeech';
import { ArchitectProvider, useArchitectContext } from './contexts/ArchitectContext';
import { TestTutorProvider } from './contexts/TestTutorContext';
import WelcomeScreen from './components/WelcomeScreen';
import Step1Blueprint from './components/Step1_Blueprint';
import { Step3Preview } from './components/Step3_Preview';
import { Step4Delivery } from './components/Step4_Delivery';
import { Loader } from './components/ui/Loader';
import { CheckCircleIcon, StethoscopeIcon, DeployIcon, MagicWandIcon, TestTubeIcon, LayoutTemplateIcon, SettingsIcon, UsersIcon, SwapIcon, ChevronLeftIcon, HistoryIcon, HeartIcon, UserIcon, VideoAnalystIcon, CodeIcon, BrowserIcon, MicrophoneIcon, ShieldCheckIcon, MessageSquareIcon, PackageIcon, NetworkIcon, PaletteIcon } from './components/ui/icons';
import { DeployerProvider } from './contexts/DeployerContext';
import { useChat } from './hooks/useChat';
import { SettingsProvider } from './contexts/SettingsContext';
import { CommunityHubProvider } from './contexts/CommunityHubContext';
import { WireframeProvider } from './contexts/WireframeContext';
import { ThemeProvider, useTheme, Theme } from './contexts/ThemeContext';
import { CodeTranslatorProvider } from './contexts/CodeTranslatorContext';
import { AuthProvider, useAuthContext } from './contexts/AuthContext';
import { VideoAnalystProvider } from './contexts/VideoAnalystContext';
import { CodeCopilotProvider } from './contexts/CodeCopilotContext';
import { ModalProvider, useModalContext } from './contexts/ModalContext';
import { ModalManager } from './components/ModalManager';
import { useKonamiCode } from './hooks/useKonamiCode';
import { WebNavigatorProvider } from './contexts/WebNavigatorContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { I18nProvider, useI18n } from './contexts/I18nContext';
import { TranslationKey } from './i18n/translations';
import { IntegrityVerifierProvider } from './contexts/IntegrityVerifierContext';
import { LiveChatProvider } from './contexts/LiveChatContext';
import { HuboShell } from './components/HuboShell';
import { ProjectProvider } from './contexts/ProjectContext';
import { CodeDoctorProvider } from './contexts/CodeDoctorContext';

const TestTutorFlow = lazy(() => import('./components/TestTutorFlow'));
const CodeDoctorFlow = lazy(() => import('./components/CodeDoctorFlow'));
const UIMagicianFlow = lazy(() => import('./components/UIMagicianFlow'));
const DeployerFlow = lazy(() => import('./components/DeployerFlow'));
const CommunityHubFlow = lazy(() => import('./components/CommunityHubFlow'));
const WireframeFlow = lazy(() => import('./components/WireframeFlow'));
const CodeTranslatorFlow = lazy(() => import('./components/CodeTranslatorFlow'));
const DonationFlow = lazy(() => import('./components/DonationFlow'));
const VideoAnalystFlow = lazy(() => import('./components/VideoAnalystFlow'));
const CodeCopilotFlow = lazy(() => import('./components/CodeCopilotFlow'));
const WebNavigatorFlow = lazy(() => import('./components/WebNavigatorFlow'));
const LiveChatFlow = lazy(() => import('./components/LiveChatFlow'));
const GuardianFlow = lazy(() => import('./components/GuardianFlow'));

const Stepper: React.FC<{ currentStep: number; steps: string[] }> = React.memo(({ currentStep, steps }) => (
    <nav aria-label="Progress">
        <ol role="list" className="flex items-center">
            {steps.map((step, stepIdx) => (
                <li key={step} className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
                    {stepIdx < currentStep ? (
                        <>
                            <div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="h-0.5 w-full bg-gradient-to-r from-primary to-accent" /></div>
                            <div className="relative w-10 h-10 flex items-center justify-center bg-gradient-to-br from-primary to-accent rounded-full shadow-glow-primary"><CheckCircleIcon className="w-6 h-6 text-white" /></div>
                        </>
                    ) : stepIdx === currentStep ? (
                        <>
                            <div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="h-0.5 w-full bg-border" /></div>
                            <div className="relative w-10 h-10 flex items-center justify-center bg-surface border-2 border-primary rounded-full shadow-glow-primary" aria-current="step"><span className="h-3 w-3 bg-primary rounded-full animate-pulse-fast" /></div>
                        </>
                    ) : (
                        <div className="relative w-10 h-10 flex items-center justify-center bg-surface border-2 border-border rounded-full" />
                    )}
                </li>
            ))}
        </ol>
    </nav>
));

const ArchitectFlow: React.FC<{onSendToDoctor: () => void; onSendToDeployer: () => void;}> = React.memo(({ onSendToDoctor, onSendToDeployer }) => {
    const { architectStep, isLoading, loadingText, error, submitBlueprint, generateArchitecture, fileStructure, requestModification, setStep, clarificationHistory, projectDescription, techStack, resetArchitect } = useArchitectContext();
    const steps = ['Prototipo', 'Aclaración', 'Vista Previa', 'Entrega'];
    const currentStepIndex = {'blueprint': 0, 'clarification': 1, 'preview': 2, 'delivery': 3}[architectStep];

    let stepComponent;
    switch (architectStep) {
        case 'blueprint': stepComponent = <Step1Blueprint onSubmit={submitBlueprint} />; break;
        case 'preview': stepComponent = fileStructure && <Step3Preview fileStructure={fileStructure} onModificationRequest={requestModification} onApproval={() => setStep('delivery')} />; break;
        case 'delivery': stepComponent = fileStructure && projectDescription && techStack && <Step4Delivery fileStructure={fileStructure} projectDescription={projectDescription} techStack={techStack} onStartNew={resetArchitect} onSendToDoctor={onSendToDoctor} onSendToDeployer={onSendToDeployer} />; break;
    }
    
    return (
        <div className="flex flex-col h-full w-full items-center pt-8">
            {isLoading && <Loader text={loadingText} />}
            <main className="w-full max-w-7xl flex-grow flex flex-col items-center mt-8 px-4">
                <div className="w-full max-w-xl mb-16"><Stepper currentStep={currentStepIndex} steps={steps} /></div>
                {error && <div className="bg-error/10 border border-error/30 text-red-300 px-4 py-3 rounded-lg relative my-4 w-full">{error}</div>}
                {stepComponent}
            </main>
        </div>
    );
});

const SidebarNav: React.FC<{ 
    activeMode: Mode | null; isSidebarVisible: boolean; onSelectMode: (mode: Mode) => void; onReset: () => void; 
    onOpenSettings: () => void; onOpenSupport: () => void; currentUser: User | null; onOpenAuth: () => void; 
    onLogout: () => void; onToggleSidebar: () => void; onOpenBaza: () => void; onOpenAgents: () => void; onOpenDesign: () => void;
}> = React.memo(({ activeMode, isSidebarVisible, onSelectMode, onReset, onOpenSettings, onOpenSupport, currentUser, onOpenAuth, onLogout, onToggleSidebar, onOpenBaza, onOpenAgents, onOpenDesign }) => {
    const { t } = useI18n();
    const navGroups = [
        { title: 'sidebar.title', items: [{ mode: 'architect', label: 'sidebar.architect', icon: CodeIcon }, { mode: 'wireframe', label: 'sidebar.wireframe', icon: LayoutTemplateIcon }, { mode: 'magician', label: 'sidebar.magician', icon: MagicWandIcon }] },
        { title: 'sidebar.title.assistants', items: [{ mode: 'codeCopilot', label: 'sidebar.copilot', icon: CodeIcon }, { mode: 'translator', label: 'sidebar.translator', icon: SwapIcon }] },
        { title: 'sidebar.title.quality', items: [{ mode: 'doctor', label: 'sidebar.doctor', icon: StethoscopeIcon }, { mode: 'tutor', label: 'sidebar.tutor', icon: TestTubeIcon }] },
        { title: 'sidebar.title.analysis', items: [{ mode: 'videoAnalyst', label: 'sidebar.videoAnalyst', icon: VideoAnalystIcon }, { mode: 'navigator', label: 'sidebar.navigator', icon: BrowserIcon }] },
        { title: 'sidebar.title.platform', items: [
            { mode: 'guardian', label: 'sidebar.guardian' as any, icon: ShieldCheckIcon },
            { mode: 'deployer', label: 'sidebar.deployer' as any, icon: DeployIcon }, 
            { mode: 'community', label: 'sidebar.community' as any, icon: UsersIcon }, 
            { mode: 'chat', label: 'sidebar.chat' as any, icon: MessageSquareIcon }, 
            { mode: 'liveChat', label: 'sidebar.liveChat' as any, icon: MicrophoneIcon }, 
            { mode: 'donation', label: 'sidebar.donation' as any, icon: HeartIcon }
        ]}
    ];

    return (
        <aside className={`relative bg-surface/30 border-r border-border/50 p-4 flex flex-col h-full backdrop-blur-sm transition-all duration-300 ${isSidebarVisible ? 'w-72' : 'w-20'}`}>
            <button onClick={onToggleSidebar} className="absolute top-1/2 -right-3 z-10 p-1 rounded-full bg-surface border border-border text-text-secondary hover:text-white transition-all -translate-y-1/2"><ChevronLeftIcon className={`w-4 h-4 transition-transform ${isSidebarVisible ? '' : 'rotate-180'}`} /></button>
            <div className={`flex items-center space-x-3 mb-8 cursor-pointer group flex-shrink-0 ${isSidebarVisible ? '' : 'justify-center'}`} onClick={onReset}><svg className="w-8 h-8 text-primary drop-shadow-text-glow-primary" viewBox="0 0 100 100" fill="currentColor"><path d="M50 5L5 95H28.5L50 48.5L71.5 95H95L50 5z M50 58.5L36.5 87.5H63.5L50 58.5z" /></svg><h1 className={`text-xl font-bold text-text-primary group-hover:text-white transition-opacity ${isSidebarVisible ? 'opacity-100' : 'opacity-0 w-0'}`}>Alphapp AI</h1></div>
            
            <div className="space-y-2 mb-6">
                <button 
                    onClick={onOpenDesign}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl bg-gradient-to-r from-primary/30 to-accent/30 border border-primary/50 text-white font-black text-[10px] uppercase tracking-tighter transition-all hover:scale-105 shadow-glow-primary w-full ${!isSidebarVisible ? 'justify-center px-0' : ''}`}
                >
                    <PaletteIcon className="w-5 h-5 text-primary" />
                    <span className={`${isSidebarVisible ? 'opacity-100' : 'opacity-0 w-0'} whitespace-nowrap`}>DESIGN HUB</span>
                </button>
                <button 
                    onClick={onOpenBaza}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl bg-surface/40 border border-border/50 text-text-secondary font-black text-[10px] uppercase tracking-tighter transition-all hover:bg-surface/60 w-full ${!isSidebarVisible ? 'justify-center px-0' : ''}`}
                >
                    <PackageIcon className="w-5 h-5 text-accent" />
                    <span className={`${isSidebarVisible ? 'opacity-100' : 'opacity-0 w-0'} whitespace-nowrap`}>BAZA HUB</span>
                </button>
            </div>

            <nav className="flex-grow overflow-y-auto space-y-4 pr-1">
                {navGroups.map((group, index) => (
                    <div key={index}>
                        {isSidebarVisible && <h2 className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2 px-3">{t(group.title as any)}</h2>}
                        <ul className="space-y-1">
                            {group.items.map(item => (
                                <li key={item.mode}>
                                    <a href="#" onClick={(e) => { e.preventDefault(); onSelectMode(item.mode as Mode); }} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeMode === item.mode ? 'bg-primary/20 text-white shadow-inner' : 'text-text-secondary hover:bg-border/50 hover:text-white'} ${!isSidebarVisible ? 'justify-center' : ''}`}>
                                        <item.icon className={`w-5 h-5 flex-shrink-0 ${activeMode === item.mode ? 'text-primary' : ''}`} />
                                        <span className={`${isSidebarVisible ? 'opacity-100' : 'opacity-0 w-0'} whitespace-nowrap`}>{t(item.label as any)}</span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </nav>
            <div className="pt-4 border-t border-border/50">
                {currentUser ? (
                    <div className="flex items-center justify-between p-2"><div className={`flex items-center gap-2 ${!isSidebarVisible && 'w-full justify-center'}`}><div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold text-white">{currentUser.username.charAt(0).toUpperCase()}</div><span className={`${isSidebarVisible ? 'opacity-100' : 'opacity-0 w-0'} font-semibold truncate`}>{currentUser.username}</span></div></div>
                ) : (
                    <button onClick={onOpenAuth} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary-focus"><UserIcon className="w-5 h-5" /></button>
                )}
                <button onClick={onOpenSettings} className="w-full flex items-center gap-3 px-3 py-2 mt-2 rounded-lg text-sm font-medium text-text-secondary hover:bg-border/50 hover:text-white"><SettingsIcon className="w-5 h-5" /></button>
            </div>
        </aside>
    );
});

const AppContent: React.FC = () => {
    const { currentUser, logout } = useAuthContext();
    const { openModal, closeModal } = useModalContext();
    const speechHook = useSpeech();
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const [activeMode, setActiveMode] = useState<Mode | null>('chat');
    const [isHuboShellOpen, setIsHuboShellOpen] = useState(false);
    const chatHook = useChat();

    const konamiCallback = useCallback(() => {
        setIsHuboShellOpen(true);
    }, []);

    useKonamiCode(konamiCallback);

    const renderContent = () => {
        if (!activeMode) return <WelcomeScreen onSelectMode={setActiveMode} currentUser={currentUser} onOpenAuthModal={() => openModal('auth', {})} onLogout={logout} onReset={() => setActiveMode(null)} />;
        return (
            <Suspense fallback={<Loader text="Restaurando Módulo..." />}>
                {(() => {
                    switch (activeMode) {
                        case 'chat': return <div className="flex flex-col h-full items-center px-4 max-w-4xl mx-auto"><ChatInterface {...chatHook} onSpeak={speechHook.speak} cancelSpeaking={speechHook.cancelSpeaking} speakingText={speechHook.speakingText} isListening={speechHook.isListening} startListening={speechHook.startListening} stopListening={speechHook.stopListening} isTtsEnabled={speechHook.isTtsEnabled} onToggleTts={speechHook.toggleTts} onOpenVoiceModal={() => openModal('settings', { speechHook })} onOpenHistory={() => openModal('chatHistory', { conversations: chatHook.conversationLog, onLoadConversation: chatHook.loadConversation, onDeleteConversation: chatHook.deleteConversation, onNewChat: chatHook.onResetChat })} /></div>;
                        case 'architect': return <ArchitectFlow onSendToDoctor={() => setActiveMode('doctor')} onSendToDeployer={() => setActiveMode('deployer')} />;
                        case 'doctor': return <CodeDoctorFlow />;
                        case 'tutor': return <TestTutorFlow />;
                        case 'magician': return <UIMagicianFlow onSendToDoctor={(res) => setActiveMode('doctor')} />;
                        case 'deployer': return <DeployerFlow />;
                        case 'community': return <CommunityHubFlow />;
                        case 'wireframe': return <WireframeFlow onSendToDoctor={(res) => setActiveMode('doctor')} />;
                        case 'translator': return <CodeTranslatorFlow />;
                        case 'donation': return <DonationFlow />;
                        case 'videoAnalyst': return <VideoAnalystFlow />;
                        case 'codeCopilot': return <CodeCopilotFlow />;
                        case 'navigator': return <WebNavigatorFlow onSendToDoctor={(res) => setActiveMode('doctor')} onAnalyzeFilesInDoctor={(files, tech, name) => setActiveMode('doctor')} />;
                        case 'liveChat': return <LiveChatFlow />;
                        case 'guardian': return <GuardianFlow />;
                        default: return <div>Módulo no encontrado.</div>;
                    }
                })()}
            </Suspense>
        );
    };

    return (
        <div className="flex h-screen bg-background relative overflow-hidden">
            <HuboShell isOpen={isHuboShellOpen} onClose={() => setIsHuboShellOpen(false)} />
            {activeMode && <SidebarNav activeMode={activeMode} isSidebarVisible={isSidebarVisible} onSelectMode={setActiveMode} onReset={() => setActiveMode(null)} onOpenSettings={() => openModal('settings', { speechHook })} onOpenSupport={() => openModal('support', {})} currentUser={currentUser} onOpenAuth={() => openModal('auth', {})} onLogout={logout} onToggleSidebar={() => setIsSidebarVisible(!isSidebarVisible)} onOpenBaza={() => openModal('baza', {})} onOpenAgents={() => openModal('agentModal', {})} onOpenDesign={() => openModal('designModal', {})} />}
            <div className={`flex-grow h-screen overflow-y-auto transition-all ${!activeMode ? 'w-full' : ''}`}>{renderContent()}</div>
        </div>
    );
};

const App: React.FC = () => (
    <ThemeProvider><ToastProvider><ModalProvider><AuthProvider><SettingsProvider><I18nProvider><IntegrityVerifierProvider><ErrorBoundary><ProjectProvider><ArchitectProvider><CodeDoctorProvider><TestTutorProvider><DeployerProvider><CommunityHubProvider><WireframeProvider><CodeTranslatorProvider><VideoAnalystProvider><CodeCopilotProvider><WebNavigatorProvider><LiveChatProvider><div className="h-screen bg-background"><AppContent /><ModalManager /></div></LiveChatProvider></WebNavigatorProvider></CodeCopilotProvider></VideoAnalystProvider></CodeTranslatorProvider></WireframeProvider></CommunityHubProvider></DeployerProvider></TestTutorProvider></CodeDoctorProvider></ArchitectProvider></ProjectProvider></ErrorBoundary></IntegrityVerifierProvider></I18nProvider></SettingsProvider></AuthProvider></ModalProvider></ToastProvider></ThemeProvider>
);

export default App;
