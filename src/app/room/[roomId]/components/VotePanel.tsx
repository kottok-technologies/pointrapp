"use client";

import { useState, useEffect } from "react";
import { useRoom } from "../context/RoomContext";
import { useUser } from "@/context/UserContext"

const DEFAULT_DECK = ["0", "1", "2", "3", "5", "8", "13", "20", "40", "100", "?"];

export function VotePanel() {
    const { room, activeStory, votes, refresh } = useRoom();
    const { user } = useUser();
    const [selected, setSelected] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const STORAGE_KEY = (roomId: string, storyId: string, userId: string) =>
        `pointrapp:vote:${roomId}:${storyId}:${userId}`;

    // ✅ Initialize selection: localStorage → backend → null
    useEffect(() => {
        if (!room?.id || !activeStory?.id || !user?.id) return;

        const key = STORAGE_KEY(room.id, activeStory.id, user.id);
        const local = localStorage.getItem(key);

        if (activeStory.status === "estimating") {
            // 🧹 Clear vote if story is being revoted
            localStorage.removeItem(key);
            setSelected(null);
            return;
        }

        if (local) {
            setSelected(local);
        } else {
            const backendVote =
                votes.find(
                    (v) => v.userId === user.id && v.storyId === activeStory.id
                )?.value ?? null;
            setSelected(backendVote);
        }
    }, [room?.id, activeStory?.id, activeStory?.status, user?.id, votes]);

    // ✅ Persist selection locally whenever it changes
    useEffect(() => {
        if (room?.id && activeStory?.id && user?.id && selected) {
            localStorage.setItem(
                STORAGE_KEY(room.id, activeStory.id, user.id),
                selected
            );
        }
    }, [selected, room?.id, activeStory?.id, user?.id]);

    async function handleVote(value: string) {
        if (!activeStory || !user) {
            setMessage("Select a story and join the room first!");
            return;
        }

        setLoading(true);
        setSelected(value);
        setMessage("");

        try {
            const res = await fetch(`/api/rooms/${room!.id}/votes`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.id,
                    storyId: activeStory.id,
                    value,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Vote failed");

            setMessage("Vote recorded!");
            localStorage.setItem(
                STORAGE_KEY(room?.id || "", activeStory.id, user.id),
                value
            );

            await refresh();
        } catch (err) {
            setMessage(err instanceof Error ? err.message : "Failed to record vote");
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
                        }`}
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
