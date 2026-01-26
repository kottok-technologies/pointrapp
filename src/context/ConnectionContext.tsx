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
import { WebSocketMessage } from "@/lib/types";

interface ConnectionContextValue {
    connectionId: string | null;
    connected: boolean;
    sendMessage: (msg: object) => void;
    onMessage: (handler: (msg: WebSocketMessage) => void) => void;
    offMessage: (handler: (msg: WebSocketMessage) => void) => void;
}

const ConnectionContext = createContext<ConnectionContextValue | undefined>(
    undefined,
);

// Keep-alive tuning
const KEEPALIVE_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const KEEPALIVE_MAX_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours

export function ConnectionProvider({ children }: { children: ReactNode }) {
    const { user } = useUser();

    const wsRef = useRef<WebSocket | null>(null);
    const [connectionId, setConnectionId] = useState<string | null>(null);
    const [connected, setConnected] = useState(false);

    const handlersRef = useRef<Set<(msg: WebSocketMessage) => void>>(new Set());

    // Keep-alive timers
    const keepAliveIntervalRef = useRef<number | null>(null);
    const keepAliveStopTimeoutRef = useRef<number | null>(null);
    const sessionStartedAtRef = useRef<number | null>(null);

    const onMessage = useCallback((handler: (msg: WebSocketMessage) => void) => {
        handlersRef.current.add(handler);
    }, []);

    const offMessage = useCallback((handler: (msg: WebSocketMessage) => void) => {
        handlersRef.current.delete(handler);
    }, []);

    const clearKeepAlive = useCallback(() => {
        if (keepAliveIntervalRef.current !== null) {
            window.clearInterval(keepAliveIntervalRef.current);
            keepAliveIntervalRef.current = null;
        }
        if (keepAliveStopTimeoutRef.current !== null) {
            window.clearTimeout(keepAliveStopTimeoutRef.current);
            keepAliveStopTimeoutRef.current = null;
        }
        sessionStartedAtRef.current = null;
    }, []);

    const startKeepAlive = useCallback(() => {
        // Ensure clean slate before starting
        clearKeepAlive();

        sessionStartedAtRef.current = Date.now();

        // Send first ping a little later (optional). If you want immediately, call sendMessage here.
        keepAliveIntervalRef.current = window.setInterval(() => {
            const ws = wsRef.current;
            if (!ws || ws.readyState !== WebSocket.OPEN) return;

            // Optional: enforce max duration here too (belt + suspenders)
            const startedAt = sessionStartedAtRef.current;
            if (startedAt && Date.now() - startedAt > KEEPALIVE_MAX_DURATION_MS) {
                console.warn("🛑 Keep-alive max duration reached; stopping keep-alives.");
                clearKeepAlive();
                return;
            }

            ws.send(JSON.stringify({ action: "ping" }));
            console.log("💓 WS keep-alive ping");
        }, KEEPALIVE_INTERVAL_MS);

        // Hard stop after 2 hours
        keepAliveStopTimeoutRef.current = window.setTimeout(() => {
            console.warn("🛑 Keep-alive stopped after 2 hours.");
            clearKeepAlive();
        }, KEEPALIVE_MAX_DURATION_MS);
    }, [clearKeepAlive]);

    useEffect(() => {
        if (!user) return;

        const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
        if (!wsUrl) {
            console.warn("⚠️ NEXT_PUBLIC_WS_URL not defined, skipping WS connection");
            return;
        }

        let reconnectAttempt = 0;
        let shouldReconnect = true;
        let reconnectTimer: number | null = null;

        const connect = () => {
            // Clear any keepalive from previous socket
            clearKeepAlive();

            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                setConnected(true);
                reconnectAttempt = 0;
                console.log("✅ Connected to WebSocket");

                // Register to receive a connectionId
                ws.send(JSON.stringify({ action: "register" }));

                // Start keep-alive for THIS connection session
                startKeepAlive();
            };

            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    // console.log("📨 WS message:", msg);

                    if (msg.type === "connectionAck") {
                        setConnectionId(msg.connectionId);
                    }

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
                setConnectionId(null);

                // Stop keep-alive when the socket is closed
                clearKeepAlive();

                if (!shouldReconnect) return;

                const delay = Math.min(1000 * 2 ** reconnectAttempt, 30000);
                reconnectAttempt++;
                console.warn(`⚠️ WS closed. Reconnecting in ${delay / 1000}s...`);

                reconnectTimer = window.setTimeout(connect, delay);
            };
        };

        connect();

        return () => {
            shouldReconnect = false;

            if (reconnectTimer !== null) {
                window.clearTimeout(reconnectTimer);
            }

            clearKeepAlive();
            wsRef.current?.close();
        };
    }, [user, clearKeepAlive, startKeepAlive]);

    const sendMessage = useCallback((msg: object) => {
        const ws = wsRef.current;
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(msg));
        } else {
            console.warn("⚠️ Tried to send WS message but not connected");
        }
    }, []);

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
    if (!ctx)
        throw new Error("useConnection must be used within a ConnectionProvider");
    return ctx;
}
