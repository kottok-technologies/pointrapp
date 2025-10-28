import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { getItem, queryByPK, updateItem, deleteItem } from "@/lib/dynamo";

// ✅ Validation schema
const RevoteSchema = z.object({
    storyId: z.string().min(1, "Story ID is required"),
});

export async function POST(
    req: Request,
    { params }: { params: { roomId: string } }
) {
    try {
        const roomId = params.roomId;
        const body = await req.json();
        const parsed = RevoteSchema.parse(body);

        // 🧠 Verify room exists
        const room = await getItem(`ROOM#${roomId}`, `ROOM#${roomId}`);
        if (!room) {
            return NextResponse.json(
                { error: `Room ${roomId} not found` },
                { status: 404 }
            );
        }

        // ✅ Verify story exists
        const story = await getItem(`ROOM#${roomId}`, `STORY#${parsed.storyId}`);
        if (!story) {
            return NextResponse.json(
                { error: `Story ${parsed.storyId} not found in room ${roomId}` },
                { status: 404 }
            );
        }

        // 🗳️ Fetch all votes under this room for the target story
        const allItems = await queryByPK(`ROOM#${roomId}`);
        const votesToDelete = allItems.filter(
            (i) => i.EntityType === "Vote" && i.StoryId === parsed.storyId
        );

        // 🧹 Remove existing votes
        for (const vote of votesToDelete) {
            await deleteItem(`ROOM#${roomId}`, vote.SK);
        }

        // 🔄 Reset story status
        await updateItem(`ROOM#${roomId}`, `STORY#${parsed.storyId}`, {
            Status: "estimating",
            Revealed: false,
            Average: null,
            Consensus: null,
            UpdatedAt: new Date().toISOString(),
        });

        return NextResponse.json(
            {
                storyId: parsed.storyId,
                message: `Votes cleared and story reset for re-estimation.`,
                deletedVotes: votesToDelete.length,
            },
            { status: 200 }
        );
    } catch (error: unknown) {
        console.error("❌ Error resetting story for revote:", error);

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
