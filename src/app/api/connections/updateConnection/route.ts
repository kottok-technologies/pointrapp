import { z, ZodError } from 'zod';
import {updateRoomId} from "@/lib/dynamo";
import {NextResponse} from "next/server";

const updateConnectionSchema = z.object({
    connectionId: z.string(),
    roomId: z.string()

})

export async function POST(req: Request) {
    const body = await req.json();
    const parsed = updateConnectionSchema.parse(body);

    try {
        await updateRoomId(parsed.connectionId, parsed.roomId);
        console.log(`🔗 Updated connection ${parsed.connectionId} to room ${parsed.roomId}`);
        return NextResponse.json(
            { message: "Connection updated successfully" },
            { status: 201 }
        );
    } catch (error) {
        console.error("❌ Failed to update RoomId:", error);
        if (error instanceof ZodError) {
            // ✅ Properly access .issues instead of .errors
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