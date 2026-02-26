
import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useToastContext } from '../../contexts/ToastContext';
import { CopyIcon } from './icons';

interface CodeBlockProps {
    language: string;
    children: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ language, children }) => {
    const { addToast } = useToastContext();
    const codeString = String(children).replace(/\n$/, '');

    const handleCopy = () => {
        navigator.clipboard.writeText(codeString).then(() => {
            addToast({
                type: 'success',
                title: '¡Copiado!',
                message: 'El bloque de código se ha copiado al portapapeles.',
            });
        }, () => {
             addToast({
                type: 'error',
                title: 'Error',
                message: 'No se pudo copiar el código.',
            });
        });
    };

    return (
        <div className="bg-background/60 backdrop-blur-sm rounded-lg my-2 relative group border border-border/50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-1.5 bg-surface/50">
                <span className="text-text-secondary text-xs font-sans">{language}</span>
                <button
                    onClick={handleCopy}
                    className="text-text-secondary hover:text-white transition-colors text-xs flex items-center gap-1 opacity-50 group-hover:opacity-100"
                    aria-label="Copiar código"
                >
                    <CopyIcon className="w-4 h-4" /> Copiar
                </button>
            </div>
            <SyntaxHighlighter
                language={language}
                style={vscDarkPlus}
                customStyle={{ margin: 0, padding: '1rem', backgroundColor: 'transparent' }}
                codeTagProps={{ style: { fontFamily: 'inherit', fontSize: 'inherit' } }}
            >
                {codeString}
            </SyntaxHighlighter>
        </div>
    );
};
