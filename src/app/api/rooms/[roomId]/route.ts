import { NextResponse } from "next/server";
import { queryByPK, getItem } from "@/lib/dynamo";
import type { Room, User, Story } from "@/lib/types";

// ✅ GET /api/rooms/[roomId]
export async function GET(
    req: Request,
    context: { params: Promise<{ roomId: string }> }
) {
    try {
        const { roomId } = await context.params;
        const pk = `ROOM#${roomId}`;

        // 1️⃣ Fetch the main Room record
        const roomItem = await getItem<Record<string, unknown>>(pk, pk);
        if (!roomItem) {
            return NextResponse.json(
                { error: `Room ${roomId} not found` },
                { status: 404 }
            );
        }

        // Normalize room to match our Room interface
        const room: Room = {
            id: String(roomItem.id ?? roomId),
            name: String(roomItem.name ?? "Untitled Room"),
            createdBy: String(roomItem.createdBy ?? ""),
            deckType: (roomItem.deckType as Room["deckType"]) ?? "fibonacci",
            customDeckValues: (roomItem.customDeckValues as string[]) ?? [],
            status: (roomItem.status as Room["status"]) ?? "active",
            revealMode: (roomItem.revealMode as Room["revealMode"]) ?? "allReveal",
            allowObservers: Boolean(roomItem.allowObservers ?? true),
            createdAt: String(roomItem.createdAt ?? new Date().toISOString()),
            updatedAt: String(roomItem.updatedAt ?? new Date().toISOString()),
            currentStoryId: roomItem.currentStoryId
                ? String(roomItem.currentStoryId)
                : undefined,
        };

        // 2️⃣ Fetch all related items (users, stories)
        const items = await queryByPK<Record<string, unknown>>(pk);

        const users: User[] = items
            .filter((i) => i.EntityType === "User")
            .map((u) => ({
                id: String(u.id ?? crypto.randomUUID()),
                name: String(u.name ?? "Unnamed"),
                role: (u.role as User["role"]) ?? "participant",
                avatarUrl: u.avatarUrl ? String(u.avatarUrl) : undefined,
                joinedAt: String(u.joinedAt ?? new Date().toISOString()),
                lastActiveAt: u.lastActiveAt
                    ? String(u.lastActiveAt)
                    : undefined,
                roomId: String(u.roomId ?? roomId),
            }));

        const stories: Story[] = items
            .filter((i) => i.EntityType === "Story")
            .map((s) => ({
                id: String(s.id ?? crypto.randomUUID()),
                roomId: String(s.roomId ?? roomId),
                title: String(s.title ?? "Untitled Story"),
                description: s.description ? String(s.description) : undefined,
                link: s.link ? String(s.link) : undefined,
                order: Number(s.order ?? 0),
                status: (s.status as Story["status"]) ?? "pending",
                average:
                    s.average !== undefined ? Number(s.average) : undefined,
                consensus:
                    s.consensus !== undefined
                        ? Boolean(s.consensus)
                        : undefined,
                finalValue:
                    s.finalValue !== undefined
                        ? String(s.finalValue)
                        : undefined,
                createdAt: String(s.createdAt ?? new Date().toISOString()),
            }));

        // 3️⃣ Return structured response
        return NextResponse.json(
            {
                room,
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
