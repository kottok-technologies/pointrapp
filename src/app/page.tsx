"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useUser } from "@/context/UserContext"
import { UserSelectionCard } from "@/components/UserSelectionCard";
import { ROomSelectionCard } from "@/components/RoomSelectionCard";

export default function HomePage() {
    const { user } = useUser();
    if (!user) {
        return <UserSelectionCard />;
    }

    return <RoomSelectionCard />;
}
