"use client";

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useMemo,
    ReactNode,
} from "react";
import { useRoomData } from "../hooks/useRoomData";
import { useUser } from "@/context/UserContext";
import { useConnection } from "@/context/ConnectionContext";
import { User, Story, Room, Vote, WebSocketMessage } from "@/lib/types";

interface RoomContextValue {
    room: Room | null;
    participants: User[];
    stories: Story[];
    votes: Vote[];
    activeStory: Story | null;
    setActiveStory: (activeStory: Story) => void;
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    actions: RoomActions;
}

interface RoomActions {
    addStory: (title: string, description?: string) => Promise<void>;
    revealVotes: (storyId: string) => Promise<void>;
    revoteStory: (storyId: string) => Promise<void>;
    joinRoom: () => Promise<void>;
    submitVote: (storyId: string, value: string) => Promise<void>;
}

const RoomContext = createContext<RoomContextValue | undefined>(undefined);

interface RoomProviderProps {
    roomId: string;
    children: ReactNode;
}

export function RoomProvider({ roomId, children }: RoomProviderProps) {
    const { user, setRoomForUser } = useUser(); // 🧍 persistent global user
    const {
        connectionId,
        sendMessage,
        onMessage,
        offMessage,
    } = useConnection(); // 🌐 persistent WebSocket connection
    const {
        votes,
        room,
        users: participants,
        stories,
        loading,
        error,
        refresh,
    } = useRoomData(roomId);

    const [activeStory, setActiveStory] = useState<Story | null>(null);

    // -----------------------------------------------------------
    // 🔗 Link connectionId ↔ roomId when socket connects
    // -----------------------------------------------------------
    useEffect(() => {
        if (!connectionId || !roomId) return;
        (async () => {
            try {
                await fetch("/api/connections/updateConnection", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ connectionId, roomId }),
                });
                console.log(`🔗 Linked connection ${connectionId} to room ${roomId}`);
            } catch (err) {
                console.error("❌ Failed to update RoomId:", err);
            }
        })();
    }, [connectionId, roomId]);

    // -----------------------------------------------------------
    // 🧩 Auto-select the first active story
    // -----------------------------------------------------------
    useEffect(() => {
        if (stories.length === 0) return;

        // Use a microtask so state updates occur after current render completes
        const handleStorySelection = () => {
            if (activeStory?.status === "done") {
                const currentIndex = stories.findIndex((s) => s.id === activeStory.id);
                const nextPending = stories
                    .slice(currentIndex + 1)
                    .find((s) => s.status !== "done");
                if (nextPending) setActiveStory(nextPending);
            } else if (!activeStory) {
                const firstPending =
                    stories.find((s) => s.status === "estimating") ??
                    stories.find((s) => s.status === "pending") ??
                    stories[0];
                if (firstPending) setActiveStory(firstPending);
            }
        };

        // Schedule after current paint to avoid cascading updates
        const raf = requestAnimationFrame(handleStorySelection);
        return () => cancelAnimationFrame(raf);
    }, [stories, activeStory]);


    // -----------------------------------------------------------
    // 📬 Listen for WebSocket messages (via ConnectionProvider)
    // -----------------------------------------------------------
    useEffect(() => {
        const handleMessage = async (msg: WebSocketMessage) => {
            try {
                console.log("📨 WS message received in RoomProvider:", msg);

                switch (msg.type) {
                    case "userJoined":
                    case "storyAdded":
                    case "votesRevealed":
                    case "revoteStarted":
                        console.log(`🔄 Event: ${msg.type}`);
                        await refresh();
                        break;
                    default:
                        console.log("📬 Unhandled WS message:", msg.type);
                }
            } catch (err) {
                console.error("⚠️ Error handling WS message:", err);
            }
        };

        onMessage(handleMessage);
        return () => offMessage(handleMessage);
    }, [onMessage, offMessage, refresh]);


    // -----------------------------------------------------------
    // 🚀 Room Actions
    // -----------------------------------------------------------
    const actions: RoomActions = useMemo(
        () => ({
            async addStory(title, description) {
                if (!title.trim()) return;
                await fetch(`/api/rooms/${roomId}/stories`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ title, description }),
                });

                sendMessage({
                    action: "broadcast",
                    type: "storyAdded",
                    roomId,
                });

                await refresh();
            },

            async revealVotes(storyId) {
                await fetch(`/api/rooms/${roomId}/reveal`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ storyId }),
                });

                sendMessage({
                    action: "broadcast",
                    type: "votesRevealed",
                    roomId,
                });

                await refresh();
            },

            async revoteStory(storyId) {
                await fetch(`/api/rooms/${roomId}/revote`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ storyId }),
                });

                sendMessage({
                    action: "broadcast",
                    type: "revoteStarted",
                    roomId,
                });

                await refresh();
            },

            async joinRoom() {
                if (!user?.id) throw new Error("No user profile available");

                const res = await fetch(`/api/rooms/${roomId}/join`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        userId: user.id,
                        name: user.name,
                        role: user.role,
                        avatarUrl: user.avatarUrl,
                        connectionId,
                    }),
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Failed to join room");

                await setRoomForUser(roomId);
                await refresh();

                sendMessage({
                    action: "broadcast",
                    type: "userJoined",
                    roomId,
                    data: {
                        userId: user.id,
                        name: user.name,
                        role: user.role,
                    },
                });
            },

            async submitVote(storyId, value) {
                if (!user) throw new Error("You must join the room first");

                await fetch(`/api/rooms/${roomId}/votes`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        userId: user.id,
                        storyId,
                        value,
                    }),
                });

                await refresh();
            },
        }),
        [roomId, user, connectionId, refresh, setRoomForUser, sendMessage]
    );

    // -----------------------------------------------------------
    // 🧩 Provide Context
    // -----------------------------------------------------------
    const value = useMemo<RoomContextValue>(
        () => ({
            room,
            participants,
            stories,
            votes,
            activeStory,
            setActiveStory,
            loading,
            error,
            refresh,
            actions,
        }),
        [room, participants, stories, votes, activeStory, setActiveStory, loading, error, refresh, actions]
    );

    return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
}

// -----------------------------------------------------------
// Hook
// -----------------------------------------------------------
export function useRoom() {
    const ctx = useContext(RoomContext);
    if (!ctx) throw new Error("useRoom must be used within a RoomProvider");
    return ctx;
}
