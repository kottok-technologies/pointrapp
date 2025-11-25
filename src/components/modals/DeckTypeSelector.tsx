"use client";

import { useState } from "react";
import type { DeckType } from "@/lib/types";

const PRESET_DECKS: { id: DeckType; label: string }[] = [
    { id: "fibonacci", label: "Fibonacci" },
    { id: "tshirt", label: "T-Shirt" },
    { id: "modified-fibonacci", label: "Modified Fibonacci" },
    { id: "powers-of-two", label: "Powers of Two" },
    { id: "custom", label: "Custom Deck" },
];

export default function DeckTypeSelector({
                                             value,
                                             customDeckValues,
                                             onChange,
                                         }: {
    value: DeckType;
    customDeckValues: string[];
    onChange: (type: DeckType, customValues?: string[]) => void;
}) {
    const [localCustom, setLocalCustom] = useState(customDeckValues);
    const [input, setInput] = useState("");

    const handleDeckTypeChange = (newType: DeckType) => {
        if (newType !== "custom") {
            onChange(newType);
        } else {
            onChange("custom", localCustom);
        }
    };

    const addValue = () => {
        const v = input.trim();
        if (!v) return;
        const updated = [...localCustom, v];
        setLocalCustom(updated);
        setInput("");
        onChange("custom", updated);
    };

    const removeValue = (v: string) => {
        const updated = localCustom.filter((x) => x !== v);
        setLocalCustom(updated);
        onChange("custom", updated);
    };

    return (
        <div className="space-y-4">
            {/* Dropdown */}
            <div className="space-y-1">
                <p className="text-sm font-medium text-gray-700">Deck Type</p>

                <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white"
                    value={value}
                    onChange={(e) => handleDeckTypeChange(e.target.value as DeckType)}
                >
                    {PRESET_DECKS.map((deck) => (
                        <option key={deck.id} value={deck.id}>
                            {deck.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Custom Deck Panel */}
            {value === "custom" && (
                <div className="p-3 border rounded-xl bg-gray-50 space-y-3">
                    <p className="text-sm font-medium text-gray-700">Custom Deck Values</p>

                    {/* Pills */}
                    <div className="flex flex-wrap gap-2">
                        {localCustom.map((v) => (
                            <div
                                key={v}
                                className="px-2 py-1 rounded-lg bg-blue-100 text-blue-700 flex items-center gap-1"
                            >
                                {v}
                                <button
                                    className="text-red-500 hover:text-red-700"
                                    onClick={() => removeValue(v)}
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Add New Value */}
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Add value"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className="flex-1 border rounded-lg px-3 py-2"
                        />
                        <button
                            onClick={addValue}
                            type="button"
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg"
                        >
                            Add
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
