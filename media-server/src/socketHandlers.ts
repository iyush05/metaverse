import { Server, Socket } from "socket.io";
import { RoomManager } from "./RoomManager.js";


const socketRoomMap = new Map<string, string>();

export function registerSocketHandlers(io: Server, roomManager: RoomManager) {
    io.on("connection", (socket: Socket) => {
        console.log(`Client connected: ${socket.id}`);

        socket.on(
            "joinRoom",
            async ({ roomId, playerId }: { roomId: string, playerId: string }) => {
                const room = await roomManager.getOrCreateRoom(roomId);
                room.addPeer(socket.id, playerId);
                socketRoomMap.set(socket.id, roomId);

                socket.emit("routerRtpCapabilities", room.getRtpCapabilities()); //send router capabilities so client can load mediasoup-client device

                socket.to(roomId).emit("peerJoined", { socketId: socket.id, playerId });

                const existingProducers = room.getOtherProducers(socket.id);
                if (existingProducers.length > 0) {
                    socket.emit("existingProducers", existingProducers); //sending new ppeer info abt existing producers
                }
            }
        );

        socket.on(
            "createTransport",
            async(
                { direction }: { direction: "send" | "recv" },
                callback: Function
            ) => {
                try {
                    const roomId = socketRoomMap.get(socket.id)!;
                    const room = await roomManager.getOrCreateRoom(roomId);
                    const transport = await room.createWebRtcTransport(socket.id, direction);

                    callback({
                        id: transport.id,
                        iceParameters: transport.iceParameters,
                        iceCandidates: transport.iceCandidates,
                        dtlsParameters: transport.dtlsParameters,
                    });
                } catch (err) {
                    callback({ error: (err as Error).message });
                }
            }
        );

        socket.on(
            "connectTransport",
            async(
                { transportId, dtlsParameters }: any,
                callback: Function
            ) => {
                try {
                    const roomId = socketRoomMap.get(socket.id)!;
                    const room = await roomManager.getOrCreateRoom(roomId);
                    await room.connectTransport(socket.id, transportId, dtlsParameters);
                    callback({ success: true });
                } catch (err) {
                    callback({ error: (err as Error).message });
                }
            }
        );

        socket.on(
            "produce",
            async ({ transportId, kind, rtpParameters }: any, callback: Function) => {
                try {
                    const roomId = socketRoomMap.get(socket.id)!;
                    const room = await roomManager.getOrCreateRoom(roomId);
                    const producer = await room.produce(socket.id, transportId, kind, rtpParameters);

                    socket.to(roomId).emit("newProducer", {
                        socketId: socket.id,
                        producerId: producer.id,
                        kind: producer.kind,
                    });

                    callback({ producerId: producer.id });
                } catch (err) {
                    callback({ error: (err as Error).message });
                }
            }
        );

        socket.on(
            "consume",
            async(
                { producerSocketId, transportId, rtpCapabilities }: any,
                callback: Function
            ) => {
                try {
                    const roomId = socketRoomMap.get(socket.id)!;
                    const room = await roomManager.getOrCreateRoom(roomId);
                    const consumer = await room.consume(socket.id, producerSocketId, transportId, rtpCapabilities);
                    if (!consumer) return callback({ error: "Cannot consume" });

                    callback({
                        consumerId: consumer.id,
                        producerId: consumer.producerId,
                        kind: consumer.kind,
                        rtpParameters: consumer.rtpParameters,
                    });
                } catch (err) {
                    callback({ error: (err as Error).message });
                }
            }
        );

        const handleLeave = () => {
            const roomId = socketRoomMap.get(socket.id);
            if (!roomId) return;

            const room = roomManager["rooms"].get(roomId);
            if (room) {
                room.removePeer(socket.id);
                roomManager.deleteRoomIfEmpty(roomId);
            }
            socketRoomMap.delete(socket.id);
            io.to(roomId).emit("peerLeft", { socketId: socket.id });
            console.log(`${socket.id} left room ${roomId}`);
        };

        socket.on("leaveRoom", handleLeave);
        socket.on("disconnect", handleLeave);
    });
}