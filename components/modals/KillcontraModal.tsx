import React, { useEffect } from 'react';
import { AlertTriangleIcon } from '../ui/icons';

interface KillcontraModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: React.ReactNode;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
}

export const KillcontraModal: React.FC<KillcontraModalProps> = ({
    isOpen,
    onClose,
    title,
    message,
    onConfirm,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar'
}) => {
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

    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    return (
        <div 
            className="fixed inset-0 z-50"
            role="dialog" aria-modal="true" aria-labelledby="killcontra-modal-title"
        >
            <div
                className="fixed inset-0 bg-background/80 animate-fade-in z-40"
                onClick={onClose}
                aria-hidden="true"
            ></div>
            <div className="flex items-center justify-center h-full">
                <div 
                    className="bg-surface border border-error/50 rounded-lg shadow-2xl shadow-error/20 w-full max-w-md m-4 transform transition-all animate-slide-up flex flex-col relative z-50"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="p-6 text-center">
                        <div className="w-16 h-16 mx-auto flex items-center justify-center rounded-full bg-error/10 border-2 border-error/30 mb-4">
                            <AlertTriangleIcon className="w-10 h-10 text-error" />
                        </div>
                        <h2 id="killcontra-modal-title" className="text-2xl font-bold text-error">
                            {title}
                        </h2>
                         <div className="mt-2 text-text-secondary">
                            {message}
                        </div>
                    </div>
                    
                    <div className="p-4 bg-background/50 rounded-b-lg flex justify-end items-center gap-4 border-t border-border">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-border text-white font-semibold rounded-lg hover:bg-border/70 transition-colors duration-200"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="px-6 py-2 bg-error text-white font-bold rounded-lg hover:bg-red-700 transition-colors"
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};