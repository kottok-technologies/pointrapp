"use client";

import { useRef, useState, useEffect } from "react";

interface CropModalProps {
    imageSrc: string;
    onClose: () => void;
    onSave: (croppedDataUrl: string) => void;
}

export default function CropModal({ imageSrc, onClose, onSave }: CropModalProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const imgRef = useRef<HTMLImageElement | null>(null);

    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [dragging, setDragging] = useState(false);
    const [startDrag, setStartDrag] = useState({ x: 0, y: 0 });

    // Load image
    useEffect(() => {
        if (!open) return;

        const draw = () => {
            const canvas = canvasRef.current;
            const img = imgRef.current;
            if (!canvas || !img) return;

            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            const size = canvas.width; // square canvas
            ctx.clearRect(0, 0, size, size);

            const scaledWidth = img.width * zoom;
            const scaledHeight = img.height * zoom;

            ctx.drawImage(
                img,
                offset.x,
                offset.y,
                scaledWidth,
                scaledHeight
            );
        };

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imageSrc;
        img.onload = () => {
            imgRef.current = img;
            draw();
        };
    }, [imageSrc, open, zoom, offset]);

    // Drag functionality
    const handleMouseDown = (e: React.MouseEvent) => {
        setDragging(true);
        setStartDrag({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    };
    const handleMouseMove = (e: React.MouseEvent) => {
        if (!dragging) return;
        setOffset({
            x: e.clientX - startDrag.x,
            y: e.clientY - startDrag.y,
        });
    };
    const handleMouseUp = () => setDragging(false);

    // Output cropped data as PNG
    const handleSave = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const dataUrl = canvas.toDataURL("image/png");
        onSave(dataUrl);
    };

    if (!open) return null;

    return (
        <div className="flex flex-col gap-4">

            <div className="text-lg font-semibold">Adjust Avatar</div>

            <div
                className="relative mx-auto"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <canvas
                    ref={canvasRef}
                    width={300}
                    height={300}
                    onMouseDown={handleMouseDown}
                    className="rounded-full cursor-grab active:cursor-grabbing bg-gray-200"
                />
            </div>

            {/* Zoom slider */}
            <div className="mt-2">
                <input
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.01"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="w-full"
                />
            </div>

            <div className="flex justify-end gap-2 pt-4">
                <button
                    className="px-3 py-2 bg-gray-200 rounded-lg"
                    onClick={onClose}
                >
                    Cancel
                </button>

                <button
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                    onClick={handleSave}
                >
                    Save Avatar
                </button>
            </div>
        </div>
    );
}
