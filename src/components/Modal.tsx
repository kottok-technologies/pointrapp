// components/ui/Modal.tsx
"use client";

import { ReactNode, useEffect } from "react";

export default function Modal({
                                  open,
                                  title,
                                  children,
                                  onClose,
                                  footer,
                              }: {
    open: boolean;
    title?: string;
    children: ReactNode;
    footer?: ReactNode;
    onClose: () => void;
}) {
    useEffect(() => {
        if (!open) return;

        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };

        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div
                className="absolute inset-0"
                onClick={onClose}
            />

            <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-md animate-fadeIn scale-100">
                {title && (
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">
                        {title}
                    </h2>
                )}

                <div className="mb-4">{children}</div>

                {footer && (
                    <div className="mt-4 flex justify-end gap-3">{footer}</div>
                )}
            </div>
        </div>
    );
}
