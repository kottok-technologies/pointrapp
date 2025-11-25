"use client";

import { useState } from "react";
import { useUser} from "@/context/UserContext";
import {router} from "next/client";
import DeckTypeSelector from "@/components/modals/DeckTypeSelector";
import type { DeckType } from "@/lib/types";

export function CreateRoomModal() {
    const { user } = useUser();

    // ✅ Initialize name safely (no SSR access)
    const [roomName, setRoomName] = useState("");
    const [deckType, setDeckType] = useState<DeckType>("fibonacci");
    const [customDeckValues, setCustomDeckValues] = useState<string[]>([]);
    const [role, setRole] = useState<"facilitator" | "participant">("participant");
    const [revealMode, setRevealMode] = useState<"manual" | "auto">("manual");
    const [allowObservers, setAllowObservers] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function createRoom() {

        if (!roomName.trim()) {
            setError("Please enter a name");
            return;
        }
        setLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/rooms", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: roomName,
                    createdBy: user?.name,
                    deckType: "fibonacci",
                    allowObservers: true,
                    revealMode: "allReveal",
                }),
            });

            const data = await res.json();
            if (res.ok && data.roomId) router.push(`/room/${data.roomId}`);
        } catch (err) {
            if (err instanceof Error) setError(err.message);
            else setError("Failed to join room");
        } finally {
            setLoading(false);
        }
    }

    return (
            <>
                <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
                    Create a Room
                </h2>

                <div className="space-y-3 mb-4">
                    <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Room Name</p>
                        <input
                            type="text"
                            placeholder="Sprint Planning"
                            value={roomName}
                            onChange={(e) => setRoomName(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:ring focus:ring-blue-100"
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Your Role</p>
                        <div className="flex justify-center gap-3 items-center text-sm">
                            {(["facilitator", "participant"] as const).map((r) => (
                                <label
                                    key={r}
                                    className={`flex w-full items-center gap-2 px-3 py-2 rounded-md border cursor-pointer transition ${
                                        role === r
                                            ? "bg-blue-50 border-blue-400 text-blue-700"
                                            : "border-gray-200 hover:border-gray-300 text-gray-700"
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="revealMode"
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

                    <DeckTypeSelector
                        value={deckType}
                        customDeckValues={customDeckValues}
                        onChange={(type, values) => {
                            setDeckType(type);
                            if (values) setCustomDeckValues(values);
                        }}
                    />

                    <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Reveal Mode</p>
                        <div className="flex justify-center gap-3 items-center text-sm">
                            {(["auto", "manual"] as const).map((r) => (
                                <label
                                    key={r}
                                    className={`flex w-full items-center gap-2 px-3 py-2 rounded-md border cursor-pointer transition ${
                                        revealMode === r
                                            ? "bg-blue-50 border-blue-400 text-blue-700"
                                            : "border-gray-200 hover:border-gray-300 text-gray-700"
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="role"
                                        value={r}
                                        checked={revealMode === r}
                                        onChange={() => setRevealMode(r)}
                                        className="accent-blue-600"
                                    />
                                    {r.charAt(0).toUpperCase() + r.slice(1)}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Allow Observers</p>
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={allowObservers}
                                onChange={(e) => setAllowObservers(e.target.checked)}
                            />
                            Allow non-voting observers
                        </label>
                    </div>

                </div>

                {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

                <button
                    onClick={createRoom}
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition disabled:bg-blue-300"
                >
                    {loading ? "Creating..." : "Create Room"}
                </button>
            </>
    );
}
