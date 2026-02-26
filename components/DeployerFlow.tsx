import React, { useState } from 'react';
import { useDeployerContext, EnvVar } from '../contexts/DeployerContext';
import { Loader } from './ui/Loader';
import { DeploymentPlatform, DeploymentFile } from '../types';
import { CheckCircleIcon, CodeIcon, CopyIcon, DeployIcon, DownloadIcon, FileIcon, LightbulbIcon, SpinnerIcon, StethoscopeIcon } from './ui/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useToastContext } from '../contexts/ToastContext';
import * as zipService from '../services/zipService';
import { FileNode } from '../types';
import { buildFileTree } from '../services/fileUtils';


const PLATFORMS: { id: DeploymentPlatform; name: string; icon: React.FC<{className?:string}> }[] = [
    { id: 'Google Cloud Run', name: 'Google Cloud Run', icon: ({className}) => <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm-5.2 6.3a.9.9 0 011.2-.2l4.6 2.8v5.8a.9.9 0 01-1.3.8l-4.5-2.8z" fill="#4285F4"></path><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm.5 13.8L7.9 13a.9.9 0 01-.4-.8V6.5a.9.9 0 01.4-.8l4.6-2.8a.9.9 0 011.3.8v11.6a.9.9 0 01-1.2.7z" fill="#EA4335"></path><path d="M17.2 15.7a.9.9 0 01-1.2.2l-4.6-2.8V7.3a.9.9 0 011.3-.8l4.5 2.8z" fill="#FBBC04"></path><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm-.5-1.7a.9.9 0 011.2-.2l4.6 2.8v5.8a.9.9 0 01-1.3.8l-4.5-2.8z" fill="#34A853"></path></svg> },
    { id: 'Vercel', name: 'Vercel', icon: ({className}) => <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 22h20L12 2z"></path></svg> },
    { id: 'AWS Elastic Beanstalk', name: 'AWS Beanstalk', icon: ({className}) => <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 16.93c-3.92-.44-7-3.83-7-7.93 0-4.42 3.58-8 8-8 .34 0 .67.03 1 .07V18.93z" fill="#FF9900"></path></svg> },
    { id: 'AWS Lambda (Serverless)', name: 'AWS Lambda', icon: ({className}) => <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 1.5L6 9h4.5v6H15V9h4.5L13.5 1.5zM9 22.5h6v-6H9v6z" fill="#FF9900"></path></svg> },
    { id: 'Docker Compose', name: 'Docker Compose', icon: ({className}) => <svg className={className} viewBox="0 0 24 24" fill="#2496ED"><path d="M22.12 9.43c-.45-1.7-1.4-3.2-2.75-4.22-1.35-1.02-3.03-1.5-4.88-1.5H5.17c-.15 0-.28.1-.32.25L2.01 14.1c-.04.15.02.3.17.38l2.6 1.4c.15.08.33.04.42-.08l1.7-2.96h7.3c1.55 0 2.8.92 2.8 2.05S15.75 17 14.2 17h-1.5c-.2 0-.35.15-.35.35v1.3c0 .2.15.35.35.35h1.5c2.4 0 4.35-1.5 4.35-3.5 0-1.4-1.1-2.8-2.5-3.2l-1.1-.3v-1.7c.05-2.6 1.6-4.95 4.15-4.95 1.1 0 1.6.3 2.05.7.45.4.75 1 .9 1.6.15.6.2 1.25.1 1.9zm-16.12.57H3.5l1-1.7h2.5zm-1 2.5H2.5l1-1.7h2.5zm-1 2.5H1.5l1-1.7H5zm5-2.5h2.5v-1.7H5zm-1.5-5H6.5l-1-1.7H3zm3.5-1.7h2.5v-1.7H7.5zm-1.5-2.5H9l-1-1.7H5.5zm8 6.2H11v-1.7h2.5zm-1.5-2.5h2.5v-1.7H10zm-1-2.5h2.5v-1.7h-2.5z"></path></svg> },
];

const UploadStep: React.FC = () => {
    const { setProjectFromUpload, isLoading } = useDeployerContext();
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
    const handleDragIn = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
    const handleDragOut = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation(); setIsDragging(false);
        if (e.dataTransfer.files?.length) setProjectFromUpload(e.dataTransfer.files);
    };
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length) setProjectFromUpload(e.target.files);
    };

    return (
        <div className="w-full max-w-3xl mx-auto text-center animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">Desplegador DevOps</h2>
            <p className="text-lg text-text-secondary mb-8">Sube tu proyecto para generar automáticamente los archivos de despliegue.</p>
            <div onDragEnter={handleDragIn} onDragLeave={handleDragOut} onDragOver={handleDrag} onDrop={handleDrop} className={`w-full h-64 border-4 border-dashed rounded-xl flex flex-col items-center justify-center transition-colors duration-300 backdrop-blur-sm ${isDragging ? 'border-primary bg-primary/10' : 'border-border bg-surface/50'}`}>
                <input ref={inputRef} type="file" webkitdirectory="" directory="" multiple className="hidden" onChange={handleChange} disabled={isLoading} />
                <DeployIcon className="w-16 h-16 text-text-tertiary mb-4" />
                <p className="text-xl font-semibold text-text-secondary">Arrastra la carpeta de tu proyecto</p>
                <p className="text-text-tertiary mt-2">o</p>
                <button onClick={() => inputRef.current?.click()} className="mt-2 px-6 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-focus transition-colors" disabled={isLoading}>
                    Seleccionar Carpeta
                </button>
            </div>
        </div>
    );
};

const ConfigureStep: React.FC = () => {
    const { 
        projectName, techStack, selectedPlatforms, setSelectedPlatforms, generateFiles, isLoading, analysisReport,
        nodeVersion, pythonVersion, port, envVars,
        setNodeVersion, setPythonVersion, setPort, setEnvVars
    } = useDeployerContext();

    const togglePlatform = (platform: DeploymentPlatform) => {
        setSelectedPlatforms(prev => prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]);
    };

    const handleEnvVarChange = (id: number, field: 'key' | 'value', value: string) => {
        setEnvVars(vars => vars.map(v => v.id === id ? { ...v, [field]: value } : v));
    };

    const addEnvVar = () => {
        setEnvVars(vars => [...vars, { id: Date.now(), key: '', value: '' }]);
    };

    const removeEnvVar = (id: number) => {
        setEnvVars(vars => vars.filter(v => v.id !== id));
    };

    return (
        <div className="w-full max-w-4xl mx-auto animate-fade-in">
            <div className="text-center">
                <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">Configurar Despliegue</h2>
                <p className="text-lg text-text-secondary mb-8">Proyecto <span className="font-bold text-accent">{projectName}</span> cargado. Selecciona las plataformas y ajusta las opciones.</p>
            </div>

            {analysisReport && analysisReport.length > 0 && (
                <div className="bg-info/10 border border-info/30 rounded-xl p-6 mb-8 text-left animate-fade-in">
                    <h3 className="text-lg font-semibold text-info mb-3 flex items-center gap-2">
                        <StethoscopeIcon /> Contexto del Doctor de Código
                    </h3>
                    <p className="text-sm text-info/80">
                        Se utilizará el reporte de <strong>{analysisReport.length} problemas</strong> encontrados para generar configuraciones de despliegue más seguras y robustas.
                    </p>
                </div>
            )}

            <div className="bg-surface/30 border border-border/50 rounded-2xl p-6 mb-8 backdrop-blur-sm">
                <h3 className="text-xl font-bold text-accent mb-6 text-center">1. Selecciona Plataformas de Destino</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {PLATFORMS.map(platform => {
                        const isSelected = selectedPlatforms.includes(platform.id);
                        return (
                             <div key={platform.id} className="relative group">
                                <div className={`absolute -inset-0.5 bg-gradient-to-r from-primary to-highlight rounded-xl blur-lg transition duration-500 ${isSelected ? 'opacity-60' : 'opacity-0 group-hover:opacity-40'}`}></div>
                                <button
                                    onClick={() => togglePlatform(platform.id)}
                                    className={`relative w-full h-full p-4 rounded-xl border-2 text-center transition-all duration-300 transform hover:-translate-y-1 flex flex-col items-center justify-center gap-2 aspect-square ${isSelected ? 'border-primary bg-primary/20 shadow-glow-primary' : 'border-border bg-surface hover:border-highlight/50'}`}
                                >
                                    <platform.icon className="w-10 h-10" />
                                    <p className={`font-semibold text-sm ${isSelected ? 'text-white' : 'text-text-primary'}`}>{platform.name}</p>
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="bg-surface/30 border border-border/50 rounded-2xl p-6 mb-8 backdrop-blur-sm">
                <h3 className="text-xl font-bold text-accent mb-6 text-center">2. Opciones de Configuración</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Runtime and Port */}
                    <div className="space-y-4">
                        {techStack?.backend === 'Node.js' && (
                             <div>
                                <label htmlFor="node-version" className="block text-sm font-medium text-text-secondary mb-1">Versión de Node.js</label>
                                <select id="node-version" value={nodeVersion} onChange={e => setNodeVersion(e.target.value)} className="w-full rounded-md border-border bg-surface p-2 text-base focus:border-primary focus:ring-primary">
                                    <option>22</option><option>20</option><option>18</option>
                                </select>
                            </div>
                        )}
                        {techStack?.backend === 'Python' && (
                             <div>
                                <label htmlFor="python-version" className="block text-sm font-medium text-text-secondary mb-1">Versión de Python</label>
                                <select id="python-version" value={pythonVersion} onChange={e => setPythonVersion(e.target.value)} className="w-full rounded-md border-border bg-surface p-2 text-base focus:border-primary focus:ring-primary">
                                    <option>3.12</option><option>3.11</option><option>3.10</option><option>3.9</option>
                                </select>
                            </div>
                        )}
                         <div>
                            <label htmlFor="port" className="block text-sm font-medium text-text-secondary mb-1">Puerto a Exponer</label>
                            <input id="port" type="number" value={port} onChange={e => setPort(e.target.value)} className="w-full rounded-md border-border bg-surface p-2 text-base focus:border-primary focus:ring-primary" />
                        </div>
                    </div>
                    {/* Environment Variables */}
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">Variables de Entorno</label>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                            {envVars.map((v, i) => (
                                <div key={v.id} className="flex items-center gap-2">
                                    <input type="text" placeholder="CLAVE" value={v.key} onChange={e => handleEnvVarChange(v.id, 'key', e.target.value)} className="flex-1 rounded-md border-border bg-background p-2 text-sm font-mono focus:border-primary focus:ring-primary"/>
                                    <input type="text" placeholder="VALOR" value={v.value} onChange={e => handleEnvVarChange(v.id, 'value', e.target.value)} className="flex-1 rounded-md border-border bg-background p-2 text-sm font-mono focus:border-primary focus:ring-primary"/>
                                    <button onClick={() => removeEnvVar(v.id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-md">&times;</button>
                                </div>
                            ))}
                        </div>
                         <button onClick={addEnvVar} className="mt-2 text-sm text-primary font-semibold hover:text-primary-focus">+ Añadir Variable</button>
                    </div>
                </div>
            </div>
            
            <div className="text-center">
                <button onClick={generateFiles} disabled={isLoading || selectedPlatforms.length === 0} className="w-full sm:w-auto px-10 py-4 bg-primary text-white font-bold text-lg rounded-lg hover:bg-primary-focus transition-transform transform hover:scale-105 duration-300 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    {isLoading && <SpinnerIcon className="w-5 h-5" />}
                    {isLoading ? 'Generando...' : 'Generar Archivos de Despliegue'}
                </button>
            </div>
        </div>
    );
};

const ResultStep: React.FC = () => {
    const { deploymentFiles, projectName, resetDeployer } = useDeployerContext();
    const [selectedFile, setSelectedFile] = useState<DeploymentFile | null>(deploymentFiles ? deploymentFiles[0] : null);
    const { addToast } = useToastContext();

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            addToast({ type: 'success', title: '¡Copiado!', message: 'Contenido copiado al portapapeles.' });
        });
    };

    const handleDownload = async () => {
        if (!deploymentFiles) return;
        try {
            const fileTree = buildFileTree(deploymentFiles);
            const zipName = `${projectName}-deployment-files`;
            const blob = await zipService.createProjectZip(fileTree, zipName);
            zipService.downloadZip(blob, zipName);
        } catch (e) {
            addToast({ type: 'error', title: 'Error', message: 'No se pudo generar el ZIP.' });
        }
    };
    
    return (
        <div className="w-full animate-fade-in">
             <div className="text-center mb-8">
                <h2 className="text-3xl font-bold">Archivos de Despliegue Generados</h2>
                <p className="text-text-secondary">Explora los archivos generados y sus explicaciones.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[70vh]">
                <div className="lg:col-span-3 bg-surface/30 border border-border/50 rounded-lg p-4 overflow-y-auto backdrop-blur-sm">
                    <h3 className="text-lg font-semibold text-accent mb-3 px-2">Archivos Generados</h3>
                    {deploymentFiles?.map(file => (
                        <div key={file.path} onClick={() => setSelectedFile(file)} className={`flex items-center space-x-2 py-1.5 px-2 cursor-pointer rounded-md ${selectedFile?.path === file.path ? 'bg-primary/20 text-white' : 'hover:bg-border/50'}`}>
                            <FileIcon className="w-5 h-5 text-text-secondary flex-shrink-0" />
                            <span className="text-sm font-mono truncate">{file.path}</span>
                        </div>
                    ))}
                </div>
                <div className="lg:col-span-9 flex flex-col gap-4">
                     {selectedFile && (
                        <details open className="bg-surface/30 border border-border/50 rounded-xl overflow-hidden backdrop-blur-sm group">
                            <summary className="p-4 font-semibold text-text-primary hover:bg-border/30 transition-colors cursor-pointer flex justify-between items-center">
                                <div className="flex items-center gap-2"><CodeIcon className="w-5 h-5"/> Contenido: <span className="font-mono text-accent">{selectedFile.path}</span></div>
                                <div className="flex items-center gap-2">
                                     <button onClick={(e) => { e.preventDefault(); handleCopy(selectedFile.content); }} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-border/50 hover:bg-border transition-colors text-xs"><CopyIcon className="w-4 h-4"/>Copiar</button>
                                    <span className="text-accent group-open:rotate-90 transition-transform text-2xl">▸</span>
                                </div>
                            </summary>
                            <div className="border-t border-border/50 bg-background/80 max-h-80 overflow-y-auto">
                                <pre className="p-4 text-sm font-mono whitespace-pre-wrap"><code>{selectedFile.content}</code></pre>
                            </div>
                        </details>
                    )}
                     {selectedFile && (
                        <details open className="bg-surface/30 border border-border/50 rounded-xl overflow-hidden backdrop-blur-sm group">
                            <summary className="p-4 font-semibold text-text-primary hover:bg-border/30 transition-colors cursor-pointer flex justify-between items-center">
                                <div className="flex items-center gap-2"><LightbulbIcon className="w-5 h-5 text-yellow-400"/> Explicación de la IA</div>
                                <span className="text-accent group-open:rotate-90 transition-transform text-2xl">▸</span>
                            </summary>
                            <div className="p-6 border-t border-border/50 bg-surface/50">
                                <article className="prose prose-invert prose-sm max-w-none"><ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedFile.explanation}</ReactMarkdown></article>
                            </div>
                        </details>
                    )}
                    {selectedFile && (
                        <details open className="bg-surface/30 border border-border/50 rounded-xl overflow-hidden backdrop-blur-sm group">
                            <summary className="p-4 font-semibold text-text-primary hover:bg-border/30 transition-colors cursor-pointer flex justify-between items-center">
                                <div className="flex items-center gap-2"><DeployIcon className="w-5 h-5 text-green-400"/> Próximos Pasos</div>
                                <span className="text-accent group-open:rotate-90 transition-transform text-2xl">▸</span>
                            </summary>
                            <div className="p-6 border-t border-border/50 bg-surface/50">
                                <article className="prose prose-invert prose-sm max-w-none"><ReactMarkdown remarkPlugins={[remarkGfm]} components={{ pre: ({node, ...props}) => <div className="relative group my-4"><button onClick={() => handleCopy(props.children[0].props.children[0])} className="absolute top-2 right-2 text-xs text-text-secondary p-1 rounded-md bg-border opacity-50 group-hover:opacity-100 transition-opacity">Copiar</button><pre {...props}/></div> }}>{selectedFile.nextSteps}</ReactMarkdown></article>
                            </div>
                        </details>
                    )}
                </div>
            </div>
            <div className="text-center mt-6 flex justify-center items-center gap-4">
                <button onClick={resetDeployer} className="px-6 py-2 border-2 border-primary text-primary font-semibold rounded-lg hover:bg-primary hover:text-white transition">Empezar de Nuevo</button>
                <button onClick={handleDownload} className="px-8 py-3 bg-accent text-white font-bold rounded-lg hover:bg-accent-focus transition-transform transform hover:scale-105 shadow-lg shadow-accent/20 flex items-center gap-2"><DownloadIcon className="w-5 h-5"/> Descargar ZIP</button>
            </div>
        </div>
    );
};

const DeployerFlow: React.FC = () => {
    const { step, isLoading, loadingText, error } = useDeployerContext();
    
    const renderStep = () => {
        switch (step) {
            case 'upload': return <UploadStep />;
            case 'configure': return <ConfigureStep />;
            case 'result': return <ResultStep />;
            default: return <div>Paso desconocido</div>;
        }
    };

    return (
        <div className="flex flex-col h-full w-full">
            {isLoading && <Loader text={loadingText} />}
            <main className="w-full max-w-7xl mx-auto flex-grow flex flex-col items-center mt-4 px-4">
                {error && <div className="bg-error/10 border-error/30 text-red-300 px-4 py-3 rounded-lg my-4 w-full" role="alert">{error}</div>}
                {renderStep()}
            </main>
        </div>
    );
};

export default DeployerFlow;