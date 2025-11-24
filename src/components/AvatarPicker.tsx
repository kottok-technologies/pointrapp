"use client";

import Image from "next/image";
import { useState } from "react";

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
    const [selected, setSelected] = useState(value ?? "");
    const [uploadedAvatar, setUploadedAvatar] = useState<string | null>(null);
    const [urlInputOpen, setUrlInputOpen] = useState(false);
    const [urlInput, setUrlInput] = useState("");

    const handleSelect = (url: string) => {
        setSelected(url);
        onChange(url);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const objectUrl = URL.createObjectURL(file);

        setUploadedAvatar(objectUrl);
        handleSelect(objectUrl);
    };

    const handleUrlSubmit = () => {
        if (!urlInput.trim()) return;

        // treat URL as "uploaded"
        setUploadedAvatar(null);
        handleSelect(urlInput.trim());
        setUrlInput("");
        setUrlInputOpen(false);
    };

    const isUploadedSelected = selected && selected.startsWith("blob:");

    return (
        <div className="space-y-4">

            {/* ========================================
                 Avatar Grid
            ========================================= */}
            <div className="grid grid-cols-3 gap-4">

                {/* Uploaded Avatar Preview */}
                {uploadedAvatar && (
                    <button
                        onClick={() => handleSelect(uploadedAvatar)}
                        className={`relative rounded-xl border-2 overflow-hidden transition-all hover:scale-105
                            ${
                            isUploadedSelected
                                ? "border-blue-600 shadow-lg"
                                : "border-transparent"
                        }
                        `}
                    >
                        <Image
                            src={uploadedAvatar}
                            alt="Uploaded avatar"
                            width={100}
                            height={100}
                            className="object-cover w-full h-full"
                        />

                        {isUploadedSelected && (
                            <div className="absolute inset-0 bg-blue-500/20 pointer-events-none" />
                        )}
                    </button>
                )}

                {/* Preset avatars */}
                {AVATAR_OPTIONS.map((url) => (
                    <button
                        key={url}
                        onClick={() => handleSelect(url)}
                        className={`relative rounded-xl border-2 overflow-hidden transition-all hover:scale-105
                            ${selected === url ? "border-blue-600 shadow-lg" : "border-transparent"}
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

                {/* Upload button */}
                <label
                    className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 cursor-pointer p-3 bg-gray-100 hover:bg-gray-200 transition"
                >
                    <span className="text-sm text-gray-700">Upload</span>
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                    />
                </label>

                {/* Enter URL button */}
                <button
                    onClick={() => setUrlInputOpen(!urlInputOpen)}
                    className="rounded-xl border-2 p-3 bg-gray-100 hover:bg-gray-200 transition"
                >
                    Enter URL
                </button>
            </div>

            {/* URL Entry Field */}
            {urlInputOpen && (
                <div className="flex gap-2 items-center">
                    <input
                        type="text"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        className="flex-1 border rounded-lg px-3 py-2"
                        placeholder="https://example.com/avatar.png"
                    />
                    <button
                        onClick={handleUrlSubmit}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                    >
                        Set
                    </button>
                </div>
            )}
        </div>
    );
}
