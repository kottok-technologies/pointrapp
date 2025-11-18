"use client";

import { useUser } from "@/context/UserContext"
import UserSelectionCard from "@/components/UserSelectionCard";
import RoomSelectionCard from "@/components/RoomSelectionCard";

export default function HomePage() {
    const { user } = useUser();
    if (!user) {
        return <UserSelectionCard />;
    }
    return <RoomSelectionCard />;
}
