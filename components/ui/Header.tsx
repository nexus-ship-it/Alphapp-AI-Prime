

import React from 'react';
import { SpeakerOnIcon, SpeakerOffIcon, SettingsIcon, RefreshIcon } from './icons';

interface HeaderProps {
    onLogoClick: () => void;
    onNewChat: () => void;
    isTtsEnabled: boolean;
    onToggleTts: () => void;
    onOpenVoiceModal: () => void;
    showChatControls: boolean;
    isReadOnly?: boolean;
}

export const Header: React.FC<HeaderProps> = React.memo(({ 
    onLogoClick, 
    onNewChat, 
    isTtsEnabled, 
    onToggleTts, 
    onOpenVoiceModal,
    showChatControls,
    isReadOnly = false
}) => {
    return (
        <header className="w-full max-w-4xl flex justify-between items-center py-4">
            <div 
                className="flex items-center space-x-3 cursor-pointer group"
                onClick={onLogoClick}
                aria-label="Back to home"
            >
                <svg
                    className="w-8 h-8 text-primary group-hover:text-primary-focus transition-colors duration-300"
                    viewBox="0 0 100 100"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                >
                    <path d="M50 5L5 95H28.5L50 48.5L71.5 95H95L50 5z M50 58.5L36.5 87.5H63.5L50 58.5z" />
                </svg>
                <h1 className="text-2xl font-bold text-text-primary group-hover:text-white transition-colors duration-300">
                    Alphapp AI
                </h1>
            </div>
            {showChatControls && !isReadOnly && (
                <div className="flex items-center space-x-2">
                    <button
                        onClick={onNewChat}
                        className="p-2 rounded-full transition-colors duration-300 bg-surface text-text-secondary hover:bg-primary/20 hover:text-white"
                        aria-label="Start new chat"
                    >
                        <RefreshIcon className="w-6 h-6" />
                    </button>
                    <button
                        onClick={onOpenVoiceModal}
                        className="p-2 rounded-full transition-colors duration-300 bg-surface text-text-secondary hover:bg-primary/20 hover:text-white"
                        aria-label="Change voice"
                    >
                        <SettingsIcon className="w-6 h-6" />
                    </button>
                    <button
                        onClick={onToggleTts}
                        className={`p-2 rounded-full transition-colors duration-300 ${isTtsEnabled ? 'bg-primary text-white' : 'bg-surface text-text-secondary hover:bg-primary/20 hover:text-white'}`}
                        aria-label={isTtsEnabled ? "Disable text-to-speech" : "Enable text-to-speech"}
                    >
                        {isTtsEnabled ? <SpeakerOnIcon className="w-6 h-6" /> : <SpeakerOffIcon className="w-6 h-6" />}
                    </button>
                </div>
            )}
        </header>
    );
});