import { NextResponse } from "next/server";
import { z } from "zod";
import { getItem, putItem, deleteItem } from "@/lib/dynamo";

const PatchSchema = z.object({
    name: z.string().optional(),
    role: z.enum(["facilitator", "participant", "observer"]).optional(),
    avatarUrl: z.string().url().optional().nullable(),
    lastActiveAt: z.string().optional(),
    roomId: z.string().optional().nullable(),
});

export async function GET(
    req: Request,
    context: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await context.params;
        const user = await getItem(`USER#${userId}`, `USER#${userId}`);

        if (!user)
            return NextResponse.json({ error: "User not found" }, { status: 404 });

        return NextResponse.json(user, { status: 200 });
    } catch (err) {
        console.error("❌ Error getting user:", err);
        return NextResponse.json({ error: "Failed to retrieve user" }, { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    context: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await context.params;
        const body = await req.json();
        const parsed = PatchSchema.parse(body);

        const existing = await getItem(`USER#${userId}`, `USER#${userId}`);
        if (!existing)
            return NextResponse.json({ error: "User not found" }, { status: 404 });

        const updated = {
            ...existing,
            ...parsed,
            LastActiveAt: new Date().toISOString(),
        };

        await putItem(updated);

        return NextResponse.json(updated, { status: 200 });
    } catch (err) {
        console.error("❌ Error updating user:", err);
        return NextResponse.json({ error: "Failed to update user" }, { status: 400 });
    }
}

export async function DELETE(
    req: Request,
    context: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await context.params;

        await deleteItem(`USER#${userId}`, `USER#${userId}`);

        return NextResponse.json({ message: "User deleted" }, { status: 200 });
    } catch (err) {
        console.error("❌ Error deleting user:", err);
        return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
    }
}
