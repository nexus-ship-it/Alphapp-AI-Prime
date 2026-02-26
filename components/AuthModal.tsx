
import React, { useState, FormEvent, useEffect } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { SpinnerIcon } from './ui/icons';
import { useI18n } from '../contexts/I18nContext';
import { TranslationKey } from '../i18n/translations';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const LanguageSelector: React.FC<{
    selectedLang: 'es' | 'en';
    onSelectLang: (lang: 'es' | 'en') => void;
}> = ({ selectedLang, onSelectLang }) => {
    const { t } = useI18n();
    return (
        <div className="flex justify-center gap-4">
            <button
                type="button"
                onClick={() => onSelectLang('es')}
                className={`px-4 py-2 rounded-lg border-2 transition-colors ${selectedLang === 'es' ? 'bg-primary border-primary text-white' : 'bg-surface border-border text-text-secondary'}`}
            >
                {t('settings.language.spanish' as TranslationKey)}
            </button>
            <button
                type="button"
                onClick={() => onSelectLang('en')}
                className={`px-4 py-2 rounded-lg border-2 transition-colors ${selectedLang === 'en' ? 'bg-primary border-primary text-white' : 'bg-surface border-border text-text-secondary'}`}
            >
                {t('settings.language.english' as TranslationKey)}
            </button>
        </div>
    );
};

const PersonaSelector: React.FC<{
    selected: 'Desarrollador' | 'QA' | 'DevOps';
    onSelect: (persona: 'Desarrollador' | 'QA' | 'DevOps') => void;
}> = ({ selected, onSelect }) => {
    const { t } = useI18n();
    const personas: ('Desarrollador' | 'QA' | 'DevOps')[] = ['Desarrollador', 'QA', 'DevOps'];
    return (
        <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">{t('username.selectRole' as TranslationKey)}:</label>
            <div className="flex justify-center gap-2">
                {personas.map(p => (
                    <button
                        key={p}
                        type="button"
                        onClick={() => onSelect(p)}
                        className={`px-3 py-1.5 text-sm rounded-full border-2 transition-colors ${selected === p ? 'bg-primary border-primary text-white font-semibold' : 'bg-surface border-border text-text-secondary'}`}
                    >
                        {t(p as TranslationKey)}
                    </button>
                ))}
            </div>
        </div>
    );
};

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
    const [isLoginView, setIsLoginView] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [lang, setLang] = useState<'es' | 'en'>('es');
    const [persona, setPersona] = useState<'Desarrollador' | 'QA' | 'DevOps'>('Desarrollador');
    const [isLoading, setIsLoading] = useState(false);
    const { login, register } = useAuthContext();
    const { t } = useI18n();

    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
           if (event.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
        }
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!email || !password) return;
        
        setIsLoading(true);
        let success = false;
        
        if (isLoginView) {
            success = await login(email, password);
        } else {
            success = await register(email, password, lang, persona);
        }
        
        setIsLoading(false);
        if (success) {
            onClose();
            setEmail('');
            setPassword('');
        }
    };
    
    if (!isOpen) return null;

    return (
        <>
            <div
                className="fixed inset-0 bg-background/80 animate-fade-in z-40"
                onClick={onClose}
                aria-hidden="true"
            />
            <div 
                className="fixed inset-0 flex items-center justify-center z-50"
                role="dialog" aria-modal="true" aria-labelledby="auth-modal-title"
            >
                <div 
                    className="bg-surface border border-border rounded-lg shadow-xl w-full max-w-sm m-4 transform transition-all animate-slide-up relative"
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
                    <div className="p-8">
                        <h2 id="auth-modal-title" className="text-2xl font-bold text-text-primary text-center mb-2">
                            {isLoginView ? t('modal.auth.loginTitle' as TranslationKey) : t('modal.auth.registerTitle' as TranslationKey)}
                        </h2>
                         <p className="text-text-secondary text-center mb-6">
                            {isLoginView ? t('modal.auth.welcomeBack' as TranslationKey) : t('modal.auth.joinAlphapp' as TranslationKey)}
                        </p>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {!isLoginView && (
                                <div className="space-y-4">
                                    <LanguageSelector selectedLang={lang} onSelectLang={setLang} />
                                    <PersonaSelector selected={persona} onSelect={setPersona} />
                                </div>
                            )}
                            <div>
                                <label htmlFor="email" className="sr-only">Email</label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Email"
                                    className="w-full p-3 bg-background border-2 border-border rounded-md text-text-primary focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                                    required
                                    autoComplete="email"
                                />
                            </div>
                             <div>
                                <label htmlFor="password"  className="sr-only">{t('modal.auth.passwordLabel' as TranslationKey)}</label>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={t('modal.auth.passwordPlaceholder' as TranslationKey)}
                                    className="w-full p-3 bg-background border-2 border-border rounded-md text-text-primary focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                                    required
                                    autoComplete={isLoginView ? "current-password" : "new-password"}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full px-6 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-focus transition-colors disabled:opacity-50 flex items-center justify-center"
                            >
                                {isLoading && <SpinnerIcon className="w-5 h-5 mr-2"/>}
                                {isLoading ? t('common.processing' as TranslationKey) : (isLoginView ? t('modal.auth.loginButton' as TranslationKey) : t('modal.auth.registerButton' as TranslationKey))}
                            </button>
                        </form>
                        <div className="mt-6 text-center">
                            <p className="text-sm text-text-secondary">
                                {isLoginView ? t('modal.auth.noAccount' as TranslationKey) : t('modal.auth.haveAccount' as TranslationKey)}
                                <button onClick={() => setIsLoginView(!isLoginView)} className="ml-1 font-semibold text-primary hover:underline">
                                    {isLoginView ? t('modal.auth.signUp' as TranslationKey) : t('modal.auth.signIn' as TranslationKey)}
                                </button>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
