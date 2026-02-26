

import React from 'react';
import { StethoscopeIcon, TestTubeIcon, MagicWandIcon, DeployIcon, LayoutTemplateIcon, HeartIcon, VideoAnalystIcon } from './ui/icons';
import { Mode, User } from '../types';
import { UserIcon, LogOutIcon } from './ui/icons';
import { useI18n } from '../contexts/I18nContext';
import { TranslationKey } from '../i18n/translations';

// A single, more advanced card component for the welcome screen
const ModeCard: React.FC<{
    onClick: () => void;
    icon: React.ReactNode;
    title: string;
    description: string;
    glowColorClass: string;
}> = ({ onClick, icon, title, description, glowColorClass }) => {
    return (
        <div className="relative group">
            <div className={`absolute -inset-1 ${glowColorClass} rounded-xl blur-xl opacity-20 group-hover:opacity-60 transition duration-500`}></div>
            <button
                onClick={onClick}
                className="relative w-full h-full bg-surface/60 border border-border/50 rounded-xl p-6 sm:p-8 text-left transition-all duration-300 transform hover:-translate-y-1 group-hover:rotate-1 backdrop-blur-sm"
            >
                <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="flex-shrink-0 w-20 h-20 bg-background rounded-full flex items-center justify-center border-2 border-border group-hover:border-primary transition-colors">
                        {icon}
                    </div>
                    <div className="text-center sm:text-left">
                        <h2 className="text-2xl font-bold text-text-primary mb-2 group-hover:text-primary transition-colors">{title}</h2>
                        <p className="text-text-secondary leading-relaxed">
                            {description}
                        </p>
                    </div>
                </div>
            </button>
        </div>
    );
};


const WelcomeScreen: React.FC<{ 
    onSelectMode: (mode: Mode) => void; 
    currentUser: User | null;
    onOpenAuthModal: () => void;
    onLogout: () => void;
    onReset: () => void;
}> = ({ onSelectMode, currentUser, onOpenAuthModal, onLogout, onReset }) => {
    const { t } = useI18n();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center animate-fade-in relative">

            <div className="absolute top-4 right-4 flex items-center gap-4">
                {currentUser ? (
                    <>
                        <div className="flex items-center gap-2 text-text-primary">
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold text-white">
                                {currentUser.username.charAt(0).toUpperCase()}
                            </div>
                            <span>{currentUser.username}</span>
                        </div>
                        <button onClick={onLogout} className="flex items-center gap-2 px-3 py-2 bg-border/50 text-text-secondary font-semibold rounded-lg hover:bg-border/80 hover:text-white transition-colors">
                            <LogOutIcon className="w-5 h-5" />
                            <span>{t('welcome.logout' as TranslationKey)}</span>
                        </button>
                    </>
                ) : (
                    <button onClick={onOpenAuthModal} className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-focus transition-colors">
                        <UserIcon className="w-5 h-5" />
                        <span>{t('welcome.login' as TranslationKey)}</span>
                    </button>
                )}
            </div>

            <div 
                className="flex items-center space-x-4 mb-6 mt-16 sm:mt-0"
                onClick={onReset}
            >
                <svg
                    className="w-14 h-14 text-primary drop-shadow-text-glow-primary"
                    viewBox="0 0 100 100"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                >
                    <path d="M50 5L5 95H28.5L50 48.5L71.5 95H95L50 5z M50 58.5L36.5 87.5H63.5L50 58.5z" />
                </svg>
                <h1 className="text-5xl sm:text-6xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-gray-200 to-primary drop-shadow-text-glow-primary">
                    Alphapp AI
                </h1>
            </div>

            <p className="mt-2 mb-12 text-lg sm:text-xl text-text-secondary max-w-3xl leading-relaxed">
                {t('welcome.title' as TranslationKey)}
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-5xl">

                <ModeCard
                    onClick={() => onSelectMode('architect')}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M12 22v-5"/><path d="M12 12v-5"/><path d="M12 2v5"/><path d="M22 17v-5"/><path d="M22 7V2"/><path d="M17 2h5"/><path d="M7 22H2"/><path d="M7 17H2"/><path d="M17 22h5"/><path d="M2 12h5"/><path d="M17 12h5"/><path d="M7 7H2"/><path d="M17 7h5"/></svg>}
                    title="Arquitecto de Código"
                    description="Diseña una arquitectura de software completa a partir de tu idea. Genera la estructura de archivos, el código base y la configuración de CI/CD."
                    glowColorClass="bg-primary"
                />

                <ModeCard
                    onClick={() => onSelectMode('doctor')}
                    icon={<StethoscopeIcon className="w-11 h-11 text-info"/>}
                    title="Doctor de Código"
                    description="Realiza un chequeo exhaustivo de tu proyecto. Detecta vulnerabilidades, problemas de calidad y sugiere las mejores prácticas."
                    glowColorClass="bg-info"
                />
                
                <ModeCard
                    onClick={() => onSelectMode('deployer')}
                    icon={<DeployIcon className="w-11 h-11 text-teal-400"/>}
                    title="Desplegador DevOps"
                    description="Genera archivos de configuración (Dockerfiles, CI/CD) para desplegar tu proyecto en plataformas en la nube populares."
                    glowColorClass="bg-teal-500"
                />

                <ModeCard
                    onClick={() => onSelectMode('magician')}
                    icon={<MagicWandIcon className="w-11 h-11 text-warning"/>}
                    title="Mago Visual"
                    description="Transforma tus bocetos en código de frontend, edita imágenes con IA y obtén críticas de diseño."
                    glowColorClass="bg-warning"
                />

                <ModeCard
                    onClick={() => onSelectMode('wireframe')}
                    icon={<LayoutTemplateIcon className="w-11 h-11 text-indigo-400"/>}
                    title="Creador de Wireframes"
                    description="Genera un boceto de UI editable a partir de una descripción de texto, ideal para prototipado rápido."
                    glowColorClass="bg-indigo-500"
                />
                 
                <ModeCard
                    onClick={() => onSelectMode('videoAnalyst')}
                    icon={<VideoAnalystIcon className="w-11 h-11 text-purple-400"/>}
                    title="Analista de Video"
                    description="Sube un video para obtener resúmenes, buscar objetos, transcribir diálogos o extraer texto en pantalla."
                    glowColorClass="bg-purple-500"
                />

                <ModeCard
                    onClick={() => onSelectMode('tutor')}
                    icon={<TestTubeIcon className="w-11 h-11 text-accent"/>}
                    title="Tutor de Pruebas"
                    description="¿No sabes cómo probar una función o componente? Pega tu código y te guiaré paso a paso para crear pruebas unitarias efectivas."
                    glowColorClass="bg-accent"
                />
                
                <ModeCard
                    onClick={() => onSelectMode('chat')}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>}
                    title="Chat de Asistencia"
                    description="Resuelve dudas sobre la plataforma Alphapp, busca información técnica actualizada en la web o pide ejemplos de código."
                    glowColorClass="bg-green-500"
                />

                <ModeCard
                    onClick={() => onSelectMode('donation')}
                    icon={<HeartIcon className="w-11 h-11 text-primary"/>}
                    title="Apoya el Proyecto"
                    description="Si encuentras útil Alphapp AI, considera hacer una donación para apoyar su desarrollo y mantenimiento continuo."
                    glowColorClass="bg-primary"
                />

            </div>
        </div>
    );
};

export default WelcomeScreen;