"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Cropper from "react-easy-crop";

const PRESET_AVATARS = [
    "/images/avatars/cat1.png",
    "/images/avatars/cat2.png",
    "/images/avatars/dog1.png",
    "/images/avatars/robot1.png",
    "/images/avatars/ghost1.png",
];

const SAVED_AVATARS_KEY = "pointrapp:savedAvatars";

type AvatarPickerProps = {
    value?: string | null;
    onChange: (url: string | null) => void;
};

type CropAreaPixels = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export default function AvatarPicker({ value, onChange }: AvatarPickerProps) {
    const [selected, setSelected] = useState<string | null>(value ?? null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [urlInput, setUrlInput] = useState("");

    const [savedAvatars, setSavedAvatars] = useState<string[]>([]);

    // Crop UI state
    const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
    const [cropFile, setCropFile] = useState<File | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropAreaPixels | null>(null);
    const [cropping, setCropping] = useState(false);

    // -----------------------------
    // Load saved avatars from localStorage
    // -----------------------------
    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            const stored = JSON.parse(localStorage.getItem(SAVED_AVATARS_KEY) || "[]");
            if (Array.isArray(stored)) setSavedAvatars(stored);
        } catch {
            // ignore
        }
    }, []);

    // -----------------------------
    // Helpers
    // -----------------------------
    const persistAvatar = (url: string) => {
        if (!url) return;

        setSavedAvatars((prev) => {
            if (prev.includes(url)) return prev;
            const updated = [...prev, url];
            if (typeof window !== "undefined") {
                localStorage.setItem(SAVED_AVATARS_KEY, JSON.stringify(updated));
            }
            return updated;
        });
    };

    const handleSelect = (url: string | null) => {
        setSelected(url);
        onChange(url);
    };

    // -----------------------------
    // File Upload -> open crop UI
    // -----------------------------
    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploadError(null);
        setCropping(true);

        // Create local object URL for Cropper
        const objectUrl = URL.createObjectURL(file);
        setCropImageSrc(objectUrl);
        setCropFile(file);
        setCrop({ x: 0, y: 0 });
        setZoom(1);

        // reset input so user can pick same file again if desired
        event.target.value = "";
    };

    const onCropComplete = (_: unknown, areaPixels: CropAreaPixels) => {
        setCroppedAreaPixels(areaPixels);
    };

    const cancelCrop = () => {
        if (cropImageSrc) {
            URL.revokeObjectURL(cropImageSrc);
        }
        setCropImageSrc(null);
        setCropFile(null);
        setCroppedAreaPixels(null);
        setCropping(false);
    };

    const applyCrop = async () => {
        if (!cropFile || !croppedAreaPixels) return;

        try {
            setUploading(true);
            setUploadError(null);

            const formData = new FormData();
            formData.append("file", cropFile);
            formData.append("crop", JSON.stringify(croppedAreaPixels));

            const res = await fetch("/api/avatar/crop", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                throw new Error(await res.text());
            }

            const { url } = await res.json();

            persistAvatar(url);
            handleSelect(url);
        } catch (err) {
            console.error("Avatar crop/upload failed:", err);
            setUploadError("Failed to save cropped avatar. Please try again.");
        } finally {
            if (cropImageSrc) URL.revokeObjectURL(cropImageSrc);
            setCropImageSrc(null);
            setCropFile(null);
            setCropping(false);
            setUploading(false);
        }
    };

    // -----------------------------
    // URL Input Handler
    // -----------------------------
    const handleUrlApply = () => {
        const trimmed = urlInput.trim();
        if (!trimmed) return;

        if (!/^https?:\/\/.+/i.test(trimmed)) {
            setUploadError("Please enter a valid URL.");
            return;
        }

        persistAvatar(trimmed);
        handleSelect(trimmed);
        setUrlInput("");
        setUploadError(null);
    };

    const allAvatars = [...PRESET_AVATARS, ...savedAvatars];

    return (
        <div className="space-y-4">
            {/* Preset + Saved Avatars */}
            <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Choose an avatar</p>
                <div className="grid grid-cols-3 gap-4">
                    {allAvatars.map((url) => (
                        <button
                            key={url}
                            type="button"
                            onClick={() => handleSelect(url)}
                            className={`relative rounded-xl border-2 overflow-hidden transition-all hover:scale-105 ${
                                selected === url ? "border-blue-600 shadow-lg" : "border-transparent"
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
                <p className="text-sm font-medium text-gray-700">Or upload your own</p>
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

            {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
            {uploading && !cropping && (
                <p className="text-xs text-gray-500">Uploading avatar...</p>
            )}

            {/* Current avatar preview (circle) */}
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
                    <span className="text-xs text-gray-600 break-all">{selected}</span>
                </div>
            )}

            {/* Inline Crop UI overlay */}
            {cropping && cropImageSrc && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
                    <div className="bg-white rounded-xl shadow-xl p-4 w-full max-w-md">
                        <h3 className="text-md font-semibold mb-3">Crop your avatar</h3>
                        <div className="relative w-full h-64 bg-black/5 rounded-lg overflow-hidden">
                            <Cropper
                                image={cropImageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={onCropComplete}
                                showGrid={false}
                            />
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                            <input
                                type="range"
                                min={1}
                                max={3}
                                step={0.1}
                                value={zoom}
                                onChange={(e) => setZoom(Number(e.target.value))}
                                className="w-2/3"
                            />
                            <span className="text-xs text-gray-500">
                                Zoom: {zoom.toFixed(1)}x
                            </span>
                        </div>
                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                type="button"
                                className="px-3 py-2 bg-gray-200 rounded-lg text-sm"
                                onClick={cancelCrop}
                                disabled={uploading}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
                                onClick={applyCrop}
                                disabled={uploading}
                            >
                                {uploading ? "Saving..." : "Apply Crop"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
