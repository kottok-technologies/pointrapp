"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import {User} from "@/lib/types";

export default function HomePage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [roomId, setRoomId] = useState("");

    async function createRoom() {
        if (!name.trim()) return;

        const res = await fetch("/api/rooms", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: `${name || "New"}'s Room`,
                createdBy: "temp-user",
                deckType: "fibonacci",
                allowObservers: true,
                revealMode: "allReveal",
            }),
        });

        const data = await res.json();
        if (res.ok && data.roomId) router.push(`/room/${data.roomId}`);
    }

    function joinExisting() {
        if (roomId.trim()) router.push(`/room/${roomId.trim()}`);
    }

    // Load user from local storage if it exists
    useEffect(() => {
        let isMounted = true;
        const loadUser = () => {
            try {
                const saved = localStorage.getItem("pointrapp:user");
                if (saved && isMounted) {
                    const parsed: User = JSON.parse(saved);
                    setName(parsed.name);
                }
            } catch (err) {
                console.error("❌ Failed to load user session:", err);
            }
        };
        requestAnimationFrame(loadUser);
        return () => {
            isMounted = false;
        };
    }, []);

    // Persist display name locally
    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem("pointrapp:displayName", name);
        }
    }, [name]);

    return (
        <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
            {/* ✨ Fade-in Card */}
            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-md border border-gray-100 text-center"
            >
                {/* 🧭 Logo (slight delayed fade-in) */}
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

                {/* 👤 Name Input */}
                <input
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 mb-3 text-gray-900 placeholder-gray-500 focus:ring focus:ring-blue-100"
                />

                <button
                    onClick={createRoom}
                    disabled={!name.trim()}
                    className="w-full bg-blue-600 text-white rounded-md py-2 hover:bg-blue-700 transition disabled:opacity-50"
                >
                    Create Room
                </button>

                {/* Divider */}
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-400">or</span>
                    </div>
                </div>

                {/* 🔑 Join Existing Room */}
                <input
                    type="text"
                    placeholder="Enter Room ID"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 mb-3 text-gray-900 placeholder-gray-500 focus:ring focus:ring-blue-100"
                />

                <button
                    onClick={joinExisting}
                    disabled={!roomId.trim()}
                    className="w-full bg-gray-700 text-white rounded-md py-2 hover:bg-gray-800 transition disabled:opacity-50"
                >
                    Join Room
                </button>
            </motion.div>

            {/* 🪶 Fade-in Footer */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.8 }}
                className="mt-8 text-xs text-gray-400 tracking-wide"
            >
                PointrApp — lightweight agile estimation made simple
            </motion.p>
        </main>
    );
}
