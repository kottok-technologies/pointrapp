// User (session participant)
export interface User {
    id: string; // UUID
    name: string;
    role: "facilitator" | "participant" | "observer";
    avatarUrl?: string;
    joinedAt: string; // ISO timestamp
    lastActiveAt?: string;
    roomId?: string; // currently joined room
}

// Room (main session)
export interface Room {
    id: string; // UUID or short code (e.g. "ABC123")
    name: string;
    createdBy: string; // userId
    deckType: "fibonacci" | "tshirt" | "powersOf2" | "custom";
    customDeckValues?: string[];
    status: "active" | "ended";
    revealMode: "allReveal" | "instant";
    allowObservers: boolean;
    createdAt: string;
    updatedAt: string;
    currentStoryId?: string;
}

// Story (individual estimation item)
export interface Story {
    id: string;
    roomId: string;
    title: string;
    description?: string;
    link?: string; // e.g. Jira/GitHub issue
    order: number;
    status: "pending" | "estimating" | "done";
    average?: number;
    consensus?: boolean;
    finalValue?: string;
    createdAt: string;
}

// Vote (one per user per story)
export interface Vote {
    pK: string;
    sK: string;
    id: string;
    storyId: string;
    userId: string;
    roomId: string;
    value: string; // e.g. "5", "13", "?"
    createdAt: string;
}

// Deck (optional customization)
export interface Deck {
    id: string;
    name: string;
    values: string[];
    createdBy?: string;
}

export interface WebSocketMessage {
    type:
        | "connectionAck"
        | "userJoined"
        | "storyAdded"
        | "votesRevealed"
        | "revoteStarted"
        | string; // fallback for unknown events
    connectionId?: string;
    data?: unknown;
}
