"use client";

import { useState, useEffect, useCallback } from "react";
import { User, Story, Room, Vote } from "@/lib/types";

interface RoomResponse {
    room: Room;
    users: User[];
    stories: Story[];
    votes: Vote[];
    error?: string;
}

interface UseRoomDataReturn {
    room: Room | null;
    users: User[];
    stories: Story[];
    votes: Vote[];
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

export function useRoomData(roomId: string): UseRoomDataReturn {
    const [room, setRoom] = useState<Room | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [stories, setStories] = useState<Story[]>([]);
    const [votes, setVotes] = useState<Vote[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    /**
     * 🔁 Fetches the latest room data once or when manually called.
     * Can be safely reused by other components or actions via `refresh()`.
     */
    const fetchRoomData = useCallback(async () => {
        if (!roomId) return;

        setLoading(true);
        setError(null);

        function shallowEqual<T>(a: T, b: T): boolean {
            return JSON.stringify(a) === JSON.stringify(b);
        }

        try {
            const res = await fetch(`/api/rooms/${roomId}`, { cache: "no-store" });
            const data: RoomResponse = await res.json();

            if (!res.ok) throw new Error(data.error ?? "Failed to load room data");

            // ✅ compare with previous states before setting
            setRoom(prev => shallowEqual(prev, data.room) ? prev : data.room);
            setUsers(prev => shallowEqual(prev, data.users) ? prev : data.users);
            setStories(prev => shallowEqual(prev, data.stories) ? prev : data.stories);
            setVotes(prev => shallowEqual(prev, data.votes) ? prev : data.votes);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to fetch room data";
            console.error("❌ Failed to fetch room data:", message);
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [roomId]);


    /**
     * 🧩 Fetch once on mount or when the roomId changes.
     * No continuous polling — this runs only once per room.
     */
    useEffect(() => {
        fetchRoomData();
    }, [fetchRoomData]);

    return {
        room,
        users,
        stories,
        votes,
        loading,
        error,
        refresh: fetchRoomData,
    };
}
