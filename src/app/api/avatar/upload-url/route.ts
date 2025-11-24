// src/app/api/avatar/upload-url/route.ts
import { uploadAvatar} from "@/lib/s3";

const BUCKET = process.env.AVATAR_BUCKET!;
const CDN_DOMAIN = process.env.CLOUDFRONT_DOMAIN!; // cdn.pointrapp.com

if (!BUCKET || !CDN_DOMAIN) {
    throw new Error(
        "Missing AVATAR_BUCKET or CLOUDFRONT_DOMAIN in env"
    );
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const rawType = searchParams.get("contentType") ?? "image/png";

        // Very light content-type safety
        const contentType =
            rawType.startsWith("image/") ? rawType : "image/png";

        const ext =
            contentType === "image/jpeg" ? "jpg" :
                contentType === "image/png" ? "png" :
                    "png";

        const key = `avatars/${crypto.randomUUID()}.${ext}`;

        const uploadUrl = await uploadAvatar(BUCKET, key, contentType);

        const publicUrl = `https://${CDN_DOMAIN}/${key}`;

        return Response.json({ uploadUrl, publicUrl, contentType });
    } catch (err) {
        console.error("❌ Failed to create avatar upload URL:", err);
        return new Response(
            JSON.stringify({ error: "Failed to generate upload URL" }),
            { status: 500 }
        );
    }
}
