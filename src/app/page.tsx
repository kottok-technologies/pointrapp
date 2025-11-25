"use client";

import { useUser } from "@/context/UserContext"
import UserSelectionCard from "@/components/lobby/UserSelectionCard";
import RoomSelectionCard from "@/components/lobby/RoomSelectionCard";

export default function HomePage() {
    const { user } = useUser();
    return (
        <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
            {!user ? <UserSelectionCard /> : <RoomSelectionCard />}
        </main>
    )
}
