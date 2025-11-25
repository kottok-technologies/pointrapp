"use client";

import { StoryList } from "@/components/room/StoryList";
import { VotePanel } from "@/components/room/VotePanel";
import { ParticipantList } from "@/components/room/ParticipantList";
import { JoinRoomModal } from "@/components/modals/JoinRoomModal";
import { useRoom } from "@/context/RoomContext";

export default function RoomPage() {
    const { room, error, refresh } = useRoom();

    if (error) return <p className="p-8 text-red-500">{error}</p>;

    return (
        <div className="min-h-screen flex flex-col">
            <main className="flex flex-1">
                <aside className="w-1/4 border-r border-r-gray-300 p-4 bg-white">
                    <ParticipantList />
                </aside>

                <section className="flex-1 p-6 overflow-y-auto bg-gray-50">
                    <StoryList />
                </section>

                <aside className="w-1/4 border-l border-l-gray-300 p-4 bg-white">
                    <VotePanel />
                </aside>
            </main>
            <JoinRoomModal />
        </div>
    );
}
