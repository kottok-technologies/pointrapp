import { NextResponse } from "next/server";
import { z } from "zod";
import { putItem } from "@/lib/dynamo";
import { nanoid } from "nanoid";

// ✅ Schema for creating a user
const UserSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1),
    role: z.enum(["facilitator", "participant", "observer"]),
    avatarUrl: z.string().optional(),
    joinedAt: z.string().optional(),
    lastActiveAt: z.string().optional(),
    roomId: z.string().optional(),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const parsed = UserSchema.parse(body);

        const id = parsed.id || nanoid(12);
        const timestamp = new Date().toISOString();

        const userItem = {
            PK: `USER#${id}`,
            SK: `USER#${id}`,
            EntityType: "User",
            UserId: id,
            Name: parsed.name,
            Role: parsed.role,
            AvatarUrl: parsed.avatarUrl || "",
            JoinedAt: parsed.joinedAt ?? timestamp,
            LastActiveAt: parsed.lastActiveAt ?? timestamp,
            RoomId: parsed.roomId || "unknown",
        };

        await putItem(userItem);

        return NextResponse.json({ userId: id, message: "User created successfully" }, { status: 201 });
    } catch (err) {
        console.error("❌ Error creating user:", err);
        return NextResponse.json({ error: "Failed to create user" }, { status: 400 });
    }
}
