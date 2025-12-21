"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRoom } from "@/context/RoomContext";
import { useUser } from "@/context/UserContext";
import { useConnection } from "@/context/ConnectionContext";
import { JoinRoomModal } from "@/components/modals/JoinRoomModal";

export default function AutoJoinGate() {
    const { participants, actions, loading, error, room } = useRoom();
    const { user } = useUser();
    const { connectionId } = useConnection();

    const [joining, setJoining] = useState(false);
    const [joinError, setJoinError] = useState<string | null>(null);
    const attempted = useRef(false);

    const isJoined = useMemo(() => {
        if (!user?.id) return false;
        return participants.some((p) => p.id === user.id);
    }, [participants, user?.id]);

    useEffect(() => {
        if (attempted.current) return;
        if (!user?.id) return;          // can't auto-join without a user
        if (!connectionId) return;      // wait for socket id so join payload is complete
        if (loading) return;            // wait until initial room data is loaded
        if (error) return;
        if (!room) return;

        if (isJoined) {
            attempted.current = true;
            return;
        }

        attempted.current = true;
        setJoining(true);
        setJoinError(null);

        (async () => {
            try {
                await actions.joinRoom();
            } catch (e) {
                console.error("Auto-join failed:", e);
                setJoinError("Failed to join room. Please try again.");
                attempted.current = false; // allow retry
            } finally {
                setJoining(false);
            }
        })();
    }, [actions, user?.id, connectionId, loading, error, room, isJoined]);

    // If user isn't selected yet, force the join modal.
    if (!user) return <JoinRoomModal />;

    // If we're in the middle of joining, show a lightweight loading overlay/card.
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

    // If join failed, show JoinRoomModal (so user can retry / reselect)
    if (!isJoined && joinError) {
        return (
            <>
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm text-center space-y-3">
                        <h2 className="text-lg font-semibold text-gray-800">Couldn’t join</h2>
                        <p className="text-sm text-red-600">{joinError}</p>
                        <button
                            className="w-full mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg"
                            onClick={() => {
                                attempted.current = false;
                                setJoinError(null);
                            }}
                        >
                            Retry
                        </button>
                    </div>
                </div>
                <JoinRoomModal />
            </>
        );
    }

    // Joined: render nothing (room UI is visible)
    return null;
}
