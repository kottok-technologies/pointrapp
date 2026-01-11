"use client";

import { useEffect, useMemo, useState } from "react";
import { useUser } from "@/context/UserContext";
import type { User } from "@/lib/types";

type Role = "facilitator" | "participant" | "observer";

export function JoinRoomModal({
                                  joinError,
                                  onClearError,
                              }: {
    joinError: string | null;
    onClearError: () => void;
}) {
    const {
        user,
        setUser,
        availableUsers,
        switchUser,
        createUser,
        deleteUser,
        setPendingJoinRole,
    } = useUser();

    const existingUsers = useMemo(() => {
        return Object.values(availableUsers ?? {}).sort((a, b) =>
            (a.name ?? "").localeCompare(b.name ?? ""),
        );
    }, [availableUsers]);

    const [mode, setMode] = useState<"pick" | "create">(
        existingUsers.length ? "pick" : "create",
    );
    const [selectedUserId, setSelectedUserId] = useState<string>(
        existingUsers[0]?.id ?? "",
    );

    const [name, setName] = useState("");
    const [role, setRole] = useState<Role>("participant");
    const [loading, setLoading] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    // Prefill name
    useEffect(() => {
        const saved = localStorage.getItem("pointrapp:displayName");
        if (saved) setName(saved);
    }, []);

    // Persist name
    useEffect(() => {
        if (name.trim().length > 0) {
            localStorage.setItem("pointrapp:displayName", name);
        }
    }, [name]);

    // Keep selection valid
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

    async function handleContinue() {
        setLoading(true);
        setLocalError(null);
        onClearError();

        try {
            let active: User | null = user;

            if (mode === "pick") {
                if (!selectedUserId) throw new Error("Please select a user.");
                const chosen = (availableUsers as Record<string, User>)[selectedUserId];
                if (!chosen) throw new Error("Selected user not found.");

                switchUser(selectedUserId);
                active = chosen;
            } else {
                if (!name.trim()) throw new Error("Please enter your name.");
                const newUser = await createUser(name.trim(), "observer", "lobby");
                setUser(newUser);
                active = newUser;
            }

            if (!active?.id) throw new Error("User creation/selection failed.");

            // ✅ Store join intent (role). AutoJoinGate will join.
            setPendingJoinRole(role);
        } catch (e) {
            console.error(e);
            setLocalError(e instanceof Error ? e.message : "Failed to continue.");
        } finally {
            setLoading(false);
        }
    }

    async function handleDeleteSelected() {
        if (!selectedUserId) return;
        setLoading(true);
        setLocalError(null);
        try {
            await deleteUser(selectedUserId);
        } catch (e) {
            console.error(e);
            setLocalError("Failed to delete user.");
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
                            Use user
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
                            New user
                        </button>
                    </div>
                )}

                {/* User selection / creation */}
                {mode === "pick" ? (
                    <div className="space-y-2 mb-4">
                        <p className="text-sm font-medium text-gray-700">Choose a user</p>

                        <select
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                            disabled={loading}
                        >
                            {existingUsers.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.name}
                                </option>
                            ))}
                        </select>

                        <button
                            type="button"
                            onClick={handleDeleteSelected}
                            disabled={loading || !selectedUserId}
                            className="w-full px-3 py-2 bg-gray-200 rounded-md text-sm hover:bg-gray-300 transition disabled:opacity-50"
                        >
                            Delete selected user
                        </button>
                    </div>
                ) : (
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
                )}

                {/* Role selection (vertical) */}
                <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Role</p>
                    <div className="flex flex-col gap-2 text-sm">
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

                {(localError || joinError) && (
                    <p className="text-sm text-red-600 mb-3">{localError ?? joinError}</p>
                )}

                <button
                    onClick={handleContinue}
                    disabled={loading || (mode === "pick" && !selectedUserId)}
                    className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition disabled:bg-blue-300"
                >
                    {loading ? "Continuing..." : "Continue"}
                </button>

                <p className="text-xs text-gray-500 mt-4 text-center">
                    You&apos;ll be connected automatically after continuing.
                </p>
            </div>
        </div>
    );
}
