import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { putItem } from "@/lib/dynamo";
import { nanoid } from "nanoid";

// ✅ Input validation schema
const CreateRoomSchema = z.object({
    name: z.string().min(1, "Room name is required"),
    createdBy: z.string().min(1, "CreatedBy (userId) is required"),
    deckType: z.enum(["fibonacci", "tshirt", "powersOf2", "custom"]),
    allowObservers: z.boolean().default(true),
    revealMode: z.enum(["allReveal", "instant"]).default("allReveal"),
    customDeckValues: z.array(z.string()).optional(),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const parsed = CreateRoomSchema.parse(body);

        const roomId = nanoid(6);
        const timestamp = new Date().toISOString();

        const roomItem = {
            PK: `ROOM#${roomId}`,
            SK: `ROOM#${roomId}`,
            EntityType: "Room",
            RoomId: roomId,
            Name: parsed.name,
            CreatedBy: parsed.createdBy,
            DeckType: parsed.deckType,
            AllowObservers: parsed.allowObservers,
            RevealMode: parsed.revealMode,
            CustomDeckValues: parsed.customDeckValues || [],
            Status: "active",
            CreatedAt: timestamp,
            UpdatedAt: timestamp,
        };

        await putItem(roomItem);

        return NextResponse.json(
            { roomId, message: "Room created successfully" },
            { status: 201 }
        );
    } catch (error: unknown) {
        console.error("❌ Error creating room:", error);

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
