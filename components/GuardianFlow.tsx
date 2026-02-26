
import React, { useState } from 'react';
import { useProjectContext } from '../contexts/ProjectContext';
import { ShieldCheckIcon, AlertTriangleIcon, BugIcon, ActivityIcon, SpinnerIcon, CheckCircleIcon, KeyIcon, DeployIcon } from './ui/icons';
import * as geminiService from '../services/geminiService';
import { useToastContext } from '../contexts/ToastContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const GuardianFlow: React.FC = () => {
    const { projectFiles, projectName, isProjectLoaded } = useProjectContext();
    const { addToast } = useToastContext();
    const [isLoading, setIsLoading] = useState(false);
    const [report, setReport] = useState<string | null>(null);

    const handleThreatModel = async () => {
        if (!isProjectLoaded || !projectFiles) {
            addToast({ type: 'warning', title: 'Sin Proyecto', message: 'Carga un proyecto para analizar su seguridad.' });
            return;
        }
        setIsLoading(true);
        try {
            const res = await geminiService.generateThreatModel(projectName || "Proyecto Sin Nombre", projectFiles);
            setReport(res);
            addToast({ type: 'success', title: 'Escaneo Completo', message: 'Modelado de amenazas STRIDE generado.' });
        } catch (e) {
            addToast({ type: 'error', title: 'Fallo de Guardian', message: 'No se pudo completar el escaneo de seguridad.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full h-full p-8 animate-fade-in flex flex-col items-center">
            <div className="max-w-6xl w-full">
                <header className="mb-12 text-center relative">
                    <div className="absolute inset-0 bg-primary/10 blur-[100px] -z-10 rounded-full" />
                    <ShieldCheckIcon className="w-20 h-20 text-primary mx-auto mb-4 drop-shadow-glow-primary" />
                    <h1 className="text-5xl font-black text-white tracking-tighter">CENTRO DE MANDO GUARDIAN</h1>
                    <p className="text-text-secondary mt-2 uppercase tracking-[0.3em] text-sm">Protocolo de Integridad Modo Dios Activado</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <button onClick={handleThreatModel} disabled={isLoading} className="group bg-surface/40 border border-border/50 p-6 rounded-2xl hover:border-primary transition-all text-left">
                        <BugIcon className="w-10 h-10 text-primary mb-4" />
                        <h3 className="text-xl font-bold text-white">Modelado STRIDE</h3>
                        <p className="text-sm text-text-secondary mt-2">Identifica Spoofing, Tampering y otros vectores de ataque.</p>
                    </button>
                    <div className="group bg-surface/40 border border-border/50 p-6 rounded-2xl hover:border-accent transition-all text-left opacity-50 cursor-not-allowed">
                        <KeyIcon className="w-10 h-10 text-accent mb-4" />
                        <h3 className="text-xl font-bold text-white">Vault Monitor</h3>
                        <p className="text-sm text-text-secondary mt-2">Detección de secretos y gestión de rotación de claves (Próximamente).</p>
                    </div>
                    <div className="group bg-surface/40 border border-border/50 p-6 rounded-2xl hover:border-success transition-all text-left opacity-50 cursor-not-allowed">
                        <DeployIcon className="w-10 h-10 text-success mb-4" />
                        <h3 className="text-xl font-bold text-white">K8s Hardening</h3>
                        <p className="text-sm text-text-secondary mt-2">Análisis de políticas de red y seguridad de pods (Próximamente).</p>
                    </div>
                </div>

                <div className="bg-surface/30 border border-border/50 rounded-3xl overflow-hidden backdrop-blur-xl">
                    <div className="p-6 border-b border-border/50 flex justify-between items-center bg-white/5">
                        <div className="flex items-center gap-2">
                            <ActivityIcon className="w-5 h-5 text-primary animate-pulse" />
                            <span className="font-bold text-text-primary uppercase tracking-widest text-xs">Reporte de Seguridad en Tiempo Real</span>
                        </div>
                        {report && (
                            <button onClick={() => setReport(null)} className="text-[10px] text-text-tertiary hover:text-white uppercase">Limpiar</button>
                        )}
                    </div>
                    <div className="p-8 min-h-[400px]">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center h-64">
                                <SpinnerIcon className="w-12 h-12 text-primary animate-spin mb-4" />
                                <p className="font-mono text-primary animate-pulse">ANALIZANDO VECTORES DE ATAQUE...</p>
                            </div>
                        ) : report ? (
                            <article className="prose prose-invert max-w-none prose-headings:text-primary prose-strong:text-accent prose-code:text-accent">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{report}</ReactMarkdown>
                            </article>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-text-tertiary">
                                <ShieldCheckIcon className="w-16 h-16 opacity-20 mb-4" />
                                <p>Inicia un escaneo para ver los resultados.</p>
                                {isProjectLoaded && <p className="text-xs mt-2">Analizando: {projectName}</p>}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GuardianFlow;
