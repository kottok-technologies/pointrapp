"use client";

import { useState } from "react";
import { useRoom } from "../context/RoomContext";

export function FacilitatorControls() {
    const { currentUser, activeStory, actions, refresh } = useRoom();
    const [loading, setLoading] = useState(false);
    const isFacilitator = currentUser?.role === "facilitator";

    if (!isFacilitator || !activeStory) return null;

    async function handleReveal() {
        setLoading(true);
        try {
            await actions.revealVotes(activeStory.id);
        } finally {
            setLoading(false);
            await refresh();
        }
    }

    async function handleRevote() {
        setLoading(true);
        try {
            await actions.revoteStory(activeStory.id);
        } finally {
            setLoading(false);
            await refresh();
        }
    }

    async function handleNext() {
        setLoading(true);
        try {
            // mark current story as done, move to next one
            await actions.revealVotes(activeStory.id);
            await refresh();
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-md p-3 shadow-sm mb-4">
            <p className="font-medium text-gray-700">
                Facilitator Controls — <span className="text-blue-600">{activeStory.title}</span>
            </p>
            <div className="flex items-center gap-3">
                <button
                    onClick={handleReveal}
                    disabled={loading}
                    className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-300"
                >
                    Reveal Votes
                </button>
                <button
                    onClick={handleRevote}
                    disabled={loading}
                    className="px-4 py-2 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:bg-yellow-300"
                >
                    Revote
                </button>
                <button
                    onClick={handleNext}
                    disabled={loading}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
                >
                    Next Story
                </button>
            </div>
        </div>
    );
}
