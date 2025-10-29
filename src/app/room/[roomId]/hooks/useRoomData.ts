"use client";

import { useState, useEffect } from "react";
import { User, Story, Room} from "@/lib/types";

interface RoomResponse {
    room: Room;
    users: User[];
    stories: Story[];
    error: string;
}

interface UseRoomDataReturn {
    room: Room | null;
    users: User[];
    stories: Story[];
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

export function useRoomData(roomId: string, intervalMs = 10000): UseRoomDataReturn {
    const [room, setRoom] = useState<Room | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [stories, setStories] = useState<Story[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function fetchRoomData() {
        if (!roomId) return;
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`/api/rooms/${roomId}`, { cache: "no-store" });

            // Explicitly type the expected shape of your JSON
            const data: RoomResponse = await res.json();

            if (!res.ok) {
                // Throw a descriptive error so TypeScript knows it’s an Error
                throw new Error(data.error ?? "Failed to load room data");
            }

            setRoom(data.room);
            setUsers(data.users);
            setStories(data.stories);
        } catch (err) {
            // err is `unknown` by default in modern TS; narrow it safely
            const message =
                err instanceof Error
                    ? err.message
                    : "Failed to fetch room data (unknown error)";
            console.error("❌ Failed to fetch room data:", message);
            setError(message);
        } finally {
            setLoading(false);
        }

    }

    useEffect(() => {
        fetchRoomData();
        const interval = setInterval(fetchRoomData, intervalMs);
        return () => clearInterval(interval);
    }, [fetchRoomData, intervalMs, roomId]);

    return {
        room,
        users,
        stories,
        loading,
        error,
        refresh: fetchRoomData,
    };
}
