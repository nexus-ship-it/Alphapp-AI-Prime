
import React, { useState, FormEvent, useEffect, useMemo, useCallback } from 'react';
import { FileNode, AnalysisIssue, AnalysisCategory } from '../types';
import DirectoryTree from './DirectoryTree';
import { useArchitectContext } from '../contexts/ArchitectContext';
import { TestTubeIcon, SpinnerIcon, StethoscopeIcon, ShieldCheckIcon, CopyIcon, MagicWandIcon, DeployIcon } from './ui/icons';
import { useToastContext } from '../contexts/ToastContext';
import { useModalContext } from '../contexts/ModalContext';
import { flattenFileTree } from '../services/fileUtils';
import { getCategoryInfo, AnalysisIssueCard } from './ui/AnalysisComponents';
import { CodeBlock } from './ui/CodeBlock';
import { useI18n } from '../contexts/I18nContext';

const ActionPanel: React.FC<{
    selectedFile: { path: string; content: string } | null;
    onRunReview: () => void;
    report: AnalysisIssue[] | null;
    isLoading: boolean;
    onIssueClick: (issue: AnalysisIssue) => void;
    onGenerateFix: (issue: AnalysisIssue) => void;
    fixingIssueId: string | null;
}> = React.memo(({ selectedFile, onRunReview, report, isLoading, onIssueClick, onGenerateFix, fixingIssueId }) => {
    const { t } = useI18n();
    const { generateTestForFile, runSovereignAudit, generateIaC, generateFullDocs } = useArchitectContext();

    const handleGenerateTest = () => {
        if (selectedFile && !isLoading) {
            generateTestForFile(selectedFile.path, selectedFile.content);
        }
    };
    
    const categoryInfo = getCategoryInfo(t);

    const groupedIssues = useMemo(() => {
        if (!report) return null;
        return report.reduce((acc, issue) => {
            if (!acc[issue.category]) acc[issue.category] = [];
            acc[issue.category].push(issue);
            return acc;
        }, {} as Record<AnalysisCategory, AnalysisIssue[]>);
    }, [report]);
    
    const getIssueId = (issue: AnalysisIssue) => `${issue.filePath}-${issue.line}-${issue.title}`;

    return (
        <div className="bg-surface/30 border border-border/50 rounded-xl flex flex-col h-full backdrop-blur-sm shadow-xl">
            <h3 className="text-xl font-bold text-text-primary p-4 border-b border-border/50 bg-gradient-to-r from-primary/10 to-transparent uppercase tracking-tighter">
                Protocolos de Acción
            </h3>
            <div className="flex-grow overflow-y-auto p-4 space-y-8 custom-scrollbar">
                <section>
                    <h4 className="text-sm font-black text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-glow-primary"></div>
                        Ingeniería de Pruebas
                    </h4>
                    {!selectedFile ? (
                        <div className="p-4 rounded-lg bg-black/20 border border-border/30 text-center">
                            <p className="text-xs text-text-tertiary italic">Selecciona un archivo para inyectar pruebas unitarias.</p>
                        </div>
                    ) : (
                        <button
                            onClick={handleGenerateTest}
                            disabled={isLoading}
                            className="group relative flex w-full items-center justify-center gap-2 px-4 py-3 bg-surface/40 text-text-primary font-bold rounded-xl hover:bg-surface/60 transition-all border border-border/50 hover:border-primary/50"
                        >
                            {isLoading ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <TestTubeIcon className="w-5 h-5 text-primary group-hover:scale-110 transition-transform"/>}
                            <span className="text-xs uppercase tracking-tighter">Generar Test: {selectedFile.path.split('/').pop()}</span>
                        </button>
                    )}
                </section>

                <section>
                    <h4 className="text-sm font-black text-accent uppercase tracking-widest mb-4 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent shadow-glow-accent"></div>
                        Auditoría y Resiliencia
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                        <button
                            onClick={onRunReview}
                            disabled={isLoading}
                            className="flex w-full items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-primary/20 to-accent/20 text-white font-bold rounded-xl hover:from-primary/30 hover:to-accent/30 transition-all border border-primary/30"
                        >
                            {isLoading ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <ShieldCheckIcon className="w-5 h-5 text-primary" />}
                            <span className="text-xs uppercase tracking-tighter">Auditoría Estándar</span>
                        </button>
                        <button
                            onClick={runSovereignAudit}
                            disabled={isLoading}
                            className="flex w-full items-center justify-center gap-2 px-4 py-3 bg-primary text-white font-black rounded-xl hover:bg-primary-focus transition-all shadow-glow-primary"
                        >
                            {isLoading ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <ShieldCheckIcon className="w-5 h-5" />}
                            <span className="text-xs uppercase tracking-tighter">Auditoría Soberana (Omni)</span>
                        </button>
                    </div>
                </section>

                <section>
                    <h4 className="text-sm font-black text-highlight uppercase tracking-widest mb-4 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-highlight shadow-glow-highlight"></div>
                        Infraestructura y Docs
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                        <button
                            onClick={generateIaC}
                            disabled={isLoading}
                            className="flex w-full items-center justify-center gap-2 px-4 py-3 bg-surface/40 text-text-primary font-bold rounded-xl hover:bg-surface/60 transition-all border border-border/50"
                        >
                            <DeployIcon className="w-5 h-5 text-highlight" />
                            <span className="text-xs uppercase tracking-tighter">Generar IaC (K8s/Terraform)</span>
                        </button>
                        <button
                            onClick={generateFullDocs}
                            disabled={isLoading}
                            className="flex w-full items-center justify-center gap-2 px-4 py-3 bg-surface/40 text-text-primary font-bold rounded-xl hover:bg-surface/60 transition-all border border-border/50"
                        >
                            <CopyIcon className="w-5 h-5 text-accent" />
                            <span className="text-xs uppercase tracking-tighter">Documentación Omnisciente</span>
                        </button>
                    </div>
                </section>

                {report && report.length > 0 && (
                    <section className="animate-fade-in">
                        <h4 className="text-sm font-black text-error uppercase tracking-widest mb-4 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-error shadow-glow-error"></div>
                            Hallazgos del Sistema ({report.length})
                        </h4>
                        <div className="space-y-4">
                            {groupedIssues && (Object.keys(groupedIssues) as AnalysisCategory[]).map(category => {
                                const info = categoryInfo[category];
                                const issues = groupedIssues[category];
                                if (issues.length === 0) return null;
                                return (
                                    <div key={category} className="animate-fade-in">
                                        <div className="flex items-center gap-2 mb-2 px-1">
                                            <info.icon className={`w-4 h-4 ${info.color}`} />
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${info.color}`}>{info.title}</span>
                                        </div>
                                        <div className="space-y-3">
                                            {issues.map((issue, index) => (
                                                <AnalysisIssueCard 
                                                    key={index} 
                                                    issue={issue} 
                                                    onCardClick={onIssueClick} 
                                                    onGenerateFix={onGenerateFix}
                                                    isFixing={fixingIssueId === getIssueId(issue)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
});

export const Step3Preview: React.FC<{ fileStructure: FileNode; onModificationRequest: (r: string) => void; onApproval: () => void; }> = ({ fileStructure, onModificationRequest, onApproval }) => {
    const { t } = useI18n();
    const [selectedFile, setSelectedFile] = useState<{ path: string; content: string } | null>(null);
    const [modRequest, setModRequest] = useState('');
    const { openModal, closeModal } = useModalContext();
    const { isLoading, analysisReport, runCodeReview, fixingIssueId, generateFix, applyFix } = useArchitectContext();
    
    const flatFileTree = useMemo(() => flattenFileTree(fileStructure), [fileStructure]);
    
    useEffect(() => {
        if (flatFileTree.length > 0 && !selectedFile) setSelectedFile(flatFileTree[0]);
    }, [flatFileTree, selectedFile]);

    const handleFileSelect = useCallback((path: string, content: string) => setSelectedFile({ path, content }), []);
    
    const handleModSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (modRequest.trim() && !isLoading) {
            onModificationRequest(modRequest);
            setModRequest('');
        }
    };
    
    const handleIssueClick = useCallback((issue: AnalysisIssue) => {
        const file = flatFileTree.find(f => f.path === issue.filePath);
        if (file) setSelectedFile(file);
    }, [flatFileTree]);
    
    const handleGenerateFix = useCallback(async (issue: AnalysisIssue) => {
        const fix = await generateFix(issue);
        if (fix) openModal('fixSuggestion', { fix, onApply: () => { applyFix(fix); closeModal(); } });
    }, [generateFix, openModal, applyFix, closeModal]);

    return (
        <div className="w-full flex flex-col gap-6 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[75vh]">
                <div className="lg:col-span-3 bg-surface/30 border border-border/50 rounded-xl p-4 overflow-y-auto custom-scrollbar backdrop-blur-sm">
                    <DirectoryTree structure={fileStructure} onFileSelect={handleFileSelect} selectedFile={selectedFile?.path ?? null} />
                </div>
                <div className="lg:col-span-5 flex flex-col gap-4">
                    <div className="flex-grow flex flex-col bg-background/80 border border-border/50 rounded-xl overflow-hidden shadow-2xl">
                        {selectedFile ? (
                            <>
                                <div className="p-3 bg-surface/50 border-b border-border/50 flex justify-between items-center px-4">
                                    <span className="text-xs font-mono text-accent truncate">{selectedFile.path}</span>
                                    <button onClick={() => navigator.clipboard.writeText(selectedFile.content)} className="p-1 hover:text-white transition-colors"><CopyIcon className="w-4 h-4"/></button>
                                </div>
                                <div className="flex-grow overflow-auto p-2 bg-black/40">
                                    <CodeBlock language={selectedFile.path.split('.').pop() || 'text'}>{selectedFile.content}</CodeBlock>
                                </div>
                            </>
                        ) : <div className="m-auto opacity-40">Selecciona un archivo</div>}
                    </div>
                    <form onSubmit={handleModSubmit} className="bg-surface/30 p-4 border border-border/50 rounded-xl flex flex-col gap-2">
                         <textarea value={modRequest} onChange={e => setModRequest(e.target.value)} placeholder={t('preview.modificationPlaceholder' as any)} className="bg-background border border-border p-3 rounded-lg text-sm resize-none h-20 outline-none focus:ring-1 focus:ring-primary" />
                         <button type="submit" disabled={!modRequest.trim() || isLoading} className="py-2 bg-accent text-white font-bold rounded-lg hover:brightness-110 transition-all flex items-center justify-center gap-2">
                             {isLoading ? <SpinnerIcon className="w-4 h-4 animate-spin"/> : <MagicWandIcon className="w-4 h-4"/>}
                             {t('common.sendRequest' as any)}
                         </button>
                    </form>
                </div>
                <div className="lg:col-span-4">
                    <ActionPanel selectedFile={selectedFile} onRunReview={runCodeReview} report={analysisReport} isLoading={isLoading} onIssueClick={handleIssueClick} onGenerateFix={handleGenerateFix} fixingIssueId={fixingIssueId} />
                </div>
            </div>
            <div className="flex justify-end">
                <button onClick={onApproval} className="px-10 py-4 bg-primary text-white font-black text-xl rounded-xl shadow-glow-primary hover:scale-105 transition-all">
                    {t('preview.approveAndContinue' as any)}
                </button>
            </div>
        </div>
    );
};
