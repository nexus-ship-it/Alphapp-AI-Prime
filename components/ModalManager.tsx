
import React from 'react';
import { useModalContext } from '../contexts/ModalContext';
import { SettingsModal } from './SettingsModal';
import { AuthModal } from './AuthModal';
import { ChatHistoryPanel } from './ChatHistoryPanel';
import { FixSuggestionModal } from './modals/FixSuggestionModal';
import { TutorChatModal } from './modals/TutorChatModal';
import { HistoryModal } from './modals/HistoryModal';
import { KillcontraModal } from './modals/KillcontraModal';
import { SupportModal } from './modals/SupportModal';
import LinkAnalysisModal from './modals/LinkAnalysisModal';
import { BazaModal } from './modals/BazaModal';
import { AgentModal } from './modals/AgentModal';
import { DesignModal } from './modals/DesignModal'; // Import the new modal

export const ModalManager: React.FC = () => {
    const { modal, closeModal } = useModalContext();

    if (!modal.type) {
        return null;
    }

    switch (modal.type) {
        case 'settings':
            return <SettingsModal isOpen={true} onClose={closeModal} {...modal.props as any} />;
        case 'auth':
            return <AuthModal isOpen={true} onClose={closeModal} {...modal.props as any} />;
        case 'chatHistory':
            return <ChatHistoryPanel isOpen={true} onClose={closeModal} {...modal.props as any} />;
        case 'fixSuggestion':
             return <FixSuggestionModal isOpen={true} onClose={closeModal} {...modal.props as any} />;
        case 'tutor':
             return <TutorChatModal isOpen={true} onClose={closeModal} {...modal.props as any} />;
        case 'linkHistory':
             return <HistoryModal isOpen={true} onClose={closeModal} {...modal.props as any} />;
        case 'killcontra':
             return <KillcontraModal isOpen={true} onClose={closeModal} {...modal.props as any} />;
        case 'support':
             return <SupportModal isOpen={true} onClose={closeModal} {...modal.props as any} />;
        case 'linkAnalysis':
            return <LinkAnalysisModal isOpen={true} onClose={closeModal} {...modal.props as any} />;
        case 'baza':
            return <BazaModal isOpen={true} onClose={closeModal} />;
        case 'agentModal':
            return <AgentModal isOpen={true} onClose={closeModal} />;
        case 'designModal': // New case for DesignModal
            return <DesignModal isOpen={true} onClose={closeModal} />;
        default:
            return null;
    }
};
