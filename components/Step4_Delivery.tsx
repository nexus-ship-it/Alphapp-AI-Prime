

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FileNode, TechStack } from '../types';
import * as zipService from '../services/zipService';
import * as geminiService from '../services/geminiService';
import { useToastContext } from '../contexts/ToastContext';
import { CopyIcon, DeployIcon, RefreshIcon, StethoscopeIcon, PackageIcon, PaletteIcon } from './ui/icons';
import { useArchitectContext } from '../contexts/ArchitectContext';
import { flattenFileTree, addFileToTree } from '../services/fileUtils';
import { CodeBlock } from './ui/CodeBlock';

const CommandBlock: React.FC<{ command: string }> = React.memo(({ command }) => {
    const { addToast } = useToastContext();
    const handleCopy = () => {
        navigator.clipboard.writeText(command).then(() => {
            addToast({ type: 'success', title: '¡Copiado!', message: 'Comando copiado al portapapeles.' });
        }, () => {
            addToast({ type: 'error', title: 'Error', message: 'No se pudo copiar el comando.' });
        });
    };

    return (
        <div className="bg-background/60 backdrop-blur-sm font-mono text-sm p-3 rounded-lg flex items-center justify-between border border-border/50">
            <pre><code>$ {command}</code></pre>
            <button onClick={handleCopy} className="p-1 text-text-secondary hover:text-white transition-colors" aria-label="Copiar comando">
                <CopyIcon className="w-4 h-4" />
            </button>
        </div>
    );
});

interface Step4DeliveryProps {
    fileStructure: FileNode;
    projectDescription: string;
    techStack: TechStack;
    onStartNew: () => void;
    onSendToDoctor: () => void;
    onSendToDeployer: () => void;
}

// FIX: Export Step4Delivery as a named export
export const Step4Delivery: React.FC<Step4DeliveryProps> = ({ fileStructure, projectDescription, techStack, onStartNew, onSendToDoctor, onSendToDeployer }) => {
    const [isDownloading, setIsDownloading] = useState(false);
    const { addToast } = useToastContext();
    const { sendToDoctor, sendToDeployer } = useArchitectContext();
    const [fontFiles, setFontFiles] = useState<FileList | null>(null);
    const fontInputRef = useRef<HTMLInputElement>(null);
    
    const [readmeContent, setReadmeContent] = useState<string | null>(null);
    const [ciCdContent, setCiCdContent] = useState<string | null>(null);
    const [isGeneratingArtifacts, setIsGeneratingArtifacts] = useState(true);

    const projectName = projectDescription.split(' ').slice(0, 5).join('-').toLowerCase().replace(/[^a-z0-9-]/g, '');
    
    useEffect(() => {
        const generateArtifacts = async () => {
            setIsGeneratingArtifacts(true);
            try {
                const flatFiles = flattenFileTree(fileStructure);
                const [readme, ciCd] = await Promise.all([
                    geminiService.generateReadme(projectDescription, techStack, flatFiles),
                    geminiService.generateCiCdWorkflow(projectDescription, techStack, flatFiles)
                ]);
                setReadmeContent(readme);
                setCiCdContent(ciCd);
            } catch (e) {
                const errorMessage = e instanceof Error ? e.message : "No se pudieron generar los artefactos del proyecto.";
                addToast({ type: 'error', title: 'Error de IA', message: errorMessage });
                setReadmeContent("# Error al generar el README.md.");
                setCiCdContent("# Error al generar el flujo de trabajo de CI/CD.");
            } finally {
                setIsGeneratingArtifacts(false);
            }
        };
        generateArtifacts();
    }, [fileStructure, projectDescription, techStack, addToast]);


    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            let structureToZip = fileStructure;
            if (readmeContent) {
                 structureToZip = addFileToTree(structureToZip, 'README.md', readmeContent);
            }
            if (ciCdContent) {
                structureToZip = addFileToTree(structureToZip, '.github/workflows/main.yml', ciCdContent);
            }
            const blob = await zipService.createProjectZip(structureToZip, projectName, fontFiles);
            zipService.downloadZip(blob, projectName);
        } catch (error) {
            console.error("Failed to create or download zip:", error);
            addToast({
                type: 'error',
                title: 'Error de Descarga',
                message: 'Hubo un error al generar el archivo .zip.',
            });
        } finally {
            setIsDownloading(false);
        }
    };
    
    const handleSendToDoctor = () => {
       sendToDoctor(); // This loads the project into the shared context.
       onSendToDoctor(); // This tells App.tsx to switch the mode.
    };

    const handleSendToDeployer = () => {
        sendToDeployer();
        onSendToDeployer();
    };

    const triggerFontFolderSelect = () => {
        fontInputRef.current?.click();
    };
    
    const handleFontFolderSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            setFontFiles(event.target.files);
        }
    };

    return (
        <div className="w-full max-w-5xl mx-auto text-center animate-fade-in pb-20">
            <div className="relative mb-12">
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/20 rounded-full blur-3xl -z-10"></div>
                <h1 className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-primary/50 mb-4 tracking-tighter uppercase drop-shadow-text-glow-primary">
                    Misión Cumplida
                </h1>
                <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-bold tracking-widest uppercase mb-4">
                    Arquitectura Sintetizada con Éxito
                </div>
                <p className="text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
                    El sistema ha sido compilado y verificado. Los activos están listos para su despliegue en el entorno de producción.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
                <div className="lg:col-span-7 space-y-6">
                    <div className="bg-surface/20 border border-border/50 rounded-3xl p-8 backdrop-blur-md text-left relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                            <PackageIcon className="w-32 h-32" />
                        </div>
                        <h3 className="text-2xl font-black text-text-primary mb-6 uppercase tracking-tighter flex items-center gap-3">
                            <div className="w-8 h-1 bg-primary"></div>
                            Paquete de Entrega
                        </h3>
                        
                        <div className="space-y-6">
                            <div>
                                <h4 className="text-sm font-black text-text-tertiary uppercase tracking-widest mb-3">Activos Tipográficos</h4>
                                <input
                                    type="file"
                                    ref={fontInputRef}
                                    onChange={handleFontFolderSelect}
                                    className="hidden"
                                    {...({ webkitdirectory: "true", directory: "true" } as any)}
                                    multiple
                                />
                                <button
                                    onClick={triggerFontFolderSelect}
                                    className="w-full px-6 py-4 border-2 border-dashed border-border/50 text-text-secondary rounded-2xl hover:border-primary/50 hover:text-primary transition-all duration-300 bg-black/20 flex items-center justify-center gap-3"
                                >
                                    <PaletteIcon className="w-5 h-5" />
                                    <span className="font-bold text-sm uppercase tracking-tighter">
                                        {fontFiles && fontFiles.length > 0 ? `${fontFiles.length} Fuentes Vinculadas` : 'Vincular Carpeta de Fuentes'}
                                    </span>
                                </button>
                            </div>

                            <button
                                onClick={handleDownload}
                                disabled={isDownloading || isGeneratingArtifacts}
                                className="group relative w-full px-8 py-5 bg-primary text-white font-black text-xl rounded-2xl hover:bg-primary-focus transition-all shadow-glow-primary disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                            >
                                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                                <span className="relative flex items-center justify-center gap-3 uppercase tracking-widest">
                                    {isDownloading ? 'Sincronizando...' : isGeneratingArtifacts ? 'Generando Núcleo...' : 'Descargar Sistema (.zip)'}
                                    <PackageIcon className="w-6 h-6" />
                                </span>
                            </button>
                        </div>
                    </div>

                    <div className="bg-surface/20 border border-border/50 rounded-3xl p-8 backdrop-blur-md text-left">
                        <h3 className="text-2xl font-black text-text-primary mb-6 uppercase tracking-tighter flex items-center gap-3">
                            <div className="w-8 h-1 bg-accent"></div>
                            Protocolos de Integración
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button
                                onClick={handleSendToDoctor}
                                disabled={isGeneratingArtifacts}
                                className="flex items-center justify-center gap-3 px-6 py-4 bg-surface/40 border border-border/50 text-text-primary font-bold rounded-2xl hover:bg-surface/60 hover:border-primary/50 transition-all group"
                            >
                                <StethoscopeIcon className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                                <span className="uppercase tracking-tighter text-sm">Auditoría Doctor</span>
                            </button>
                            <button
                                onClick={handleSendToDeployer}
                                disabled={isGeneratingArtifacts}
                                className="flex items-center justify-center gap-3 px-6 py-4 bg-surface/40 border border-border/50 text-text-primary font-bold rounded-2xl hover:bg-surface/60 hover:border-accent/50 transition-all group"
                            >
                                <DeployIcon className="w-6 h-6 text-accent group-hover:scale-110 transition-transform" />
                                <span className="uppercase tracking-tighter text-sm">Despliegue Soberano</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-surface/20 border border-border/50 rounded-3xl p-8 backdrop-blur-md text-left h-full flex flex-col">
                        <h3 className="text-2xl font-black text-text-primary mb-6 uppercase tracking-tighter flex items-center gap-3">
                            <div className="w-8 h-1 bg-highlight"></div>
                            Manifiesto del Sistema
                        </h3>
                        <div className="flex-grow space-y-4 overflow-y-auto custom-scrollbar pr-2">
                            <details className="bg-black/20 border border-border/30 rounded-2xl overflow-hidden group open:border-primary/30 transition-all">
                                <summary className="p-4 font-bold text-text-primary hover:bg-white/5 transition-colors cursor-pointer flex justify-between items-center uppercase tracking-tighter text-sm">
                                    README.md Soberano
                                    <span className="text-primary group-open:rotate-90 transition-transform text-xl">▸</span>
                                </summary>
                                <div className="p-6 border-t border-border/30 bg-black/40">
                                    {isGeneratingArtifacts ? <div className="animate-pulse text-text-tertiary">Sincronizando...</div> : (
                                        <article className="prose prose-invert prose-sm max-w-none prose-pre:bg-black/50">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{readmeContent || ''}</ReactMarkdown>
                                        </article>
                                    )}
                                </div>
                            </details>

                            <details className="bg-black/20 border border-border/30 rounded-2xl overflow-hidden group open:border-accent/30 transition-all">
                                <summary className="p-4 font-bold text-text-primary hover:bg-white/5 transition-colors cursor-pointer flex justify-between items-center uppercase tracking-tighter text-sm">
                                    CI/CD Pipeline (YAML)
                                    <span className="text-accent group-open:rotate-90 transition-transform text-xl">▸</span>
                                </summary>
                                <div className="p-6 border-t border-border/30 bg-black/40">
                                    {isGeneratingArtifacts ? <div className="animate-pulse text-text-tertiary">Sincronizando...</div> : (
                                        <CodeBlock language="yaml">{ciCdContent || ''}</CodeBlock>
                                    )}
                                </div>
                            </details>

                            <details className="bg-black/20 border border-border/30 rounded-2xl overflow-hidden group open:border-highlight/30 transition-all">
                                <summary className="p-4 font-bold text-text-primary hover:bg-white/5 transition-colors cursor-pointer flex justify-between items-center uppercase tracking-tighter text-sm">
                                    Guía de Despliegue Rápido
                                    <span className="text-highlight group-open:rotate-90 transition-transform text-xl">▸</span>
                                </summary>
                                <div className="p-6 border-t border-border/30 bg-black/40 space-y-4">
                                    <div className="space-y-3">
                                        <div className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Secuencia de Comandos</div>
                                        <CommandBlock command={`cd ${projectName}`} />
                                        <CommandBlock command="git init -b main" />
                                        <CommandBlock command="git add . && git commit -m 'Initial sovereign commit'" />
                                        <CommandBlock command="gh repo create --public --source=. --remote=origin" />
                                    </div>
                                </div>
                            </details>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-center pt-8">
                <button 
                    onClick={onStartNew}
                    className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-surface/20 border border-border/50 text-text-secondary hover:text-white hover:border-white/30 transition-all group"
                >
                    <RefreshIcon className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                    <span className="font-bold uppercase tracking-widest text-sm">Iniciar Nueva Arquitectura</span>
                </button>
            </div>
        </div>
    );
};