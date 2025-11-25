import { NextResponse } from "next/server";
import { getItem } from "@/lib/dynamo";
import {Room} from "@/lib/types";

export async function GET(
    req: Request,
    context: { params: Promise<{ roomId: string }> }
) {
    const { roomId } = await context.params;

    const room: Room | null = await getItem(`ROOM#${roomId}`);

    if (!room) {
        return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Return only the lightweight header info
    return NextResponse.json({
        name: room.name,
    });
}
