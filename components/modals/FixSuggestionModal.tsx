

import React from 'react';
import { AnalysisIssue } from '../../types';
import { useI18n } from '../../contexts/I18nContext';
import { TranslationKey } from '../../i18n/translations';

export const FixSuggestionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onApply: () => void;
    fix: { issue: AnalysisIssue; originalContent: string; fixedContent: string };
}> = ({ isOpen, onClose, onApply, fix }) => {
    const { t } = useI18n();
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50">
            <div className="fixed inset-0 bg-background/80 animate-fade-in z-40" onClick={onClose} />
            <div className="flex items-center justify-center h-full">
                <div className="bg-surface border border-border rounded-lg shadow-xl w-full max-w-6xl h-[90vh] m-4 transform transition-all animate-slide-up flex flex-col relative z-50" onClick={(e) => e.stopPropagation()}>
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute top-3 right-3 p-1 rounded-full text-text-secondary hover:bg-border/50 text-2xl leading-none w-8 h-8 flex items-center justify-center z-10"
                        aria-label={t('common.close' as TranslationKey)}
                    >
                        &times;
                    </button>
                    <div className="p-4 border-b border-border">
                        <h2 className="text-xl font-bold text-text-primary">{t('modal.fix.title' as TranslationKey)}</h2>
                        <p className="text-sm text-text-secondary mt-1">{t('modal.fix.description' as TranslationKey, { title: fix.issue.title })}</p>
                    </div>
                    <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 p-4 overflow-hidden min-h-0">
                        <div className="flex flex-col h-full">
                            <h3 className="text-lg font-semibold text-red-400 mb-2 text-center">{t('modal.fix.original' as TranslationKey)}</h3>
                            <div className="flex-grow bg-background rounded-lg p-3 overflow-auto font-mono text-sm border border-red-500/30">
                                <pre><code>{fix.originalContent}</code></pre>
                            </div>
                        </div>
                         <div className="flex flex-col h-full">
                            <h3 className="text-lg font-semibold text-green-400 mb-2 text-center">{t('modal.fix.fixed' as TranslationKey)}</h3>
                            <div className="flex-grow bg-background rounded-lg p-3 overflow-auto font-mono text-sm border border-green-500/30">
                                 <pre><code>{fix.fixedContent}</code></pre>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 bg-background/50 rounded-b-lg flex justify-end items-center gap-4 border-t border-border">
                        <button onClick={onClose} className="px-6 py-2 bg-border text-white font-semibold rounded-lg hover:bg-border/70 transition-colors">{t('common.cancel' as TranslationKey)}</button>
                        <button onClick={() => { onApply(); onClose(); }} className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary-focus transition-colors">{t('modal.fix.apply' as TranslationKey)}</button>
                    </div>
                </div>
            </div>
        </div>
    );
};