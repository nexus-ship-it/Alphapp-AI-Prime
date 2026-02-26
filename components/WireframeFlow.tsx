

import React, { useState, useRef, FormEvent } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { DownloadIcon, LayoutTemplateIcon, SendIcon, HistoryIcon, TrashIcon, SaveIcon, MagicWandIcon, CodeIcon, LightbulbIcon, StethoscopeIcon, CopyIcon, SpinnerIcon } from './ui/icons';
import { useToastContext } from '../contexts/ToastContext';
import { WireframeData, WireframeElement, IconName, WireframeCodeResult } from '../types';
import { useWireframeContext } from '../contexts/WireframeContext';
import { Loader } from './ui/Loader';
import { CodeBlock } from './ui/CodeBlock';

const SkeletonLoader: React.FC<{ text: string }> = ({ text }) => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-background rounded-lg">
        <svg className="animate-spin h-10 w-10 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-accent font-semibold animate-pulse">{text}</p>
    </div>
);


const IconLibrary: Record<IconName, React.FC<{ x: number; y: number; size: number; color: string }>> = {
    'menu': ({ x, y, size, color }) => (<path stroke={color} style={{ transition: 'stroke 0.2s ease' }} strokeWidth="2" strokeLinecap="round" d={`M${x+size*0.2},${y+size*0.3}h${size*0.6} M${x+size*0.2},${y+size*0.5}h${size*0.6} M${x+size*0.2},${y+size*0.7}h${size*0.6}`} />),
    'user': ({ x, y, size, color }) => (<g fill="none" stroke={color} style={{ transition: 'stroke 0.2s ease' }} strokeWidth="2" strokeLinecap="round"><circle cx={x+size*0.5} cy={y+size*0.4} r={size*0.2} /><path d={`M${x+size*0.2},${y+size*0.9} q${size*0.3},-${size*0.4} ${size*0.6},0`} /></g>),
    'search': ({ x, y, size, color }) => (<g fill="none" stroke={color} style={{ transition: 'stroke 0.2s ease' }} strokeWidth="2" strokeLinecap="round"><circle cx={x+size*0.45} cy={y+size*0.45} r={size*0.25} /><path d={`M${x+size*0.65},${y+size*0.65} l${size*0.2},${size*0.2}`} /></g>),
    'close': ({ x, y, size, color }) => (<path stroke={color} style={{ transition: 'stroke 0.2s ease' }} strokeWidth="2" strokeLinecap="round" d={`M${x+size*0.2},${y+size*0.2}L${x+size*0.8},${y+size*0.8}M${x+size*0.8},${y+size*0.2}L${x+size*0.2},${y+size*0.8}`} />),
    'arrow-left': ({ x, y, size, color }) => (<path stroke={color} style={{ transition: 'stroke 0.2s ease' }} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d={`M${x+size*0.7},${y+size*0.2}L${x+size*0.3},${y+size*0.5}L${x+size*0.7},${y+size*0.8}`} />),
    'arrow-right': ({ x, y, size, color }) => (<path stroke={color} style={{ transition: 'stroke 0.2s ease' }} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d={`M${x+size*0.3},${y+size*0.2}L${x+size*0.7},${y+size*0.5}L${x+size*0.3},${y+size*0.8}`} />),
    'image': ({ x, y, size, color }) => (<g fill="none" stroke={color} style={{ transition: 'stroke 0.2s ease' }} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x={x+size*0.1} y={y+size*0.1} width={size*0.8} height={size*0.8} rx="1"/><circle cx={x+size*0.35} cy={y+size*0.35} r={size*0.08} /><path d={`M${x+size*0.1},${y+size*0.7} l${size*0.3},-${size*0.3} l${size*0.5},${size*0.5}`} /></g>),
    'home': ({ x, y, size, color }) => (<path fill="none" stroke={color} style={{ transition: 'stroke 0.2s ease' }} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d={`M${x+size*0.1},${y+size*0.5}L${x+size*0.5},${y+size*0.1}L${x+size*0.9},${y+size*0.5}V${y+size*0.9}H${x+size*0.1}Z`} />),
    'settings': ({ x, y, size, color }) => (<g fill="none" stroke={color} style={{ transition: 'stroke 0.2s ease' }} strokeWidth="2" strokeLinecap="round"><circle cx={x+size*0.5} cy={y+size*0.5} r={size*0.15} /><path d={`M${x+size*0.5},${y+size*0.1}V${y+size*0.3} M${x+size*0.5},${y+size*0.7}V${y+size*0.9} M${x+size*0.1},${y+size*0.5}H${y+size*0.3} M${x+size*0.7},${y+size*0.5}H${y+size*0.9}`} /></g>),
    'copy': ({ x, y, size, color }) => (<path fill="none" stroke={color} style={{ transition: 'stroke 0.2s ease' }} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d={`M${x+size*0.6},${y+size*0.6} H${x+size*0.9} V${y+size*0.9} H${x+size*0.6} Z M${x+size*0.1},${y+size*0.1} H${x+size*0.4} V${y+size*0.4} H${x+size*0.1} Z M${x+size*0.1},${y+size*0.6} V${y+size*0.4} H${x+size*0.6}`} />),
    'send': ({ x, y, size, color }) => (<path fill="none" stroke={color} style={{ transition: 'stroke 0.2s ease' }} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d={`M${x+size*0.1},${y+size*0.1} L${x+size*0.9},${y+size*0.5} L${x+size*0.1},${y+size*0.9} L${x+size*0.3},${y+size*0.5} Z`} />),
};

const RenderWireframeElement: React.FC<{
    element: WireframeElement;
    activeId: string | null;
    hoveredId: string | null;
    onActivate: (id: string) => void;
    onDeactivate: () => void;
    onHover: (id: string) => void;
    onUnhover: () => void;
}> = ({ element, activeId, hoveredId, onActivate, onDeactivate, onHover, onUnhover }) => {
    const renderChildren = () => element.children?.map(child => <RenderWireframeElement key={child.id} element={child} {...{ activeId, hoveredId, onActivate, onDeactivate, onHover, onUnhover }} />);
    const baseStyle = { fill: element.backgroundColor || 'transparent', stroke: element.borderColor || '#CCCCCC', strokeWidth: 2 };

    switch (element.type) {
        case 'container':
            return <g><rect x={element.x} y={element.y} width={element.width} height={element.height} rx={element.borderRadius || 0} {...baseStyle} />{renderChildren()}</g>;
        case 'text':
            return <text x={element.x + (element.textAlign === 'center' ? element.width / 2 : element.textAlign === 'right' ? element.width - 10 : 10)} y={element.y + element.height / 2} dominantBaseline="middle" textAnchor={element.textAlign === 'center' ? 'middle' : element.textAlign === 'right' ? 'end' : 'start'} fontSize={element.fontSize || 16} fontWeight={element.fontWeight || 'normal'} fill={element.borderColor || '#333333'} style={{ userSelect: 'none' }}>{element.text}</text>;
        case 'button': {
            const isActive = activeId === element.id;
            const isHovered = hoveredId === element.id;
            const fill = isActive && element.activeBackgroundColor ? element.activeBackgroundColor : isHovered && element.hoverBackgroundColor ? element.hoverBackgroundColor : element.backgroundColor || 'transparent';
            const stroke = isActive && element.activeBorderColor ? element.activeBorderColor : isHovered && element.hoverBorderColor ? element.hoverBorderColor : element.borderColor || '#CCCCCC';
            const textColor = isActive && element.activeBorderColor ? element.activeBorderColor : isHovered && element.hoverBorderColor ? element.hoverBorderColor : element.borderColor || '#333333';
            
            return (
                <g onMouseDown={() => onActivate(element.id)} onMouseUp={onDeactivate} onMouseEnter={() => onHover(element.id)} onMouseLeave={onUnhover} style={{ cursor: 'pointer' }}>
                    <rect x={element.x} y={element.y} width={element.width} height={element.height} rx={element.borderRadius || 4} fill={fill} stroke={stroke} strokeWidth={2} style={{ transition: 'fill 0.2s ease, stroke 0.2s ease' }} />
                    <text x={element.x + element.width / 2} y={element.y + element.height / 2} dominantBaseline="middle" textAnchor="middle" fontSize={element.fontSize || 16} fontWeight={element.fontWeight || 'bold'} fill={textColor} style={{ transition: 'fill 0.2s ease', userSelect: 'none' }} pointerEvents="none">{element.text}</text>
                </g>
            );
        }
        case 'input':
            return <g><rect x={element.x} y={element.y} width={element.width} height={element.height} rx={element.borderRadius || 4} {...baseStyle} fill="#FFFFFF" /><text x={element.x + 10} y={element.y + element.height / 2} dominantBaseline="middle" textAnchor="start" fontSize={element.fontSize || 16} fill="#9CA3AF" style={{ userSelect: 'none' }}>{element.text || 'Placeholder'}</text></g>;
        case 'image':
            return <g><rect x={element.x} y={element.y} width={element.width} height={element.height} rx={element.borderRadius || 0} {...baseStyle} fill="#F3F4F6" /><path stroke="#9CA3AF" strokeWidth="2" d={`M${element.x},${element.y} L${element.x+element.width},${element.y+element.height} M${element.x+element.width},${element.y} L${element.x},${element.y+element.height}`} /></g>;
        case 'icon': {
            const isIconActive = activeId === element.id;
            const isIconHovered = hoveredId === element.id;
            const iconColor = isIconActive && element.activeBorderColor ? element.activeBorderColor : isIconHovered && element.hoverBorderColor ? element.hoverBorderColor : element.borderColor || '#333333';
            const IconComponent = IconLibrary[element.iconName || 'image'];
            return (
                <g onMouseDown={() => onActivate(element.id)} onMouseUp={onDeactivate} onMouseEnter={() => onHover(element.id)} onMouseLeave={onUnhover} style={{ cursor: 'pointer' }}>
                    <IconComponent x={element.x} y={element.y} size={Math.min(element.width, element.height)} color={iconColor} />
                </g>
            );
        }
        default: return null;
    }
};

const TabButton: React.FC<{ label: string; icon: React.FC<{ className?: string }>; isActive: boolean; onClick: () => void; }> = ({ label, icon: Icon, isActive, onClick }) => (
    <button onClick={onClick} className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors duration-200 ${isActive ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-white'}`}>
        <Icon className="w-5 h-5" />
        <span>{label}</span>
    </button>
);


const WireframeFlow: React.FC<{ onSendToDoctor: (result: WireframeCodeResult) => void; }> = ({ onSendToDoctor }) => {
    const { wireframeResult, codeResult, isLoading, loadingText, error, generateWireframe, refineWireframe, generateCode, resetWireframe, saveDraft, loadDraft, clearDraft, hasDraft } = useWireframeContext();
    const [wireframePrompt, setWireframePrompt] = useState('');
    const [refinementPrompt, setRefinementPrompt] = useState('');
    const [activeElementId, setActiveElementId] = useState<string | null>(null);
    const [hoveredElementId, setHoveredElementId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'code' | 'explanation' | 'refine'>('code');
    const svgRef = useRef<SVGSVGElement>(null);
    const { addToast } = useToastContext();

    const handleGenerate = (e: FormEvent) => {
        e.preventDefault();
        if (wireframePrompt.trim()) {
            generateWireframe(wireframePrompt);
        }
    };

    const handleRefine = (e: FormEvent) => {
        e.preventDefault();
        if (refinementPrompt.trim() && wireframeResult) {
            const { explanation, ...currentData } = wireframeResult;
            refineWireframe(currentData, refinementPrompt).then(() => {
                setRefinementPrompt('');
            });
        }
    };

    const handleCopyCode = () => {
        if (codeResult?.content) {
            navigator.clipboard.writeText(codeResult.content).then(() => {
                addToast({ type: 'success', title: 'Copiado', message: 'Código copiado al portapapeles.' });
            });
        }
    };

    const handleDownloadFile = () => {
        if (codeResult) {
            const blob = new Blob([codeResult.content], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = codeResult.filePath.split('/').pop() || 'component.tsx';
            a.click();
            URL.revokeObjectURL(url);
        }
    };

    const handleExportSVG = () => {
        if (!svgRef.current) return;
        const svgString = new XMLSerializer().serializeToString(svgRef.current);
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'wireframe.svg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        addToast({ type: 'success', title: 'Exportado', message: 'Se ha descargado el wireframe como SVG.' });
    };

    return (
        <div className="flex flex-col h-full w-full items-center">
            <main className="w-full max-w-screen-xl mx-auto flex-grow flex flex-col items-center mt-4 px-4">
                <div className="w-full flex justify-between items-center mb-8 flex-col sm:flex-row gap-4">
                    <div className="text-center sm:text-left">
                        <h2 className="text-4xl md:text-5xl font-bold text-text-primary">Creador de Wireframes</h2>
                        <p className="text-lg text-text-secondary mt-2">Genera un wireframe a partir de una simple descripción de texto.</p>
                    </div>
                    {wireframeResult && (
                         <button onClick={resetWireframe} className="px-6 py-2 border-2 border-primary text-primary font-semibold rounded-lg hover:bg-primary hover:text-white transition duration-300 flex-shrink-0">
                            Empezar de Nuevo
                        </button>
                    )}
                </div>

                {error && <div className="bg-error/10 border border-error/30 text-red-300 px-4 py-3 rounded-lg relative my-4 w-full" role="alert">{error}</div>}
                
                <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in h-[80vh] flex-grow">
                    <div className="lg:col-span-8 flex flex-col bg-surface/50 rounded-lg border border-border backdrop-blur-sm h-full">
                        <div className="flex-grow p-4 min-h-0 relative flex items-center justify-center bg-background rounded-b-lg">
                            {isLoading && !wireframeResult ? (
                                <SkeletonLoader text={loadingText} />
                            ) : wireframeResult ? (
                                <svg 
                                    ref={svgRef} 
                                    className="rounded-lg shadow-xl border border-border/50"
                                    style={{ 
                                        aspectRatio: `${wireframeResult.canvas.width} / ${wireframeResult.canvas.height}`,
                                        maxWidth: '100%',
                                        maxHeight: '100%',
                                        width: 'auto',
                                        height: 'auto'
                                    }}
                                    viewBox={`0 0 ${wireframeResult.canvas.width} ${wireframeResult.canvas.height}`}
                                >
                                    <rect width="100%" height="100%" fill={wireframeResult.canvas.backgroundColor} />
                                    {wireframeResult.elements.map(el => <RenderWireframeElement key={el.id} element={el} activeId={activeElementId} hoveredId={hoveredElementId} onActivate={setActiveElementId} onDeactivate={() => setActiveElementId(null)} onHover={setHoveredElementId} onUnhover={() => setHoveredElementId(null)} />)}
                                </svg>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-center">
                                    <LayoutTemplateIcon className="w-24 h-24 text-text-tertiary mb-4" />
                                    <h3 className="text-xl font-semibold text-text-secondary">Diseñador de Bocetos</h3>
                                    <p className="text-text-tertiary mt-2 max-w-md">Describe la interfaz que quieres crear en el panel de la derecha para empezar.</p>
                                    <div className="mt-6 flex items-center gap-4">
                                        <button onClick={loadDraft} disabled={!hasDraft} className="flex items-center gap-2 px-4 py-2 bg-primary/20 text-primary font-semibold rounded-lg hover:bg-primary/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm">
                                            <HistoryIcon className="w-5 h-5" />
                                            Cargar último borrador
                                        </button>
                                        <button onClick={clearDraft} disabled={!hasDraft} className="p-2 text-text-tertiary hover:text-error transition-colors disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Eliminar borrador">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="lg:col-span-4 flex flex-col gap-4 h-full">
                        <div className="flex-grow flex flex-col bg-surface/50 rounded-lg border border-border backdrop-blur-sm min-h-0">
                            {!codeResult ? (
                                <>
                                    <h3 className="text-base font-bold text-text-primary p-3 border-b border-border">Control de Diseño</h3>
                                    <div className="flex-grow p-4 overflow-y-auto space-y-4">
                                        {wireframeResult && (
                                            <div className="prose prose-invert prose-sm max-w-none bg-background/50 p-3 rounded-lg">
                                                <h4 className="text-accent !mb-2">Explicación de la IA</h4>
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{wireframeResult.explanation}</ReactMarkdown>
                                            </div>
                                        )}
                                    </div>
                                    <form onSubmit={wireframeResult ? handleRefine : handleGenerate} className="p-2 border-t border-border">
                                        <textarea value={wireframeResult ? refinementPrompt : wireframePrompt} onChange={(e) => wireframeResult ? setRefinementPrompt(e.target.value) : setWireframePrompt(e.target.value)} placeholder={wireframeResult ? "Ej: 'Haz la cabecera más alta...'" : "Ej: 'Una página de inicio para una app de música...'"} className="w-full p-2 bg-surface/80 border-2 border-border rounded-lg text-sm focus:ring-2 focus:ring-primary transition-colors resize-none mb-2 h-24" disabled={isLoading} />
                                        <button type="submit" disabled={isLoading || (wireframeResult ? !refinementPrompt.trim() : !wireframePrompt.trim())} className="w-full p-2 rounded-lg bg-primary text-white hover:bg-primary-focus transition-all disabled:bg-border disabled:cursor-not-allowed flex items-center justify-center gap-2"> <SendIcon className="w-5 h-5" /> <span>{wireframeResult ? 'Refinar Wireframe' : 'Generar Wireframe'}</span></button>
                                    </form>
                                </>
                            ) : (
                                <>
                                    <div className="flex border-b border-border"><TabButton label="Código" icon={CodeIcon} isActive={activeTab === 'code'} onClick={() => setActiveTab('code')} /><TabButton label="Explicación" icon={LightbulbIcon} isActive={activeTab === 'explanation'} onClick={() => setActiveTab('explanation')} /><TabButton label="Refinar Diseño" icon={LayoutTemplateIcon} isActive={activeTab === 'refine'} onClick={() => setActiveTab('refine')} /></div>
                                    <div className="flex-grow overflow-y-auto p-4">
                                        {activeTab === 'code' && (<div className="space-y-2"><h4 className="font-semibold text-accent mb-1">Código Generado</h4><CodeBlock language="tsx">{codeResult.content}</CodeBlock></div>)}
                                        {activeTab === 'explanation' && (<div className="prose prose-invert prose-sm max-w-none"><h4 className="text-accent !mb-1">Explicación del Código</h4><ReactMarkdown remarkPlugins={[remarkGfm]}>{codeResult.explanation}</ReactMarkdown></div>)}
                                        {activeTab === 'refine' && (
                                            <form onSubmit={handleRefine} className="flex flex-col h-full">
                                                <h4 className="font-semibold text-accent mb-2">Refinar Diseño Original</h4>
                                                <textarea value={refinementPrompt} onChange={(e) => setRefinementPrompt(e.target.value)} placeholder="Ej: 'Haz la cabecera más alta...'" className="w-full flex-grow p-2 bg-surface/80 border-2 border-border rounded-lg text-sm resize-none mb-2" disabled={isLoading} />
                                                <button type="submit" disabled={isLoading || !refinementPrompt.trim()} className="w-full p-2 rounded-lg bg-primary text-white flex items-center justify-center gap-2"><SendIcon className="w-5 h-5" /> <span>Refinar Wireframe</span></button>
                                            </form>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                        {wireframeResult && (
                            <div className="flex-shrink-0 bg-surface/50 p-3 rounded-lg border border-border space-y-2">
                                <h3 className="text-sm font-semibold text-accent text-center">Acciones</h3>
                                <div className="grid grid-cols-1 gap-2">
                                    {codeResult ? (
                                        <div className="grid grid-cols-2 gap-2">
                                            <button onClick={handleDownloadFile} className="p-2 text-sm bg-border/50 rounded-md flex items-center justify-center gap-2"><DownloadIcon className="w-4 h-4"/> Descargar</button>
                                            <button onClick={() => onSendToDoctor(codeResult)} className="p-2 text-sm bg-info/20 text-info font-semibold rounded-md flex items-center justify-center gap-2"><StethoscopeIcon className="w-4 h-4"/> Analizar</button>
                                        </div>
                                    ) : (
                                        <button onClick={generateCode} disabled={isLoading} className="p-2 text-sm bg-primary text-white font-semibold rounded-lg hover:bg-primary-focus transition-colors disabled:opacity-50 flex items-center justify-center gap-2"> {isLoading && !codeResult ? <SpinnerIcon className="w-4 h-4"/> : <MagicWandIcon className="w-4 h-4"/>} {isLoading && !codeResult ? 'Generando...' : 'Generar Código'}</button>
                                    )}
                                    <div className="grid grid-cols-2 gap-2">
                                        <button onClick={handleExportSVG} className="p-2 text-sm bg-border/50 text-text-secondary hover:bg-border hover:text-white transition-colors rounded-md flex items-center justify-center gap-2"><DownloadIcon className="w-4 h-4"/> SVG</button>
                                        <button onClick={() => saveDraft(wireframeResult)} className="p-2 text-sm bg-border/50 text-text-secondary hover:bg-border hover:text-white transition-colors rounded-md flex items-center justify-center gap-2"><SaveIcon className="w-4 h-4"/> Guardar</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default WireframeFlow;