interface PlayerState {
    x: number;
    y: number;
    direction: "UP" | "DOWN" | "LEFT" | "RIGHT" | undefined;
    isMoving: boolean;
}

interface RoomState {
    [socketId: string]: PlayerState;
}

interface Rooms {
    [roomId: string]: RoomState;
}

interface JoinRoomCallback {
    players: RoomState;
}

interface SocketData {
    currentRoom: string | null;
}

export type { PlayerState, RoomState, Rooms, JoinRoomCallback, SocketData };