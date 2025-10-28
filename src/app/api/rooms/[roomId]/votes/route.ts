// app/api/rooms/[roomId]/votes/route.ts
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { putItem, getItem, queryByPK } from "@/lib/dynamo";

const SubmitVoteSchema = z.object({
    userId: z.string().min(1, "userId is required"),
    storyId: z.string().min(1, "storyId is required"),
    value: z.string().min(1, "vote value is required"),
});

export async function POST(
    req: Request,
    { params }: { params: { roomId: string } }
) {
    try {
        const roomId = params.roomId;
        const body = await req.json();
        const parsed = SubmitVoteSchema.parse(body);

        // Check room exists
        const room = await getItem(`ROOM#${roomId}`, `ROOM#${roomId}`);
        if (!room) {
            return NextResponse.json({ error: `Room ${roomId} not found` }, { status: 404 });
        }

        // Check story exists under this room
        const story = await getItem(
            `ROOM#${roomId}`,
            `STORY#${parsed.storyId}`
        );
        if (!story) {
            return NextResponse.json(
                { error: `Story ${parsed.storyId} not found in room ${roomId}` },
                { status: 404 }
            );
        }

        // Create vote item
        const voteId = `${parsed.storyId}#${parsed.userId}`; // unique-ish
        const timestamp = new Date().toISOString();

        const voteItem = {
            PK: `ROOM#${roomId}`,
            SK: `VOTE#${voteId}`,
            EntityType: "Vote",
            RoomId: roomId,
            StoryId: parsed.storyId,
            UserId: parsed.userId,
            Value: parsed.value,
            CreatedAt: timestamp,
        };

        await putItem(voteItem);

        return NextResponse.json(
            { message: `Vote recorded for story ${parsed.storyId} by user ${parsed.userId}` },
            { status: 201 }
        );
    } catch (error: unknown) {
        console.error("❌ Error submitting vote:", error);
        if (error instanceof ZodError) {
            const messages = error.issues.map((i) => i.message).join(", ");
            return NextResponse.json({ error: `Validation failed: ${messages}` }, { status: 400 });
        }
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
