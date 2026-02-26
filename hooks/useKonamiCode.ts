import { useEffect, useState, useCallback } from 'react';

const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

export const useKonamiCode = (callback: () => void) => {
    const [keys, setKeys] = useState<string[]>([]);

    const handler = useCallback((event: KeyboardEvent) => {
        setKeys(prevKeys => {
            const nextKey = event.key;
            const expectedNextKey = konamiCode[prevKeys.length];

            if (nextKey === expectedNextKey) {
                // Correct key in sequence
                const newKeys = [...prevKeys, nextKey];
                if (newKeys.length === konamiCode.length) {
                    // Full code entered
                    callback();
                    return []; // Reset
                }
                return newKeys;
            } else {
                // Incorrect key, check if it's the start of a new sequence
                if (nextKey === konamiCode[0]) {
                    return [nextKey]; // Start new sequence
                }
                // Completely wrong key, reset
                return [];
            }
        });
    }, [callback]);

    useEffect(() => {
        window.addEventListener('keydown', handler);
        return () => {
            window.removeEventListener('keydown', handler);
        };
    }, [handler]);
};
