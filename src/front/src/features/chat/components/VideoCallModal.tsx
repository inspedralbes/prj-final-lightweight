import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { socket } from "@/features/workout/services/socket";
import { PhoneOff, Mic, MicOff } from "@/shared/components/Icons";

interface VideoCallModalProps {
  roomId: string;
  isInitiator: boolean;
  otherUserId: number;
  onEnd: () => void;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export default function VideoCallModal({
  roomId,
  isInitiator,
  otherUserId,
  onEnd,
}: VideoCallModalProps) {
  const { t } = useTranslation();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const [remoteConnected, setRemoteConnected] = useState(false);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { userId: _userId } = { userId: otherUserId }; // keep ref stable

  /** Clean up all WebRTC resources and socket listeners. */
  const cleanup = () => {
    // stop local tracks
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;

    // close peer connection
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    // leave signaling room
    socket.emit("leave-room", roomId);

    // remove listeners added by this component
    socket.off("user-joined", handleUserJoined);
    socket.off("offer", handleOffer);
    socket.off("answer", handleAnswer);
    socket.off("ice-candidate", handleIceCandidate);
    socket.off("video-call-end", handleRemoteEnd);
    socket.off("user-left", handleUserLeft);
  };

  // --- Signaling handlers (stable refs so they can be removed in cleanup) ---

  const handleUserJoined = async ({
    socketId,
  }: {
    socketId: string;
    roomId: string;
  }) => {
    // Only the initiator responds to user-joined by creating an offer
    if (!isInitiator) return;
    if (!pcRef.current) return;
    console.log("[VideoCall] peer joined:", socketId, "— creating offer");
    try {
      const offer = await pcRef.current.createOffer();
      await pcRef.current.setLocalDescription(offer);
      socket.emit("offer", { roomId, offer });
    } catch (err) {
      console.error("[VideoCall] createOffer error:", err);
    }
  };

  const handleOffer = async (offer: RTCSessionDescriptionInit) => {
    if (!pcRef.current) return;
    console.log("[VideoCall] received offer");
    try {
      await pcRef.current.setRemoteDescription(
        new RTCSessionDescription(offer),
      );
      const answer = await pcRef.current.createAnswer();
      await pcRef.current.setLocalDescription(answer);
      socket.emit("answer", { roomId, answer });
    } catch (err) {
      console.error("[VideoCall] handleOffer error:", err);
    }
  };

  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    if (!pcRef.current) return;
    console.log("[VideoCall] received answer");
    try {
      await pcRef.current.setRemoteDescription(
        new RTCSessionDescription(answer),
      );
    } catch (err) {
      console.error("[VideoCall] handleAnswer error:", err);
    }
  };

  const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
    if (!pcRef.current) return;
    try {
      await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.error("[VideoCall] addIceCandidate error:", err);
    }
  };

  const handleRemoteEnd = ({
    fromUserId,
  }: {
    fromUserId: number;
    toUserId: number;
  }) => {
    if (Number(fromUserId) === Number(otherUserId)) {
      console.log("[VideoCall] remote user ended call");
      cleanup();
      onEnd();
    }
  };

  const handleUserLeft = ({ socketId }: { socketId: string }) => {
    console.log("[VideoCall] user left socket room:", socketId);
    // Remote video will freeze; treat as call ended after brief delay
    setRemoteConnected(false);
  };

  // --- Main effect: get media, create PC, join room ---
  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      // 1. Get local media
      let stream: MediaStream;
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("getUserMedia not available");
        }
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
      } catch {
        if (!cancelled) setError(t("videoCall.cameraError"));
        return;
      }
      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // 2. Create RTCPeerConnection
      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;

      // Add local tracks to peer connection
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // On remote track → show in remote video element
      pc.ontrack = (event) => {
        console.log("[VideoCall] ontrack", event.streams);
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
          setRemoteConnected(true);
        }
      };

      // ICE candidate → forward via socket
      pc.onicecandidate = ({ candidate }) => {
        if (candidate) {
          socket.emit("ice-candidate", {
            roomId,
            candidate: candidate.toJSON(),
          });
        }
      };

      pc.onconnectionstatechange = () => {
        console.log("[VideoCall] connection state:", pc.connectionState);
        if (
          pc.connectionState === "disconnected" ||
          pc.connectionState === "failed"
        ) {
          setRemoteConnected(false);
        }
      };

      // 3. Register signaling listeners
      socket.on("user-joined", handleUserJoined);
      socket.on("offer", handleOffer);
      socket.on("answer", handleAnswer);
      socket.on("ice-candidate", handleIceCandidate);
      socket.on("video-call-end", handleRemoteEnd);
      socket.on("user-left", handleUserLeft);

      // 4. Join socket room
      socket.emit("join-room", roomId);

      // 5. If NOT initiator: the initiator is waiting for user-joined and will send offer; we just wait.
      //    But if we are the initiator and callee already joined (race condition): create offer now.
      //    The backend emits current-peers to us if someone is already in the room.
      socket.once(
        "current-peers",
        async ({ peers }: { roomId: string; peers: string[] }) => {
          if (isInitiator && peers.length > 0 && pcRef.current) {
            console.log(
              "[VideoCall] initiator: callee already in room, creating offer",
            );
            try {
              const offer = await pcRef.current.createOffer();
              await pcRef.current.setLocalDescription(offer);
              socket.emit("offer", { roomId, offer });
            } catch (err) {
              console.error(
                "[VideoCall] createOffer (current-peers) error:",
                err,
              );
            }
          }
        },
      );
    };

    start();

    return () => {
      cancelled = true;
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, isInitiator]);

  const handleHangUp = () => {
    socket.emit("video-call-end", { fromUserId: 0, toUserId: otherUserId });
    cleanup();
    onEnd();
  };

  const toggleMute = () => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setMuted((m) => !m);
  };

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
        <div className="bg-[#1a1a1a] rounded-xl p-8 flex flex-col items-center gap-4 max-w-sm mx-4">
          <p className="text-red-400 text-center">{error}</p>
          <button
            onClick={onEnd}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            {t("common.close")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95">
      {/* Remote video (full background) */}
      <div className="relative w-full h-full max-w-3xl max-h-[90vh] mx-auto flex items-center justify-center">
        {!remoteConnected && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-white text-sm">{t("videoCall.connecting")}</p>
            </div>
          </div>
        )}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className={`w-full h-full object-cover rounded-xl ${remoteConnected ? "opacity-100" : "opacity-0"}`}
        />

        {/* Local video (picture-in-picture) */}
        <div className="absolute bottom-20 right-4 w-32 h-24 rounded-lg overflow-hidden border-2 border-orange-500 shadow-xl">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover scale-x-[-1]"
          />
        </div>

        {/* Controls bar */}
        <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4 px-4">
          {/* Mute button */}
          <button
            onClick={toggleMute}
            title={muted ? t("videoCall.unmute") : t("videoCall.mute")}
            className={`p-3 rounded-full transition-colors ${
              muted
                ? "bg-orange-500 hover:bg-orange-600 text-white"
                : "bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white"
            }`}
          >
            {muted ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>

          {/* Hang up */}
          <button
            onClick={handleHangUp}
            title={t("videoCall.endCall")}
            className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors shadow-lg"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
