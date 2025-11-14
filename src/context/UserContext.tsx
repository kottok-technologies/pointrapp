"use client";

import React, { createContext, useContext, useMemo, ReactNode } from "react";
import { useUserData } from "@/hooks/useUserData";
import { User } from "@/lib/types";

interface UserContextValue extends ReturnType<typeof useUserData> {}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
    const userState = useUserData();
    const value = useMemo(() => userState, [userState]);

    return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
    const context = useContext(UserContext);
    if (!context) throw new Error("useUser must be used within a UserProvider");
    return context;
}
