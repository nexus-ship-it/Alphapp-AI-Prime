

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { translations, TranslationKey } from '../i18n/translations';

export type Language = 'es' | 'en';

interface I18nContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    // FIX: Changed return type of t from TranslationKey to string
    t: (key: TranslationKey, replacements?: Record<string, string>) => string;
}

export const I18nContext = createContext<I18nContextType | undefined>(undefined);

const LANG_STORAGE_KEY = 'alphapp-ai-language';

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>(() => {
        try {
            const savedLang = window.localStorage.getItem(LANG_STORAGE_KEY);
            if (savedLang === 'es' || savedLang === 'en') {
                return savedLang;
            }
        } catch (e) {
            console.error('Failed to access language preferences', e);
        }
        return 'es'; // Default to Spanish
    });

    const setLanguage = useCallback((lang: Language) => {
        setLanguageState(lang);
        try {
            window.localStorage.setItem(LANG_STORAGE_KEY, lang);
        } catch (e) {
            console.error('Failed to save language to localStorage', e);
        }
    }, []);

    const t = useCallback((key: TranslationKey, replacements: Record<string, string> = {}): string => {
        // Fallback to English if the key is missing in the current language
        const langTranslations = translations[language] || translations.en;
        let translation = langTranslations[key] || translations.en[key] || key;

        // Handle replacements
        Object.keys(replacements).forEach(placeholder => {
            translation = translation.replace(`{${placeholder}}`, replacements[placeholder]);
        });

        return translation;
    }, [language]);

    useEffect(() => {
        document.documentElement.lang = language;
    }, [language]);

    return (
        <I18nContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </I18nContext.Provider>
    );
};

export const useI18n = () => {
    const context = useContext(I18nContext);
    if (context === undefined) {
        throw new Error('useI18n must be used within an I18nProvider');
    }
    return context;
};