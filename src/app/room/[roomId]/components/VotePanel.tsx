"use client";

import { useState } from "react";
import { useRoom } from "../context/RoomContext";

const DEFAULT_DECK = ["0", "1", "2", "3", "5", "8", "13", "20", "40", "100", "?"];

export function VotePanel() {
    const { room, activeStory, currentUser, refresh } = useRoom();
    const [selected, setSelected] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    async function handleVote(value: string) {
        if (!activeStory) {
            setMessage("Select a story first!");
            return;
        }

        if (!currentUser) {
            setMessage("You must join the room first.");
            return;
        }

        setLoading(true);
        setSelected(value);
        setMessage("");

        try {
            const res = await fetch(`/api/rooms/${room.id}/votes`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: currentUser.id,
                    storyId: activeStory.id,
                    value,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Vote failed");

            setMessage("Vote recorded!");
            await refresh();
        } catch (err: any) {
            setMessage(err.message);
            setSelected(null);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-col items-center">
            <h2 className="text-lg font-semibold mb-3">Your Vote</h2>

            <div className="grid grid-cols-3 gap-3 mb-4">
                {DEFAULT_DECK.map((value) => (
                    <button
                        key={value}
                        disabled={loading}
                        onClick={() => handleVote(value)}
                        className={`rounded-xl px-4 py-3 text-lg font-medium shadow-sm border transition
              ${
                            selected === value
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white hover:bg-blue-50 border-gray-300 text-gray-700"
                        }
            `}
                    >
                        {value}
                    </button>
                ))}
            </div>

            {message && (
                <p
                    className={`text-sm ${
                        message.includes("error") ? "text-red-500" : "text-gray-600"
                    }`}
                >
                    {message}
                </p>
            )}

            {selected && !message.includes("error") && (
                <div className="mt-4 text-center">
                    <p className="text-gray-700">
                        You selected: <span className="font-semibold">{selected}</span>
                    </p>
                    <p className="text-xs text-gray-400">
                        Waiting for other participants...
                    </p>
                </div>
            )}
        </div>
    );
}
