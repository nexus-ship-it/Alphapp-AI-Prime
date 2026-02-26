
import React, { useState, useCallback, useRef } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { 
    XCircleIcon, PaletteIcon, MagicWandIcon, 
    ImageIcon, LayoutTemplateIcon, CodeIcon,
    SpinnerIcon, SendIcon, DownloadIcon,
    CopyIcon, RefreshIcon, LightbulbIcon
} from '../ui/icons';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
// FIX: Import useToastContext to allow showing notifications.
import { useToastContext } from '../../contexts/ToastContext';

type DesignTool = 'dashboard' | 'wizard' | 'wireframe' | 'branding' | 'lab';

export const DesignModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const { t } = useI18n();
    // FIX: Initialize the toast hook.
    const { addToast } = useToastContext();
    const [activeTool, setActiveTool] = useState<DesignTool>('dashboard');
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [visualResult, setVisualResult] = useState<string | null>(null);

    const handleGenerateStyles = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim() || isLoading) return;
        setIsLoading(true);
        setResult(null);
        
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `Genera un "Design Token Set" completo de Tailwind CSS para un proyecto con el concepto: "${prompt}". 
                Incluye una paleta de colores extendida (primary, secondary, accent, neutral, surfaces), escala tipográfica y definiciones de sombras. 
                Devuelve la respuesta en formato de configuración de tailwind y variables CSS raíz.`
            });
            setResult(response.text);
        } catch (error) {
            setResult("Error en la sincronización del Lab de Estilos.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogoForge = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim() || isLoading) return;
        setIsLoading(true);
        setVisualResult(null);
        
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ text: `A high-end, futuristic brand logo for: "${prompt}". Minimalist design, symmetrical, vector style, white background, trending on Dribbble.` }] },
            });
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) setVisualResult(`data:image/png;base64,${part.inlineData.data}`);
            }
        } catch (error) {
             // FIX: Use addToast to report errors to the UI.
             addToast({ type: 'error', title: 'Error', message: 'Fallo al forjar logo.' });
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    const ToolSidebarItem: React.FC<{ id: DesignTool, label: string, icon: any }> = ({ id, label, icon: Icon }) => (
        <button 
            onClick={() => { setActiveTool(id); setResult(null); setVisualResult(null); setPrompt(''); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTool === id ? 'bg-primary/20 text-white border border-primary/30 shadow-inner' : 'text-text-secondary hover:bg-white/5'}`}
        >
            <Icon className="w-5 h-5" />
            <span className="text-sm font-bold uppercase tracking-tighter">{label}</span>
        </button>
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/90 backdrop-blur-md animate-fade-in" onClick={onClose} />
            
            <div className="relative bg-surface/40 border border-primary/20 rounded-3xl shadow-2xl w-full max-w-6xl h-[85vh] flex overflow-hidden animate-slide-up backdrop-blur-2xl">
                
                {/* Sidebar */}
                <aside className="w-64 border-r border-white/5 bg-black/20 p-6 flex flex-col gap-8">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/20"><PaletteIcon className="w-6 h-6 text-primary" /></div>
                        <h2 className="font-black text-white tracking-tighter">CREATIVE HUB</h2>
                    </div>
                    <nav className="flex flex-col gap-2">
                        <ToolSidebarItem id="dashboard" label="Vista General" icon={RefreshIcon} />
                        <ToolSidebarItem id="wizard" label="UI Wizard" icon={MagicWandIcon} />
                        <ToolSidebarItem id="wireframe" label="Estructura" icon={LayoutTemplateIcon} />
                        <ToolSidebarItem id="branding" label="Branding" icon={ImageIcon} />
                        <ToolSidebarItem id="lab" label="Style Lab" icon={CodeIcon} />
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 flex flex-col">
                    <header className="p-6 border-b border-white/5 flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-bold text-white uppercase tracking-widest">
                                {activeTool === 'dashboard' ? 'Panel de Control de Diseño' :
                                 activeTool === 'wizard' ? 'Visual to Component Wizard' :
                                 activeTool === 'wireframe' ? 'Arquitectura de Interfaz' :
                                 activeTool === 'branding' ? 'Logo Forge Studio' : 'Styling Lab & Tokens'}
                            </h3>
                            <p className="text-xs text-text-tertiary">Protocolo Creativo Prime v2.0</p>
                        </div>
                        <button onClick={onClose} className="p-2 text-text-secondary hover:text-white transition-colors">
                            <XCircleIcon className="w-8 h-8" />
                        </button>
                    </header>

                    <div className="flex-grow overflow-y-auto p-8 custom-scrollbar">
                        {activeTool === 'dashboard' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                                <div className="bg-primary/5 border border-primary/20 p-6 rounded-2xl">
                                    <h4 className="text-primary font-black mb-2 uppercase tracking-tighter flex items-center gap-2"><LightbulbIcon className="w-4 h-4" /> Resumen Creativo</h4>
                                    <p className="text-text-secondary text-sm">El sistema está listo para procesar bocetos visuales, wireframes de baja fidelidad o generar tokens de estilo corporativos.</p>
                                </div>
                                <div className="bg-accent/5 border border-accent/20 p-6 rounded-2xl">
                                    <h4 className="text-accent font-black mb-2 uppercase tracking-tighter flex items-center gap-2"><CodeIcon className="w-4 h-4" /> Integración Directa</h4>
                                    <p className="text-text-secondary text-sm">Cualquier código generado en el Wizard puede ser enviado directamente al Doctor para auditoría de calidad.</p>
                                </div>
                            </div>
                        )}

                        {activeTool === 'lab' && (
                            <div className="space-y-6 animate-fade-in">
                                <form onSubmit={handleGenerateStyles} className="space-y-4">
                                    <label className="text-sm font-bold text-text-primary uppercase tracking-widest">Describe la estética visual:</label>
                                    <div className="flex gap-2 p-1.5 bg-background/50 border border-white/10 rounded-2xl focus-within:border-primary">
                                        <input 
                                            value={prompt} onChange={e => setPrompt(e.target.value)}
                                            placeholder="Ej: 'Plataforma DeFi elegante con tonos neón violeta y fondo obsidiana'..."
                                            className="w-full bg-transparent p-3 outline-none text-white text-sm"
                                        />
                                        <button disabled={isLoading} className="px-6 bg-primary text-white font-black rounded-xl hover:brightness-110 disabled:opacity-50">
                                            {isLoading ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : 'GENERAR'}
                                        </button>
                                    </div>
                                </form>
                                {result && (
                                    <div className="bg-black/40 border border-white/10 rounded-2xl p-6 relative">
                                        <button className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-lg" title="Copiar Configuración">
                                            <CopyIcon className="w-5 h-5" />
                                        </button>
                                        <article className="prose prose-invert prose-sm max-w-none">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
                                        </article>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTool === 'branding' && (
                             <div className="space-y-6 animate-fade-in">
                                <form onSubmit={handleLogoForge} className="space-y-4">
                                    <label className="text-sm font-bold text-text-primary uppercase tracking-widest">Nombre de marca o concepto:</label>
                                    <div className="flex gap-2 p-1.5 bg-background/50 border border-white/10 rounded-2xl focus-within:border-accent">
                                        <input 
                                            value={prompt} onChange={e => setPrompt(e.target.value)}
                                            placeholder="Ej: 'Aether Cloud Computing'..."
                                            className="w-full bg-transparent p-3 outline-none text-white text-sm"
                                        />
                                        <button disabled={isLoading} className="px-6 bg-accent text-white font-black rounded-xl hover:brightness-110 disabled:opacity-50">
                                            {isLoading ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : 'FORJAR'}
                                        </button>
                                    </div>
                                </form>
                                {visualResult && (
                                    <div className="flex flex-col items-center gap-6">
                                        <img src={visualResult} alt="Logo Result" className="w-72 h-72 rounded-3xl shadow-glow-highlight border border-white/20" />
                                        <button className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-bold transition-all">
                                            <DownloadIcon className="w-5 h-5" /> DESCARGAR ACTIVO
                                        </button>
                                    </div>
                                )}
                             </div>
                        )}

                        {(activeTool === 'wizard' || activeTool === 'wireframe') && (
                            <div className="h-full flex flex-col items-center justify-center text-center py-20 opacity-60">
                                <LayoutTemplateIcon className="w-24 h-24 text-primary mb-4" />
                                <h4 className="text-2xl font-black text-white">INTEGRACIÓN EN CURSO</h4>
                                <p className="max-w-md text-text-secondary mt-2">Utiliza los módulos de la barra lateral principal para acceder a estas herramientas mientras finalizamos el puente de diseño.</p>
                            </div>
                        )}
                    </div>

                    <footer className="p-4 bg-background/20 border-t border-white/5 flex justify-between items-center text-[10px] text-text-tertiary px-10 font-black uppercase tracking-[0.2em]">
                        <div className="flex gap-6">
                            <span>Tokens Activos: 0</span>
                            <span>Asset Cache: Vacío</span>
                        </div>
                        <span className="text-primary animate-pulse flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-current" />
                            Red Creativa Estable
                        </span>
                    </footer>
                </main>
            </div>
        </div>
    );
};
