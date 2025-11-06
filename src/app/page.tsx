"use client";

import {useEffect, useState} from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [roomId, setRoomId] = useState("");

    async function createRoom() {
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

    useEffect(() => {
        localStorage.setItem("pointrapp:displayName", name);
    }, [name])

    return (
        <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
            <div className="w-full max-w-sm bg-white p-6 rounded-xl shadow">
                <h1 className="text-3xl font-bold text-center mb-6 text-black">
                    Pointr
                </h1>

                <input
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 mb-3"
                />

                <button
                    onClick={createRoom}
                    className="w-full bg-blue-600 text-white rounded-md py-2 hover:bg-blue-700 transition"
                >
                    Create Room
                </button>

                <div className="border-t my-4" />

                <input
                    type="text"
                    placeholder="Enter Room ID"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 mb-3"
                />

                <button
                    onClick={joinExisting}
                    className="w-full bg-gray-700 text-white rounded-md py-2 hover:bg-gray-800 transition"
                >
                    Join Room
                </button>
            </div>
        </main>
    );
}
