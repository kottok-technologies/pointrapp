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

            if (!shallowEqual(data.room, room)) setRoom(data.room);
            if (!shallowEqual(data.users, users)) setUsers(data.users);
            if (!shallowEqual(data.stories, stories)) setStories(data.stories);
            if (!shallowEqual(data.votes, votes)) setVotes(data.votes);
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
    }, [roomId, room, users, stories, votes]);

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
