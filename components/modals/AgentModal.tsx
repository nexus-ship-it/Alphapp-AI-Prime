
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { 
    XCircleIcon, NetworkIcon, SendIcon, SpinnerIcon, 
    ShieldCheckIcon, ActivityIcon, LightbulbIcon,
    CodeIcon, ChevronRightIcon
} from '../ui/icons';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type AgentRole = 'oracle' | 'sentinel' | 'architect' | 'liaison';

interface Agent {
    id: AgentRole;
    name: string;
    description: string;
    icon: React.FC<{ className?: string }>;
    color: string;
    prompt: string;
    tools?: any[];
}

const AGENTS: Agent[] = [
    {
        id: 'oracle',
        name: 'Oráculo de Red',
        description: 'Búsqueda en tiempo real y análisis de mercado externo.',
        icon: NetworkIcon,
        color: 'primary',
        prompt: 'Eres el Agente Oráculo. Tu especialidad es obtener datos en tiempo real de la web y predecir tendencias. Sé preciso y basa tus respuestas en datos actuales.',
        tools: [{ googleSearch: {} }]
    },
    {
        id: 'sentinel',
        name: 'Centinela de Seguridad',
        description: 'Auditoría profunda de contratos, código y protocolos.',
        icon: ShieldCheckIcon,
        color: 'error',
        prompt: 'Eres el Agente Centinela. Tu prioridad absoluta es la seguridad. Analiza cada bit en busca de debilidades lógicas o vectores de ataque.',
    },
    {
        id: 'architect',
        name: 'Arquitecto Maestro',
        description: 'Diseño de sistemas escalables y optimización de recursos.',
        icon: CodeIcon,
        color: 'accent',
        prompt: 'Eres el Agente Arquitecto. Diseñas arquitecturas de élite siguiendo principios Clean Architecture y SOLID. Tu meta es la escalabilidad infinita.',
    },
    {
        id: 'liaison',
        name: 'Enlace de Protocolo',
        description: 'Estrategias de comunicación y automatización de flujos.',
        icon: ActivityIcon,
        color: 'highlight',
        prompt: 'Eres el Agente Enlace. Optimizas la comunicación entre sistemas y humanos. Generas flujos de trabajo eficientes y ganchos persuasivos.',
    }
];

export const AgentModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const { t } = useI18n();
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory, isLoading]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading || !selectedAgent) return;

        const userText = input;
        setInput('');
        setChatHistory(prev => [...prev, { role: 'user', text: userText }]);
        setIsLoading(true);

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: [
                    ...chatHistory.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
                    { role: 'user', parts: [{ text: userText }] }
                ],
                config: {
                    systemInstruction: selectedAgent.prompt,
                    tools: selectedAgent.tools
                }
            });

            setChatHistory(prev => [...prev, { role: 'model', text: response.text || 'Sin respuesta.' }]);
        } catch (error) {
            console.error(error);
            setChatHistory(prev => [...prev, { role: 'model', text: 'Error de sincronización neuronal. Intenta reconectar el agente.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-background/95 backdrop-blur-md animate-fade-in" onClick={onClose} />
            
            <div className={`relative bg-surface/40 border border-${selectedAgent?.color || 'primary'}/30 rounded-3xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-slide-up backdrop-blur-2xl transition-all duration-500`}>
                
                {/* Visual Grid Background */}
                <div className="absolute inset-0 opacity-10 pointer-events-none" 
                    style={{ backgroundImage: 'radial-gradient(var(--color-primary) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

                <div className="p-6 border-b border-white/5 bg-white/5 flex justify-between items-center z-10">
                    <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-2xl bg-${selectedAgent?.color || 'primary'}/20 shadow-glow-primary transition-all`}>
                            <NetworkIcon className={`w-6 h-6 text-${selectedAgent?.color || 'primary'}`} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Colmena de Agentes</h2>
                            <p className="text-xs text-text-tertiary uppercase tracking-widest">Protocolo de Red Descentralizada Prime</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full text-text-secondary hover:bg-error/20 hover:text-error transition-all">
                        <XCircleIcon className="w-8 h-8" />
                    </button>
                </div>

                <div className="flex-grow flex overflow-hidden z-10">
                    {/* Agent Sidebar */}
                    <aside className="w-72 border-r border-white/5 p-4 hidden md:flex flex-col gap-2 bg-black/20 overflow-y-auto">
                        {AGENTS.map(agent => (
                            <button 
                                key={agent.id}
                                onClick={() => { setSelectedAgent(agent); setChatHistory([]); }}
                                className={`p-4 rounded-2xl text-left transition-all border group ${selectedAgent?.id === agent.id ? `bg-${agent.color}/20 border-${agent.color}/50 shadow-inner` : 'border-transparent hover:bg-white/5 hover:border-white/10'}`}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <agent.icon className={`w-5 h-5 text-${agent.color} ${selectedAgent?.id === agent.id ? 'animate-pulse' : ''}`} />
                                    <span className="font-bold text-sm text-text-primary uppercase tracking-tighter">{agent.name}</span>
                                </div>
                                <p className="text-[10px] text-text-tertiary leading-tight">{agent.description}</p>
                            </button>
                        ))}
                    </aside>

                    {/* Main Interaction Area */}
                    <main className="flex-1 flex flex-col bg-background/30">
                        {!selectedAgent ? (
                            <div className="flex-grow flex flex-col items-center justify-center text-center p-8 animate-fade-in">
                                <NetworkIcon className="w-20 h-20 text-primary/20 mb-6 animate-pulse" />
                                <h3 className="text-2xl font-bold text-white mb-2">Sincroniza un Agente</h3>
                                <p className="text-text-secondary max-w-sm">Selecciona una inteligencia especializada de la colmena para iniciar el despliegue del protocolo.</p>
                                <div className="mt-8 grid grid-cols-2 gap-4 md:hidden w-full">
                                    {AGENTS.map(a => (
                                        <button key={a.id} onClick={() => setSelectedAgent(a)} className={`p-3 rounded-xl bg-${a.color}/10 border border-${a.color}/30 text-xs font-bold`}>{a.name}</button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex-grow overflow-y-auto p-6 space-y-6 custom-scrollbar">
                                    {chatHistory.length === 0 && (
                                        <div className="bg-primary/5 border border-primary/20 p-6 rounded-2xl animate-fade-in">
                                            <div className="flex items-center gap-2 mb-2">
                                                <LightbulbIcon className={`text-${selectedAgent.color} w-5 h-5`} />
                                                <span className={`font-bold text-${selectedAgent.color} text-sm uppercase`}>Agente {selectedAgent.name} Online</span>
                                            </div>
                                            <p className="text-text-secondary text-sm leading-relaxed">{selectedAgent.prompt}</p>
                                        </div>
                                    )}
                                    {chatHistory.map((msg, idx) => (
                                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                                            <div className={`max-w-[85%] px-4 py-3 rounded-2xl shadow-xl ${msg.role === 'user' ? 'bg-primary text-white rounded-br-none' : 'bg-surface/80 text-text-primary rounded-tl-none border border-white/5 backdrop-blur-md'}`}>
                                                <article className="prose prose-invert prose-sm max-w-none">
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                                                </article>
                                            </div>
                                        </div>
                                    ))}
                                    {isLoading && (
                                        <div className="flex justify-start animate-fade-in">
                                            <div className="bg-surface/80 px-4 py-3 rounded-2xl rounded-tl-none border border-white/5 backdrop-blur-md flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                                                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                                                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                                            </div>
                                        </div>
                                    )}
                                    <div ref={chatEndRef} />
                                </div>

                                <div className="p-4 bg-background/40 border-t border-white/5 backdrop-blur-md">
                                    <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-center gap-2 p-1.5 bg-surface/80 border border-white/10 rounded-2xl focus-within:border-primary/50 transition-all">
                                        <input 
                                            value={input} 
                                            onChange={e => setInput(e.target.value)} 
                                            placeholder={`Instrucciones para el Agente ${selectedAgent.id}...`} 
                                            className="w-full bg-transparent p-3 outline-none text-white font-medium text-sm"
                                            disabled={isLoading}
                                        />
                                        <button 
                                            type="submit" 
                                            disabled={isLoading || !input.trim()}
                                            className={`p-3 bg-${selectedAgent.color} text-white font-black rounded-xl hover:brightness-110 disabled:opacity-50 transition-all shadow-lg`}
                                        >
                                            {isLoading ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <SendIcon className="w-5 h-5" />}
                                        </button>
                                    </form>
                                </div>
                            </>
                        )}
                    </main>
                </div>

                <div className="p-4 bg-background/20 border-t border-white/5 flex justify-between items-center text-[9px] text-text-tertiary px-8 font-black uppercase tracking-[0.2em]">
                    <div className="flex items-center gap-4">
                        <span>Hive Protocol v2.4</span>
                        <div className="flex items-center gap-1 text-success">
                            <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                            <span>Red Segura</span>
                        </div>
                    </div>
                    <span className="flex items-center gap-1"><SpinnerIcon className="w-3 h-3"/> Procesamiento Distribuido Activo</span>
                </div>
            </div>
        </div>
    );
};
