import { io, Socket } from "socket.io-client";
import { MediasoupClient } from "../mediasoup/MediasoupClient";

export class SignalingClient {
  private socket: Socket;
  public mediasoupClient: MediasoupClient;
  private publishedStream: MediaStream | null = null;

  constructor(serverUrl: string) {
    this.socket = io(serverUrl);
    this.mediasoupClient = new MediasoupClient(this.socket);
  }

  async joinRoom(roomId: string, playerId: string): Promise<void> {
    return new Promise((resolve) => {
      this.socket.emit("joinRoom", { roomId, playerId });

      this.socket.once("routerRtpCapabilities", async (rtpCapabilities) => {
        await this.mediasoupClient.loadDevice(rtpCapabilities);

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, frameRate: 15 },
          audio: true,
        });
        this.publishedStream = stream;
        await this.mediasoupClient.startPublishing(stream);
        resolve();
      });
    });
  }

  getPublishedStream(): MediaStream | null {
    return this.publishedStream;
  }

  leaveRoom(): void {
    this.socket.emit("leaveRoom");
    this.mediasoupClient.stopAll();
    this.publishedStream = null;
  }
}