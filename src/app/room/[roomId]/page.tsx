"use client";

import { StoryList } from "./components/StoryList";
import { VotePanel } from "./components/VotePanel";
import { ParticipantList } from "./components/ParticipantList";
import { JoinRoomModal } from "./components/JoinRoomModal";
import { useRoom } from "./context/RoomContext";

export default function RoomPage() {
    const { room, loading, error, refresh } = useRoom();

    if (loading) return <p className="p-8 text-gray-500">Loading room...</p>;
    if (error) return <p className="p-8 text-red-500">{error}</p>;

    return (
        <div className="min-h-screen flex flex-col">
            <header className="flex justify-between items-center bg-white px-6 py-3 shadow">
                <h1 className="text-lg font-semibold">{room?.name}</h1>
                <button
                    onClick={refresh}
                    className="text-sm text-blue-600 hover:underline"
                >
                    Refresh
                </button>
            </header>

            <main className="flex flex-1">
                <aside className="w-1/4 border-r p-4 bg-white">
                    <ParticipantList />
                </aside>

                <section className="flex-1 p-6 overflow-y-auto bg-gray-50">
                    <StoryList />
                </section>

                <aside className="w-1/4 border-l p-4 bg-white">
                    <VotePanel />
                </aside>
            </main>
            <JoinRoomModal />
        </div>
    );
}
