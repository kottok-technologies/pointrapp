import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { putItem, getItem } from "@/lib/dynamo";
import type { Vote, Room, Story } from "@/lib/types";

// ✅ Schema validation
const SubmitVoteSchema = z.object({
    userId: z.string().min(1, "userId is required"),
    storyId: z.string().min(1, "storyId is required"),
    value: z.string().min(1, "vote value is required"),
});

export async function POST(
    req: Request,
    context: { params: Promise<{ roomId: string }> }
) {
    try {
        const { roomId } = await context.params;
        const body = await req.json();
        const parsed = SubmitVoteSchema.parse(body);

        // 🧠 Verify the room exists
        const room = await getItem<Room>(`ROOM#${roomId}`, `ROOM#${roomId}`);
        if (!room) {
            return NextResponse.json(
                { error: `Room ${roomId} not found` },
                { status: 404 }
            );
        }

        // ✅ Verify the story exists under this room
        const story = await getItem<Story>(
            `ROOM#${roomId}`,
            `STORY#${parsed.storyId}`
        );
        if (!story) {
            return NextResponse.json(
                { error: `Story ${parsed.storyId} not found in room ${roomId}` },
                { status: 404 }
            );
        }

        // 🆕 Construct the vote item
        const voteId = `${parsed.storyId}#${parsed.userId}`; // unique per user per story
        const timestamp = new Date().toISOString();

        const voteItem: Vote = {
            pK: `ROOM#${roomId}`,
            sK: `VOTE#${voteId}`,
            id: voteId,
            storyId: parsed.storyId,
            userId: parsed.userId,
            roomId,
            value: parsed.value,
            createdAt: timestamp,
        };

        await putItem(voteItem);

        return NextResponse.json(
            {
                message: `Vote recorded for story ${parsed.storyId} by user ${parsed.userId}`,
                vote: voteItem,
            },
            { status: 201 }
        );
    } catch (error: unknown) {
        console.error("❌ Error submitting vote:", error);

        if (error instanceof ZodError) {
            const messages = error.issues.map((i) => i.message).join(", ");
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
