

import { useState, useCallback } from 'react';
import { ToastProps } from '../components/ui/Toast';

export type ToastOptions = Omit<ToastProps, 'id' | 'onClose'>;

export const useToast = () => {
    const [toasts, setToasts] = useState<ToastProps[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    }, []);

    const addToast = useCallback((toast: ToastOptions) => {
        const id = new Date().getTime().toString() + Math.random().toString();
        setToasts(prevToasts => [...prevToasts, { ...toast, id, onClose: removeToast }]);
    }, [removeToast]);

    return { toasts, addToast, removeToast };
};