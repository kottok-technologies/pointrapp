import { RoomProvider } from "@/context/RoomContext";

export default async function RoomLayout({
                                       children,
                                       params,
                                   }: {
    children: React.ReactNode;
    params: Promise<{ roomId: string }>;
}) {
    const { roomId } = await params;
    return (
        <RoomProvider roomId={roomId}>
            <div className="min-h-screen bg-gray-100">{children}</div>
        </RoomProvider>
    );
}
