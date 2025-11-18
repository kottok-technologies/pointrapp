"use client";

import React from "react";
import {motion} from "framer-motion";
import Image from "next/image";

export function Card({ children }: { children: React.ReactNode }) {
    return (
        <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-md border border-gray-100 text-center"
            >
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                    className="flex justify-center mb-6"
                >
                    <Image
                        src="/images/logo.png"
                        alt="Pointr App Logo"
                        width={160}
                        height={160}
                        className="object-contain"
                        priority
                    />
                </motion.div>
                {children}
            </motion.div>

            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.8 }}
                className="mt-8 text-xs text-gray-400 tracking-wide"
            >
                PointrApp — lightweight agile estimation made simple
            </motion.p>
        </main>
    )
}