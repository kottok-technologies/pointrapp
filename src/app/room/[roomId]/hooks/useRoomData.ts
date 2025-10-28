"use client";

import { useState, useEffect } from "react";
import { User, Story } from "@/lib/types";

interface RoomData {
    id: string;
    name: string;
    createdBy: string;
    deckType: string;
    status: string;
    allowObservers: boolean;
    revealMode: string;
    createdAt: string;
    updatedAt: string;
}

interface RoomResponse {
    room: RoomData;
    users: User[];
    stories: Story[];
}

interface UseRoomDataReturn {
    room: RoomData | null;
    users: User[];
    stories: Story[];
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

export function useRoomData(roomId: string, intervalMs = 10000): UseRoomDataReturn {
    const [room, setRoom] = useState<RoomData | null>(null);
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
            const data: RoomResponse = await res.json();

            if (!res.ok) throw new Error(data as any);

            setRoom(data.room);
            setUsers(data.users);
            setStories(data.stories);
        } catch (err: any) {
            console.error("❌ Failed to fetch room data:", err);
            setError(err.message || "Failed to fetch room data");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchRoomData();
        const interval = setInterval(fetchRoomData, intervalMs);
        return () => clearInterval(interval);
    }, [roomId]);

    return {
        room,
        users,
        stories,
        loading,
        error,
        refresh: fetchRoomData,
    };
}
