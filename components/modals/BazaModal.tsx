
import React, { useState, useCallback } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { 
    XCircleIcon, ActivityIcon, MagicWandIcon, 
    SendIcon, SpinnerIcon, LightbulbIcon, 
    ImageIcon, PackageIcon, CopyIcon,
    ShieldCheckIcon
} from '../ui/icons';
import { TranslationKey } from '../../i18n/translations';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type BazaTool = 'niche' | 'logo' | 'copy' | 'blueprint' | null;

export const BazaModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const { t } = useI18n();
    const [activeTool, setActiveTool] = useState<BazaTool>(null);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [imageResult, setImageResult] = useState<string | null>(null);

    const handleAction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        setIsLoading(true);
        setResult(null);
        setImageResult(null);
        
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        try {
            if (activeTool === 'niche') {
                const response = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: `Actúa como un analista de mercado de nivel Silicon Valley. Realiza una investigación profunda del nicho: "${input}". 
                    Busca tendencias actuales, identifica 3 competidores clave y encuentra una "brecha" u oportunidad única para un nuevo producto SaaS. 
                    Usa búsqueda web para datos reales.`,
                    config: { tools: [{ googleSearch: {} }] }
                });
                setResult(response.text);
            } else if (activeTool === 'copy') {
                const response = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: `Genera un copy de ventas "Nivel Dios" para: "${input}". 
                    Incluye una estructura AIDA (Atención, Interés, Deseo, Acción), un gancho irresistible y 5 beneficios clave enfocados en el valor, no solo en las características.`,
                });
                setResult(response.text);
            } else if (activeTool === 'logo') {
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash-image',
                    contents: { parts: [{ text: `A professional, minimalist logo design for a brand named: "${input}". Futuristic, high-tech aesthetic, clean lines, suitable for a tech startup. Vector style, solid background.` }] },
                });
                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData) {
                        setImageResult(`data:image/png;base64,${part.inlineData.data}`);
                    }
                }
            } else if (activeTool === 'blueprint') {
                 const response = await ai.models.generateContent({
                    model: 'gemini-3-pro-preview',
                    contents: `Diseña un Business Blueprint completo para: "${input}". 
                    Incluye: Modelo de Ingresos, Estrategia de Retención, Mapa de Ruta de Producto de 6 meses y métricas clave (KPIs) a seguir.`,
                    config: { thinkingConfig: { thinkingBudget: 4000 } }
                });
                setResult(response.text);
            }
        } catch (error) {
            console.error(error);
            setResult("Anomalía detectada en el flujo de datos de Baza. Reintenta la sincronización.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    const renderToolCard = (id: BazaTool, icon: React.ReactNode, title: string, desc: string, color: string) => (
        <button 
            onClick={() => setActiveTool(id)}
            className={`group p-6 rounded-2xl border border-border/50 bg-surface/40 hover:border-${color}/50 hover:bg-surface/60 transition-all text-left relative overflow-hidden`}
        >
            <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}/10 blur-3xl group-hover:bg-${color}/20 transition-all`} />
            <div className={`mb-4 p-3 rounded-xl bg-${color}/10 w-fit text-${color}`}>
                {icon}
            </div>
            <h3 className="text-xl font-black text-text-primary mb-2">{title}</h3>
            <p className="text-sm text-text-secondary leading-relaxed">{desc}</p>
        </button>
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-background/90 backdrop-blur-md animate-fade-in" onClick={onClose} />
            
            <div className="relative bg-surface/40 border border-primary/20 rounded-3xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden animate-slide-up backdrop-blur-2xl">
                <div className="p-6 border-b border-white/5 bg-white/5 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-primary to-accent shadow-glow-primary">
                            <PackageIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tighter uppercase">{t('baza.title' as TranslationKey)}</h2>
                            <p className="text-xs text-text-tertiary uppercase tracking-widest">{t('baza.description' as TranslationKey)}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full text-text-secondary hover:bg-error/20 hover:text-error transition-all">
                        <XCircleIcon className="w-8 h-8" />
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto p-8 custom-scrollbar">
                    {!activeTool ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                            {renderToolCard('niche', <ActivityIcon />, t('baza.tool.niche' as TranslationKey), t('baza.tool.niche.desc' as TranslationKey), 'primary')}
                            {renderToolCard('logo', <ImageIcon />, t('baza.tool.logo' as TranslationKey), t('baza.tool.logo.desc' as TranslationKey), 'accent')}
                            {renderToolCard('copy', <CopyIcon />, t('baza.tool.copy' as TranslationKey), t('baza.tool.copy.desc' as TranslationKey), 'highlight')}
                            {renderToolCard('blueprint', <ShieldCheckIcon />, t('baza.tool.blueprint' as TranslationKey), t('baza.tool.blueprint.desc' as TranslationKey), 'success')}
                        </div>
                    ) : (
                        <div className="space-y-8 animate-fade-in">
                            <button onClick={() => { setActiveTool(null); setResult(null); setImageResult(null); }} className="text-xs font-black text-accent hover:underline uppercase tracking-tighter flex items-center gap-2">
                                ← Volver a Baza Hub
                            </button>
                            
                            <form onSubmit={handleAction} className="space-y-4">
                                <label className="block text-lg font-bold text-text-primary">
                                    {activeTool === 'niche' ? 'Introduce el área de interés:' : 
                                     activeTool === 'logo' ? 'Nombre de tu marca/producto:' : 
                                     'Descripción del producto/servicio:'}
                                </label>
                                <div className="flex gap-2 p-1.5 bg-background/50 border-2 border-border/50 rounded-2xl focus-within:border-primary/50 transition-all">
                                    <input 
                                        value={input} 
                                        onChange={e => setInput(e.target.value)}
                                        className="w-full bg-transparent p-3 outline-none text-white font-medium"
                                        placeholder="Ej: Plataforma de gestión de IA para agencias..."
                                        disabled={isLoading}
                                    />
                                    <button 
                                        type="submit" 
                                        disabled={isLoading || !input.trim()}
                                        className="px-6 bg-primary text-white font-black rounded-xl hover:brightness-110 disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {isLoading ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <MagicWandIcon className="w-5 h-5" />}
                                        <span>PROCESAR</span>
                                    </button>
                                </div>
                            </form>

                            {(result || imageResult || isLoading) && (
                                <div className="bg-black/20 border border-white/5 rounded-2xl p-6 min-h-[300px]">
                                    {isLoading ? (
                                        <div className="flex flex-col items-center justify-center h-64 gap-4">
                                            <SpinnerIcon className="w-12 h-12 text-primary animate-spin" />
                                            <p className="font-mono text-primary animate-pulse">SINCRONIZANDO CON LA RED DE MERCADO...</p>
                                        </div>
                                    ) : (
                                        <div className="animate-fade-in">
                                            {imageResult && (
                                                <div className="flex flex-col items-center gap-4">
                                                    <img src={imageResult} alt="Generated Logo" className="w-64 h-64 rounded-2xl shadow-glow-primary border border-white/10" />
                                                    <p className="text-xs text-text-tertiary">Boceto de Identidad Visual generado para: {input}</p>
                                                </div>
                                            )}
                                            {result && (
                                                <article className="prose prose-invert max-w-none prose-headings:text-primary prose-strong:text-accent">
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
                                                </article>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-4 bg-background/20 border-t border-white/5 flex justify-between items-center text-[10px] text-text-tertiary px-8 font-black uppercase tracking-[0.2em]">
                    <span>Baza Business Core v1.0</span>
                    <span className="text-primary animate-pulse">Sincronizado</span>
                </div>
            </div>
        </div>
    );
};
