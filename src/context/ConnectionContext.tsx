"use client";

import React, {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
    ReactNode,
    useCallback,
} from "react";
import { useUser } from "@/context/UserContext";
import { WebSocketMessage } from "@/lib/types"

interface ConnectionContextValue {
    connectionId: string | null;
    connected: boolean;
    sendMessage: (msg: object) => void;
    /** optional event bus for consumers (e.g. RoomProvider) */
    onMessage: (handler: (msg: WebSocketMessage) => void) => void;
    offMessage: (handler: (msg: WebSocketMessage) => void) => void;
}

const ConnectionContext = createContext<ConnectionContextValue | undefined>(undefined);

export function ConnectionProvider({ children }: { children: ReactNode }) {
    const { user } = useUser();
    const wsRef = useRef<WebSocket | null>(null);
    const [connectionId, setConnectionId] = useState<string | null>(null);
    const [connected, setConnected] = useState(false);
    const handlersRef = useRef<Set<(msg: WebSocketMessage) => void>>(new Set());

    const onMessage = useCallback((handler: (msg: WebSocketMessage) => void) => {
        handlersRef.current.add(handler);
    }, []);

    const offMessage = useCallback((handler: (msg: WebSocketMessage) => void) => {
        handlersRef.current.delete(handler);
    }, []);

    useEffect(() => {
        if (!user) return;

        const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
        if (!wsUrl) {
            console.warn("⚠️ NEXT_PUBLIC_WS_URL not defined, skipping WS connection");
            return;
        }

        let reconnectAttempt = 0;
        let shouldReconnect = true;

        const connect = () => {
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                setConnected(true);
                reconnectAttempt = 0;
                console.log("✅ Connected to WebSocket");
                ws.send(JSON.stringify({ action: "register" }));
            };

            ws.onmessage = async (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    console.log("📨 WS message:", msg);

                    // Core system events
                    if (msg.type === "connectionAck") {
                        setConnectionId(msg.connectionId);
                    }

                    // Broadcast to subscribers (e.g., RoomProvider)
                    handlersRef.current.forEach((fn) => fn(msg));
                } catch (err) {
                    console.error("⚠️ Error parsing WS message:", err);
                }
            };

            ws.onerror = (err) => {
                console.error("❌ WebSocket error:", err);
                ws.close();
            };

            ws.onclose = () => {
                setConnected(false);
                if (!shouldReconnect) return;
                const delay = Math.min(1000 * 2 ** reconnectAttempt, 30000);
                reconnectAttempt++;
                console.warn(`⚠️ WS closed. Reconnecting in ${delay / 1000}s...`);
                setTimeout(connect, delay);
            };
        };

        connect();

        return () => {
            shouldReconnect = false;
            wsRef.current?.close();
        };
    }, [user]);

    const sendMessage = (msg: object) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(msg));
        } else {
            console.warn("⚠️ Tried to send WS message but not connected");
        }
    };

    return (
        <ConnectionContext.Provider
            value={{
                connectionId,
                connected,
                sendMessage,
                onMessage,
                offMessage,
            }}
        >
            {children}
        </ConnectionContext.Provider>
    );
}

export function useConnection() {
    const ctx = useContext(ConnectionContext);
    if (!ctx) throw new Error("useConnection must be used within a ConnectionProvider");
    return ctx;
}
