import type { types as mediasoupTypes } from "mediasoup";
import { createWorker } from "mediasoup";
import { mediasoupConfig } from "./mediasoupConfig.js";
import { Room } from "./Room.js";

export class RoomManager {
    private workers: mediasoupTypes.Worker[] = [];
    private workerIndex = 0;
    private rooms: Map<string, Room> = new Map();

    async init(numWorkers = 1): Promise<void> {
        for (let i = 0; i < numWorkers; i++) {
            const worker = await createWorker(mediasoupConfig.worker);
            worker.on("died", () => {
                console.error("mediasoup worker died, restarting...");
            });
            this.workers.push(worker);
        }
        console.log(`${numWorkers} mediasoup workers started`);
    }

    private getNextWorker(): mediasoupTypes.Worker {
        const worker = this.workers[this.workerIndex];
        if (!worker) {
            throw new Error("No mediasoup workers available");
        }
        this.workerIndex = (this.workerIndex + 1) % this.workers.length;
        return worker;
    }

    async getOrCreateRoom(roomId: string): Promise<Room> {
        let room = this.rooms.get(roomId);
        if (!room) {
            const worker = this.getNextWorker();
            room = await Room.create(roomId, worker);
            this.rooms.set(roomId, room);
            console.log(`Room created: ${roomId}`);
        }
        return room;
    }

    deleteRoomIfEmpty(roomId: string): void {
        const room = this.rooms.get(roomId);
        if (room?.isEmpty()) {
            this.rooms.delete(roomId);
            console.log(`Room deleted: ${roomId}`);
        }
    }
}