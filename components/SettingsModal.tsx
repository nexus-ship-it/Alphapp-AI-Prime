
import React, { useState, useEffect } from 'react';
import { useSettingsContext } from '../contexts/SettingsContext';
import { useSpeech } from '../hooks/useSpeech';
import { PlayCircleIcon, PauseCircleIcon, CheckCircleIcon, StarIcon, BellIcon, SettingsIcon, PaletteIcon, LanguageIcon } from './ui/icons';
import { NotificationEvent } from '../types';
import { useTheme, Theme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nContext';
import { TranslationKey } from '../i18n/translations';

type Tab = 'notifications' | 'appearance' | 'voice' | 'language';

const ToggleSwitch: React.FC<{
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
    description?: string;
}> = ({ checked, onChange, label, description }) => (
    <div className="flex items-center justify-between py-2">
        <div>
            <label className="font-medium text-text-primary">{label}</label>
            {description && <p className="text-sm text-text-secondary">{description}</p>}
        </div>
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface ${
                checked ? 'bg-primary' : 'bg-border'
            }`}
        >
            <span
                aria-hidden="true"
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    checked ? 'translate-x-5' : 'translate-x-0'
                }`}
            />
        </button>
    </div>
);


const NotificationsPanel: React.FC = () => {
    const { settings, updateNotificationPreferences, updateDNDSettings, updateEventPreference, isNotificationPermissionGranted, requestNotificationPermission } = useSettingsContext();
    const { t } = useI18n();

    useEffect(() => {
        if (settings.notificationPreferences.enabled && isNotificationPermissionGranted === null) {
            requestNotificationPermission();
        }
    }, [settings.notificationPreferences.enabled, isNotificationPermissionGranted, requestNotificationPermission]);

    return (
        <div className="p-6 space-y-6">
            {!isNotificationPermissionGranted && (
                <div className="bg-warning/10 border border-warning/30 text-yellow-300 px-4 py-3 rounded-lg flex items-start gap-3">
                    <BellIcon className="w-6 h-6 text-warning mt-1" />
                    <div>
                        <h4 className="font-bold">{t('notifications.permission.required' as TranslationKey)}</h4>
                        <p className="text-sm">{t('notifications.permission.description' as TranslationKey)}</p>
                        <button onClick={requestNotificationPermission} className="mt-2 text-sm font-semibold underline hover:text-white">{t('notifications.permission.request' as TranslationKey)}</button>
                    </div>
                </div>
            )}
            <ToggleSwitch
                label={t('notifications.enable' as TranslationKey)}
                description={t('notifications.enable.description' as TranslationKey)}
                checked={settings.notificationPreferences.enabled}
                onChange={(value) => {
                    if (value && Notification.permission !== 'granted') {
                        requestNotificationPermission();
                    }
                    updateNotificationPreferences({ enabled: value });
                }}
            />

            <div className={`space-y-4 transition-opacity duration-300 ${settings.notificationPreferences.enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                <hr className="border-border/50"/>
                <ToggleSwitch
                    label={t('notifications.sound' as TranslationKey)}
                    checked={settings.notificationPreferences.soundEnabled}
                    onChange={(value) => updateNotificationPreferences({ soundEnabled: value })}
                />
                
                {/* FIX: Ensure 'notifications.notifyWhen' is passed as a string literal key */}
                <h3 className="text-lg font-semibold text-text-primary pt-4">{t('notifications.notifyWhen' as TranslationKey)}</h3>
                {(Object.keys(settings.notificationPreferences.events) as NotificationEvent[]).map((eventKey) => {
                    return (
                        <ToggleSwitch
                            key={eventKey}
                            label={t(`notification.event.${eventKey}` as TranslationKey)}
                            checked={settings.notificationPreferences.events[eventKey]}
                            onChange={(value) => updateEventPreference(eventKey, value)}
                        />
                    );
                })}

                <hr className="border-border/50"/>
                 <h3 className="text-lg font-semibold text-text-primary pt-4">{t('notifications.dnd.title' as TranslationKey)}</h3>
                 <ToggleSwitch
                    label={t('notifications.dnd.enable' as TranslationKey)}
                    description={t('notifications.dnd.description' as TranslationKey)}
                    checked={settings.dndSettings.enabled}
                    onChange={(value) => updateDNDSettings({ enabled: value })}
                />
                 <div className={`flex items-center gap-4 transition-opacity duration-300 ${settings.dndSettings.enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                    <div className="flex-1">
                        <label htmlFor="dnd-start" className="block text-sm font-medium text-text-secondary">{t('notifications.dnd.from' as TranslationKey)}</label>
                        <input
                            id="dnd-start"
                            type="time"
                            value={settings.dndSettings.startTime}
                            onChange={(e) => updateDNDSettings({ startTime: e.target.value })}
                            className="mt-1 block w-full rounded-md border-border bg-surface p-2 text-sm focus:border-primary focus:ring-primary"
                        />
                    </div>
                    <div className="flex-1">
                        <label htmlFor="dnd-end" className="block text-sm font-medium text-text-secondary">{t('notifications.dnd.to' as TranslationKey)}</label>
                        <input
                            id="dnd-end"
                            type="time"
                            value={settings.dndSettings.endTime}
                            onChange={(e) => updateDNDSettings({ endTime: e.target.value })}
                            className="mt-1 block w-full rounded-md border-border bg-surface p-2 text-sm focus:border-primary focus:ring-primary"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

const AppearancePanel: React.FC = () => {
    const { theme, setTheme } = useTheme();
    const { t } = useI18n();

    const themes: { id: Theme; label: TranslationKey; }[] = [
        { id: 'light', label: 'appearance.light' },
        { id: 'dark', label: 'appearance.dark' },
        { id: 'midnight', label: 'appearance.midnight' },
        { id: 'dusk', label: 'appearance.dusk' },
        { id: 'solarized', label: 'appearance.solarized' },
    ];

    return (
        <div className="p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-2">{t('appearance.title' as TranslationKey)}</h3>
            <p className="text-sm text-text-secondary mb-6">{t('appearance.description' as TranslationKey)}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {themes.map((themeObj) => {
                    const isSelected = theme === themeObj.id;
                    return (
                        <button
                            key={themeObj.id}
                            onClick={() => setTheme(themeObj.id)}
                            aria-pressed={isSelected}
                            className={`p-4 rounded-lg border-2 text-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface focus:ring-primary ${
                                isSelected ? 'border-primary bg-primary/20 shadow-lg shadow-primary/10' : 'border-border bg-surface hover:border-primary/50'
                            }`}
                        >
                            <div className={`w-full h-20 rounded-md mb-3 flex items-center justify-center preview-${themeObj.id} transition-all`}>
                                <div className="w-3/4 bg-background/50 p-2 rounded">
                                     <div className={`w-full h-2 rounded-sm bg-primary mb-2`}></div>
                                     <div className={`w-1/2 h-2 rounded-sm bg-accent`}></div>
                                </div>
                            </div>
                            <p className={`font-semibold ${isSelected ? 'text-primary' : 'text-text-primary'}`}>{t(themeObj.label)}</p>
                        </button>
                    );
                })}
            </div>
            <style>{`
                .preview-light { background-color: #FFF; border: 1px solid #E2E8F0; }
                .preview-light .bg-background\\/50 { background-color: #F8FAFC80; }
                .preview-light .bg-primary { background-color: rgb(106 13 173); }
                .preview-light .bg-accent { background-color: rgb(13 148 136); }

                .preview-dark { background-color: #0F172A; border: 1px solid #475569; }
                .preview-dark .bg-background\\/50 { background-color: #1E293B80; }
                .preview-dark .bg-primary { background-color: rgb(168 104 232); }
                .preview-dark .bg-accent { background-color: rgb(20 184 166); }

                .preview-midnight { background-color: #000; border: 1px solid #1f2937; }
                .preview-midnight .bg-background\\/50 { background-color: #11182780; }
                .preview-midnight .bg-primary { background-color: rgb(192 132 252); }
                .preview-midnight .bg-accent { background-color: rgb(74 222 128); }

                .preview-dusk { background-color: rgb(39 39 42); border: 1px solid rgb(82 82 91); }
                .preview-dusk .bg-background\\/50 { background-color: #3f3f4680; }
                .preview-dusk .bg-primary { background-color: rgb(251 146 60); }
                .preview-dusk .bg-accent { background-color: rgb(251 113 133); }

                .preview-solarized { background-color: #fdf6e3; border: 1px solid #e8e2d0; }
                .preview-solarized .bg-background\\/50 { background-color: #eee8d580; }
                .preview-solarized .bg-primary { background-color: rgb(38 139 210); }
                .preview-solarized .bg-accent { background-color: rgb(211 54 130); }
            `}</style>
        </div>
    );
};


const VoicePanel: React.FC<{ speechHook: ReturnType<typeof useSpeech> }> = ({ speechHook }) => {
    const { 
        availableVoices: voices, 
        selectedVoice, 
        selectVoice: onSelectVoice, 
        previewVoice: onPreviewVoice, 
        cancelSpeaking: onCancelPreview, 
        isSpeaking 
    } = speechHook;
    const { t } = useI18n();
    const [previewingVoiceURI, setPreviewingVoiceURI] = useState<string | null>(null);

     useEffect(() => {
        if (!isSpeaking) {
            setPreviewingVoiceURI(null);
        }
    }, [isSpeaking]);

    const handlePreview = (voice: SpeechSynthesisVoice) => {
        if (isSpeaking && previewingVoiceURI === voice.voiceURI) {
            onCancelPreview();
            setPreviewingVoiceURI(null);
        } else {
            onPreviewVoice(voice);
            setPreviewingVoiceURI(voice.voiceURI);
        }
    };

    return (
        <div className="p-4">
             {voices.length > 0 ? (
                <ul className="space-y-2">
                    {voices.map((voice) => {
                        const isSelected = selectedVoice?.voiceURI === voice.voiceURI;
                        const isPreviewing = isSpeaking && previewingVoiceURI === voice.voiceURI;
                        const isRecommended = /google|microsoft/i.test(voice.name);

                        return (
                            <li 
                                key={voice.voiceURI}
                                className={`group flex items-center justify-between p-3 rounded-md transition-all duration-300
                                    ${isSelected ? 'bg-primary/20' : 'hover:bg-border/50'}
                                    ${isPreviewing ? 'ring-2 ring-inset ring-accent' : ''}
                                `}
                            >
                                <button onClick={() => onSelectVoice(voice)} className="flex-grow text-left pr-4">
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-text-primary">{voice.name}<span className="sr-only">{t('voice.selected.sr' as TranslationKey)}</span></p>
                                        {isRecommended && (
                                            <div className="flex-shrink-0 text-yellow-400" title={t('voice.recommended' as TranslationKey)}>
                                                <StarIcon className="w-4 h-4" />
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-text-secondary">{voice.lang} - {voice.localService ? t('voice.lang.local' as TranslationKey) : t('voice.lang.network' as TranslationKey)}</p>
                                </button>
                                <div className="flex items-center space-x-3 flex-shrink-0">
                                    {isSelected && <CheckCircleIcon className="w-6 h-6 text-primary" aria-hidden="true"/>}
                                    <button 
                                        onClick={() => handlePreview(voice)}
                                        className={`p-2 rounded-full transition-colors ${isPreviewing ? 'text-accent animate-pulse' : 'text-text-secondary group-hover:text-white'}`}
                                        aria-label={isPreviewing ? t('voice.preview.stop' as TranslationKey) : t('voice.preview.start' as TranslationKey)}
                                    >
                                        {isPreviewing ? <PauseCircleIcon className="w-6 h-6" /> : <PlayCircleIcon className="w-6 h-6" />}
                                    </button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <p className="text-text-tertiary text-center py-8">{t('voice.noVoices' as TranslationKey)}</p>
            )}
        </div>
    );
};

const LanguagePanel: React.FC = () => {
    const { language, setLanguage, t } = useI18n();

    return (
        <div className="p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-2">{t('settings.language.title' as TranslationKey)}</h3>
            <p className="text-sm text-text-secondary mb-6">{t('settings.language.description' as TranslationKey)}</p>
            <div className="flex justify-center gap-4">
                <button
                    type="button"
                    onClick={() => setLanguage('es')}
                    className={`px-6 py-3 rounded-lg border-2 text-lg font-semibold transition-colors ${language === 'es' ? 'bg-primary border-primary text-white' : 'bg-surface border-border text-text-secondary'}`}
                >
                    {t('settings.language.spanish' as TranslationKey)}
                </button>
                <button
                    type="button"
                    onClick={() => setLanguage('en')}
                    className={`px-6 py-3 rounded-lg border-2 text-lg font-semibold transition-colors ${language === 'en' ? 'bg-primary border-primary text-white' : 'bg-surface border-border text-text-secondary'}`}
                >
                    {t('settings.language.english' as TranslationKey)}
                </button>
            </div>
        </div>
    );
};

export const SettingsModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    speechHook: ReturnType<typeof useSpeech>;
}> = ({ isOpen, onClose, speechHook }) => {
    const { t } = useI18n();
    const [activeTab, setActiveTab] = useState<Tab>('voice');

    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
           if (event.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
        }
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-50"
            role="dialog" aria-modal="true" aria-labelledby="settings-modal-title"
        >
            <div
                className="fixed inset-0 bg-background/80 animate-fade-in z-40"
                onClick={onClose}
                aria-hidden="true"
            ></div>
            <div className="flex items-center justify-center h-full">
                <div 
                    className="bg-surface border border-border rounded-lg shadow-xl w-full max-w-3xl m-4 transform transition-all animate-slide-up flex flex-col relative z-50"
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
                    <div className="p-4 border-b border-border">
                        <h2 id="settings-modal-title" className="text-xl font-bold text-text-primary">{t('settings.title' as TranslationKey)}</h2>
                        <p className="text-sm text-text-secondary mt-1">{t('settings.description' as TranslationKey)}</p>
                    </div>

                    <div className="flex border-b border-border">
                        <button
                            onClick={() => setActiveTab('voice')}
                            className={`flex-1 flex items-center justify-center gap-2 p-3 text-sm font-semibold border-b-2 transition-colors duration-200 ${activeTab === 'voice' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-white'}`}
                        >
                            <SettingsIcon className="w-5 h-5" />
                            {t('settings.tab.voice' as TranslationKey)}
                        </button>
                        <button
                            onClick={() => setActiveTab('notifications')}
                            className={`flex-1 flex items-center justify-center gap-2 p-3 text-sm font-semibold border-b-2 transition-colors duration-200 ${activeTab === 'notifications' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-white'}`}
                        >
                            <BellIcon className="w-5 h-5" />
                            {t('settings.tab.notifications' as TranslationKey)}
                        </button>
                        <button
                            onClick={() => setActiveTab('appearance')}
                            className={`flex-1 flex items-center justify-center gap-2 p-3 text-sm font-semibold border-b-2 transition-colors duration-200 ${activeTab === 'appearance' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-white'}`}
                        >
                            <PaletteIcon className="w-5 h-5" />
                            {t('settings.tab.appearance' as TranslationKey)}
                        </button>
                        <button
                            onClick={() => setActiveTab('language')}
                            className={`flex-1 flex items-center justify-center gap-2 p-3 text-sm font-semibold border-b-2 transition-colors duration-200 ${activeTab === 'language' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-white'}`}
                        >
                            <LanguageIcon className="w-5 h-5" />
                            {t('settings.tab.language' as TranslationKey)}
                        </button>
                    </div>
                    
                    <div className="max-h-[60vh] overflow-y-auto">
                        {activeTab === 'notifications' && <NotificationsPanel />}
                        {activeTab === 'appearance' && <AppearancePanel />}
                        {activeTab === 'voice' && <VoicePanel speechHook={speechHook} />}
                        {activeTab === 'language' && <LanguagePanel />}
                    </div>

                    <div className="p-4 bg-background/50 rounded-b-lg text-right border-t border-border">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-border text-white font-semibold rounded-lg hover:bg-border/70 transition-colors duration-200"
                        >
                            {t('settings.close' as TranslationKey)}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
