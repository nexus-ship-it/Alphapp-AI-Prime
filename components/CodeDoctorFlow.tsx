
import React, { useState, useRef } from 'react';
import { useCodeDoctorContext } from '../contexts/CodeDoctorContext';
import { Loader } from './ui/Loader';
import { StethoscopeIcon, CheckCircleIcon, LightbulbIcon, UploadIcon, SpinnerIcon } from './ui/icons';
import { AnalysisIssueCard } from './ui/AnalysisComponents';
import { useI18n } from '../contexts/I18nContext';

const CodeDoctorFlow: React.FC = () => {
    const { t } = useI18n();
    const {
        uploadedFiles, isLoading, loadingText, doctorStep, analysisReport,
        setUploadedFilesAndDetectStack, contextualSummary, generateAndShowFix, fixingIssueId, resetDoctor
    } = useCodeDoctorContext();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); setIsDragging(false);
        if (e.dataTransfer.files?.length) setUploadedFilesAndDetectStack(e.dataTransfer.files);
    };

    if (isLoading) return <Loader text={loadingText} />;

    return (
        <div className="w-full max-w-7xl mx-auto p-4 flex flex-col items-center gap-8 animate-fade-in">
            <header className="text-center space-y-2">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto border-2 border-primary/30 shadow-glow-primary">
                    <StethoscopeIcon className="w-10 h-10 text-primary" />
                </div>
                <h1 className="text-5xl font-black tracking-tighter text-white uppercase">Doctor de Código</h1>
                <p className="text-text-secondary uppercase tracking-[0.2em] text-sm">Auditoría Clínica de Arquitectura y Seguridad</p>
            </header>

            {doctorStep === 'upload' && (
                <div className="w-full max-w-3xl space-y-6">
                    <div 
                        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        className={`border-4 border-dashed rounded-3xl p-16 text-center transition-all duration-300 backdrop-blur-md
                            ${isDragging ? 'border-primary bg-primary/10 scale-105' : 'border-border/50 bg-surface/30 hover:border-primary/40'}`}
                    >
                        <input type="file" ref={fileInputRef} className="hidden" multiple {...({ webkitdirectory: "true", directory: "true" } as any)} onChange={e => e.target.files && setUploadedFilesAndDetectStack(e.target.files)} />
                        <UploadIcon className="w-16 h-16 text-primary/40 mx-auto mb-6" />
                        <p className="text-2xl font-bold text-text-primary mb-2">Sube la carpeta de tu paciente</p>
                        <p className="text-text-tertiary mb-8">Analizaré cada línea en busca de vulnerabilidades lógicas.</p>
                        <button onClick={() => fileInputRef.current?.click()} className="px-8 py-4 bg-primary text-white font-black rounded-xl hover:brightness-110 shadow-lg shadow-primary/20">SELECCIONAR PROYECTO</button>
                    </div>
                </div>
            )}

            {doctorStep === 'report' && (
                <div className="w-full space-y-6 animate-fade-in">
                    <div className="flex justify-between items-end border-b border-border/30 pb-4">
                        <div>
                            <h2 className="text-3xl font-bold">Reporte de Salud Técnica</h2>
                            <p className="text-text-secondary">Resultados obtenidos mediante razonamiento Omni-Logic</p>
                        </div>
                        <button onClick={resetDoctor} className="text-xs font-black text-text-tertiary hover:text-white uppercase tracking-widest">Nuevo Escaneo</button>
                    </div>

                    {contextualSummary && (
                        <div className="bg-primary/5 border border-primary/20 p-6 rounded-2xl">
                             <h3 className="text-primary font-bold mb-2 flex items-center gap-2"><LightbulbIcon className="w-5 h-5"/> Resumen Médico</h3>
                             <p className="text-text-secondary italic text-sm">{contextualSummary}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {analysisReport?.length === 0 ? (
                            <div className="col-span-2 py-20 text-center bg-surface/30 rounded-3xl border border-success/30">
                                <CheckCircleIcon className="w-16 h-16 text-success mx-auto mb-4" />
                                <h3 className="text-2xl font-bold">¡Sistema Inmune al 100%!</h3>
                                <p className="text-text-secondary">No se han detectado patologías de código en este escaneo.</p>
                            </div>
                        ) : analysisReport?.map((issue, idx) => (
                            <AnalysisIssueCard 
                                key={idx} 
                                issue={issue} 
                                onCardClick={() => {}} 
                                onGenerateFix={generateAndShowFix} 
                                isFixing={fixingIssueId === `${issue.filePath}-${issue.line}-${issue.title}`}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CodeDoctorFlow;
