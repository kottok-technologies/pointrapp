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
import { User, Story, Room } from "@/lib/types";

// -----------------------------------------------------------
// Context Interfaces
// -----------------------------------------------------------

interface RoomContextValue {
    room: Room | null;
    users: User[];
    stories: Story[];
    activeStory: Story | null;
    currentUser: User | null;
    loading: boolean;
    error: string | null;
    setActiveStory: (story: Story | null) => void;
    setCurrentUser: (user: User | null) => void;
    refresh: () => Promise<void>;
    actions: RoomActions;
}

interface RoomActions {
    addStory: (title: string, description?: string) => Promise<void>;
    revealVotes: (storyId: string) => Promise<void>;
    revoteStory: (storyId: string) => Promise<void>;
    joinRoom: (name: string, role: User["role"]) => Promise<User>;
    submitVote: (storyId: string, value: string) => Promise<void>;
}

// -----------------------------------------------------------
// Context Setup
// -----------------------------------------------------------

const RoomContext = createContext<RoomContextValue | undefined>(undefined);

interface RoomProviderProps {
    roomId: string;
    children: ReactNode;
}

const STORAGE_KEY = (roomId: string) => `pointrapp:user:${roomId}`;

// -----------------------------------------------------------
// Provider Component
// -----------------------------------------------------------

export function RoomProvider({ roomId, children }: RoomProviderProps) {
    const { room, users, stories, loading, error, refresh } = useRoomData(roomId);
    const [activeStory, setActiveStory] = useState<Story | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    // 🧠 Load persisted user session (if exists)
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY(roomId));
            if (saved) {
                const parsed: User = JSON.parse(saved);
                setCurrentUser(parsed);
            }
        } catch (err) {
            console.error("❌ Failed to load user session:", err);
        }
    }, [roomId]);

    // 💾 Persist user whenever it changes
    useEffect(() => {
        if (currentUser) {
            localStorage.setItem(STORAGE_KEY(roomId), JSON.stringify(currentUser));
        } else {
            localStorage.removeItem(STORAGE_KEY(roomId));
        }
    }, [currentUser, roomId]);

    // 🧩 Auto-pick first story in estimating state
    useEffect(() => {
        if (!activeStory && stories.length > 0) {
            const estimating = stories.find((s) => s.status === "estimating");
            setActiveStory(estimating || stories[0]);
        }
    }, [stories, activeStory]);

    // -----------------------------------------------------------
    // Actions (CRUD-style, tied to API routes)
    // -----------------------------------------------------------

    const actions: RoomActions = useMemo(
        () => ({
            async addStory(title: string, description?: string) {
                if (!title.trim()) return;
                await fetch(`/api/rooms/${roomId}/stories`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ title, description }),
                });
                await refresh();
            },

            async revealVotes(storyId: string) {
                await fetch(`/api/rooms/${roomId}/reveal`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ storyId }),
                });
                await refresh();
            },

            async revoteStory(storyId: string) {
                await fetch(`/api/rooms/${roomId}/revote`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ storyId }),
                });
                await refresh();
            },

            async joinRoom(name: string, role: User["role"]) {
                const res = await fetch(`/api/rooms/${roomId}/join`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, role }),
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Failed to join room");

                const newUser: User = {
                    id: data.userId,
                    name,
                    role,
                    joinedAt: new Date().toISOString(),
                    roomId,
                };

                setCurrentUser(newUser);
                localStorage.setItem(STORAGE_KEY(roomId), JSON.stringify(newUser));
                await refresh();
                return newUser;
            },

            async submitVote(storyId: string, value: string) {
                if (!currentUser) throw new Error("You must join the room first");

                await fetch(`/api/rooms/${roomId}/votes`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        userId: currentUser.id,
                        storyId,
                        value,
                    }),
                });

                await refresh();
            },
        }),
        [roomId, currentUser, refresh]
    );

    // -----------------------------------------------------------
    // Provide context value
    // -----------------------------------------------------------

    const value: RoomContextValue = {
        room,
        users,
        stories,
        activeStory,
        currentUser,
        loading,
        error,
        setActiveStory,
        setCurrentUser,
        refresh,
        actions,
    };

    return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
}

// -----------------------------------------------------------
// Hook to use the RoomContext
// -----------------------------------------------------------

export function useRoom() {
    const context = useContext(RoomContext);
    if (!context) {
        throw new Error("useRoom must be used within a RoomProvider");
    }
    return context;
}
