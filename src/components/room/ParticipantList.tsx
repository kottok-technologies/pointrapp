"use client";

import { useRoom } from "../../context/RoomContext";
import Image from "next/image";

export function ParticipantList() {
    const { participants } = useRoom();

    return (
        <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Participants</h2>

            {participants.length === 0 && (
                <p className="text-sm text-gray-400">No participants yet.</p>
            )}

            <ul className="space-y-2">
                {participants.map((user) => (
                    <li
                        key={user.id}
                        className={`flex items-center justify-between bg-white border rounded-lg px-3 py-2 shadow-sm transition ${
                            user.role === "facilitator" ? "border-blue-400" : "border-gray-200"
                        }`}
                    >
                        <div className="flex items-center space-x-3">
                            {user.avatarUrl ? (
                                <Image
                                    src={user.avatarUrl}
                                    alt={user.name}
                                    className="w-8 h-8 rounded-full border"
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">
                                    {user.name?.[0]?.toUpperCase() || "?"}
                                </div>
                            )}

                            <div>
                                <p className="text-gray-800 font-medium">{user.name}</p>
                                <p className="text-xs text-gray-500">{user.role}</p>
                            </div>
                        </div>

                        <span className="text-gray-300 text-sm font-medium">⌛</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
