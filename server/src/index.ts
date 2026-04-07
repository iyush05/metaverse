import { Server } from "socket.io";
import type { PlayerState, Rooms } from "./types/common.js";

const io = new Server(3000, {
    cors: {
        origin: "*"
    }
});

const PROXIMITY_THRESHOLD = 256;
const rooms: Rooms = {};
const roomGroups: Record<string, string[][]> = {};

function calculateGroups(roomId: string) {
    const players = rooms[roomId];
    if (!players) return;

    const socketIds = Object.keys(players);
    const groups: string[][] = [];
    const visited = new Set<string>();

    for (const id1 of socketIds) {
        if (visited.has(id1)) continue;

        const currentGroup: string[] = [];
        const queue: string[] = [id1];
        visited.add(id1);

        while (queue.length > 0) {
            const currentId = queue.shift()!;
            currentGroup.push(currentId);

            const p1 = players[currentId];
            for (const id2 of socketIds) {
                if (visited.has(id2)) continue;
                const p2 = players[id2];

                if (!p1 || !p2) continue;

                const distance = Math.hypot(p1.x - p2.x, p1.y - p2.y);
                if (distance < PROXIMITY_THRESHOLD) {
                    visited.add(id2);
                    queue.push(id2);
                }
            }
        }
        groups.push(currentGroup.sort());
    }

    const previousGroups = roomGroups[roomId] || [];

    for (const newGroup of groups) {
        const inGroup = newGroup.length > 1;
        newGroup.forEach(id => {
            io.to(id).emit("group-status", { inGroup });
        });

        if (newGroup.length < 2) continue;

        const contributingOldGroups = previousGroups.filter(oldGroup =>
            oldGroup.some(id => newGroup.includes(id))
        );

        if (contributingOldGroups.length > 1) {
            const names = contributingOldGroups.map(og => {
                const leaderId = og[0];
                const leaderObj = leaderId ? players[leaderId] : undefined;
                return leaderObj?.name ? leaderObj.name : `Player ${leaderId?.slice(0, 4) || 'Anon'}`;
            });
            const msgText = `${names.join(" and ")}'s group joined.`;

            newGroup.forEach(id => {
                io.to(id).emit("system-message", { text: msgText, type: 'merge' });
            });
        }
    }

    roomGroups[roomId] = groups;
}

io.on("connection", (socket) => {
    let currentRoom = null;

    socket.on("join-room", (roomId: string, name: string | undefined, callback: Function) => {
        socket.data.currentRoom = roomId;
        currentRoom = roomId;
        if (!rooms[roomId]) rooms[roomId] = {};

        socket.join(roomId);

        const existingPlayers = { ...rooms[roomId] };
        callback({ players: existingPlayers });

        const initialState: PlayerState = { x: 640, y: 640, direction: "DOWN", isMoving: false };
        if (name) initialState.name = name;
        rooms[roomId][socket.id] = initialState;
        socket.to(roomId).emit("player-joined", { id: socket.id, ...initialState });

        calculateGroups(roomId);
    });

    socket.on("player-moved", (state: PlayerState) => {
        const roomId = socket.data.currentRoom;
        if (!roomId || !rooms[roomId]) return;

        // Preserve name if not sent back in player-moved
        const existingName = rooms[roomId][socket.id]?.name;
        const newState = { ...state };
        const finalName = state.name || existingName;
        if (finalName) {
            newState.name = finalName;
        }
        rooms[roomId][socket.id] = newState;

        const payload: any = { id: socket.id, ...state };
        if (state.name || existingName) {
            payload.name = state.name || existingName;
        }

        socket.to(roomId).emit("player-moved", payload);

        calculateGroups(roomId);
    });

    socket.on("send-chat", (text: string) => {
        const roomId = socket.data.currentRoom;
        if (!roomId || !rooms[roomId]) return;

        const currentGroups = roomGroups[roomId] || [];
        const senderGroup = currentGroups.find(g => g.includes(socket.id));

        if (senderGroup) {
            const senderName = rooms[roomId][socket.id]?.name;
            senderGroup.forEach(id => {
                io.to(id).emit("chat-message", { id: socket.id, text, name: senderName });
            });
        }
    });

    socket.on("leave-room", (roomId) => {
        if (socket.data.currentRoom === roomId) {
            socket.data.currentRoom = null;
        }
        if (rooms[roomId] && rooms[roomId][socket.id]) {
            delete rooms[roomId][socket.id];
            io.to(roomId).emit("player-left", { id: socket.id });
        }
        socket.leave(roomId);
        calculateGroups(roomId);
    });

    socket.on("disconnect", () => {
        const roomId = socket.data.currentRoom;
        if (!roomId || !rooms[roomId]) return;

        delete rooms[roomId][socket.id];
        io.to(roomId).emit("player-left", { id: socket.id });

        calculateGroups(roomId);
    });
});