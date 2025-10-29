"use client";

import { useState, useEffect, useCallback } from "react";
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

    // ✅ Memoize fetchRoomData so its reference is stable across renders
    const fetchRoomData = useCallback(async () => {
        if (!roomId) return;
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`/api/rooms/${roomId}`, { cache: "no-store" });

            const data: RoomResponse = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Failed to load room data");

            setRoom(data.room);
            setUsers(data.users);
            setStories(data.stories);
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : "Failed to fetch room data (unknown error)";
            console.error("❌ Failed to fetch room data:", message);
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [roomId]); // ✅ depends only on roomId

    // ✅ Now your useEffect sees a stable dependency
    useEffect(() => {
        fetchRoomData();
    }, [fetchRoomData]);

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
