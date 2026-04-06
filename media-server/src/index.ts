import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { RoomManager } from "./RoomManager.js";
import { registerSocketHandlers } from "./socketHandlers.js";

async function main () {
    const app = express();
    const httpServer = createServer(app);
    const io = new Server(httpServer, {
        cors: { origin: "*" },
    });

    const roomManager = new RoomManager();
    await roomManager.init(2);

    registerSocketHandlers(io, roomManager);

    const PORT = process.env.PORT || 3001;

    httpServer.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

main().catch(console.error);