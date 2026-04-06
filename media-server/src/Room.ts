import type { types as mediasoupTypes } from "mediasoup";
import { mediasoupConfig } from "./mediasoupConfig.js";

export interface Peer {
    socketId: string;
    playerId: string;
    transports: Map<string, mediasoupTypes.WebRtcTransport>;
    producers: Map<string, mediasoupTypes.Producer>;
    consumers: Map<string, mediasoupTypes.Consumer>;
}

export class Room {
    public roomId: string;
    private router: mediasoupTypes.Router;
    private peers: Map<string, Peer> = new Map();

    constructor(roomId: string, router: mediasoupTypes.Router) {
        this.roomId = roomId;
        this.router = router;
    }

    static async create(
        roomId: string,
        worker: mediasoupTypes.Worker
    ): Promise<Room> {
        const router = await worker.createRouter({
            mediaCodecs: mediasoupConfig.router.mediaCodecs,
        });
        return new Room(roomId, router);
    }

    getRtpCapabilities(): mediasoupTypes.RtpCapabilities {
        return this.router.rtpCapabilities;
    }

    addPeer(socketId: string, playerId: string): Peer {
        const peer: Peer = {
            socketId,
            playerId,
            transports: new Map(),
            producers: new Map(),
            consumers: new Map(),
        };
        this.peers.set(socketId, peer);
        return peer;
    }

    removePeer(socketId: string): void {
        const peer = this.peers.get(socketId);
        if (!peer) return;

        peer.consumers.forEach((c) => c.close());
        peer.producers.forEach((p) => p.close());
        peer.transports.forEach((t) => t.close());
        this.peers.delete(socketId);
    }

    getPeer(socketId: string): Peer | undefined {
        return this.peers.get(socketId);
    }

    getPeers(): Peer[] {
        return Array.from(this.peers.values());
    }

    isEmpty(): boolean {
        return this.peers.size === 0;
    }

    async createWebRtcTransport(socketId: string, direction: "send" | "recv"): Promise<mediasoupTypes.WebRtcTransport> {
        const transport = await this.router.createWebRtcTransport(
            mediasoupConfig.webRtcTransport
        );

        const peer = this.peers.get(socketId);
        if (!peer) throw new Error("Peer not found");
        peer.transports.set(transport.id, transport);

        transport.on("dtlsstatechange", (state) => {
            if (state === "closed") {
                peer.transports.delete(transport.id);
            }
        });

        return transport;
    }

    async connectTransport(
        socketId: string,
        transportId: string,
        dtlsParameters: mediasoupTypes.DtlsParameters
    ): Promise<void> {
        const peer = this.peers.get(socketId);
        const transport = peer?.transports.get(transportId);
        if (!transport) throw new Error("Transport not found");
        await transport.connect({ dtlsParameters });
    }

    async produce(
        socketId: string,
        transportId: string,
        kind: mediasoupTypes.MediaKind,
        rtpParameters: mediasoupTypes.RtpParameters
    ): Promise<mediasoupTypes.Producer> {
        const peer = this.peers.get(socketId);
        const transport = peer?.transports.get(transportId);
        if (!transport) throw new Error("transport not found");

        const producer = await transport.produce({ kind, rtpParameters });
        peer!.producers.set(producer.id, producer);

        producer.on("transportclose", () => {
            peer!.producers.delete(producer.id);
        });

        return producer;
    }

    async consume (
        consumerSocketId: string,
        producerSocketId: string,
        transportId: string,
        rtpCapabilities: mediasoupTypes.RtpCapabilities
    ): Promise<mediasoupTypes.Consumer | null> {
        const producerPeer = this.peers.get(producerSocketId);
        if (!producerPeer) return null;

        const consumerPeer = this.peers.get(consumerSocketId);
        const transport = consumerPeer?.transports.get(transportId);
        if (!transport) return null;

        const results: mediasoupTypes.Consumer[] = [];

        for(const producer of producerPeer.producers.values()) {
            if (!this.router.canConsume({ producerId: producer.id, rtpCapabilities}))
                continue;

            const consumer = await transport.consume({
                producerId: producer.id,
                rtpCapabilities,
                paused: false,
            });

            consumerPeer!.consumers.set(consumer.id, consumer);

            consumer.on("transportclose", () => {
                consumerPeer!.consumers.delete(consumer.id);
            });

            results.push(consumer);
        }

        return results[0] ?? null;
    }

    getOtherProducers(socketId: string): Array<{ socketId: string; producerId: string; kind: string }> {
        const result: Array<{ socketId: string; producerId: string; kind: string }> = [];

        this.peers.forEach((peer, sid) => {
            if (sid === socketId) return;
            peer.producers.forEach((producer) => {
                result.push({ socketId: sid, producerId: producer.id, kind: producer.kind });
            });
        });
        return result;
    }
}
