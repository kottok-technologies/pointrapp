"use client";

import { useState } from "react";
import { useRoom } from "../context/RoomContext";

export function JoinRoomModal() {
    const { currentUser, actions } = useRoom();
    const [name, setName] = useState("");
    const [role, setRole] = useState<"facilitator" | "participant" | "observer">("participant");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // If user already joined, hide modal
    if (currentUser) return null;

    async function handleJoin() {
        if (!name.trim()) {
            setError("Please enter your name");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await actions.joinRoom(name.trim(), role);
        } catch (err: any) {
            setError(err.message || "Failed to join room");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-sm">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
                    Join the Room
                </h2>

                <div className="space-y-3 mb-4">
                    <input
                        type="text"
                        placeholder="Your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring focus:ring-blue-100"
                        disabled={loading}
                    />

                    <div className="flex justify-between items-center text-sm">
                        {(["facilitator", "participant", "observer"] as const).map((r) => (
                            <label
                                key={r}
                                className={`flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer transition
                  ${
                                    role === r
                                        ? "bg-blue-50 border-blue-400 text-blue-700"
                                        : "border-gray-200 hover:border-gray-300 text-gray-700"
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="role"
                                    value={r}
                                    checked={role === r}
                                    onChange={() => setRole(r)}
                                    className="accent-blue-600"
                                />
                                {r.charAt(0).toUpperCase() + r.slice(1)}
                            </label>
                        ))}
                    </div>
                </div>

                {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

                <button
                    onClick={handleJoin}
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition disabled:bg-blue-300"
                >
                    {loading ? "Joining..." : "Join Room"}
                </button>
            </div>
        </div>
    );
}
