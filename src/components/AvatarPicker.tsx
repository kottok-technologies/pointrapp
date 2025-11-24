// src/components/ui/AvatarPicker.tsx
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

type AvatarPickerProps = {
    value?: string | null;
    onChange: (url: string | null) => void;
};

export default function AvatarPicker({ value, onChange }: AvatarPickerProps) {
    const [selected, setSelected] = useState<string | null>(value ?? null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [urlInput, setUrlInput] = useState("");

    const handleSelect = (url: string | null) => {
        setSelected(url);
        onChange(url);
    };

    const handleFileChange = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploadError(null);
        setUploading(true);

        try {
            // 1️⃣ Ask backend for presigned URL
            const res = await fetch(
                `/api/avatar/upload-url?contentType=${encodeURIComponent(
                    file.type || "image/png"
                )}`
            );
            if (!res.ok) {
                throw new Error("Failed to get upload URL");
            }
            const { uploadUrl, publicUrl } = await res.json();

            // 2️⃣ Upload directly to S3 via presigned URL
            const putRes = await fetch(uploadUrl, {
                method: "PUT",
                headers: {
                    "Content-Type": file.type || "image/png",
                },
                body: file,
            });

            if (!putRes.ok) {
                throw new Error("Upload failed");
            }

            // 3️⃣ Update selection
            handleSelect(publicUrl);
        } catch (err) {
            console.error("❌ Avatar upload failed:", err);
            setUploadError("Failed to upload avatar. Please try again.");
        } finally {
            setUploading(false);
            // reset file input so same file can be re-selected
            event.target.value = "";
        }
    };

    const handleUrlApply = () => {
        const trimmed = urlInput.trim();
        if (!trimmed) return;
        // naive validation
        if (!/^https?:\/\/.+/i.test(trimmed)) {
            setUploadError("Please enter a valid URL (starting with http or https).");
            return;
        }
        setUploadError(null);
        handleSelect(trimmed);
    };

    return (
        <div className="space-y-4">
            {/* Preset avatars */}
            <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                    Choose an avatar
                </p>
                <div className="grid grid-cols-3 gap-4">
                    {AVATAR_OPTIONS.map((url) => (
                        <button
                            key={url}
                            type="button"
                            onClick={() => handleSelect(url)}
                            className={`relative rounded-xl border-2 overflow-hidden transition-all hover:scale-105
                ${
                                selected === url
                                    ? "border-blue-600 shadow-lg"
                                    : "border-transparent"
                            }`}
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
            </div>

            {/* Upload */}
            <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">
                    Or upload your own
                </p>
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={uploading}
                    className="block w-full text-sm text-gray-700
                     file:mr-3 file:py-2 file:px-3
                     file:rounded-lg file:border-0
                     file:bg-blue-600 file:text-white
                     hover:file:bg-blue-700
                     cursor-pointer"
                />
                {uploading && (
                    <p className="text-xs text-gray-500">
                        Uploading avatar, please wait...
                    </p>
                )}
            </div>

            {/* URL input */}
            <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Or use an image URL</p>
                <div className="flex gap-2">
                    <input
                        type="url"
                        placeholder="https://example.com/avatar.png"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-400 outline-none"
                    />
                    <button
                        type="button"
                        onClick={handleUrlApply}
                        className="px-3 py-2 bg-gray-200 rounded-lg text-sm"
                    >
                        Use URL
                    </button>
                </div>
            </div>

            {uploadError && (
                <p className="text-xs text-red-500">{uploadError}</p>
            )}

            {/* Preview */}
            {selected && (
                <div className="mt-2 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                        <Image
                            src={selected}
                            alt="Selected avatar"
                            width={48}
                            height={48}
                            className="object-cover w-full h-full"
                        />
                    </div>
                    <span className="text-xs text-gray-600 break-all">
            {selected}
          </span>
                </div>
            )}
        </div>
    );
}
