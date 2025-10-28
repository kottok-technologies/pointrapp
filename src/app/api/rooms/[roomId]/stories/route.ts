import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { putItem, getItem, queryByPK } from "@/lib/dynamo";
import { nanoid } from "nanoid";

// ✅ Schema for adding a story
const CreateStorySchema = z.object({
    title: z.string().min(1, "Story title is required"),
    description: z.string().optional(),
    link: z.string().url().optional(),
});

export async function POST(
    req: Request,
    { params }: { params: { roomId: string } }
) {
    try {
        const roomId = params.roomId;
        const body = await req.json();
        const parsed = CreateStorySchema.parse(body);

        // 🧠 Verify that the room exists
        const room = await getItem(`ROOM#${roomId}`, `ROOM#${roomId}`);
        if (!room) {
            return NextResponse.json(
                { error: `Room ${roomId} not found` },
                { status: 404 }
            );
        }

        // 📊 Determine story order (1 + existing story count)
        const allItems = await queryByPK(`ROOM#${roomId}`);
        const storyCount = allItems.filter((i) => i.EntityType === "Story").length;

        const storyId = nanoid(8);
        const timestamp = new Date().toISOString();

        const storyItem = {
            PK: `ROOM#${roomId}`,
            SK: `STORY#${storyId}`,
            EntityType: "Story",
            StoryId: storyId,
            RoomId: roomId,
            Title: parsed.title,
            Description: parsed.description || "",
            Link: parsed.link || "",
            Order: storyCount + 1,
            Status: "pending",
            CreatedAt: timestamp,
            UpdatedAt: timestamp,
        };

        await putItem(storyItem);

        return NextResponse.json(
            {
                storyId,
                message: `Story "${parsed.title}" added to room ${roomId}`,
            },
            { status: 201 }
        );
    } catch (error: unknown) {
        console.error("❌ Error adding story:", error);

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
