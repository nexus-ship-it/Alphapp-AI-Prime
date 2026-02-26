import React, { useState, useRef, useEffect, forwardRef, memo } from 'react';

interface CodeEditorProps {
    value: string;
    onChange: (value: string, cursorPosition: number) => void;
    language: string;
}

export const CodeEditor = memo(forwardRef<HTMLTextAreaElement, CodeEditorProps>(({ value, onChange, language }, ref) => {
    const [lineNumbers, setLineNumbers] = useState('1');
    const lineNumbersRef = useRef<HTMLPreElement>(null);
    
    const internalRef = useRef<HTMLTextAreaElement>(null);
    const textareaRef = ref || internalRef;


    useEffect(() => {
        const lines = value.split('\n').length;
        const numbers = Array.from({ length: lines }, (_, i) => i + 1).join('\n');
        setLineNumbers(numbers);
    }, [value]);

    const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChange(e.target.value, e.target.selectionStart);
    };
    
    const handleScroll = () => {
        const ta = (textareaRef as React.RefObject<HTMLTextAreaElement>).current;
        if (ta && lineNumbersRef.current) {
            lineNumbersRef.current.scrollTop = ta.scrollTop;
        }
    };
    
    useEffect(() => {
        const ta = (textareaRef as React.RefObject<HTMLTextAreaElement>).current;
        if (ta) {
            ta.addEventListener('scroll', handleScroll);
            return () => ta.removeEventListener('scroll', handleScroll);
        }
    }, [textareaRef]);

    return (
        <div className="relative h-full w-full bg-background/80 flex font-mono text-sm border-2 border-transparent rounded-lg overflow-hidden">
            <pre
                ref={lineNumbersRef}
                aria-hidden="true"
                className="p-4 text-right text-text-tertiary select-none bg-surface/50 border-r border-border"
                style={{ lineHeight: '1.5rem' }}
            >
                {lineNumbers}
            </pre>
            <textarea
                ref={textareaRef}
                value={value}
                onChange={handleCodeChange}
                onKeyDown={(e) => {
                    if (e.key === 'Tab') {
                        e.preventDefault();
                        const start = e.currentTarget.selectionStart;
                        const end = e.currentTarget.selectionEnd;
                        const newValue = value.substring(0, start) + '  ' + value.substring(end);
                        e.currentTarget.value = newValue;
                        // A more robust way to trigger react state update
                        onChange(newValue, start + 2);
                        
                        // Set selection range after state update
                        setTimeout(() => {
                             const ta = (textareaRef as React.RefObject<HTMLTextAreaElement>).current;
                             if(ta) {
                                ta.selectionStart = ta.selectionEnd = start + 2;
                             }
                        }, 0);
                    }
                }}
                spellCheck="false"
                className="flex-grow p-4 bg-transparent resize-none outline-none text-text-primary caret-primary h-full"
                style={{ lineHeight: '1.5rem' }}
                placeholder={`Escribe tu código ${language} aquí...`}
            />
        </div>
    );
}));