import React, { useCallback } from 'react';
import { AnalysisIssue, AnalysisCategory } from '../../types';
import {
    ShieldCheckIcon, PackageIcon, CheckCircleIcon, LightbulbIcon,
    SpinnerIcon, BugIcon, DeployIcon, KeyIcon, MagicWandIcon
} from './icons';
import { TranslationKey } from '../../i18n/translations';
import { useI18n } from '../../contexts/I18nContext';

export const getSeverityClass = (severity: AnalysisIssue['severity']) => {
    switch (severity) {
        case 'Crítica': return 'bg-red-900/40 text-red-200 border-red-500/50 shadow-red-500/10';
        case 'Alta': return 'bg-orange-900/40 text-orange-200 border-orange-500/50';
        case 'Media': return 'bg-yellow-900/40 text-yellow-200 border-yellow-500/50';
        case 'Baja': return 'bg-blue-900/40 text-blue-200 border-blue-500/50';
        case 'Informativa': return 'bg-gray-800/40 text-gray-200 border-gray-600/50';
        default: return 'bg-gray-700 text-gray-300 border-gray-600';
    }
};

export const getCategoryInfo = (t: (key: TranslationKey, replacements?: Record<string, string>) => string): Record<AnalysisCategory, { icon: React.FC<{className?: string}>, color: string, title: string }> => ({
    'Seguridad': { icon: ShieldCheckIcon, color: 'text-red-400', title: t('analysis.category.security' as TranslationKey) },
    'Análisis de Dependencias': { icon: BugIcon, color: 'text-orange-400', title: t('analysis.category.dependencies' as TranslationKey) },
    'Optimización de Dependencias': { icon: PackageIcon, color: 'text-purple-400', title: t('analysis.category.dependencyOptimization' as TranslationKey) },
    'Calidad': { icon: CheckCircleIcon, color: 'text-yellow-400', title: t('analysis.category.quality' as TranslationKey) },
    'Mejores Prácticas': { icon: LightbulbIcon, color: 'text-blue-400', title: t('analysis.category.bestPractices' as TranslationKey) },
    'Infraestructura': { icon: DeployIcon, color: 'text-teal-400', title: t('analysis.category.infrastructure' as TranslationKey) },
    'Licenciamiento': { icon: PackageIcon, color: 'text-gray-400', title: t('analysis.category.licensing' as TranslationKey) },
    'Detección de Secretos': { icon: KeyIcon, color: 'text-red-500', title: t('analysis.category.secrets' as TranslationKey) },
});

export const AnalysisIssueCard: React.FC<{ 
    issue: AnalysisIssue; 
    onCardClick: (issue: AnalysisIssue) => void;
    onGenerateFix: (issue: AnalysisIssue) => void;
    onExplain?: (issue: AnalysisIssue) => void;
    isFixing: boolean;
}> = React.memo(({ issue, onCardClick, onGenerateFix, onExplain, isFixing }) => {
    const { t } = useI18n();
    const handleCardClick = useCallback(() => onCardClick(issue), [onCardClick, issue]);
    const handleFixClick = useCallback(() => onGenerateFix(issue), [onGenerateFix, issue]);
    const handleExplainClick = useCallback(() => onExplain?.(issue), [onExplain, issue]);

    const isCritical = issue.severity === 'Crítica' || issue.severity === 'Alta';

    return (
        <div className={`group relative bg-surface/40 border border-border/50 rounded-xl p-5 transition-all duration-300 backdrop-blur-sm shadow-sm
            ${issue.isResolved ? 'opacity-60 bg-success/5 border-success/30' : 'hover:bg-surface/60 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5'}
            ${!issue.isResolved && isCritical ? 'animate-pulse-slow border-l-4 border-l-error' : ''}
        `}>
            <div onClick={handleCardClick} className="cursor-pointer">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex-grow pr-4">
                        <h3 className="text-lg font-bold text-text-primary group-hover:text-primary transition-colors">
                            {t(issue.title as TranslationKey)}
                        </h3>
                        <p className="text-xs font-mono text-text-tertiary mt-1 bg-black/20 inline-block px-2 py-0.5 rounded">
                            {issue.filePath}:{issue.line}
                        </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-black border transition-all ${getSeverityClass(issue.severity)}`}>
                        {t(issue.severity as TranslationKey)}
                    </span>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed mb-4">
                    {t(issue.description as TranslationKey)}
                </p>
            </div>

            <div className="mt-4 pt-4 border-t border-border/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                 <div className="flex-grow w-full sm:w-auto">
                    <div className="flex items-center gap-2 mb-2">
                        <LightbulbIcon className="w-4 h-4 text-accent" />
                        <h4 className="text-xs font-bold text-accent uppercase tracking-widest">{t('analysis.suggestion' as TranslationKey)}</h4>
                    </div>
                    <div className="bg-black/30 p-3 rounded-lg border border-white/5">
                        <p className="text-sm text-text-primary font-mono italic leading-relaxed whitespace-pre-wrap">
                            {t(issue.suggestion as TranslationKey)}
                        </p>
                    </div>
                </div>

                 <div className="flex flex-shrink-0 items-center gap-3 w-full sm:w-auto justify-end">
                     {onExplain && !issue.isResolved && (
                         <button 
                            onClick={handleExplainClick} 
                            className="p-2.5 rounded-lg bg-surface border border-border text-text-secondary hover:text-info hover:border-info transition-all flex items-center gap-2"
                            title={t('analysis.explain' as TranslationKey)}
                        >
                             <LightbulbIcon className="w-5 h-5" />
                        </button>
                     )}
                     
                     {issue.isResolved ? (
                        <div className="flex items-center gap-2 text-success font-bold text-sm bg-success/10 px-4 py-2 rounded-lg border border-success/20">
                            <CheckCircleIcon className="w-5 h-5" />
                            <span>{t('analysis.resolved' as TranslationKey)}</span>
                        </div>
                     ) : (
                        <button 
                            onClick={handleFixClick} 
                            disabled={isFixing}
                            className="flex-grow sm:flex-grow-0 flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-primary to-accent text-white font-bold rounded-lg hover:brightness-110 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-wait shadow-lg shadow-primary/20"
                        >
                            {isFixing ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <MagicWandIcon className="w-5 h-5" />}
                            <span>{isFixing ? t('analysis.generatingFix' as TranslationKey) : t('analysis.generateFix' as TranslationKey)}</span>
                        </button>
                     )}
                 </div>
            </div>
            <style>{`
                @keyframes pulse-slow {
                    0%, 100% { border-color: rgba(var(--color-error), 0.3); }
                    50% { border-color: rgba(var(--color-error), 0.7); }
                }
                .animate-pulse-slow {
                    animation: pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
            `}</style>
        </div>
    );
});
