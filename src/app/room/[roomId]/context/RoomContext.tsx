"use client";

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useMemo,
    ReactNode,
    useRef,
} from "react";
import { useRoomData } from "../hooks/useRoomData";
import { User, Story, Room, Vote } from "@/lib/types";

interface RoomContextValue {
    room: Room | null;
    users: User[];
    stories: Story[];
    votes: Vote[];
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
const STORAGE_KEY = (roomId: string) => `pointrapp:user:${roomId}`;

interface RoomProviderProps {
    roomId: string;
    children: ReactNode;
}

export function RoomProvider({ roomId, children }: RoomProviderProps) {
    const { votes, room, users, stories, loading, error, refresh } = useRoomData(roomId);
    const [activeStory, setActiveStory] = useState<Story | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const wsRef = useRef<WebSocket | null>(null);

    // 🧠 Load persisted user session
    useEffect(() => {
        let isMounted = true;
        const loadUser = () => {
            try {
                const saved = localStorage.getItem(STORAGE_KEY(roomId));
                if (saved && isMounted) {
                    const parsed: User = JSON.parse(saved);
                    setCurrentUser(parsed);
                }
            } catch (err) {
                console.error("❌ Failed to load user session:", err);
            }
        };
        requestAnimationFrame(loadUser);
        return () => {
            isMounted = false;
        };
    }, [roomId]);

    // 💾 Persist user whenever it changes
    useEffect(() => {
        if (currentUser) {
            localStorage.setItem(STORAGE_KEY(roomId), JSON.stringify(currentUser));
        } else {
            localStorage.removeItem(STORAGE_KEY(roomId));
        }
    }, [currentUser, roomId]);

    // 🧩 Auto-select the first "estimating" story when appropriate
    useEffect(() => {
        if (stories.length === 0) return;

        if (activeStory) {
            if (activeStory.status === "done") {
                const currentIndex = stories.findIndex((s) => s.id === activeStory.id);
                const nextPending = stories.slice(currentIndex + 1).find((s) => s.status !== "done");
                if (nextPending) {
                    requestAnimationFrame(() => setActiveStory(nextPending));
                }
            }
            return;
        }

        const firstEstimatingOrPending =
            stories.find((s) => s.status === "estimating") ??
            stories.find((s) => s.status === "pending") ??
            stories[0];

        if (firstEstimatingOrPending) {
            requestAnimationFrame(() => setActiveStory(firstEstimatingOrPending));
        }
    }, [stories, activeStory, setActiveStory]);

    // 🌐 WebSocket: Connect and listen for broadcast events
    useEffect(() => {
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
        if (!wsUrl) {
            console.warn("⚠️ NEXT_PUBLIC_WS_URL not defined, skipping WebSocket connection");
            return;
        }

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log("🔌 Connected to WebSocket gateway");
            // Optionally register the room
            ws.send(JSON.stringify({ action: "register", roomId }));
        };

        ws.onmessage = async (event) => {
            try {
                const msg = JSON.parse(event.data);
                console.log("📨 WebSocket message:", msg);

                switch (msg.type) {
                    case "userJoined":
                        console.log(`👤 ${msg.data.name} joined the room`);
                        await refresh();
                        break;
                    case "storyAdded":
                    case "votesRevealed":
                    case "revoteStarted":
                        console.log(`🔄 ${msg.type} event detected`);
                        await refresh();
                        break;
                    default:
                        console.log("📬 Unhandled message type:", msg.type);
                        break;
                }
            } catch (err) {
                console.error("⚠️ Error parsing WS message:", err);
            }
        };

        ws.onerror = (err) => {
            console.error("❌ WebSocket error:", err);
        };

        ws.onclose = (e) => {
            console.log(`⚠️ WebSocket closed (${e.code}). Reconnecting in 5s...`);
            setTimeout(() => {
                if (wsRef.current === ws) wsRef.current = null;
            }, 5000);
        };

        return () => {
            ws.close();
        };
    }, [roomId, refresh]);

    // -----------------------------------------------------------
    // Actions
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

                // 🆕 Immediately announce to WebSocket if connected
                if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                    wsRef.current.send(
                        JSON.stringify({
                            action: "join",
                            roomId,
                            userId: newUser.id,
                            name: newUser.name,
                            role: newUser.role,
                        })
                    );
                    console.log(`📡 Sent join event for ${newUser.name}`);
                }

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
    // Provide Context
    // -----------------------------------------------------------

    const value = useMemo<RoomContextValue>(
        () => ({
            room,
            users,
            stories,
            activeStory,
            currentUser,
            loading,
            error,
            votes,
            setActiveStory,
            setCurrentUser,
            refresh,
            actions,
        }),
        [room, users, stories, activeStory, currentUser, loading, error, votes, refresh, actions]
    );

    return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
}

export function useRoom() {
    const context = useContext(RoomContext);
    if (!context) {
        throw new Error("useRoom must be used within a RoomProvider");
    }
    return context;
}
