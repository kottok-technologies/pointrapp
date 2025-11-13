"use client";

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useMemo,
    ReactNode,
} from "react";
import { nanoid } from "nanoid";
import { User } from "@/lib/types";

/**
 * LocalStorage structure:
 *
 * pointrapp:users = {
 *   "<userId>": User,
 *   "<userId2>": User
 * }
 * pointrapp:activeUserId = "<userId>"
 */

const USERS_KEY = "pointrapp:users";
const ACTIVE_USER_KEY = "pointrapp:activeUserId";

interface UserContextValue {
    user: User;
    availableUsers: Record<string, User>;
    setUser: (user: User) => void;
    createUser: (name?: string, role?: User["role"]) => Promise<User>;
    switchUser: (userId: string) => void;
    updateUserField: <K extends keyof User>(key: K, value: User[K]) => void;
    deleteUser: (userId: string) => void;
    refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
    const [availableUsers, setAvailableUsers] = useState<Record<string, User>>({});
    const [user, setUser] = useState<User>(() => ({
        id: "",
        name: "Anonymous",
        role: "participant",
        joinedAt: new Date().toISOString(),
    }));

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

    // -----------------------------------------------------------
    // 🔗 Helper: create user remotely
    // -----------------------------------------------------------
    const createUserRemote = useCallback(async (newUser: User) => {
        try {
            const res = await fetch(`/api/users`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newUser),
            });
            if (!res.ok) {
                console.error("⚠️ Failed to create user remotely:", await res.text());
            } else {
                console.log("✅ Created user in backend:", newUser.id);
            }
        } catch (err) {
            console.error("❌ Failed to reach backend to create user:", err);
        }
    }, []);

    // -----------------------------------------------------------
    // 🧩 Initialize on mount
    // -----------------------------------------------------------
    useEffect(() => {
        if (typeof window === "undefined") return;

        // read-only part first
        const allUsers = loadAvailableUsers();
        const activeId = getActiveUserId();

        // defer all state updates until after render
        requestAnimationFrame(() => {
            if (activeId && allUsers[activeId]) {
                setAvailableUsers(allUsers);
                setUser(allUsers[activeId]);
            } else {
                const newUser: User = {
                    id: nanoid(12),
                    name: "Anonymous",
                    role: "participant",
                    joinedAt: new Date().toISOString(),
                    roomId: "lobby",
                };

                const updated = { ...allUsers, [newUser.id]: newUser };
                saveAvailableUsers(updated);
                setAvailableUsers(updated);
                setUser(newUser);
                setActiveUserId(newUser.id);
                console.log(newUser);

                // fire-and-forget remote creation (outside state cycle)
                createUserRemote(newUser).catch((err) =>
                    console.error("❌ Failed to create remote user:", err)
                );
            }
        });
    }, [
        loadAvailableUsers,
        saveAvailableUsers,
        getActiveUserId,
        setActiveUserId,
        createUserRemote,
    ]);


    // -----------------------------------------------------------
    // 💾 Persist when user or list changes
    // -----------------------------------------------------------
    useEffect(() => {
        if (typeof window !== "undefined" && user.id) {
            saveAvailableUsers(availableUsers);
            setActiveUserId(user.id);
        }
    }, [availableUsers, user, saveAvailableUsers, setActiveUserId]);

    // -----------------------------------------------------------
    // ✨ Actions
    // -----------------------------------------------------------

    // 🔄 Hydrate from backend
    const refreshUser = useCallback(async () => {
        if (!user?.id) return;
        try {
            const res = await fetch(`/api/users/${user.id}`);
            if (res.ok) {
                const dbUser: User = await res.json();
                setUser(dbUser);
                setAvailableUsers((prev) => ({ ...prev, [dbUser.id]: dbUser }));
                saveAvailableUsers({ ...availableUsers, [dbUser.id]: dbUser });
                console.log("✅ User hydrated from backend");
            } else if (res.status === 404) {
                console.log("ℹ️ User not found, creating remotely...");
                await createUserRemote(user);
            }
        } catch (err) {
            console.error("⚠️ Failed to hydrate user:", err);
        }
    }, [user, availableUsers, saveAvailableUsers, createUserRemote]);

    // 🆕 Create a new local + remote user profile
    const createUser = useCallback(
        async (name = "Anonymous", role: User["role"] = "participant"): Promise<User> => {
            const newUser: User = {
                id: nanoid(12),
                name,
                role,
                joinedAt: new Date().toISOString(),
            };
            const updated = { ...availableUsers, [newUser.id]: newUser };
            setAvailableUsers(updated);
            saveAvailableUsers(updated);
            setUser(newUser);
            setActiveUserId(newUser.id);

            // 🆕 Immediately persist to backend
            await createUserRemote(newUser);

            return newUser;
        },
        [availableUsers, saveAvailableUsers, setActiveUserId, createUserRemote]
    );

    // 🔁 Switch between existing profiles
    const switchUser = useCallback(
        (userId: string) => {
            if (!availableUsers[userId]) {
                console.warn(`⚠️ User ${userId} not found`);
                return;
            }
            setUser(availableUsers[userId]);
            setActiveUserId(userId);
            console.log(`👤 Switched to user ${availableUsers[userId].name}`);
        },
        [availableUsers, setActiveUserId]
    );

    // ✏️ Update a single field
    const updateUserField = useCallback(
        <K extends keyof User>(key: K, value: User[K]) => {
            if (!user?.id) return;
            const updatedUser = { ...user, [key]: value };
            setUser(updatedUser);
            const updatedUsers = { ...availableUsers, [user.id]: updatedUser };
            setAvailableUsers(updatedUsers);
            saveAvailableUsers(updatedUsers);

            // Background sync
            fetch(`/api/users/${user.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ [key]: value }),
            }).catch((err) =>
                console.warn("⚠️ Failed to sync user field:", err)
            );
        },
        [user, availableUsers, saveAvailableUsers]
    );

    // 🗑️ Delete user
    const deleteUser = useCallback(
        (userId: string) => {
            const updated = { ...availableUsers };
            delete updated[userId];
            setAvailableUsers(updated);
            saveAvailableUsers(updated);

            if (user.id === userId) {
                const nextId = Object.keys(updated)[0];
                if (nextId) {
                    setUser(updated[nextId]);
                    setActiveUserId(nextId);
                } else {
                    const fallback = createUser();
                    fallback.then(setUser);
                }
            }
        },
        [availableUsers, user, saveAvailableUsers, setActiveUserId, createUser]
    );

    const value = useMemo(
        () => ({
            user,
            availableUsers,
            setUser,
            createUser,
            switchUser,
            updateUserField,
            deleteUser,
            refreshUser,
        }),
        [
            user,
            availableUsers,
            createUser,
            switchUser,
            updateUserField,
            deleteUser,
            refreshUser,
        ]
    );

    return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

// -----------------------------------------------------------
// Hook
// -----------------------------------------------------------
export function useUser() {
    const context = useContext(UserContext);
    if (!context)
        throw new Error("useUser must be used within a UserProvider");
    return context;
}
