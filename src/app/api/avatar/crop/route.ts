import { NextRequest } from "next/server";
import sharp from "sharp";
import { uploadAvatar } from "@/lib/s3";
import { nanoid } from "nanoid";

const BUCKET = process.env.AVATAR_BUCKET!;
const CDN_DOMAIN = process.env.CLOUDFRONT_DOMAIN!;

if (!BUCKET || !CDN_DOMAIN) {
    throw new Error("Missing AVATAR_BUCKET or CLOUDFRONT_DOMAIN");
}

type CropArea = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export async function POST(req: NextRequest) {
    try {
        const form = await req.formData();

        const file = form.get("file") as File | null;
        const cropJson = form.get("crop") as string | null;

        if (!file) {
            return new Response("Missing file", { status: 400 });
        }
        if (!cropJson) {
            return new Response("Missing crop data", { status: 400 });
        }

        const crop = JSON.parse(cropJson) as CropArea;

        const arrayBuffer = await file.arrayBuffer();
        const inputBuffer = Buffer.from(arrayBuffer);

        // 1️⃣ Crop the region and normalize to 256x256 PNG
        const croppedBuffer = await sharp(inputBuffer)
            .extract({
                left: Math.round(crop.x),
                top: Math.round(crop.y),
                width: Math.round(crop.width),
                height: Math.round(crop.height),
            })
            .resize(256, 256)
            .png()
            .toBuffer();

        // (Optional: you *could* add a circular alpha-mask here using
        // sharp + SVG overlay, but CSS rounded-full is enough visually.)

        const key = `avatars/${nanoid()}.png`;

        // 2️⃣ Ask S3 for a presigned PUT URL, as in your existing flow
        const uploadUrl = await uploadAvatar(BUCKET, key, "image/png");

        // 2️⃣ Convert Node Buffer → real ArrayBuffer (no SharedArrayBuffer in sight)
        const arrayBufferSend = croppedBuffer.buffer.slice(
            croppedBuffer.byteOffset,
            croppedBuffer.byteOffset + croppedBuffer.byteLength,
        ) as ArrayBuffer; // <-- key: narrow to ArrayBuffer for TS

// 3️⃣ Upload to S3 via presigned URL
        const putRes = await fetch(uploadUrl, {
            method: "PUT",
            headers: {
                "Content-Type": "image/png",
            },
            body: arrayBufferSend, // BodyInit accepts ArrayBuffer
        });

        if (!putRes.ok) {
            console.error("S3 upload failed:", await putRes.text());
            return new Response("Failed to upload cropped avatar", { status: 500 });
        }

        const publicUrl = `https://${CDN_DOMAIN}/${key}`;

        return Response.json({ url: publicUrl });
    } catch (err) {
        console.error("❌ Avatar crop failed:", err);
        return new Response("Failed to crop image", { status: 500 });
    }
}
