import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';

export type Theme = 'dark' | 'light' | 'midnight' | 'dusk' | 'solarized' | 'sovereign';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'alphapp-ai-theme';

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState<Theme>(() => {
        try {
            const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
            return (savedTheme as Theme) || 'dark';
        } catch (e) {
            return 'dark';
        }
    });

    useEffect(() => {
        const root = window.document.documentElement;
        
        root.classList.remove('dark', 'light', 'midnight', 'dusk', 'solarized', 'sovereign');
        root.classList.add(theme);

        try {
            window.localStorage.setItem(THEME_STORAGE_KEY, theme);
        } catch (e) {
            console.error('Failed to save theme to localStorage', e);
        }
    }, [theme]);

    const setTheme = useCallback((newTheme: Theme) => {
        setThemeState(newTheme);
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};