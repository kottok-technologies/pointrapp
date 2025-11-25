"use client";

import UserMenu from "@/components/layout/UserMenu";
import {usePathname} from "next/navigation";
import {useEffect, useState} from "react";

export default function Navbar() {
    const pathname = usePathname();
    const match = pathname.match(/^\/room\/([^/]+)/);
    const roomId = match?.[1] || null;

    const [roomName, setRoomName] = useState<string | null>(null);

    useEffect(() => {
        let ignore = false;

        if (!roomId && !ignore) {
            Promise.resolve().then(() => {
            setRoomName(null);
            })
            return () => {ignore = true;};
        }

        const fetchRoomHeader = async () => {
            try {
                const res = await fetch(`/api/rooms/${roomId}/header`);
                if (!res.ok) {
                    setRoomName(null);
                    return;
                }
                const data = await res.json();
                if (!ignore) setRoomName(data.name);
            } catch {
                // ignore
            }
        };

        fetchRoomHeader();
        return () => { ignore = true };
    }, [roomId]);
    return (
        <nav className="w-full bg-white shadow px-4 py-3 flex justify-between items-center sticky top-0">
            {roomName ? (
                <h1 className="text-lg font-semibold">{roomName}</h1> ) : (
                    <h1 className="text-xl font-semibold text-gray-800">PointrApp</h1>
            )}
            <UserMenu />
        </nav>
    );
}
