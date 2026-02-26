

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FileNode, TechStack } from '../types';
import * as zipService from '../services/zipService';
import * as geminiService from '../services/geminiService';
import { useToastContext } from '../contexts/ToastContext';
import { CopyIcon, DeployIcon, RefreshIcon, StethoscopeIcon } from './ui/icons';
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
        <div className="w-full max-w-4xl mx-auto text-center animate-fade-in">
            <div className="bg-gradient-to-br from-success/20 to-surface/20 border border-success/30 p-8 rounded-2xl mb-8 backdrop-blur-sm shadow-lg shadow-success/10">
                <h2 className="text-4xl font-bold text-green-300">¡Construcción Completa!</h2>
                <p className="text-green-300/80 mt-2 text-lg">Tu proyecto ha sido diseñado y está listo para descargar.</p>
            </div>

            {/* Download Section */}
            <div className="bg-surface/30 border border-border/50 rounded-2xl p-8 mb-8 text-left backdrop-blur-sm space-y-6">
                 <h3 className="text-2xl font-bold text-accent mb-4 text-center">Finalizar y Entregar</h3>
                 {/* Font Selection */}
                 <div>
                    <h4 className="font-semibold text-text-primary mb-2">Agregar Fuentes (Opcional)</h4>
                    <p className="text-sm text-text-secondary mb-3">
                        Incluye una carpeta de fuentes (.ttf, .woff2) en una carpeta `/public/fonts` dentro del .zip.
                    </p>
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
                        className="w-full px-6 py-3 border-2 border-dashed border-border/70 text-text-secondary rounded-lg hover:border-accent hover:text-accent transition duration-300 bg-surface/50"
                    >
                        {fontFiles && fontFiles.length > 0 ? `${fontFiles.length} archivo(s) de fuente seleccionado(s)` : 'Seleccionar Carpeta de Fuentes'}
                    </button>
                 </div>
                 {/* Download Button */}
                 <button
                    onClick={handleDownload}
                    disabled={isDownloading || isGeneratingArtifacts}
                    className="w-full px-8 py-4 bg-gradient-to-r from-primary to-accent text-white font-bold text-lg rounded-lg hover:from-primary-focus hover:to-accent-focus transition-all transform hover:scale-105 duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/30"
                >
                    {isDownloading ? 'Generando .zip...' : isGeneratingArtifacts ? 'Generando archivos de proyecto...' : `Descargar Proyecto (.zip)`}
                </button>

                <div className="flex items-center my-2">
                    <div className="flex-grow border-t border-border/50"></div>
                    <span className="flex-shrink mx-4 text-text-tertiary text-sm">PRÓXIMOS PASOS</span>
                    <div className="flex-grow border-t border-border/50"></div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <button
                        onClick={handleSendToDoctor}
                        disabled={isGeneratingArtifacts}
                        className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-info to-blue-700 text-white font-bold text-lg rounded-lg hover:from-info/80 hover:to-blue-800 transition-all transform hover:scale-105 duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-info/20"
                    >
                        <StethoscopeIcon className="w-6 h-6" />
                        Revisar con Doctor
                    </button>
                    <button
                        onClick={handleSendToDeployer}
                        disabled={isGeneratingArtifacts}
                        className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-600 to-teal-700 text-white font-bold text-lg rounded-lg hover:from-cyan-700 hover:to-teal-800 transition-all transform hover:scale-105 duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-600/20"
                    >
                        <DeployIcon className="w-6 h-6" />
                        Preparar Despliegue
                    </button>
                </div>
            </div>

            {/* Additional Info Section (Accordion) */}
            <div className="space-y-4 text-left">
                {/* README Accordion */}
                <details className="bg-surface/30 border border-border/50 rounded-xl overflow-hidden backdrop-blur-sm group">
                    <summary className="p-4 font-semibold text-text-primary hover:bg-border/30 transition-colors cursor-pointer flex justify-between items-center">
                        Vista Previa del README.md
                        <span className="text-accent group-open:rotate-90 transition-transform text-2xl">▸</span>
                    </summary>
                    <div className="p-6 border-t border-border/50 bg-surface/50">
                        {isGeneratingArtifacts && <div className="text-center p-8 text-text-secondary">Generando README.md...</div>}
                        {!isGeneratingArtifacts && readmeContent && (
                            <article className="prose prose-invert prose-pre:bg-background/80 max-w-none prose-h1:text-accent prose-a:text-primary">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{readmeContent}</ReactMarkdown>
                            </article>
                        )}
                    </div>
                </details>

                 {/* CI/CD Accordion */}
                 <details className="bg-surface/30 border border-border/50 rounded-xl overflow-hidden backdrop-blur-sm group">
                    <summary className="p-4 font-semibold text-text-primary hover:bg-border/30 transition-colors cursor-pointer flex justify-between items-center">
                        <span className="flex items-center gap-2"><RefreshIcon className="w-5 h-5"/> Canalización de CI/CD</span>
                        <span className="text-accent group-open:rotate-90 transition-transform text-2xl">▸</span>
                    </summary>
                    <div className="p-6 border-t border-border/50 bg-surface/50">
                        {isGeneratingArtifacts && <div className="text-center p-8 text-text-secondary">Generando flujo de trabajo CI/CD...</div>}
                        {!isGeneratingArtifacts && ciCdContent && (
                           <CodeBlock language="yaml">{ciCdContent}</CodeBlock>
                        )}
                    </div>
                </details>

                {/* Deploy Accordion */}
                <details className="bg-surface/30 border border-border/50 rounded-xl overflow-hidden backdrop-blur-sm group">
                    <summary className="p-4 font-semibold text-text-primary hover:bg-border/30 transition-colors cursor-pointer flex justify-between items-center">
                        Instrucciones de Despliegue
                        <span className="text-accent group-open:rotate-90 transition-transform text-2xl">▸</span>
                    </summary>
                    <div className="p-6 border-t border-border/50 bg-surface/50 space-y-6">
                        <div>
                            <h3 className="font-semibold text-accent mb-2">Publicar en GitHub</h3>
                            <p className="text-sm text-text-secondary mb-3">
                                Sigue estos pasos en tu terminal para crear un repositorio en GitHub y subir tu código. Necesitas tener la <a href="https://cli.github.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">CLI de GitHub</a> instalada.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-semibold text-text-primary text-sm mb-1">1. Navega a la carpeta de tu proyecto</h4>
                                <CommandBlock command={`cd ${projectName}`} />
                            </div>
                            <div>
                                <h4 className="font-semibold text-text-primary text-sm mb-1">2. Inicializa Git</h4>
                                <CommandBlock command="git init -b main" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-text-primary text-sm mb-1">3. Añade y confirma los archivos</h4>
                                <CommandBlock command="git add . && git commit -m 'Initial commit from Alphapp AI'" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-text-primary text-sm mb-1">4. Crea el repositorio y sube el código</h4>
                                <CommandBlock command="gh repo create && git push -u origin main" />
                            </div>
                        </div>
                    </div>
                </details>
            </div>
        </div>
    );
};