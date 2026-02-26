

import React, { useEffect } from 'react';
import { Conversation } from '../types';
import { HistoryIcon, RefreshIcon, TrashIcon } from './ui/icons';
import { useI18n } from '../contexts/I18nContext';
import { TranslationKey } from '../i18n/translations';

interface ChatHistoryPanelProps {
    isOpen: boolean;
    onClose: () => void;
    conversations: Conversation[];
    onLoadConversation: (id: string) => void;
    onDeleteConversation: (id: string) => void;
    onNewChat: () => void;
}

const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 60) return 'hace un momento';
    if (diffSeconds < 3600) return `hace ${Math.floor(diffSeconds / 60)} min`;
    if (diffSeconds < 86400) return `hace ${Math.floor(diffSeconds / 3600)} horas`;
    
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
};

export const ChatHistoryPanel: React.FC<ChatHistoryPanelProps> = ({
    isOpen,
    onClose,
    conversations,
    onLoadConversation,
    onDeleteConversation,
    onNewChat,
}) => {
    const { t } = useI18n();
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
        }
        return () => {
            window.removeEventListener('keydown', handleEsc);
        };
    }, [isOpen, onClose]);

    const handleLoad = (id: string) => {
        onLoadConversation(id);
        onClose();
    };

    const handleDelete = (e: React.MouseEvent, conversation: Conversation) => {
        e.stopPropagation();
        if (window.confirm(t('modal.chatHistory.confirmDelete' as TranslationKey, { title: conversation.title }))) {
            onDeleteConversation(conversation.id);
        }
    };

    const handleNewChat = () => {
        onNewChat();
        onClose();
    };
    
    return (
        <>
            <div
                className={`fixed inset-0 bg-background/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
                aria-hidden="true"
            ></div>
            <aside
                className={`fixed top-0 left-0 h-full w-80 bg-surface shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="history-panel-title"
            >
                <div className="p-4 border-b border-border flex justify-between items-center">
                    <h2 id="history-panel-title" className="text-xl font-bold text-text-primary flex items-center gap-2">
                        <HistoryIcon className="w-6 h-6" />
                        {t('modal.chatHistory.title' as TranslationKey)}
                    </h2>
                    <button onClick={handleNewChat} className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-focus transition-colors text-sm" aria-label={t('modal.chatHistory.new' as TranslationKey)}>
                        <RefreshIcon className="w-4 h-4" />
                        {t('modal.chatHistory.new' as TranslationKey)}
                    </button>
                </div>
                <div className="p-2 h-[calc(100%-65px)] overflow-y-auto">
                    {conversations.length > 0 ? (
                        <ul className="space-y-1">
                            {conversations.map((conv) => (
                                <li key={conv.id}>
                                    <div
                                        onClick={() => handleLoad(conv.id)}
                                        className="w-full p-3 rounded-lg text-left transition-colors duration-200 hover:bg-border/50 cursor-pointer group flex justify-between items-center"
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => e.key === 'Enter' && handleLoad(conv.id)}
                                    >
                                        <div className="flex-grow overflow-hidden">
                                            <p className="font-semibold text-text-primary truncate">{conv.title}</p>
                                            <p className="text-xs text-text-secondary">{formatTimestamp(conv.timestamp)}</p>
                                        </div>
                                        <button
                                            onClick={(e) => handleDelete(e, conv)}
                                            className="p-2 rounded-full text-text-secondary hover:bg-error/20 hover:text-error opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                            aria-label={t('modal.chatHistory.deleteAria' as TranslationKey, { title: conv.title })}
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center text-text-tertiary p-4">
                            <HistoryIcon className="w-12 h-12 mb-4" />
                            <p className="font-semibold">{t('modal.chatHistory.empty' as TranslationKey)}</p>
                            <p className="text-sm">{t('modal.chatHistory.emptyDescription' as TranslationKey)}</p>
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
};