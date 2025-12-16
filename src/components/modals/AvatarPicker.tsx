"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import Cropper, { Area, MediaSize } from "react-easy-crop";

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

type CropSource =
    | { kind: "file"; file: File; previewUrl: string }
    | { kind: "url"; imageUrl: string; previewUrl: string };

export default function AvatarPicker({ value, onChange }: AvatarPickerProps) {
    const [selected, setSelected] = useState<string | null>(value ?? null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [urlInput, setUrlInput] = useState("");

    const [savedAvatars, setSavedAvatars] = useState<string[]>([]);

    // Crop UI state
    const [cropping, setCropping] = useState(false);
    const [cropSource, setCropSource] = useState<CropSource | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropAreaPixels | null>(null);
    const [mediaSize, setMediaSize] = useState<MediaSize | null>(null);

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

    // Keep selected in sync if parent changes value
    useEffect(() => {
        setSelected(value ?? null);
    }, [value]);

    // -----------------------------
    // Helpers
    // -----------------------------
    const persistAvatar = (url: string) => {
        if (!url) return;

        setSavedAvatars((prev) => {
            if (prev.includes(url)) return prev;
            const updated = [...prev, url];
            localStorage.setItem(SAVED_AVATARS_KEY, JSON.stringify(updated));
            return updated;
        });
    };

    const handleSelect = (url: string | null) => {
        setSelected(url);
        onChange(url);
    };

    const openCropper = (source: CropSource) => {
        setUploadError(null);
        setCropping(true);
        setCropSource(source);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCroppedAreaPixels(null);
        setMediaSize(null);
    };

    const closeCropper = () => {
        // Revoke only object URLs we created
        if (cropSource?.kind === "file") {
            URL.revokeObjectURL(cropSource.previewUrl);
        }
        setCropping(false);
        setCropSource(null);
        setCroppedAreaPixels(null);
        setMediaSize(null);
    };

    // -----------------------------
    // File Upload -> open crop UI
    // -----------------------------
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const previewUrl = URL.createObjectURL(file);
        openCropper({ kind: "file", file, previewUrl });

        // reset input so user can pick same file again if desired
        event.target.value = "";
    };

    const onCropComplete = (_: Area, areaPixels: Area) => {
        setCroppedAreaPixels({
            x: areaPixels.x,
            y: areaPixels.y,
            width: areaPixels.width,
            height: areaPixels.height,
        });
    };

    const applyCrop = async () => {
        if (!cropSource || !croppedAreaPixels) return;

        try {
            setUploading(true);
            setUploadError(null);

            // Important: ensure crop is in natural pixel space.
            // react-easy-crop gives pixel coords relative to the source image.
            // Capturing mediaSize helps validate we have a loaded image.
            if (!mediaSize) {
                throw new Error("Image not loaded yet.");
            }

            const formData = new FormData();
            formData.append("crop", JSON.stringify(croppedAreaPixels));

            if (cropSource.kind === "file") {
                formData.append("file", cropSource.file);
            } else {
                formData.append("imageUrl", cropSource.imageUrl);
            }

            const res = await fetch("/api/avatar/crop", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                throw new Error(await res.text());
            }

            // Crop route returns { publicUrl, contentType }
            const data: { publicUrl: string } = await res.json();
            const publicUrl = data.publicUrl;

            persistAvatar(publicUrl);
            handleSelect(publicUrl);
            closeCropper();
        } catch (err) {
            console.error("Avatar crop/upload failed:", err);
            setUploadError("Failed to save cropped avatar. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    // -----------------------------
    // URL Input Handler -> open crop UI
    // -----------------------------
    const handleUrlCrop = () => {
        const trimmed = urlInput.trim();
        if (!trimmed) return;

        if (!/^https?:\/\/.+/i.test(trimmed)) {
            setUploadError("Please enter a valid URL.");
            return;
        }

        // We can show the cropper using the remote URL directly.
        // The server will fetch + crop + upload.
        openCropper({ kind: "url", imageUrl: trimmed, previewUrl: trimmed });
        setUrlInput("");
    };

    const allAvatars = useMemo(() => [...PRESET_AVATARS, ...savedAvatars], [savedAvatars]);

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
                            {selected === url && <div className="absolute inset-0 bg-blue-500/20 pointer-events-none" />}
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
                    <button type="button" onClick={handleUrlCrop} className="px-3 py-2 bg-gray-200 rounded-lg text-sm">
                        Crop URL
                    </button>
                </div>
            </div>

            {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}

            {/* Current avatar preview (circle) */}
            {selected && (
                <div className="mt-2 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                        <Image src={selected} alt="Selected avatar" width={48} height={48} className="object-cover w-full h-full" />
                    </div>
                    <span className="text-xs text-gray-600 break-all">{selected}</span>
                </div>
            )}

            {/* Crop UI overlay */}
            {cropping && cropSource?.previewUrl && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
                    <div className="bg-white rounded-xl shadow-xl p-4 w-full max-w-md">
                        <h3 className="text-md font-semibold mb-3">Crop your avatar</h3>

                        <div className="relative w-full h-64 bg-black/5 rounded-lg overflow-hidden">
                            <Cropper
                                image={cropSource.previewUrl}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={onCropComplete}
                                onMediaLoaded={(media: MediaSize) => setMediaSize(media)}
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
                            <span className="text-xs text-gray-500">Zoom: {zoom.toFixed(1)}x</span>
                        </div>

                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                type="button"
                                className="px-3 py-2 bg-gray-200 rounded-lg text-sm"
                                onClick={closeCropper}
                                disabled={uploading}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
                                onClick={applyCrop}
                                disabled={uploading || !croppedAreaPixels}
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
