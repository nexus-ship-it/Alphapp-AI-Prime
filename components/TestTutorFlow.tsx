

import React, { useState, FormEvent, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTestTutorContext } from '../contexts/TestTutorContext';
import { Loader } from './ui/Loader';
import { TechStack, TechCategory, TechValue, TechOption } from '../types';
import { ReactIcon, VueIcon, NodeJsIcon, PythonIcon } from './ui/TechIcons';
// FIX: Changed to named import for ChatInterface.
import { ChatInterface } from './ChatInterface';
import { useSpeech } from '../hooks/useSpeech';
import { LightbulbIcon, SpinnerIcon } from './ui/icons';
import { CodeBlock } from './ui/CodeBlock';


const techOptions: { name: TechValue; icon: React.FC<{className?:string}>; category: TechCategory }[] = [
    { name: 'React', icon: ReactIcon, category: 'frontend' },
    { name: 'Vue', icon: VueIcon, category: 'frontend' },
    { name: 'Node.js', icon: NodeJsIcon, category: 'backend' },
    { name: 'Python', icon: PythonIcon, category: 'backend' },
];

const SimplifiedTechSelection: React.FC<{
    techStack: TechStack;
    onSelect: (category: TechCategory, value: TechValue) => void;
}> = ({ techStack, onSelect }) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {techOptions.map(option => {
            const isSelected = techStack[option.category] === option.name;
            return (
                <button
                    key={option.name} type="button"
                    onClick={() => onSelect(option.category, option.name)}
                    className={`group p-3 rounded-lg border-2 transition-all duration-200 flex flex-col items-center justify-center gap-2 aspect-square ${isSelected ? 'bg-primary/20 border-primary shadow-lg shadow-primary/10' : 'bg-surface/50 border-border hover:border-primary/50'}`}>
                    <option.icon className={`w-10 h-10 transition-transform ${isSelected ? 'scale-110' : 'group-hover:scale-110'}`} />
                    <span className={`font-medium text-sm ${isSelected ? 'text-white' : 'text-text-secondary'}`}>{option.name}</span>
                </button>
            );
        })}
    </div>
);

const InputStep: React.FC = () => {
    const { startTutoring, techStack, handleTechSelect, isLoading, getAnalysis, analysisFeedback, isAnalyzing } = useTestTutorContext();
    const [code, setCode] = useState('');

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (code.trim()) {
            startTutoring(code, techStack);
        }
    };
    
    const handleAnalyze = () => {
        if(code.trim()){
            getAnalysis(code, techStack);
        }
    }
    
    const language = techStack.frontend !== 'None' ? 'javascript' : 'python';

    return (
        <div className="w-full max-w-7xl mx-auto animate-fade-in">
             <div className="text-center mb-8">
                <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">Tutor de Pruebas</h2>
                <p className="text-lg text-text-secondary">Pega un fragmento de código, selecciona la tecnología y te enseñaré a escribir pruebas para él.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column: Code and Tech */}
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-accent mb-3 text-center">1. Selecciona la Tecnología</h3>
                            <SimplifiedTechSelection techStack={techStack} onSelect={handleTechSelect} />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-accent mb-3 text-center">2. Pega tu Código Aquí</h3>
                             <div className="relative h-96 bg-surface/50 border-2 border-border rounded-lg p-1 backdrop-blur-sm">
                                <textarea
                                    value={code} onChange={(e) => setCode(e.target.value)}
                                    placeholder='// Tu código aquí...'
                                    className="w-full h-full p-4 bg-background font-mono text-text-primary resize-none focus:outline-none rounded-lg"
                                    required
                                    spellCheck="false"
                                />
                             </div>
                        </div>
                    </div>
                    {/* Right Column: Analysis */}
                    <div className="flex flex-col">
                        <h3 className="text-lg font-semibold text-accent mb-3 text-center">3. Análisis de IA (Opcional)</h3>
                        <div className="flex-grow bg-surface/50 border-2 border-border rounded-lg p-4 flex flex-col backdrop-blur-sm">
                            <button type="button" onClick={handleAnalyze} disabled={isAnalyzing || !code.trim()} className="flex w-full items-center justify-center gap-2 px-4 py-3 bg-info text-white font-semibold rounded-lg hover:bg-info/80 disabled:opacity-50 transition-colors mb-4">
                                <LightbulbIcon className="w-5 h-5" />
                                Analizar Código
                            </button>
                            <div className="flex-grow overflow-y-auto pr-2">
                                {isAnalyzing && (
                                    <div className="flex items-center justify-center h-full text-text-secondary">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        <span>Analizando...</span>
                                    </div>
                                )}
                                {!isAnalyzing && !analysisFeedback && (
                                     <div className="flex items-center justify-center h-full text-text-tertiary text-center">
                                        <p>Haz clic en "Analizar Código" para obtener una revisión rápida y sugerencias de la IA antes de empezar.</p>
                                    </div>
                                )}
                                {analysisFeedback && (
                                    <article className="prose prose-invert prose-sm max-w-none">
                                        <ReactMarkdown 
                                          remarkPlugins={[remarkGfm]}
                                          components={{ 
                                            // FIX: Adjust `code` component rendering to correctly differentiate inline/block code
                                            code: ({node, className, children, ...props}) => {
                                                const match = /language-(\w+)/.exec(className || '');
                                                const isBlock = match && String(children).includes('\n'); 
                                                return isBlock ? (
                                                    <CodeBlock language={match[1]}>{String(children).replace(/\n$/, '')}</CodeBlock>
                                                ) : (
                                                    <code className="bg-border/50 text-accent font-mono py-0.5 px-1 rounded-sm text-sm" {...props}>
                                                        {children}
                                                    </code>
                                                )
                                            }
                                          }}
                                        >
                                          {analysisFeedback}
                                        </ReactMarkdown>
                                    </article>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-center pt-4">
                    <button type="submit" disabled={isLoading || !code.trim()}
                        className="w-full sm:w-auto px-10 py-4 bg-primary text-white font-bold text-lg rounded-lg hover:bg-primary-focus transition-transform transform hover:scale-105 duration-300 shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center">
                        {isLoading && <SpinnerIcon className="w-5 h-5 mr-2" />}
                        {isLoading ? 'Iniciando...' : 'Comenzar Tutoría de Pruebas'}
                    </button>
                </div>
            </form>
        </div>
    );
};

const TutoringStep: React.FC = () => {
    const { tutorHistory, sendTutorMessage, isLoading, resetTutor } = useTestTutorContext();
    const [inputText, setInputText] = useState('');
    const { isListening, startListening, stopListening, transcript } = useSpeech(); 

    useEffect(() => {
        if (!isListening && transcript) {
            setInputText(transcript);
            sendTutorMessage(transcript);
        }
    }, [isListening, transcript, sendTutorMessage]);

    return (
        <div className="w-full h-full max-w-4xl flex-grow flex flex-col mt-4 mx-auto">
            <ChatInterface
                context="test-tutor"
                chatHistory={tutorHistory}
                onSendMessage={async (message) => {
                    setInputText('');
                    await sendTutorMessage(message);
                }}
                isLoading={isLoading}
                inputValue={inputText}
                onInputChange={setInputText}
                isListening={isListening}
                startListening={startListening}
                stopListening={stopListening}
                onSpeak={() => {}} 
                cancelSpeaking={() => {}}
                speakingText={null}
                attachedFiles={[]}
                onAddFiles={() => {}}
                onRemoveFile={() => {}}
                onResetChat={resetTutor}
                isTtsEnabled={false}
                onToggleTts={() => {}}
                onOpenHistory={() => {}}
                onOpenVoiceModal={() => {}}
                setMessageFeedback={() => {}}
            />
        </div>
    );
}

const TestTutorFlow: React.FC = () => {
    const { tutorStep, isLoading, error } = useTestTutorContext();

    return (
        <div className="flex flex-col h-full w-full items-center">
            {isLoading && tutorStep === 'input' && <Loader text="Iniciando tutoría..." />}
            <main className="w-full max-w-7xl flex-grow flex flex-col items-center justify-center mt-4 px-4">
                {error && <div className="bg-error/10 border border-error/30 text-red-300 px-4 py-3 rounded-lg relative my-4 w-full" role="alert">{error}</div>}
                {tutorStep === 'input' && <InputStep />}
                {tutorStep === 'tutoring' && <TutoringStep />}
            </main>
        </div>
    );
};

export default TestTutorFlow;