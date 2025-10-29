import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { putItem, getItem, queryByPK } from "@/lib/dynamo";
import { nanoid } from "nanoid";
import type { Story, Room } from "@/lib/types";

// ✅ Schema for adding a story
const CreateStorySchema = z.object({
    title: z.string().min(1, "Story title is required"),
    description: z.string().optional(),
    link: z.string().url().optional(),
});

export async function POST(
    req: Request,
    context: { params: Promise<{ roomId: string }> }
) {
    try {
        const { roomId } = await context.params;
        const body = await req.json();
        const parsed = CreateStorySchema.parse(body);

        // 🧠 Verify that the room exists
        const room = await getItem<Room>(`ROOM#${roomId}`, `ROOM#${roomId}`);
        if (!room) {
            return NextResponse.json(
                { error: `Room ${roomId} not found` },
                { status: 404 }
            );
        }

        // 📊 Determine story order (1 + existing story count)
        const allItems = await queryByPK<Record<string, unknown>>(`ROOM#${roomId}`);
        const storyCount = allItems.filter(
            (i) => i.EntityType === "Story" || i.entityType === "Story"
        ).length;

        // 🆕 Construct new story
        const storyId = nanoid(8);
        const timestamp = new Date().toISOString();

        const storyItem: Story = {
            id: storyId,
            roomId,
            title: parsed.title,
            description: parsed.description,
            link: parsed.link,
            order: storyCount + 1,
            status: "pending",
            createdAt: timestamp,
            // optional props left undefined by design
        };

        // 🧭 DynamoDB record keys
        const dbItem = {
            PK: `ROOM#${roomId}`,
            SK: `STORY#${storyId}`,
            EntityType: "Story",
            ...storyItem,
        };

        await putItem(dbItem);

        return NextResponse.json(
            {
                storyId,
                story: storyItem,
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
