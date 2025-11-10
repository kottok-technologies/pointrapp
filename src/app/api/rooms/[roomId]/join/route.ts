import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { putItem, getItem } from "@/lib/dynamo";
import { nanoid } from "nanoid";
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";
import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";

// ✅ Schema for joining a room
const JoinRoomSchema = z.object({
    name: z.string().min(1, "Name is required"),
    role: z.enum(["facilitator", "participant", "observer"]).default("participant"),
    avatarUrl: z.string().url().optional(),
});

export async function POST(
    req: Request,
    context: { params: Promise<{ roomId: string }> }
) {
    try {
        const { roomId } = await context.params;
        const body = await req.json();
        const parsed = JoinRoomSchema.parse(body);

        // 🧠 Check if room exists
        const room = await getItem(`ROOM#${roomId}`, `ROOM#${roomId}`);
        if (!room) {
            return NextResponse.json(
                { error: `Room ${roomId} not found` },
                { status: 404 }
            );
        }

        const userId = nanoid(8);
        const timestamp = new Date().toISOString();

        const userItem = {
            PK: `ROOM#${roomId}`,
            SK: `USER#${userId}`,
            EntityType: "User",
            UserId: userId,
            RoomId: roomId,
            Name: parsed.name,
            Role: parsed.role,
            AvatarUrl: parsed.avatarUrl || null,
            JoinedAt: timestamp,
            LastActiveAt: timestamp,
        };

        console.log("IN join route")

        await putItem(userItem);

        // ✅ Broadcast new user joined
        try {
            const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
            if (!wsUrl) {
                console.warn("⚠️ Skipping broadcast: NEXT_PUBLIC_WS_URL not configured");
            } else {

                const dynamo = new DynamoDBClient({ region: process.env.AWS_REGION });
                const api = new ApiGatewayManagementApiClient({
                    region: process.env.AWS_REGION,
                    endpoint: wsUrl.replace(/^wss/, "https"), // convert wss:// → https://
                });
                console.log("IN join route")

                // Query active connections for this room (same logic as broadcast lambda)
                const scanResult = await dynamo.send(
                    new ScanCommand({ TableName: process.env.CONNECTIONS_TABLE })
                );
                const connections = (scanResult.Items || []).map((i) => unmarshall(i));

                const payload = JSON.stringify({
                    type: "userJoined",
                    data: {
                        userId,
                        name: parsed.name,
                        role: parsed.role,
                        roomId,
                    },
                });

                for (const conn of connections) {
                    if (!conn.ConnectionId || conn.RoomId !== roomId) continue;
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
                console.log(`📢 Broadcasted userJoined for room ${roomId}`);
            }
        } catch (broadcastErr) {
            console.error("⚠️ Broadcast failed:", broadcastErr);
        }

        return NextResponse.json(
            {
                userId,
                message: `Joined room ${roomId} successfully`,
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
