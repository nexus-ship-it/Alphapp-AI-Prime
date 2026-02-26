
import React from 'react';
import { HistoryItem } from '../../types';
import { useI18n } from '../../contexts/I18nContext';
import { TranslationKey } from '../../i18n/translations';

export const HistoryModal: React.FC<{
    isOpen: boolean; onClose: () => void; history: HistoryItem[]; onLoad: (item: HistoryItem) => void; onClear: () => void;
}> = ({ isOpen, onClose, history, onLoad, onClear }) => {
    const { t } = useI18n();
    if (!isOpen) return null;
    const handleLoadItem = (item: HistoryItem) => { onLoad(item); onClose(); };
    return (
        <div className="fixed inset-0 z-50">
            <div className="fixed inset-0 bg-background/80 animate-fade-in z-40" onClick={onClose} />
            <div className="flex items-center justify-center h-full">
                <div className="bg-surface border border-border rounded-lg shadow-xl w-full max-w-2xl m-4 transform transition-all animate-slide-up flex flex-col relative z-50" onClick={e => e.stopPropagation()}>
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute top-3 right-3 p-1 rounded-full text-text-secondary hover:bg-border/50 text-2xl leading-none w-8 h-8 flex items-center justify-center z-10"
                        aria-label={t('common.close' as TranslationKey)}
                    >
                        &times;
                    </button>
                    <div className="p-4 border-b border-border">
                        <h2 className="text-xl font-bold text-text-primary">{t('modal.history.title' as TranslationKey)}</h2>
                    </div>
                    <div className="p-4 max-h-[60vh] overflow-y-auto">
                        {history.length === 0 ? (
                            <p className="text-text-tertiary text-center py-8">{t('modal.history.empty' as TranslationKey)}</p>
                        ) : (
                            <ul className="space-y-2">
                                {history.map(item => (
                                    <li key={item.timestamp} onClick={() => handleLoadItem(item)} className="p-3 rounded-md transition-colors duration-200 hover:bg-border/50 cursor-pointer border border-transparent hover:border-primary/50">
                                        <p className="font-semibold text-text-primary truncate">{item.analysisResult.metadata.title || item.url}</p>
                                        <p className="text-xs text-text-secondary">{new Date(item.timestamp).toLocaleString()}</p>
                                        <p className="text-sm text-text-tertiary mt-1 truncate">{item.analysisResult.summary}</p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <div className="p-4 bg-background/50 rounded-b-lg flex justify-end items-center gap-4 border-t border-border">
                        <button onClick={onClear} disabled={history.length === 0} className="px-6 py-2 bg-error/20 text-error font-semibold rounded-lg hover:bg-error/30 transition-colors disabled:opacity-50">
                            {t('modal.history.clear' as TranslationKey)}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};