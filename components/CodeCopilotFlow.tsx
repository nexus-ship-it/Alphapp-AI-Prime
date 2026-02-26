import React, { useEffect, useRef } from 'react';
import { useCodeCopilotContext } from '../contexts/CodeCopilotContext';
import { CodeLanguage, CodeCompletionSuggestion, CodeDiagnostic } from '../types';
import { CodeEditor } from './ui/CodeEditor';
import { SpinnerIcon } from './ui/icons';

const LANGUAGES: CodeLanguage[] = ['JavaScript', 'TypeScript', 'Python', 'Go', 'Java', 'HTML', 'CSS'];

const SuggestionList: React.FC<{
    suggestions: CodeCompletionSuggestion[];
    onSelect: (suggestion: CodeCompletionSuggestion) => void;
    isLoading: boolean;
}> = ({ suggestions, onSelect, isLoading }) => {
    if (isLoading) {
        return (
            <div className="p-3 border-t border-border flex items-center text-sm text-text-secondary">
                <SpinnerIcon className="w-4 h-4 mr-2" />
                <span>Obteniendo sugerencias...</span>
            </div>
        );
    }
    if (suggestions.length === 0) return null;

    return (
        <div className="p-2 border-t border-border">
            <h4 className="text-xs font-bold text-text-tertiary px-2 mb-1">SUGERENCIAS</h4>
            <ul className="space-y-1">
                {suggestions.map(s => (
                    <li key={s.id} onClick={() => onSelect(s)} className="p-2 rounded-md hover:bg-primary/20 cursor-pointer">
                        <p className="font-semibold text-sm text-text-primary">{s.description}</p>
                        <pre className="text-xs text-text-secondary bg-background/50 p-1 rounded mt-1 whitespace-pre-wrap"><code>{s.text}</code></pre>
                    </li>
                ))}
            </ul>
        </div>
    );
};


const DiagnosticsPanel: React.FC<{
    diagnostics: CodeDiagnostic[];
    isLoading: boolean;
    onSelect: (line: number) => void;
}> = ({ diagnostics, isLoading, onSelect }) => {
    const severityMap = {
        Error: { icon: '🔴', color: 'text-error' },
        Warning: { icon: '🟡', color: 'text-warning' },
        Information: { icon: '🔵', color: 'text-info' },
        Hint: { icon: '💡', color: 'text-accent' }
    };

    return (
        <div className="h-full flex flex-col bg-surface/50 border border-border/50 rounded-lg backdrop-blur-sm">
            <h3 className="text-lg font-semibold p-3 border-b border-border text-text-primary flex items-center">
                Diagnósticos
                {isLoading && <SpinnerIcon className="w-4 h-4 ml-2" />}
            </h3>
            <div className="flex-grow p-2 overflow-y-auto">
                {diagnostics.length === 0 && !isLoading ? (
                    <div className="flex items-center justify-center h-full text-text-tertiary text-center p-4">
                        <p>No se encontraron problemas. ¡Sigue escribiendo!</p>
                    </div>
                ) : (
                    <ul className="space-y-2">
                        {diagnostics.map((d, i) => {
                            const { icon, color } = severityMap[d.severity];
                            return (
                                <li key={i} onClick={() => onSelect(d.line)} className="p-2 rounded-md hover:bg-border/50 cursor-pointer">
                                    <div className={`font-semibold text-sm ${color} flex items-center`}>
                                        <span>{icon}</span>
                                        <span className="ml-2">Línea {d.line}: {d.severity}</span>
                                    </div>
                                    <p className="text-xs text-text-secondary mt-1 ml-6">{d.message}</p>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
};


const CodeCopilotFlow: React.FC = () => {
    const {
        code, language, suggestions, diagnostics, isCompleting, isDiagnosing,
        setCode, setLanguage, applySuggestion, resetCopilot
    } = useCodeCopilotContext();
    const editorRef = useRef<HTMLTextAreaElement>(null);
    
    useEffect(() => {
        return () => {
            resetCopilot();
        };
    }, [resetCopilot]);
    
    const handleCodeChange = (newCode: string, cursorPosition: number) => {
        setCode(newCode, cursorPosition);
    };
    
    const handleSelectSuggestion = (suggestion: CodeCompletionSuggestion) => {
         if (editorRef.current) {
             const cursorPosition = editorRef.current.selectionStart;
             const newCode = applySuggestion(suggestion, cursorPosition);
             
             // Manually update to keep focus and cursor correct
             editorRef.current.value = newCode;
             const newCursorPos = cursorPosition + suggestion.text.length;
             editorRef.current.focus();
             editorRef.current.setSelectionRange(newCursorPos, newCursorPos);
         }
    };
    
     const handleDiagnosticSelect = (line: number) => {
        if (editorRef.current) {
            const lines = code.split('\n');
            const position = lines.slice(0, line - 1).join('\n').length + (line > 1 ? 1 : 0);
            editorRef.current.focus();
            const lineLength = lines[line - 1].length;
            editorRef.current.setSelectionRange(position, position + lineLength);
            
            // Scroll to the line
            const lineHeight = 24; // 1.5rem from editor styles
            const scrollPosition = (line - 3) * lineHeight; // show a bit of context
            editorRef.current.scrollTop = Math.max(0, scrollPosition);
        }
    };

    return (
        <div className="flex flex-col h-full w-full">
            <main className="w-full max-w-screen-xl mx-auto flex-grow flex flex-col items-center mt-4 px-4">
                <div className="w-full text-center sm:text-left mb-6">
                    <h2 className="text-4xl md:text-5xl font-bold text-text-primary">Copiloto de Código</h2>
                    <p className="text-lg text-text-secondary mt-2">Tu asistente IA para escribir código más rápido y con menos errores.</p>
                </div>

                <div className="w-full flex items-center justify-center gap-4 mb-4">
                    <label htmlFor="language-select" className="font-semibold text-text-secondary">Lenguaje:</label>
                    <select
                        id="language-select"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as CodeLanguage)}
                        className="rounded-md border-border bg-surface p-2 text-base focus:border-primary focus:ring-primary"
                    >
                        {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                    </select>
                </div>
                
                <div className="flex-grow w-full grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[60vh]">
                    <div className="lg:col-span-2 flex flex-col h-full bg-surface/50 border border-border/50 rounded-lg backdrop-blur-sm">
                        <div className="flex-grow relative min-h-0">
                            <CodeEditor ref={editorRef} value={code} onChange={handleCodeChange} language={language} />
                        </div>
                        <SuggestionList suggestions={suggestions} onSelect={handleSelectSuggestion} isLoading={isCompleting} />
                    </div>
                    <div className="lg:col-span-1">
                        <DiagnosticsPanel diagnostics={diagnostics} isLoading={isDiagnosing} onSelect={handleDiagnosticSelect} />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CodeCopilotFlow;