
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useCodeTranslatorContext, Language } from '../contexts/CodeTranslatorContext';
import { Loader } from './ui/Loader';
import { CopyIcon, SpinnerIcon, SwapIcon } from './ui/icons';
import { useToastContext } from '../contexts/ToastContext';
import { CodeBlock } from './ui/CodeBlock';

const LANGUAGES: Language[] = ['React', 'Vue', 'Angular', 'Svelte', 'JavaScript', 'TypeScript', 'Python', 'Go', 'Java'];

const CodeTranslatorFlow: React.FC = () => {
    const {
        sourceCode,
        sourceLang,
        targetLang,
        translationResult,
        isLoading,
        error,
        setSourceCode,
        setSourceLang,
        setTargetLang,
        translateCode,
    } = useCodeTranslatorContext();
    
    const getLanguageSyntax = (lang: Language) => {
        switch (lang) {
            case 'React':
            case 'Vue':
            case 'Svelte':
            case 'JavaScript':
                return 'javascript';
            case 'TypeScript':
                return 'typescript';
            case 'Python':
                return 'python';
            case 'Go':
                return 'go';
            case 'Java':
                return 'java';
            case 'Angular':
                return 'typescript'; // Angular is primarily TS
            default:
                return 'plaintext';
        }
    }


    return (
        <div className="flex flex-col h-full w-full">
            {isLoading && <Loader text="Traduciendo código..." />}
            <main className="w-full max-w-screen-xl mx-auto flex-grow flex flex-col mt-4 px-4">
                <div className="w-full text-center sm:text-left mb-6">
                    <h2 className="text-4xl md:text-5xl font-bold text-text-primary">Traductor de Código</h2>
                    <p className="text-lg text-text-secondary mt-2">Convierte código entre diferentes lenguajes y frameworks con la ayuda de la IA.</p>
                </div>

                {error && (
                    <div className="bg-error/10 border border-error/30 text-red-300 px-4 py-3 rounded-lg relative my-4 w-full" role="alert">
                        {error}
                    </div>
                )}
                
                <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-6">
                    <div className="w-full md:w-auto">
                        <label htmlFor="source-lang" className="block text-sm font-medium text-text-secondary mb-1">Desde:</label>
                        <select
                            id="source-lang"
                            value={sourceLang}
                            onChange={(e) => setSourceLang(e.target.value as Language)}
                            className="w-full rounded-md border-border bg-surface p-2 text-base focus:border-primary focus:ring-primary"
                        >
                            {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                        </select>
                    </div>
                    
                    <div className="p-2 mt-4">
                       <SwapIcon className="w-6 h-6 text-primary"/>
                    </div>

                    <div className="w-full md:w-auto">
                        <label htmlFor="target-lang" className="block text-sm font-medium text-text-secondary mb-1">A:</label>
                        <select
                            id="target-lang"
                            value={targetLang}
                            onChange={(e) => setTargetLang(e.target.value as Language)}
                            className="w-full rounded-md border-border bg-surface p-2 text-base focus:border-primary focus:ring-primary"
                        >
                            {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[50vh]">
                    {/* Input Panel */}
                    <div className="flex flex-col bg-surface/50 border border-border rounded-lg">
                        <h3 className="p-3 border-b border-border font-semibold text-text-primary">Código Fuente ({sourceLang})</h3>
                        <textarea
                            value={sourceCode}
                            onChange={(e) => setSourceCode(e.target.value)}
                            placeholder={`Pega tu código ${sourceLang} aquí...`}
                            className="w-full h-full p-4 bg-background rounded-b-lg text-text-primary font-mono text-sm resize-none focus:outline-none"
                            spellCheck="false"
                        />
                    </div>
                    {/* Output Panel */}
                    <div className="flex flex-col bg-surface/50 border border-border rounded-lg">
                        <h3 className="p-3 border-b border-border font-semibold text-text-primary">Resultado ({targetLang})</h3>
                        <div className="flex-grow p-4 overflow-y-auto bg-background rounded-b-lg">
                            {translationResult ? (
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="font-semibold text-accent mb-2">Código Traducido</h4>
                                        <CodeBlock language={getLanguageSyntax(targetLang)}>
                                            {translationResult.translatedCode}
                                        </CodeBlock>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-accent mb-2">Explicación</h4>
                                        <article className="prose prose-invert prose-sm max-w-none">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {translationResult.explanation}
                                            </ReactMarkdown>
                                        </article>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center text-text-tertiary">
                                    <p>La traducción aparecerá aquí.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-6 text-center">
                    <button
                        onClick={translateCode}
                        disabled={isLoading}
                        className="w-full sm:w-auto px-10 py-3 bg-primary text-white font-bold text-lg rounded-lg hover:bg-primary-focus transition-transform transform hover:scale-105 duration-300 shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isLoading && <SpinnerIcon className="w-5 h-5" />}
                        {isLoading ? 'Traduciendo...' : 'Traducir Código'}
                    </button>
                </div>
            </main>
        </div>
    );
};

export default CodeTranslatorFlow;