import { Server } from "socket.io";
import type { PlayerState, Rooms } from "./types/common.js";

const io = new Server(3000, {
    cors: {
        origin: "*"
    }
});

const rooms: Rooms = {};

io.on("connection", (socket) => {
    let currentRoom = null;

    socket.on("join-room", (roomId, callback) => {
        socket.data.currentRoom = roomId;
        currentRoom = roomId;
        if (!rooms[roomId]) rooms[roomId] = {};

        socket.join(roomId);

        const existingPlayers = { ...rooms[roomId] };
        callback({ players: existingPlayers });

        const initialState: PlayerState = {x: 640, y: 640, direction: "DOWN", isMoving: false };
        rooms[roomId][socket.id] = initialState;
        socket.to(roomId).emit("player-joined", { id: socket.id, ...initialState });
    });

    socket.on("player-moved", (state: PlayerState) => {
        const roomId = socket.data.currentRoom;
        if (!roomId || !rooms[roomId]) return;
        rooms[roomId][socket.id] = state;
        socket.to(roomId).emit("player-moved", { id: socket.id, ...state }); 
    })

    socket.on("disconnect", () => {
        const roomId = socket.data.currentRoom;
        if (!roomId || !rooms[roomId]) return;

        delete rooms[roomId][socket.id];
        io.to(roomId).emit("player-left", { id: socket.id });
    });
});