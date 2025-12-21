"use client";

import { useEffect, useMemo, useState } from "react";
import { useUser } from "@/context/UserContext";
import { useRoom } from "@/context/RoomContext";
import type { User } from "@/lib/types";

type Role = "facilitator" | "participant" | "observer";

export function JoinRoomModal() {
    const { room } = useRoom();
    const {
        user,
        availableUsers,
        switchUser,
        createUser,
        updateUserField,
        deleteUser,
    } = useUser();

    // If user already exists, hide modal
    if (user) return null;

    const existingUsers = useMemo(() => {
        return Object.values(availableUsers ?? {}).sort((a, b) =>
            (a.name ?? "").localeCompare(b.name ?? ""),
        );
    }, [availableUsers]);

    const [mode, setMode] = useState<"pick" | "create">(existingUsers.length ? "pick" : "create");
    const [selectedUserId, setSelectedUserId] = useState<string>(existingUsers[0]?.id ?? "");

    const [name, setName] = useState("");
    const [role, setRole] = useState<Role>("participant");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Prefill name from localStorage
    useEffect(() => {
        const saved = localStorage.getItem("pointrapp:displayName");
        if (saved) setName(saved);
    }, []);

    useEffect(() => {
        if (name.trim().length > 0) {
            localStorage.setItem("pointrapp:displayName", name);
        }
    }, [name]);

    // Keep selection valid as existingUsers changes
    useEffect(() => {
        if (mode !== "pick") return;
        if (!existingUsers.length) {
            setMode("create");
            setSelectedUserId("");
            return;
        }
        if (!selectedUserId || !existingUsers.some((u) => u.id === selectedUserId)) {
            setSelectedUserId(existingUsers[0].id);
        }
    }, [existingUsers, mode, selectedUserId]);

    async function handleUseExisting() {
        if (!selectedUserId) {
            setError("Please select a profile.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const chosen = (availableUsers as Record<string, User>)[selectedUserId];
            if (!chosen) throw new Error("Selected profile not found.");

            // Activate that user
            switchUser(selectedUserId);

            // Optional: let the user pick a different role at join-time
            // This updates localStorage + DB via PATCH.
            if (chosen.role !== role) {
                // updateUserField uses current `user`, which updates after switchUser.
                // We can safely schedule the role update in a microtask.
                queueMicrotask(() => updateUserField("role", role));
            }

            // Optional: set their roomId ahead of join (not required)
            // AutoJoinGate/joinRoom will set it anyway via setRoomForUser
            // queueMicrotask(() => updateUserField("roomId", room?.id ?? null));
        } catch (e) {
            console.error(e);
            setError("Failed to use that profile. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    async function handleCreateNew() {
        if (!name.trim()) {
            setError("Please enter your name");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const roomId = room?.id ?? "lobby";
            await createUser(name.trim(), role, roomId);
            // AutoJoinGate will join
        } catch (e) {
            console.error(e);
            setError("Failed to create your profile. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    async function handleDeleteSelected() {
        if (!selectedUserId) return;
        setLoading(true);
        setError(null);
        try {
            await deleteUser(selectedUserId);
        } catch (e) {
            console.error(e);
            setError("Failed to delete profile.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-sm">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
                    Join the Room
                </h2>

                {/* Mode toggle */}
                {existingUsers.length > 0 && (
                    <div className="mb-4 grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => setMode("pick")}
                            className={`py-2 rounded-md text-sm border transition ${
                                mode === "pick"
                                    ? "bg-blue-50 border-blue-400 text-blue-700"
                                    : "border-gray-200 text-gray-700 hover:border-gray-300"
                            }`}
                            disabled={loading}
                        >
                            Use profile
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode("create")}
                            className={`py-2 rounded-md text-sm border transition ${
                                mode === "create"
                                    ? "bg-blue-50 border-blue-400 text-blue-700"
                                    : "border-gray-200 text-gray-700 hover:border-gray-300"
                            }`}
                            disabled={loading}
                        >
                            New profile
                        </button>
                    </div>
                )}

                {/* Role selection (applies to either mode) */}
                <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Role</p>
                    <div className="flex justify-between items-center text-sm">
                        {(["facilitator", "participant", "observer"] as const).map((r) => (
                            <label
                                key={r}
                                className={`flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer transition ${
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
                                    disabled={loading}
                                />
                                {r.charAt(0).toUpperCase() + r.slice(1)}
                            </label>
                        ))}
                    </div>
                </div>

                {mode === "pick" ? (
                    <>
                        <div className="space-y-2 mb-4">
                            <p className="text-sm font-medium text-gray-700">Choose a profile</p>

                            <select
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                                disabled={loading}
                            >
                                {existingUsers.map((u) => (
                                    <option key={u.id} value={u.id}>
                                        {u.name} ({u.role})
                                    </option>
                                ))}
                            </select>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={handleUseExisting}
                                    disabled={loading || !selectedUserId}
                                    className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition disabled:bg-blue-300"
                                >
                                    {loading ? "Working..." : "Continue"}
                                </button>

                                <button
                                    type="button"
                                    onClick={handleDeleteSelected}
                                    disabled={loading || !selectedUserId}
                                    className="px-3 py-2 bg-gray-200 rounded-md text-sm hover:bg-gray-300 transition disabled:opacity-50"
                                    title="Delete this profile"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="space-y-3 mb-4">
                            <input
                                type="text"
                                placeholder="Your name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:ring focus:ring-blue-100"
                                disabled={loading}
                            />
                        </div>

                        <button
                            onClick={handleCreateNew}
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition disabled:bg-blue-300"
                        >
                            {loading ? "Saving..." : "Continue"}
                        </button>
                    </>
                )}

                {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

                <p className="text-xs text-gray-500 mt-4 text-center">
                    You&apos;ll be connected to the room automatically after continuing.
                </p>
            </div>
        </div>
    );
}
