// components/ui/AvatarPicker.tsx
"use client";

import Image from "next/image";
import { useState } from "react";

// Example list — replace with your own images later
const AVATAR_OPTIONS = [
    "/images/avatars/cat1.png",
    "/images/avatars/cat2.png",
    "/images/avatars/dog1.png",
    "/images/avatars/robot1.png",
    "/images/avatars/ghost1.png",
];

export default function AvatarPicker({
                                         value,
                                         onChange,
                                     }: {
    value?: string;
    onChange: (url: string) => void;
}) {
    const [selected, setSelected] = useState(value);

    const handleSelect = (url: string) => {
        setSelected(url);
        onChange(url);
    };

    return (
        <div className="grid grid-cols-3 gap-4">
            {AVATAR_OPTIONS.map((url) => (
                <button
                    key={url}
                    onClick={() => handleSelect(url)}
                    className={`relative rounded-xl border-2 overflow-hidden transition-all hover:scale-105
                        ${
                        selected === url
                            ? "border-blue-600 shadow-lg"
                            : "border-transparent"
                    }
                    `}
                >
                    <Image
                        src={url}
                        alt="avatar"
                        width={100}
                        height={100}
                        className="object-cover w-full h-full"
                    />

                    {selected === url && (
                        <div className="absolute inset-0 bg-blue-500/20 pointer-events-none" />
                    )}
                </button>
            ))}
        </div>
    );
}
