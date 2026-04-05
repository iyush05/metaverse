export interface PlayerState {
    x: number;
    y: number;
    direction: "UP" | "DOWN" | "LEFT" | "RIGHT" | undefined;
    isMoving: boolean;
}

export interface PlayerPayload extends PlayerState {
    id: string;
}

export type OtherPlayers = Record<string, PlayerState>;

export interface ChatMessage {
    id: string;
    text: string;
}

export interface SystemMessage {
    text: string;
    type: 'merge' | 'other';
}