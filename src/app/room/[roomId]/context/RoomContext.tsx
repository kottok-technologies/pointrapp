"use client";

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
    useMemo,
} from "react";
import toast from "react-hot-toast";
import { useRoomData } from "../hooks/useRoomData";
import { User, Story, Room } from "@/lib/types";

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

const RoomContext = createContext<RoomContextValue | undefined>(undefined);

interface RoomProviderProps {
    roomId: string;
    children: ReactNode;
}

const STORAGE_KEY = (roomId: string) => `pointrapp:user:${roomId}`;

export function RoomProvider({ roomId, children }: RoomProviderProps) {
    const { room, users, stories, loading, error, refresh } = useRoomData(roomId);

    // --- Restore user from localStorage lazily ---
    const [currentUser, setCurrentUser] = useState<User | null>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY(roomId));
            return saved ? (JSON.parse(saved) as User) : null;
        } catch {
            return null;
        }
    });

    const [activeStory, setActiveStory] = useState<Story | null>(null);

    // --- Toast when restoring a saved user session ---
    useEffect(() => {
        if (currentUser) {
            toast.success(`Welcome back, ${currentUser.name}! 👋`, {
                id: "welcome-toast",
                duration: 3000,
            });
        }
        // only trigger on first mount for this roomId
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomId]);

    // --- Persist user whenever it changes ---
    useEffect(() => {
        if (currentUser) {
            localStorage.setItem(STORAGE_KEY(roomId), JSON.stringify(currentUser));
        } else {
            localStorage.removeItem(STORAGE_KEY(roomId));
        }
    }, [currentUser, roomId]);

    // --- Auto-pick active story ---
    useEffect(() => {
        if (!activeStory && stories.length > 0) {
            const estimating = stories.find((s) => s.status === "estimating");
            setActiveStory(estimating || stories[0]);
        }
    }, [stories, activeStory]);

    // --- Actions ---
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

                toast.success(`Welcome, ${name}! 🎉`);
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

// --- Hook for safe context usage ---
export function useRoom() {
    const context = useContext(RoomContext);
    if (!context) throw new Error("useRoom must be used within a RoomProvider");
    return context;
}
