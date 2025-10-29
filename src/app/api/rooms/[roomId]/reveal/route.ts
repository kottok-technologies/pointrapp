import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { getItem, queryByPK, updateItem } from "@/lib/dynamo";
import { Vote } from "@/lib/types"

// ✅ Validation schema
const RevealSchema = z.object({
    storyId: z.string().min(1, "Story ID is required"),
});

export async function POST(
    req: Request,
    context: { params: Promise<{ roomId: string }> }
) {
    try {
        const { roomId } = await context.params;
        const body = await req.json();
        const parsed = RevealSchema.parse(body);

        // 🧠 Verify the room exists
        const room = await getItem(`ROOM#${roomId}`, `ROOM#${roomId}`);
        if (!room) {
            return NextResponse.json({ error: `Room ${roomId} not found` }, { status: 404 });
        }

        // ✅ Verify the story exists
        const story = await getItem(`ROOM#${roomId}`, `STORY#${parsed.storyId}`);
        if (!story) {
            return NextResponse.json(
                { error: `Story ${parsed.storyId} not found in room ${roomId}` },
                { status: 404 }
            );
        }

        // 🗳️ Get all votes for this story
        const allItems = await queryByPK<Vote>(`ROOM#${roomId}`);
        const votes = allItems.filter(
            (vote) => vote.storyId === parsed.storyId
        );

        if (votes.length === 0) {
            return NextResponse.json(
                { error: "No votes found for this story" },
                { status: 400 }
            );
        }

        // 🧮 Extract numeric votes (ignore '?', coffee breaks, etc.)
        const numericVotes = votes
            .map((v) => Number(v.value))
            .filter((v) => !isNaN(v));

        let average = null;
        let consensus = false;

        if (numericVotes.length > 0) {
            const sum = numericVotes.reduce((a, b) => a + b, 0);
            average = sum / numericVotes.length;
            consensus = new Set(numericVotes).size === 1; // all equal
        }

        // 🏁 Mark story as done
        await updateItem(`ROOM#${roomId}`, `STORY#${parsed.storyId}`, {
            Status: "done",
            Revealed: true,
            Average: average,
            Consensus: consensus,
            UpdatedAt: new Date().toISOString(),
        });

        return NextResponse.json(
            {
                storyId: parsed.storyId,
                revealed: true,
                average,
                consensus,
                votes,
            },
            { status: 200 }
        );
    } catch (error: unknown) {
        console.error("❌ Error revealing votes:", error);

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
