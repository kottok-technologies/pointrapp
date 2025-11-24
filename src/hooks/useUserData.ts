 "use client";

import { useState, useEffect, useCallback } from "react";
import { nanoid } from "nanoid";
import { User } from "@/lib/types";

const USERS_KEY = "pointrapp:users";
const ACTIVE_USER_KEY = "pointrapp:activeUserId";

export function useUserData() {
    const [availableUsers, setAvailableUsers] = useState<Record<string, User>>({});
    const [user, setUser] = useState<User | null>(null);

    // -----------------------------------------------------------
    // 🧠 LocalStorage Helpers
    // -----------------------------------------------------------
    const loadAvailableUsers = useCallback((): Record<string, User> => {
        try {
            const saved = localStorage.getItem(USERS_KEY);
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    }, []);

    const saveAvailableUsers = useCallback((usersObj: Record<string, User>) => {
        localStorage.setItem(USERS_KEY, JSON.stringify(usersObj));
    }, []);

    const getActiveUserId = useCallback((): string | null => {
        return localStorage.getItem(ACTIVE_USER_KEY);
    }, []);

    const setActiveUserId = useCallback((id: string) => {
        localStorage.setItem(ACTIVE_USER_KEY, id);
    }, []);

    const removeActiveUserId = useCallback(() => {
        localStorage.removeItem(ACTIVE_USER_KEY);
    }, []);

    const createUserRemote = useCallback(async (newUser: User) => {
        try {
            const res = await fetch(`/api/users`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newUser),
            });
            if (!res.ok) console.warn("⚠️ Failed to create user remotely:", await res.text());
        } catch (err) {
            console.error("❌ Remote user creation failed:", err);
        }
    }, []);

    const deleteUserRemote = useCallback(async (userId: string) => {
        try {
            const res = await fetch(`/api/users/${userId}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
            });
            if (!res.ok) console.warn("⚠️ Failed to delete user remotely:", await res.text());
        } catch (err) {
            console.error("❌ Remote user deletion failed:", err);
        }
    }, []);

    // -----------------------------------------------------------
    // 🧩 Initialize on mount
    // -----------------------------------------------------------
    useEffect(() => {
        if (typeof window === "undefined") return;

        const allUsers = loadAvailableUsers();
        const activeId = getActiveUserId();

        requestAnimationFrame(() => {
            setAvailableUsers(allUsers)
            if (activeId && allUsers[activeId]) {
                setUser(allUsers[activeId]);
            }
        });
    }, [loadAvailableUsers, saveAvailableUsers, getActiveUserId, setActiveUserId, createUserRemote]);

    // -----------------------------------------------------------
    // 💾 Persist when user or list changes
    // -----------------------------------------------------------
    useEffect(() => {
        if (typeof window !== "undefined" && user?.id) {
            saveAvailableUsers(availableUsers);
            setActiveUserId(user.id);
        }
    }, [availableUsers, user, saveAvailableUsers, setActiveUserId]);

    // -----------------------------------------------------------
    // ✨ Actions
    // -----------------------------------------------------------
    const refreshUser = useCallback(async () => {
        if (!user?.id) return;
        try {
            const res = await fetch(`/api/users/${user.id}`);
            if (res.ok) {
                const dbUser: User = await res.json();
                setUser(dbUser);
                const updated = { ...availableUsers, [dbUser.id]: dbUser };
                setAvailableUsers(updated);
                saveAvailableUsers(updated);
            } else if (res.status === 404) {
                await createUserRemote(user);
            }
        } catch (err) {
            console.error("⚠️ Failed to refresh user:", err);
        }
    }, [user, availableUsers, saveAvailableUsers, createUserRemote]);

    const createUser = useCallback(
        async (name = "Anonymous", role: User["role"] = "observer", roomId = "lobby"): Promise<User> => {
            const newUser: User = {
                id: nanoid(12),
                name,
                role,
                joinedAt: new Date().toISOString(),
                roomId,
            };
            const updated = { ...availableUsers, [newUser.id]: newUser };
            setAvailableUsers(updated);
            setUser(newUser);
            saveAvailableUsers(updated);
            setActiveUserId(newUser.id);
            await createUserRemote(newUser);
            return newUser;
        },
        [availableUsers, saveAvailableUsers, setActiveUserId, createUserRemote]
    );

    const switchUser = useCallback(
        (userId: string) => {
            if (!availableUsers[userId]) return;
            setUser(availableUsers[userId]);
            setActiveUserId(userId);
        },
        [availableUsers, setActiveUserId]
    );

    const updateUserField = useCallback(
        <K extends keyof User>(key: K, value: User[K]) => {
            if (!user?.id) return;
            const updatedUser = { ...user, [key]: value };
            setUser(updatedUser);
            const updatedUsers = { ...availableUsers, [user.id]: updatedUser };
            setAvailableUsers(updatedUsers);
            saveAvailableUsers(updatedUsers);
            fetch(`/api/users/${user.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ [key]: value }),
            }).catch((err) => console.warn("⚠️ Failed to sync user field:", err));
        },
        [user, availableUsers, saveAvailableUsers]
    );

    const deleteUser = useCallback(
        async (userId: string) => {
            const updated = { ...availableUsers };
            delete updated[userId];
            setAvailableUsers(updated);
            saveAvailableUsers(updated);
            setUser(null);
            removeActiveUserId();
            await deleteUserRemote(userId);
        },
        [availableUsers, saveAvailableUsers, removeActiveUserId, deleteUserRemote]
    );

    // Log out user
    const logout = useCallback(() => {
        // Remove active user tracking
        localStorage.removeItem(ACTIVE_USER_KEY);

        // Clear current user (UI will treat it as “not logged in”)
        setUser(null);

        console.log("👋 User logged out (active user cleared)");
    }, []);

    // inside useUserData (add near the other actions)
    const setRoomForUser = useCallback(
        async (roomId: string | null) => {
            if (!user?.id) return;
            const updatedUser = { ...user, roomId };
            setUser(updatedUser);
            const updatedUsers = { ...availableUsers, [user.id]: updatedUser };
            setAvailableUsers(updatedUsers);
            saveAvailableUsers(updatedUsers);

            try {
                await fetch(`/api/users/${user.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ roomId }),
                });
                console.log(`✅ Synced roomId=${roomId ?? "null"} for user ${user.id}`);
            } catch (err) {
                console.warn("⚠️ Failed to sync roomId for user:", err);
            }
        },
        [user, availableUsers, saveAvailableUsers]
    );


    return {
        user,
        availableUsers,
        setUser,
        createUser,
        switchUser,
        updateUserField,
        deleteUser,
        logout,
        refreshUser,
        setRoomForUser,
    };
}
