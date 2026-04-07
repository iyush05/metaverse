import { Device } from "mediasoup-client";
import type { Transport, Producer, Consumer, RtpCapabilities } from "mediasoup-client/types";
import { Socket } from "socket.io-client";

export class MediasoupClient {
    private device: Device;
    private sendTransport: Transport | null = null;
    private recvTransport: Transport | null = null;
    private producers: Map<string, Producer> = new Map();
    private consumers: Map<string, Consumer> = new Map();
    private socket: Socket;

    private deviceLoadedResolve!: () => void;
    private deviceLoaded: Promise<void>;

    public onNewStream?: (socketId: string, stream: MediaStream, kind: string, playerName?: string) => void;
    public onStreamRemoved?: (socketId: string) => void;

    constructor(socket: Socket) {
        this.device = new Device();
        this.socket = socket;
        this.deviceLoaded = new Promise((resolve) => {
            this.deviceLoadedResolve = resolve;
        });
        this.setupSocketListeners();
    }

    private setupSocketListeners() {
        this.socket.on("newProducer", async (data: any) => {
            if (Array.isArray(data)) {
                for (const { socketId, producerId, playerName } of data) {
                    await this.consumeProducer(socketId, producerId, playerName);
                }
            } else {
                await this.consumeProducer(data.socketId, data.producerId, data.playerName);
            }
        });

        this.socket.on("existingProducers", async (producers: any[]) => {
            for (const { socketId, producerId, playerName } of producers) {
                await this.consumeProducer(socketId, producerId, playerName);
            }
        });

        this.socket.on("peerLeft", ({ socketId }: { socketId: string }) => {
            this.onStreamRemoved?.(socketId);
        });
    }

    async loadDevice(rtpCapabilities: RtpCapabilities): Promise<void> {
        if (!this.device.loaded) {
            await this.device.load({ routerRtpCapabilities: rtpCapabilities });
        }

        this.deviceLoadedResolve();
    }

    async startPublishing(stream: MediaStream): Promise<void> {
        this.sendTransport = await this.createTransport("send");

        for (const track of stream.getTracks()) {
            const producer = await this.sendTransport.produce({ track });
            this.producers.set(producer.id, producer);
        }
    }

    async consumeProducer(producerSocketId: string, producerId: string, playerName?: string): Promise<void> {
        await this.deviceLoaded;

        if (!this.recvTransport) {
            this.recvTransport = await this.createTransport("recv");
        }

        const consumerData = await this.socketEmit("consume", {
            producerSocketId,
            producerId,
            transportId: this.recvTransport.id,
            rtpCapabilities: this.device.rtpCapabilities
        });

        if (consumerData.error) {
            console.error("Consume error:", consumerData.error);
            return;
        }

        const consumer = await this.recvTransport.consume({
            id: consumerData.consumerId,
            producerId: consumerData.producerId,
            kind: consumerData.kind,
            rtpParameters: consumerData.rtpParameters,
        });

        this.consumers.set(consumer.id, consumer);

        const stream = new MediaStream([consumer.track]);
        this.onNewStream?.(producerSocketId, stream, consumer.kind, playerName);
    }

    async stopAll(): Promise<void> {
        this.producers.forEach((p) => p.close());
        this.producers.clear();
        this.consumers.forEach((c) => c.close());
        this.consumers.clear();
        this.sendTransport?.close();
        this.sendTransport = null;
        this.recvTransport?.close();
        this.recvTransport = null;
    }

    private async createTransport(direction: "send" | "recv"): Promise<Transport> {
        const params = await this.socketEmit("createTransport", { direction });
        
        const transport =
            direction === "send"
                ? this.device.createSendTransport(params)
                : this.device.createRecvTransport(params);

            transport.on("connect", ({ dtlsParameters }, callback, errback) => {
                this.socketEmit("connectTransport", {
                    transportId: transport.id,
                    dtlsParameters,
                })
                    .then(callback)
                    .catch(errback);
            });

        if (direction === "send") {
            transport.on("produce", ({ kind, rtpParameters }, callback, errback) => {
                this.socketEmit("produce", {
                    transportId: transport.id,
                    kind,
                    rtpParameters,
        })
          .then(({ producerId }) => callback({ id: producerId }))
          .catch(errback);
      });
    }

        return transport;
    }

    private socketEmit(event: string, data: any): Promise<any> {
        return new Promise((resolve) => {
            this.socket.emit(event, data, resolve);
        });
    }
}