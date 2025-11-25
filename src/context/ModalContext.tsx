"use client";

import {
    createContext,
    useContext,
    useState,
    ReactNode,
    useCallback,
} from "react";
import { createPortal } from "react-dom";

type ModalOptions = {
    content: ReactNode;
};

type ModalContextValue = {
    openModal: (content: ReactNode) => void;
    closeModal: () => void;
};

const ModalContext = createContext<ModalContextValue | null>(null);

export function ModalProvider({ children }: { children: ReactNode }) {
    const [modalContent, setModalContent] = useState<ReactNode | null>(null);

    const openModal = useCallback((content: ReactNode) => {
        setModalContent(content);
    }, []);

    const closeModal = useCallback(() => {
        setModalContent(null);
    }, []);

    return (
        <ModalContext.Provider value={{ openModal, closeModal }}>
            {children}

            {modalContent &&
                createPortal(
                    <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center">
                        <div
                            className="absolute inset-0"
                            onClick={closeModal}
                        />
                        <div className="relative bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
                            {modalContent}
                        </div>
                    </div>,
                    document.getElementById("modal-root")!
                )}
        </ModalContext.Provider>
    );
}

export function useModal() {
    const ctx = useContext(ModalContext);
    if (!ctx) throw new Error("useModal must be used within a ModalProvider");
    return ctx;
}
