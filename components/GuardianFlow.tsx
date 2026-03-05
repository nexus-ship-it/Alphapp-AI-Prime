
import React, { useState, useEffect } from 'react';
import { useProjectContext } from '../contexts/ProjectContext';
import { ShieldCheckIcon, AlertTriangleIcon, BugIcon, ActivityIcon, SpinnerIcon, CheckCircleIcon, KeyIcon, DeployIcon, NetworkIcon } from './ui/icons';
import * as geminiService from '../services/geminiService';
import { useToastContext } from '../contexts/ToastContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const TerminalOutput: React.FC<{ lines: string[] }> = ({ lines }) => {
    return (
        <div className="bg-black/80 border border-primary/30 rounded-xl p-4 font-mono text-xs text-primary/80 h-48 overflow-y-auto shadow-inner">
            <div className="flex items-center gap-2 mb-2 border-b border-primary/20 pb-2">
                <div className="w-2 h-2 rounded-full bg-error animate-pulse"></div>
                <div className="w-2 h-2 rounded-full bg-warning animate-pulse delay-75"></div>
                <div className="w-2 h-2 rounded-full bg-success animate-pulse delay-150"></div>
                <span className="ml-2 text-primary opacity-50">/var/log/guardian.sys</span>
            </div>
            {lines.map((line, i) => (
                <div key={i} className="mb-1">
                    <span className="text-accent/50 mr-2">[{new Date().toISOString().split('T')[1].split('.')[0]}]</span>
                    {line}
                </div>
            ))}
            <div className="animate-pulse">_</div>
        </div>
    );
};

const GuardianFlow: React.FC = () => {
    const { projectFiles, projectName, isProjectLoaded } = useProjectContext();
    const { addToast } = useToastContext();
    const [isLoading, setIsLoading] = useState(false);
    const [report, setReport] = useState<string | null>(null);
    const [terminalLines, setTerminalLines] = useState<string[]>(['Inicializando Protocolo Guardian...', 'Estableciendo conexión segura con el núcleo...', 'Esperando directivas...']);

    const addTerminalLine = (line: string) => {
        setTerminalLines(prev => [...prev.slice(-15), line]);
    };

    const handleThreatModel = async () => {
        if (!isProjectLoaded || !projectFiles) {
            addToast({ type: 'warning', title: 'Sin Proyecto', message: 'Carga un proyecto para analizar su seguridad.' });
            addTerminalLine('ERROR: No se detectó ningún proyecto en el espacio de trabajo.');
            return;
        }
        setIsLoading(true);
        addTerminalLine(`Iniciando escaneo profundo en [${projectName}]...`);
        addTerminalLine('Analizando vectores de ataque STRIDE...');
        addTerminalLine('Verificando dependencias y configuraciones...');
        
        try {
            const res = await geminiService.generateThreatModel(projectName || "Proyecto Sin Nombre", projectFiles);
            setReport(res);
            addTerminalLine('Escaneo completado. Amenazas identificadas y mitigaciones propuestas.');
            addToast({ type: 'success', title: 'Escaneo Completo', message: 'Modelado de amenazas STRIDE generado.' });
        } catch (e) {
            addTerminalLine('ERROR CRÍTICO: Fallo en la comunicación con el motor de análisis.');
            addToast({ type: 'error', title: 'Fallo de Guardian', message: 'No se pudo completar el escaneo de seguridad.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full h-full p-4 sm:p-8 animate-fade-in flex flex-col items-center relative overflow-hidden">
            {/* Cyber Background */}
            <div className="absolute inset-0 pointer-events-none opacity-10" style={{ backgroundImage: 'linear-gradient(to right, rgba(var(--color-primary), 0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(var(--color-primary), 0.2) 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="max-w-6xl w-full z-10">
                <header className="mb-10 text-center relative">
                    <div className="inline-flex items-center justify-center p-4 rounded-full bg-surface/50 border border-primary/30 mb-6 shadow-glow-primary relative">
                        <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-[spin_4s_linear_infinite]"></div>
                        <div className="absolute inset-2 rounded-full border border-accent/30 animate-[spin_3s_linear_infinite_reverse]"></div>
                        <ShieldCheckIcon className="w-16 h-16 text-primary drop-shadow-text-glow-primary relative z-10" />
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tighter drop-shadow-md">
                        CENTRO DE MANDO <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">GUARDIAN</span>
                    </h1>
                    <div className="mt-4 inline-flex items-center gap-2 px-4 py-1 rounded-full bg-error/10 border border-error/30 text-error text-xs font-bold tracking-[0.2em] uppercase animate-pulse">
                        <AlertTriangleIcon className="w-4 h-4" />
                        Protocolo de Integridad Soberano Activado
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button onClick={handleThreatModel} disabled={isLoading} className="group relative bg-surface/60 border border-primary/30 p-6 rounded-2xl hover:border-primary transition-all text-left overflow-hidden backdrop-blur-sm shadow-lg">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <BugIcon className="w-10 h-10 text-primary mb-4 relative z-10 group-hover:scale-110 transition-transform" />
                            <h3 className="text-xl font-bold text-white relative z-10">Modelado STRIDE</h3>
                            <p className="text-sm text-text-secondary mt-2 relative z-10">Identifica Spoofing, Tampering y otros vectores de ataque avanzados.</p>
                            {isLoading && <div className="absolute bottom-0 left-0 h-1 bg-primary animate-progress-bar w-full"></div>}
                        </button>
                        
                        <div className="group bg-surface/40 border border-border/50 p-6 rounded-2xl text-left opacity-60 relative overflow-hidden backdrop-blur-sm">
                            <div className="absolute top-2 right-2 text-[9px] font-bold text-warning uppercase tracking-widest border border-warning/30 px-2 py-0.5 rounded-full">Próximamente</div>
                            <KeyIcon className="w-10 h-10 text-accent mb-4 grayscale group-hover:grayscale-0 transition-all" />
                            <h3 className="text-xl font-bold text-white">Vault Monitor</h3>
                            <p className="text-sm text-text-secondary mt-2">Detección de secretos y gestión de rotación de claves criptográficas.</p>
                        </div>
                        
                        <div className="group bg-surface/40 border border-border/50 p-6 rounded-2xl text-left opacity-60 relative overflow-hidden backdrop-blur-sm">
                            <div className="absolute top-2 right-2 text-[9px] font-bold text-warning uppercase tracking-widest border border-warning/30 px-2 py-0.5 rounded-full">Próximamente</div>
                            <DeployIcon className="w-10 h-10 text-success mb-4 grayscale group-hover:grayscale-0 transition-all" />
                            <h3 className="text-xl font-bold text-white">K8s Hardening</h3>
                            <p className="text-sm text-text-secondary mt-2">Análisis de políticas de red y seguridad de pods en clústeres.</p>
                        </div>

                        <div className="group bg-surface/40 border border-border/50 p-6 rounded-2xl text-left opacity-60 relative overflow-hidden backdrop-blur-sm">
                            <div className="absolute top-2 right-2 text-[9px] font-bold text-warning uppercase tracking-widest border border-warning/30 px-2 py-0.5 rounded-full">Próximamente</div>
                            <NetworkIcon className="w-10 h-10 text-highlight mb-4 grayscale group-hover:grayscale-0 transition-all" />
                            <h3 className="text-xl font-bold text-white">Zero Trust Net</h3>
                            <p className="text-sm text-text-secondary mt-2">Verificación continua y microsegmentación de red.</p>
                        </div>
                    </div>

                    <div className="lg:col-span-1 flex flex-col">
                        <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-2 flex items-center gap-2">
                            <ActivityIcon className="w-4 h-4" />
                            Telemetría del Sistema
                        </h3>
                        <TerminalOutput lines={terminalLines} />
                    </div>
                </div>

                <div className="bg-surface/50 border border-primary/20 rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>
                    <div className="p-4 sm:p-6 border-b border-border/50 flex justify-between items-center bg-black/20">
                        <div className="flex items-center gap-3">
                            <div className="relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                            </div>
                            <span className="font-bold text-white uppercase tracking-widest text-sm">Reporte de Inteligencia</span>
                        </div>
                        {report && (
                            <button onClick={() => setReport(null)} className="text-xs font-bold text-text-secondary hover:text-error uppercase transition-colors px-3 py-1 rounded-lg hover:bg-error/10">Purgar Datos</button>
                        )}
                    </div>
                    <div className="p-6 sm:p-8 min-h-[400px] relative">
                        {isLoading ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface/80 backdrop-blur-sm z-20">
                                <div className="relative w-24 h-24 mb-6">
                                    <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                                    <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                    <ShieldCheckIcon className="absolute inset-0 m-auto w-10 h-10 text-primary animate-pulse" />
                                </div>
                                <p className="font-mono text-primary font-bold tracking-widest animate-pulse">ANALIZANDO VECTORES DE ATAQUE...</p>
                                <p className="text-xs text-text-secondary mt-2 font-mono">Aplicando heurísticas de seguridad avanzadas</p>
                            </div>
                        ) : report ? (
                            <article className="prose prose-invert max-w-none prose-headings:text-primary prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-strong:text-accent prose-code:text-highlight prose-code:bg-highlight/10 prose-code:px-1 prose-code:rounded prose-a:text-info hover:prose-a:text-info/80 prose-pre:bg-black/60 prose-pre:border prose-pre:border-border/50">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{report}</ReactMarkdown>
                            </article>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-text-tertiary">
                                <ShieldCheckIcon className="w-20 h-20 opacity-10 mb-6" />
                                <p className="text-lg font-medium">Sistema en espera de directivas.</p>
                                <p className="text-sm mt-2 max-w-md text-center">Inicia un escaneo STRIDE para identificar vulnerabilidades arquitectónicas en el código fuente.</p>
                                {isProjectLoaded && <div className="mt-6 px-4 py-2 bg-surface border border-border/50 rounded-lg text-xs font-mono text-text-secondary">Objetivo fijado: <span className="text-primary">{projectName}</span></div>}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GuardianFlow;
