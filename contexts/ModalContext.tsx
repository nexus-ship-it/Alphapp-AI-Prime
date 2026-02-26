import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { ModalType, ModalPayload } from '../types';

interface ModalState<T extends ModalType> {
  type: T | null;
  props: T extends keyof ModalPayload ? ModalPayload[T] : {};
}

interface ModalContextType {
  modal: ModalState<ModalType>;
  openModal: <T extends ModalType>(type: T, props: ModalPayload[T]) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [modal, setModal] = useState<ModalState<ModalType>>({ type: null, props: {} });

    const openModal = useCallback(<T extends ModalType>(type: T, props: ModalPayload[T]) => {
        setModal({ type, props });
    }, []);

    const closeModal = useCallback(() => {
        setModal({ type: null, props: {} });
    }, []);

    const value = { modal, openModal, closeModal };

    return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
};

export const useModalContext = () => {
    const context = useContext(ModalContext);
    if (context === undefined) {
        throw new Error('useModalContext must be used within a ModalProvider');
    }
    return context;
};