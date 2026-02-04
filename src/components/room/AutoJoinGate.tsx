"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRoom } from "@/context/RoomContext";
import { useUser } from "@/context/UserContext";
import { useConnection } from "@/context/ConnectionContext";
import { JoinRoomModal } from "@/components/modals/JoinRoomModal";

function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
}

export default function AutoJoinGate() {
    const { participants, actions, loading, error, room, refresh } = useRoom();
    const { user, pendingJoinRole, clearPendingJoinRole, updateUserField } = useUser();
    const { connectionId } = useConnection();

    const [joining, setJoining] = useState(false);
    const [joinError, setJoinError] = useState<string | null>(null);
    const [joinedLatch, setJoinedLatch] = useState(false);

    const attempted = useRef(false);

    const isJoined = useMemo(() => {
        if (!user?.id) return false;
        console.log("Participants")
        console.log(participants);
        console.log("User")
        console.log(user);
        return participants.some((p) => p.id === user.id);
    }, [participants, user]);

    // Reset when room or user changes
    useEffect(() => {
        attempted.current = false;
        setJoinError(null);
        setJoining(false);
        setJoinedLatch(false);
        clearPendingJoinRole(); // ensures URL join asks role every time
    }, [room?.id, user?.id, clearPendingJoinRole]);

    // If participants finally show joined, drop the latch
    useEffect(() => {
        if (isJoined) setJoinedLatch(false);
    }, [isJoined]);

    useEffect(() => {
        if (attempted.current) return;

        if (!room) return;
        if (loading) return;
        if (error) return;

        if (!user?.id) return;
        if (!connectionId) return;

        if (isJoined) {
            attempted.current = true;
            return;
        }

        if (!pendingJoinRole) return;

        attempted.current = true;
        setJoining(true);
        setJoinError(null);

        (async () => {
            try {
                updateUserField("role", pendingJoinRole);
                await actions.joinRoom();

                // latch immediately so modal doesn't reappear during refresh lag
                setJoinedLatch(true);

                // consume role selection for this join
                clearPendingJoinRole();

                // 🔁 Poll refresh until we appear in participants
                const maxTries = 6;
                for (let i = 0; i < maxTries; i++) {
                    await refresh();
                    await sleep(250 + i * 150);

                    // Re-check using the latest participants via state update on next render.
                    // We can't read `participants` synchronously here reliably, so just allow
                    // the next effect/render to flip `isJoined`.
                    // If joinedLatch is still true on next loop iteration, keep trying.
                    if (participants.some((p) => p.id === user.id)) {
                        setJoinedLatch(false);
                        return;
                    }
                }

                // If we never saw ourselves, fail gracefully
                setJoinedLatch(false);
                setJoinError(
                    "Joined request succeeded, but the room did not reflect your membership. Please retry.",
                );
                attempted.current = false; // allow retry
            } catch (e) {
                console.error("Join failed:", e);
                setJoinError("Failed to join room. Please try again.");
                attempted.current = false;
            } finally {
                setJoining(false);
            }
        })();
        // NOTE: intentionally not including `participants` in deps to avoid rerunning join
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        actions,
        room,
        loading,
        error,
        user?.id,
        connectionId,
        pendingJoinRole,
        isJoined,
        refresh,
        clearPendingJoinRole,
    ]);

    if (error) {
        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
                <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm text-center space-y-3">
                    <h2 className="text-lg font-semibold text-gray-800">Room error</h2>
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            </div>
        );
    }

    // If join succeeded but room isn't updated yet
    if (!isJoined && joinedLatch) {
        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20 pointer-events-none">
                <div className="bg-white rounded-xl shadow-xl p-4 w-full max-w-sm text-center space-y-2">
                    <h2 className="text-base font-semibold text-gray-800">Loading room…</h2>
                    <div className="flex justify-center pt-1">
                        <div className="h-6 w-6 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
                    </div>
                </div>
            </div>
        );
    }

    const shouldShowModal = !isJoined && (!user || !pendingJoinRole || !!joinError);

    if (shouldShowModal) {
        return (
            <JoinRoomModal
                joinError={joinError}
                onClearError={() => setJoinError(null)}
            />
        );
    }

    if (!isJoined && (joining || loading)) {
        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
                <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm text-center space-y-3">
                    <h2 className="text-lg font-semibold text-gray-800">Joining room…</h2>
                    <p className="text-sm text-gray-600">Connecting you to the session.</p>
                    <div className="flex justify-center pt-2">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
