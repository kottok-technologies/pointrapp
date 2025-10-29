"use client";

import { useState } from "react";
import { useRoom } from "../context/RoomContext";
import {FacilitatorControls} from "./FacilitatorControls";

export function StoryList() {
    const { stories, activeStory, setActiveStory, refresh } = useRoom();
    const [newTitle, setNewTitle] = useState("");
    const [adding, setAdding] = useState(false);
    const [message, setMessage] = useState("");

    async function addStory() {
        if (!newTitle.trim()) return;
        setAdding(true);
        setMessage("");

        try {
            const res = await fetch(`/api/rooms/${activeStory?.roomId || ""}/stories`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: newTitle }),
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to add story");
            setNewTitle("");
            setMessage("Story added successfully!");
            await refresh();
        } catch (err) {
            if (err instanceof Error) {
                setMessage(err.message);
            } else {
                setMessage("Error adding story");
            }
        } finally {
            setAdding(false);
        }
    }

    return (
        <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">Stories</h2>
            </div>

            <FacilitatorControls />

            <div className="space-y-2">
                {stories.map((story) => (
                    <button
                        key={story.id}
                        onClick={() => setActiveStory(story)}
                        className={`w-full text-left px-4 py-3 rounded-lg border shadow-sm transition
              ${
                            activeStory?.id === story.id
                                ? "border-blue-600 bg-blue-50"
                                : "border-gray-200 hover:bg-gray-50"
                        }`}
                    >
                        <div className="flex justify-between items-center">
                            <h3 className="font-medium text-gray-800">{story.title}</h3>
                            <span
                                className={`text-xs px-2 py-1 rounded-full ${
                                    story.status === "done"
                                        ? "bg-green-100 text-green-700"
                                        : story.status === "estimating"
                                            ? "bg-yellow-100 text-yellow-700"
                                            : "bg-gray-100 text-gray-600"
                                }`}
                            >
                {story.status}
              </span>
                        </div>

                        {story.status === "done" && story.average && (
                            <p className="text-xs text-gray-500 mt-1">
                                Avg: {story.average.toFixed(1)}{" "}
                                {story.consensus ? "✅ Consensus" : ""}
                            </p>
                        )}
                    </button>
                ))}

                {stories.length === 0 && (
                    <p className="text-sm text-gray-400">No stories yet.</p>
                )}
            </div>

            <div className="pt-4 border-t mt-4">
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        placeholder="Add a new story..."
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                        disabled={adding}
                    />
                    <button
                        onClick={addStory}
                        disabled={adding}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                    >
                        {adding ? "Adding..." : "Add"}
                    </button>
                </div>
                {message && <p className="text-sm mt-2 text-gray-600">{message}</p>}
            </div>
        </div>
    );
}
