import sharp from "sharp";
import { uploadAvatar } from "@/lib/s3";

export const runtime = "nodejs"; // sharp requires Node runtime

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

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB cap for URL downloads
const FETCH_TIMEOUT_MS = 10_000;

function isHttpUrl(value: string): boolean {
    try {
        const u = new URL(value);
        return u.protocol === "http:" || u.protocol === "https:";
    } catch {
        return false;
    }
}

/**
 * Basic SSRF safety:
 * - Only http/https
 * - Block localhost
 * - Block obvious private IP literals (does not protect against DNS rebinding)
 */
function isBlockedHost(hostname: string): boolean {
    const h = hostname.toLowerCase();

    if (h === "localhost" || h.endsWith(".localhost")) return true;
    if (h === "127.0.0.1" || h === "::1") return true;

    // If hostname is an IPv4 literal, block private ranges
    const ipv4Match = h.match(/^(\d{1,3}\.){3}\d{1,3}$/);
    if (ipv4Match) {
        const parts = h.split(".").map((n) => Number(n));
        if (parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) return true;

        const [a, b] = parts;
        // 10.0.0.0/8
        if (a === 10) return true;
        // 172.16.0.0/12
        if (a === 172 && b >= 16 && b <= 31) return true;
        // 192.168.0.0/16
        if (a === 192 && b === 168) return true;
        // 169.254.0.0/16 (link-local)
        if (a === 169 && b === 254) return true;
        // 127.0.0.0/8 loopback
        if (a === 127) return true;
    }

    // Optional: block common internal domains if you want
    // if (h.endsWith(".internal") || h.endsWith(".local")) return true;

    return false;
}

async function readResponseWithLimit(
    res: Response,
    maxBytes: number,
): Promise<Buffer> {
    const contentLength = res.headers.get("content-length");
    if (contentLength) {
        const n = Number(contentLength);
        if (!Number.isNaN(n) && n > maxBytes) {
            throw new Error(`Image too large (content-length ${n} > ${maxBytes})`);
        }
    }

    if (!res.body) {
        throw new Error("No response body");
    }

    // Convert web ReadableStream -> Buffer with a hard cap
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;

    while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
            total += value.byteLength;
            if (total > maxBytes) {
                throw new Error(`Image too large (>${maxBytes} bytes)`);
            }
            chunks.push(value);
        }
    }

    return Buffer.from(Buffer.concat(chunks.map((c) => Buffer.from(c))));
}

async function fetchImageBuffer(imageUrl: string): Promise<Buffer> {
    if (!isHttpUrl(imageUrl)) {
        throw new Error("imageUrl must be http/https");
    }

    const u = new URL(imageUrl);
    if (isBlockedHost(u.hostname)) {
        throw new Error("imageUrl hostname is not allowed");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
        const res = await fetch(imageUrl, {
            method: "GET",
            redirect: "follow",
            signal: controller.signal,
            headers: {
                // Helps some CDNs behave predictably
                Accept: "image/*",
            },
        });

        if (!res.ok) {
            throw new Error(`Failed to fetch imageUrl: ${res.status}`);
        }

        const ct = res.headers.get("content-type") ?? "";
        if (!ct.toLowerCase().startsWith("image/")) {
            throw new Error(`URL did not return an image (content-type: ${ct})`);
        }

        return await readResponseWithLimit(res, MAX_IMAGE_BYTES);
    } finally {
        clearTimeout(timeout);
    }
}

function clampCrop(crop: CropArea, imgW: number, imgH: number) {
    const left = Math.max(0, Math.min(Math.round(crop.x), imgW - 1));
    const top = Math.max(0, Math.min(Math.round(crop.y), imgH - 1));
    const width = Math.max(1, Math.min(Math.round(crop.width), imgW - left));
    const height = Math.max(1, Math.min(Math.round(crop.height), imgH - top));
    return { left, top, width, height };
}

export async function POST(req: Request) {
    try {
        const form = await req.formData();

        const file = form.get("file") as File | null;
        const imageUrl = (form.get("imageUrl") as string | null) ?? null;
        const cropJson = form.get("crop") as string | null;

        if (!cropJson) return new Response("Missing crop data", { status: 400 });
        if (!file && !imageUrl) {
            return new Response("Missing file or imageUrl", { status: 400 });
        }

        const crop = JSON.parse(cropJson) as CropArea;

        // 1) Load image bytes from file OR URL
        let inputBuffer: Buffer;

        if (file) {
            // Optional: basic file size cap (File.size exists in Next runtime)
            if (typeof file.size === "number" && file.size > MAX_IMAGE_BYTES) {
                return new Response("File too large", { status: 413 });
            }
            inputBuffer = Buffer.from(await file.arrayBuffer());
        } else {
            inputBuffer = await fetchImageBuffer(imageUrl!);
        }

        // 2) Validate + clamp crop to bounds, then crop -> 256x256 png
        const image = sharp(inputBuffer);
        const meta = await image.metadata();

        if (!meta.width || !meta.height) {
            return new Response("Invalid image", { status: 400 });
        }

        const { left, top, width, height } = clampCrop(
            crop,
            meta.width,
            meta.height,
        );

        const croppedBuffer = await image
            .extract({ left, top, width, height })
            .resize(256, 256, { fit: "cover" })
            .png()
            .toBuffer();

        // 3) Presign PUT + upload
        const key = `avatars/${crypto.randomUUID()}.png`;
        const uploadUrl = await uploadAvatar(BUCKET, key, "image/png");

        const body = croppedBuffer.buffer.slice(
            croppedBuffer.byteOffset,
            croppedBuffer.byteOffset + croppedBuffer.byteLength,
        ) as ArrayBuffer;

        const putRes = await fetch(uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": "image/png" },
            body,
        });

        if (!putRes.ok) {
            console.error("S3 upload failed:", await putRes.text());
            return new Response("Failed to upload cropped avatar", { status: 500 });
        }

        const publicUrl = `https://${CDN_DOMAIN}/${key}`;
        return Response.json({ publicUrl, contentType: "image/png" });
    } catch (err) {
        console.error("❌ Avatar crop failed:", err);
        return new Response("Failed to crop image", { status: 500 });
    }
}
