import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { putItem, getItem } from "@/lib/dynamo";
import { nanoid } from "nanoid";

// ✅ Schema for joining a room
const JoinRoomSchema = z.object({
    name: z.string().min(1, "Name is required"),
    role: z.enum(["facilitator", "participant", "observer"]).default("participant"),
    avatarUrl: z.string().url().optional(),
});

// ✅ Route Handler
export async function POST(
    req: Request,
    { params }: { params: { roomId: string } }
) {
    try {
        const roomId = params.roomId;
        const body = await req.json();
        const parsed = JoinRoomSchema.parse(body);

        // 🧠 Check if room exists
        const room = await getItem(`ROOM#${roomId}`, `ROOM#${roomId}`);
        if (!room) {
            return NextResponse.json(
                { error: `Room ${roomId} not found` },
                { status: 404 }
            );
        }

        const userId = nanoid(8);
        const timestamp = new Date().toISOString();

        const userItem = {
            PK: `ROOM#${roomId}`,
            SK: `USER#${userId}`,
            EntityType: "User",
            UserId: userId,
            RoomId: roomId,
            Name: parsed.name,
            Role: parsed.role,
            AvatarUrl: parsed.avatarUrl || null,
            JoinedAt: timestamp,
            LastActiveAt: timestamp,
        };

        await putItem(userItem);

        return NextResponse.json(
            {
                userId,
                message: `Joined room ${roomId} successfully`,
            },
            { status: 201 }
        );
    } catch (error: unknown) {
        console.error("❌ Error joining room:", error);

        if (error instanceof ZodError) {
            const messages = error.issues.map((issue) => issue.message).join(", ");
            return NextResponse.json(
                { error: `Validation failed: ${messages}` },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
