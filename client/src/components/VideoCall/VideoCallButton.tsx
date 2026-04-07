import { useState, useEffect, useRef, useCallback } from 'react';
import { socket } from '../../services/socket';
import { SignalingClient } from '../../services/SignalingClient';
import { VideoOverlay } from '../../mediasoup/VideoOverlay';
import './VideoCallButton.css';

const MEDIA_SERVER_URL = import.meta.env.VITE_MEDIA_SERVER_URL;

interface VideoCallButtonProps {
    roomId: string;
}

type CallState = 'idle' | 'connecting' | 'active';

export const VideoCallButton = ({ roomId }: VideoCallButtonProps) => {
    const [isVisible, setIsVisible] = useState(false);
    const [callState, setCallState] = useState<CallState>('idle');
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [isAudioOn, setIsAudioOn] = useState(true);
    const signalingRef = useRef<SignalingClient | null>(null);
    const overlayRef = useRef<VideoOverlay | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const publishedStreamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        const handleGroupStatus = ({ inGroup }: { inGroup: boolean }) => {
            setIsVisible(inGroup);
        };

        socket.on('group-status', handleGroupStatus);
        return () => {
            socket.off('group-status', handleGroupStatus);
        };
    }, []);

    useEffect(() => {
        if (!isVisible && callState === 'active') {
            leaveCall();
        }
    }, [isVisible, callState]);

    useEffect(() => {
        return () => {
            cleanupCall();
        };
    }, []);

    const cleanupCall = useCallback(() => {
        if (signalingRef.current) {
            signalingRef.current.leaveRoom();
            signalingRef.current = null;
        }

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(t => t.stop());
            localStreamRef.current = null;
        }

        if (overlayRef.current) {
            overlayRef.current.clear();
            overlayRef.current.hide();
            overlayRef.current = null;
        }

        setCallState('idle');
        setIsVideoOn(true);
        setIsAudioOn(true);
    }, []);

    const joinCall = useCallback(async () => {
        if (callState !== 'idle') return;
        setCallState('connecting');

        try {
            const overlay = new VideoOverlay('video-call-overlay');
            overlayRef.current = overlay;
            overlay.show();

            const signaling = new SignalingClient(MEDIA_SERVER_URL);
            signalingRef.current = signaling;

            signaling.mediasoupClient.onNewStream = (socketId, stream, kind, playerName) => {
                overlay.addStream(socketId, stream, kind, playerName);
            };

            signaling.mediasoupClient.onStreamRemoved = (socketId) => {
                overlay.removeStream(socketId);
            };

            const heroName = new URLSearchParams(window.location.search).get('name') || 'Player';
            await signaling.joinRoom(roomId, heroName);

            publishedStreamRef.current = signaling.getPublishedStream();

            const localStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 320, height: 240, frameRate: 15 },
                audio: false, // audio-only for self-view preview
            });
            localStreamRef.current = localStream;
            overlay.addLocalStream(localStream);

            setCallState('active');
        } catch (err) {
            console.error('Failed to join video call:', err);
            cleanupCall();
        }
    }, [roomId, callState, cleanupCall]);

    const leaveCall = useCallback(() => {
        cleanupCall();
    }, [cleanupCall]);

    const toggleVideo = useCallback(() => {
        const published = publishedStreamRef.current;
        if (!published) return;
        const videoTrack = published.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            setIsVideoOn(videoTrack.enabled);
        }
        // Also toggle local preview
        const local = localStreamRef.current;
        if (local) {
            const localVideo = local.getVideoTracks()[0];
            if (localVideo) localVideo.enabled = !localVideo.enabled;
        }
    }, []);

    const toggleAudio = useCallback(() => {
        const stream = publishedStreamRef.current;
        if (!stream) return;
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            setIsAudioOn(audioTrack.enabled);
        }
    }, []);

    if (!isVisible) return null;

    return (
        <div className="videocall-container">
            {callState === 'idle' && (
                <button
                    className="videocall-btn videocall-btn--join"
                    onClick={joinCall}
                    id="videocall-join-btn"
                >
                    <span className="videocall-btn__icon">📹</span>
                    <span>Join Video Call</span>
                </button>
            )}

            {callState === 'connecting' && (
                <button className="videocall-btn videocall-btn--connecting" disabled>
                    <span className="videocall-btn__icon">⏳</span>
                    <span>Connecting…</span>
                </button>
            )}

            {callState === 'active' && (
                <div className="videocall-active-controls">
                    <button
                        className={`videocall-toggle-btn ${!isAudioOn ? 'videocall-toggle-btn--off' : ''}`}
                        onClick={toggleAudio}
                        id="videocall-toggle-audio-btn"
                        title={isAudioOn ? 'Mute microphone' : 'Unmute microphone'}
                    >
                        <span className="videocall-toggle-btn__icon">{isAudioOn ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                        ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="2" x2="22" y1="2" y2="22"/><path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2"/><path d="M5 10v2a7 7 0 0 0 12 5.29"/><path d="M15 9.34V5a3 3 0 0 0-5.68-1.33"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                        )}</span>
                    </button>

                    <button
                        className={`videocall-toggle-btn ${!isVideoOn ? 'videocall-toggle-btn--off' : ''}`}
                        onClick={toggleVideo}
                        id="videocall-toggle-video-btn"
                        title={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
                    >
                        <span className="videocall-toggle-btn__icon">{isVideoOn ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.934a.5.5 0 0 0-.777-.416L16 11"/><rect x="2" y="6" width="14" height="12" rx="2"/></svg>
                        ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.66 6H14a2 2 0 0 1 2 2v2.5l5.248 3.062a.5.5 0 0 0 .752-.432V8.37a.5.5 0 0 0-.752-.432L16 11"/><path d="M16 16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                        )}</span>
                    </button>

                    <button
                        className="videocall-btn videocall-btn--leave"
                        onClick={leaveCall}
                        id="videocall-leave-btn"
                    >
                        <span className="videocall-btn__icon">📵</span>
                        <span>Leave</span>
                        <span className="videocall-live-badge">
                            <span className="videocall-live-dot" />
                            LIVE
                        </span>
                    </button>
                </div>
            )}
        </div>
    );
};
