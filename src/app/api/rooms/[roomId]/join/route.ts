import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import {
    putItem,
    getItem,
    queryByRoomId,
    updateRoomId,
} from "@/lib/dynamo";
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";

// ✅ Schema for joining a room
const JoinRoomSchema = z.object({
    userId: z.string().min(1, "userId is required"), // 🧠 user now provided by UserProvider
    name: z.string().min(1, "Name is required"),
    role: z.enum(["facilitator", "participant", "observer"]).default("participant"),
    avatarUrl: z.string().url().optional(),
    connectionId: z.string().optional(),
});

export async function POST(
    req: Request,
    context: { params: Promise<{ roomId: string }> }
) {
    try {
        const { roomId } = await context.params;
        const body = await req.json();
        const parsed = JoinRoomSchema.parse(body);

        // 🧠 Ensure the room exists
        const room = await getItem(`ROOM#${roomId}`, `ROOM#${roomId}`);
        if (!room) {
            return NextResponse.json(
                { error: `Room ${roomId} not found` },
                { status: 404 }
            );
        }

        const timestamp = new Date().toISOString();

        // ✅ Represent user-room membership
        const roomUserItem = {
            PK: `ROOM#${roomId}`,
            SK: `USER#${parsed.userId}`,
            EntityType: "RoomUser",
            UserId: parsed.userId,
            RoomId: roomId,
            Name: parsed.name,
            Role: parsed.role,
            AvatarUrl: parsed.avatarUrl || null,
            JoinedAt: timestamp,
            LastActiveAt: timestamp,
        };

        // Save relationship entry
        await putItem(roomUserItem);

        // ✅ If we know the connection ID, tie it to the room
        if (parsed.connectionId) {
            console.log(`🔗 Linking connection ${parsed.connectionId} to room ${roomId}`);
            await updateRoomId(parsed.connectionId, roomId);
        }

        // ✅ Broadcast new participant to all others in this room
        try {
            const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
            if (!wsUrl) {
                console.warn("⚠️ Skipping broadcast: NEXT_PUBLIC_WS_URL not set");
            } else {
                const api = new ApiGatewayManagementApiClient({
                    region: process.env.AWS_REGION,
                    endpoint: wsUrl.replace(/^wss/, "https"), // WebSocket → HTTP
                });

                const connections = await queryByRoomId<{ ConnectionId: string }>(roomId);

                const payload = JSON.stringify({
                    action: "broadcast",
                    type: "userJoined",
                    data: {
                        userId: parsed.userId,
                        name: parsed.name,
                        role: parsed.role,
                        roomId,
                    },
                });

                for (const conn of connections) {
                    if (!conn.ConnectionId) continue;
                    try {
                        await api.send(
                            new PostToConnectionCommand({
                                ConnectionId: conn.ConnectionId,
                                Data: payload,
                            })
                        );
                    } catch (err) {
                        console.error(`⚠️ Failed to send to ${conn.ConnectionId}:`, err);
                    }
                }

                console.log(`📢 Broadcasted "userJoined" for ${parsed.name} in ${roomId}`);
            }
        } catch (broadcastErr) {
            console.error("⚠️ Broadcast failed:", broadcastErr);
        }

        return NextResponse.json(
            {
                userId: parsed.userId,
                message: `User ${parsed.name} joined room ${roomId}`,
            },
            { status: 201 }
        );
    } catch (error: unknown) {
        console.error("❌ Error joining room:", error);

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
