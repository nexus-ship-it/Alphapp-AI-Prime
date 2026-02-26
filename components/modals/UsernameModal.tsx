

import React, { useState, FormEvent } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { TranslationKey } from '../../i18n/translations';

const LanguageSelector: React.FC<{
    selectedLang: 'es' | 'en';
    onSelectLang: (lang: 'es' | 'en') => void;
}> = ({ selectedLang, onSelectLang }) => {
    const { t } = useI18n();
    return (
        <div className="flex justify-center gap-4 mb-6">
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
        <div className="mb-6">
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

export const UsernameModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (username: string, lang: 'es' | 'en', persona: 'Desarrollador' | 'QA' | 'DevOps') => void;
    onCancel: () => void;
}> = ({ isOpen, onClose, onSubmit, onCancel }) => {
    const { t } = useI18n();
    const [username, setUsername] = useState('');
    const [lang, setLang] = useState<'es' | 'en'>('es');
    const [persona, setPersona] = useState<'Desarrollador' | 'QA' | 'DevOps'>('Desarrollador');

    if (!isOpen) return null;

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (username.trim()) {
            onSubmit(username.trim(), lang, persona);
            onClose();
        }
    };
    
    const handleCancel = () => {
        onCancel();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50">
            <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-40 animate-fade-in" onClick={handleCancel} />
            <div className="flex items-center justify-center h-full">
                <form onSubmit={handleSubmit} className="bg-surface p-8 rounded-lg shadow-2xl w-full max-w-sm text-center border border-border relative z-50" onClick={e => e.stopPropagation()}>
                    <button 
                        type="button" 
                        onClick={handleCancel} 
                        className="absolute top-2 right-2 p-1 rounded-full text-text-secondary hover:bg-border/50 text-2xl leading-none w-8 h-8 flex items-center justify-center"
                        aria-label={t('common.close' as TranslationKey)}
                    >
                        &times;
                    </button>
                    <h2 className="text-2xl font-bold text-text-primary mb-2">{t('username.title' as TranslationKey)}</h2>
                    <p className="text-text-secondary mb-6">{t('username.description' as TranslationKey)}</p>
                    <LanguageSelector selectedLang={lang} onSelectLang={setLang} />
                    <PersonaSelector selected={persona} onSelect={setPersona} />
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder={t('username.placeholder' as TranslationKey)}
                        className="w-full p-3 bg-background border-2 border-border rounded-md text-text-primary focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                        required
                        autoFocus
                    />
                    <button type="submit" className="w-full mt-4 px-6 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-focus transition-colors">
                        {t('username.join' as TranslationKey)}
                    </button>
                </form>
            </div>
        </div>
    );
};