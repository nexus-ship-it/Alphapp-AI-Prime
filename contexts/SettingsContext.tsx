import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { AppSettings, NotificationPreferences, DNDSettings, NotificationEvent } from '../types';
import { useToastContext } from './ToastContext';

const SETTINGS_KEY = 'alphapp-ai-settings';

const DEFAULT_SETTINGS: AppSettings = {
  notificationPreferences: {
    enabled: false,
    soundEnabled: true,
    events: {
      projectGenerated: true,
      analysisComplete: true,
      codeGenerated: true,
      deploymentFilesGenerated: true,
      // Removed securityScanComplete
    },
  },
  dndSettings: {
    enabled: false,
    startTime: '22:00',
    endTime: '08:00',
  },
};

interface SettingsContextType {
    settings: AppSettings;
    updateNotificationPreferences: (prefs: Partial<NotificationPreferences>) => void;
    updateDNDSettings: (dnd: Partial<DNDSettings>) => void;
    updateEventPreference: (event: NotificationEvent, value: boolean) => void;
    notify: (event: NotificationEvent, options: NotificationOptions & { title: string }) => void;
    isNotificationPermissionGranted: boolean | null;
    requestNotificationPermission: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<AppSettings>(() => {
        try {
            const savedSettings = localStorage.getItem(SETTINGS_KEY);
            if (savedSettings) {
                const parsed = JSON.parse(savedSettings);
                // Merge with defaults to handle new settings being added
                return {
                    notificationPreferences: {
                        ...DEFAULT_SETTINGS.notificationPreferences,
                        ...parsed.notificationPreferences,
                        events: {
                            ...DEFAULT_SETTINGS.notificationPreferences.events,
                            ...parsed.notificationPreferences?.events
                        }
                    },
                    dndSettings: {
                        ...DEFAULT_SETTINGS.dndSettings,
                        ...parsed.dndSettings
                    }
                };
            }
        } catch (error) {
            console.error("Failed to load settings from localStorage", error);
        }
        return DEFAULT_SETTINGS;
    });

    const [isNotificationPermissionGranted, setNotificationPermissionGranted] = useState<boolean | null>(null);
    const { addToast } = useToastContext();

    useEffect(() => {
        setNotificationPermissionGranted(Notification.permission === 'granted');
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        } catch (error) {
            console.error("Failed to save settings to localStorage", error);
        }
    }, [settings]);

    const requestNotificationPermission = useCallback(async () => {
        if (!('Notification' in window)) {
            addToast({ type: 'error', title: 'No Soportado', message: 'Las notificaciones no son compatibles con este navegador.' });
            return;
        }

        if (Notification.permission === 'granted') {
            setNotificationPermissionGranted(true);
            return;
        }
        
        if (Notification.permission === 'denied') {
            addToast({ type: 'warning', title: 'Permiso Denegado', message: 'Debes habilitar las notificaciones en la configuración de tu navegador.' });
             setNotificationPermissionGranted(false);
            return;
        }

        try {
            const permission = await Notification.requestPermission();
            setNotificationPermissionGranted(permission === 'granted');
            if(permission === 'denied'){
                 addToast({ type: 'warning', title: 'Permiso Denegado', message: 'Has denegado el permiso para mostrar notificaciones.' });
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error);
        }
    }, [addToast]);

    const updateNotificationPreferences = (prefs: Partial<NotificationPreferences>) => {
        setSettings(s => ({ ...s, notificationPreferences: { ...s.notificationPreferences, ...prefs } }));
    };

    const updateDNDSettings = (dnd: Partial<DNDSettings>) => {
        setSettings(s => ({ ...s, dndSettings: { ...s.dndSettings, ...dnd } }));
    };

    const updateEventPreference = (event: NotificationEvent, value: boolean) => {
        setSettings(s => ({
            ...s,
            notificationPreferences: {
                ...s.notificationPreferences,
                events: {
                    ...s.notificationPreferences.events,
                    [event]: value,
                },
            },
        }));
    };
    
    const canNotify = (event: NotificationEvent) => {
        if (!settings.notificationPreferences.enabled) return false;
        if (!settings.notificationPreferences.events[event]) return false;
        
        if (settings.dndSettings.enabled) {
            const now = new Date();
            const currentTime = now.getHours() * 60 + now.getMinutes();

            const [startH, startM] = settings.dndSettings.startTime.split(':').map(Number);
            const startTime = startH * 60 + startM;

            const [endH, endM] = settings.dndSettings.endTime.split(':').map(Number);
            const endTime = endH * 60 + endM;

            if (startTime <= endTime) { // Same day DND (e.g., 09:00 - 17:00)
                if (currentTime >= startTime && currentTime < endTime) return false;
            } else { // Overnight DND (e.g., 22:00 - 08:00)
                if (currentTime >= startTime || currentTime < endTime) return false;
            }
        }

        return true;
    };

    const notify = (event: NotificationEvent, options: NotificationOptions & { title: string }) => {
        if (document.hasFocus()) return; // Don't notify if the user is already looking at the tab
        if (!isNotificationPermissionGranted) return;
        if (!canNotify(event)) return;

        const { title, ...restOptions } = options;
        
        const finalOptions: NotificationOptions = {
            icon: '/vite.svg',
            ...restOptions,
            silent: !settings.notificationPreferences.soundEnabled,
        };

        new Notification(title, finalOptions);
    };

    const value = {
        settings,
        updateNotificationPreferences,
        updateDNDSettings,
        updateEventPreference,
        notify,
        isNotificationPermissionGranted,
        requestNotificationPermission
    };

    return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettingsContext = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettingsContext must be used within a SettingsProvider');
    }
    return context;
};