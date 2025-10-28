import { RoomProvider } from "./context/RoomContext";

export default function RoomLayout({
                                       children,
                                       params,
                                   }: {
    children: React.ReactNode;
    params: { roomId: string };
}) {
    return (
        <RoomProvider roomId={params.roomId}>
            <div className="min-h-screen bg-gray-100">{children}</div>
        </RoomProvider>
    );
}
