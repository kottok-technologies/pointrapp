import { NextResponse } from "next/server";
import { queryByPK, getItem } from "@/lib/dynamo";

// ✅ GET /api/rooms/[roomId]
export async function GET(
    _req: Request,
    { params }: { params: { roomId: string } }
) {
    try {
        const roomId = params.roomId;
        const pk = `ROOM#${roomId}`;

        // 1️⃣ Fetch the main Room record
        const room = await getItem(pk, pk);
        if (!room) {
            return NextResponse.json(
                { error: `Room ${roomId} not found` },
                { status: 404 }
            );
        }

        // 2️⃣ Fetch all related items (users, stories, votes)
        const items = await queryByPK(pk);

        const users = items
            .filter((i) => i.EntityType === "User")
            .map((u) => ({
                id: u.UserId || u.id,
                name: u.Name,
                role: u.Role,
                avatarUrl: u.AvatarUrl,
                joinedAt: u.JoinedAt,
                lastActiveAt: u.LastActiveAt,
                roomId: u.RoomId,
            }));

        const stories = items
            .filter((i) => i.EntityType === "Story")
            .map((s) => ({
                id: s.StoryId,
                title: s.Title,
                description: s.Description,
                status: s.Status,
                average: s.Average,
                consensus: s.Consensus,
                createdAt: s.CreatedAt,
            }));

        // 3️⃣ Return structured response
        return NextResponse.json(
            {
                room: {
                    id: room.RoomId,
                    name: room.Name,
                    createdBy: room.CreatedBy,
                    deckType: room.DeckType,
                    status: room.Status,
                    allowObservers: room.AllowObservers,
                    revealMode: room.RevealMode,
                    createdAt: room.CreatedAt,
                    updatedAt: room.UpdatedAt,
                },
                users,
                stories,
            },
            { status: 200 }
        );
    } catch (err) {
        console.error("❌ Error fetching room data:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
