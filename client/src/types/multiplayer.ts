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