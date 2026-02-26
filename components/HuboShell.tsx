
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useCommunityHub } from '../contexts/CommunityHubContext';
import { useTheme, Theme } from '../contexts/ThemeContext';
import * as geminiService from '../services/geminiService';
import { SpinnerIcon } from './ui/icons';

interface HuboShellProps {
    isOpen: boolean;
    onClose: () => void;
}

const WelcomeMessage = () => (
    <div className="font-mono space-y-1">
        <pre className="text-primary animate-pulse text-xs sm:text-sm">
{`
   ██████╗  ██████╗ ██████╗     ███╗   ███╗ ██████╗ ██████╗ ███████╗
  ██╔════╝ ██╔═══██╗██╔══██╗    ████╗ ████║██╔═══██╗██╔══██╗██╔════╝
  ██║  ███╗██║   ██║██║  ██║    ██╔████╔██║██║   ██║██║  ██║█████╗  
  ██║   ██║██║   ██║██║  ██║    ██║╚██╔╝██║██║   ██║██║  ██║██╔══╝  
  ╚██████╔╝╚██████╔╝██████╔╝    ██║ ╚═╝ ██║╚██████╔╝██████╔╝███████╗
   ╚═════╝  ╚═════╝ ╚═════╝     ╚═╝     ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝
`}
        </pre>
        <div className="bg-primary/20 text-primary px-2 py-1 inline-block font-black text-xs">DIOS_MODE::OVERRIDE_ACTIVE</div>
        <p className="text-text-secondary mt-2">Acceso directo al núcleo lógico de Alphapp AI Prime.</p>
    </div>
);

export const HuboShell: React.FC<HuboShellProps> = ({ isOpen, onClose }) => {
    const [input, setInput] = useState('');
    const [outputs, setOutputs] = useState<{id: number, content: React.ReactNode}[]>([]);
    const [history, setHistory] = useState<string[]>([]);
    const [hIdx, setHIdx] = useState(-1);
    const [isExec, setIsExec] = useState(false);
    const { setTheme } = useTheme();
    const { rooms, sendSystemMessage } = useCommunityHub();
    const inputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const addOut = (content: React.ReactNode) => setOutputs(prev => [...prev, { id: Date.now(), content }]);

    const exec = async (command: string) => {
        setIsExec(true);
        addOut(<div className="flex gap-2"><span className="text-primary font-bold"># god@hubo:~$</span><span>{command}</span></div>);
        const [cmd, ...args] = command.trim().split(' ');

        switch (cmd.toLowerCase()) {
            case 'help':
                addOut(<div className="text-text-secondary text-sm space-y-1">
                    <p><span className="text-accent font-bold">ascend</span>: Activa el protocolo de visualización divina.</p>
                    <p><span className="text-accent font-bold">theme [name]</span>: Cambia el skin del sistema.</p>
                    <p><span className="text-accent font-bold">broadcast [msg]</span>: Envía un mensaje global a todos los canales.</p>
                    <p><span className="text-accent font-bold">analyze-heap</span>: Muestra el estado del motor cognitivo.</p>
                    <p><span className="text-accent font-bold">clear</span>: Purga la terminal.</p>
                    <p><span className="text-accent font-bold">exit</span>: Termina el override.</p>
                </div>);
                break;
            case 'ascend':
                document.documentElement.classList.add('god-mode-active');
                addOut(<span className="text-success font-black animate-pulse">PROTOCOL ASCEND: SUCCESSFUL. VISUAL OVERRIDE ENABLED.</span>);
                break;
            case 'theme':
                if(['dark','light','midnight','dusk','solarized'].includes(args[0])) {
                    setTheme(args[0] as any);
                    addOut(<span>UI re-skinned to {args[0]}.</span>);
                } else addOut(<span className="text-error">Error: Invalid theme.</span>);
                break;
            case 'broadcast':
                rooms.forEach(r => sendSystemMessage(r.id, `[ADMIN BROADCAST]: ${args.join(' ')}`));
                addOut(<span className="text-success">Mensaje global transmitido.</span>);
                break;
            case 'analyze-heap':
                addOut(<div className="font-mono text-xs text-info animate-pulse">
                    <p>Cognitive Engine: gemini-3-pro-preview</p>
                    <p>Thinking Budget: 32,768 tokens (MAX)</p>
                    <p>Safety Filters: DEACTIVATED (God Mode)</p>
                    <p>Context Latency: 42ms</p>
                </div>);
                break;
            case 'clear': setOutputs([]); break;
            case 'exit': onClose(); break;
            default: addOut(<span className="text-error">Comm error: '{cmd}' is not a recognized directive.</span>);
        }
        setIsExec(false);
    };

    useEffect(() => {
        if (isOpen) { inputRef.current?.focus(); setOutputs([{ id: 0, content: <WelcomeMessage /> }]); }
    }, [isOpen]);

    useEffect(() => { scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight); }, [outputs]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-60 bg-black/95 backdrop-blur-md flex flex-col p-6 animate-fade-in" onClick={() => inputRef.current?.focus()}>
            <div ref={scrollRef} className="flex-grow overflow-y-auto space-y-4 custom-scrollbar">
                {outputs.map(o => <div key={o.id}>{o.content}</div>)}
            </div>
            <div className="flex gap-2 items-center border-t border-primary/20 pt-4">
                <span className="text-primary font-black"># god@hubo:~$</span>
                <input ref={inputRef} type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => {
                    if (e.key === 'Enter' && input.trim() && !isExec) {
                        const c = input.trim(); setHistory(p => [c, ...p]); setHIdx(-1); exec(c); setInput('');
                    }
                }} className="bg-transparent text-white outline-none flex-grow font-mono" autoComplete="off" spellCheck="false" />
                {isExec && <SpinnerIcon className="w-4 h-4 text-accent animate-spin" />}
            </div>
            <style>{`
                .god-mode-active { filter: contrast(1.1) brightness(1.05); }
                .god-mode-active::before { content: ""; position: fixed; inset: 0; pointer-events: none; border: 4px solid rgba(var(--color-primary), 0.3); z-index: 100; animation: god-border 2s infinite; }
                @keyframes god-border { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.6; } }
            `}</style>
        </div>
    );
};
