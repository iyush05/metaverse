import type { types as mediasoupTypes } from "mediasoup";

export const mediasoupConfig = {
    worker: {
        rtcMinPort: 10000,
        rtcMaxPort: 10100,
        logLevel: "warn" as mediasoupTypes.WorkerLogLevel,
        logTags: ["info", "ice", "dtls", "rtp"] as mediasoupTypes.WorkerLogTag[],
    },
    router: {
        mediaCodecs: [
            {
                kind: "audio" as mediasoupTypes.MediaKind,
                mimeType: "audio/opus",
                clockRate: 48000,
                channels: 2,
            },
            {
                kind: "video" as mediasoupTypes.MediaKind,
                mimeType: "video/VP8",
                clockRate: 90000,
                parameters: { "x-google-start-bitrate": 1000 },
            },
        ] as unknown as mediasoupTypes.RtpCodecCapability[],
    },
    webRtcTransport: {
        listenIps: [
            {
                ip: "0.0.0.0",
                announcedIp: process.env.ANNOUNCED_IP || "127.0.0.1",
            },
        ],
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,
        initialAvailableOutgoingBitrate: 800000,
    },
};