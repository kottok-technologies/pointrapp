import {useRouter} from "next/navigation";
import {useState} from "react";
import {Card} from "@/components/Card";
import {useUser} from "@/context/UserContext";

export default function RoomSelectionCard() {
    const { user } = useUser();
    const router = useRouter();
    const [roomId, setRoomId] = useState("");

    async function createRoom() {
        if (!user) return;

        const res = await fetch("/api/rooms", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: `${user.name}'s Room`,
                createdBy: user.name,
                deckType: "fibonacci",
                allowObservers: true,
                revealMode: "allReveal",
            }),
        });

        const data = await res.json();
        if (res.ok && data.roomId) router.push(`/room/${data.roomId}`);
    }

    function joinExisting() {
        if (roomId.trim()) router.push(`/room/${roomId.trim()}`);
    }

    return (
        <Card>
            <button
                onClick={createRoom}
                className="w-full bg-blue-600 text-white rounded-md py-2 hover:bg-blue-700 transition disabled:opacity-50"
            >
                Create Room
            </button>

            {/* Divider */}
            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-400">or</span>
                </div>
            </div>

            {/* 🔑 Join Existing Room */}
            <input
                type="text"
                placeholder="Enter Room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 mb-3 text-gray-900 placeholder-gray-500 focus:ring focus:ring-blue-100"
            />

            <button
                onClick={joinExisting}
                disabled={!roomId.trim()}
                className="w-full bg-gray-700 text-white rounded-md py-2 hover:bg-gray-800 transition disabled:opacity-50"
            >
                Join Room
            </button>
        </Card>
    );
}