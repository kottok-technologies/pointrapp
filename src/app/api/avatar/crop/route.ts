import { NextRequest } from "next/server";
import sharp from "sharp";
import { uploadAvatar } from "@/lib/s3";
import { nanoid } from "nanoid";

const BUCKET = process.env.AVATAR_BUCKET!;
const CDN_DOMAIN = process.env.CLOUDFRONT_DOMAIN!;

export async function POST(req: NextRequest) {
    try {
        const form = await req.formData();

        const file = form.get("file") as File;
        const cropJSON = form.get("crop") as string;

        if (!file) {
            return new Response("Missing file", { status: 400 });
        }
        if (!cropJSON) {
            return new Response("Missing crop data", { status: 400 });
        }

        const crop = JSON.parse(cropJSON) as {
            x: number;
            y: number;
            width: number;
            height: number;
        };

        const arrayBuffer = await file.arrayBuffer();
        const inputBuffer = Buffer.from(arrayBuffer);

        // Perform crop + mask to circle
        const cropped = await sharp(inputBuffer)
            .extract({
                left: Math.round(crop.x),
                top: Math.round(crop.y),
                width: Math.round(crop.width),
                height: Math.round(crop.height),
            })
            .resize(256, 256)
            .png()
            .toBuffer();

        const key = `avatars/${nanoid()}.png`;

        // Upload to the same bucket you already use
        const uploadUrl = await uploadAvatar(BUCKET, key, "image/png");

        await fetch(uploadUrl, {
            method: "PUT",
            headers: {
                "Content-Type": "image/png",
            },
            body: cropped,
        });

        const publicUrl = `https://${CDN_DOMAIN}/${key}`;

        return Response.json({ url: publicUrl });
    } catch (err) {
        console.error("❌ Avatar crop failed:", err);
        return new Response("Failed to crop image", { status: 500 });
    }
}
