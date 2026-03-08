import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { socket } from "@/features/workout/services/socket";
import { ArrowRight, X, VideoCamera } from "@/shared/components/Icons";
import { chatService } from "@/features/chat/services/chatService";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useToast } from "@/shared/hooks/useToast";
import { useRingtone } from "@/shared/hooks/useRingtone";
import VideoCallModal from "@/features/chat/components/VideoCallModal";

interface Message {
  text: string;
  sender: "me" | "them";
  timestamp: Date;
}

interface P2PChatProps {
  roomId: string;
  onClose: () => void;
  title: string;
  otherUserId: number;
}

// "pending": invite sent, waiting for server confirmation (no UI shown — prevents flash)
type CallState = "idle" | "pending" | "calling" | "in-call";

const P2PChat: React.FC<P2PChatProps> = ({
  roomId,
  onClose,
  title,
  otherUserId,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const toast = useToast();
  const ringtone = useRingtone();
  const callTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  // starts in "connecting" while we wait for partner info; offline only if socket truly disconnects
  const [status, setStatus] = useState<"connected" | "connecting" | "offline">(
    "connecting",
  );
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── Video call state ───────────────────────────────────────────────────────
  const [callState, setCallState] = useState<CallState>("idle");
  const [callIsInitiator, setCallIsInitiator] = useState(false);
  const callRoomId = user
    ? `video_${Math.min(user.id, otherUserId)}_${Math.max(user.id, otherUserId)}`
    : "";

  // ── Ringtone: play while ringing outgoing only; incoming is handled globally ──
  useEffect(() => {
    if (callState === "calling") {
      ringtone.play();
    } else {
      ringtone.stop();
    }
  }, [callState]); // eslint-disable-line react-hooks/exhaustive-deps

  const scrollToEnd = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToEnd();
  }, [messages]);

  // keep track of underlying socket state so we can show offline indicator
  useEffect(() => {
    const handleDisconnect = () => setStatus("offline");
    const handleConnect = () => {
      setStatus("connecting");
      // if we reconnect, notify and re-check with partner
      if (user && otherUserId) {
        socket.emit("open-chat", {
          userId: user.id,
          roomId,
          otherUserId,
        });
        socket.emit("get-chat-status", {
          roomId,
          userId: user.id,
          otherUserId,
        });
      }
    };
    socket.on("disconnect", handleDisconnect);
    socket.on("connect", handleConnect);
    return () => {
      socket.off("disconnect", handleDisconnect);
      socket.off("connect", handleConnect);
    };
  }, [roomId, otherUserId, user]);

  // Cargar la conversación previa
  useEffect(() => {
    if (otherUserId && user) {
      chatService
        .getConversation(otherUserId)
        .then((msgs) => {
          const formatted: Message[] = msgs.map((m) => ({
            text: m.text,
            sender: m.senderId === user.id ? "me" : "them",
            timestamp: new Date(m.createdAt),
          }));
          setMessages(formatted);

          // marcar como leídos los mensajes donde yo soy receptor y aún no fueron leídos
          const unreadIds = msgs
            .filter((m) => !m.read && m.receiverId === user.id)
            .map((m) => m.id);
          if (unreadIds.length > 0) {
            chatService
              .markAsRead(unreadIds)
              .catch((e) => console.error("Error marking messages read:", e));
          }
        })
        .catch((e) => {
          console.error("Error loading conversation:", e);
        });
    }
  }, [otherUserId, user]);

  useEffect(() => {
    console.log("[P2PChat] mounting, socket.connected=", socket.connected);
    if (!user || !otherUserId) return;

    // Notificar que abrimos el chat
    socket.emit("open-chat", {
      userId: user.id,
      roomId,
      otherUserId,
    });

    // Pedir estado inicial
    socket.emit("get-chat-status", {
      roomId,
      userId: user.id,
      otherUserId,
    });

    // ── Video call signaling (caller side only — callee side lives in AppContent) ──
    // Server confirmed the invite was delivered → show calling popup
    const handleVideoCallDelivered = (payload: {
      callerId: number;
      calleeId: number;
    }) => {
      if (Number(payload.calleeId) !== Number(otherUserId)) return;
      console.log("[VideoCall] invite delivered, showing calling popup");
      setCallState("calling");
      callTimeoutRef.current = setTimeout(() => {
        socket.emit("video-call-end", {
          fromUserId: user!.id,
          toUserId: otherUserId,
        });
        setCallState("idle");
        toast.warning(t("videoCall.callMissed", { name: title }));
      }, 30_000);
    };

    // Callee is not connected at all → silent failure, toast only
    const handleVideoCallUnavailable = (payload: {
      callerId: number;
      calleeId: number;
    }) => {
      if (Number(payload.calleeId) !== Number(otherUserId)) return;
      console.log("[VideoCall] callee offline");
      setCallState("idle");
      toast.warning(t("videoCall.userOffline", { name: title }));
    };

    // Callee accepted → caller enters call
    const handleVideoCallAccept = (payload: {
      callerId: number;
      calleeId: number;
      roomId: string;
    }) => {
      if (Number(payload.calleeId) !== Number(otherUserId)) return;
      console.log("[VideoCall] call accepted");
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
        callTimeoutRef.current = null;
      }
      setCallIsInitiator(true);
      setCallState("in-call");
    };

    const handleVideoCallReject = (payload: {
      callerId: number;
      calleeId: number;
    }) => {
      if (Number(payload.calleeId) !== Number(otherUserId)) return;
      console.log("[VideoCall] call rejected");
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
        callTimeoutRef.current = null;
      }
      setCallState("idle");
      toast.info(t("videoCall.callMissed", { name: title }));
    };

    const handleVideoCallEnd = (payload: {
      fromUserId: number;
      toUserId: number;
    }) => {
      if (Number(payload.fromUserId) !== Number(otherUserId)) return;
      console.log("[VideoCall] remote ended call");
      setCallState("idle");
    };

    // Escuchar eventos en tiempo real
    const handleChatPartnerStatus = (data: {
      roomId: string;
      userId: number;
      status: "connected" | "connecting" | "disconnected";
    }) => {
      console.log("[P2PChat] chat-partner-status received", data);
      if (data.roomId === roomId) {
        setStatus(data.status === "connected" ? "connected" : "connecting");
      }
    };

    const handleChatStatus = (data: {
      roomId: string;
      status: "connected" | "connecting";
      otherUserConnected: boolean;
    }) => {
      console.log("[P2PChat] chat-status reply", data);
      if (data.roomId === roomId) {
        setStatus(data.status);
      }
    };

    const handleP2PMessage = (data: any) => {
      console.log("[P2PChat] p2p-message received", data);
      if (data && data.text) {
        setMessages((prev) => [
          ...prev,
          {
            text: data.text,
            sender: "them",
            timestamp: new Date(data.timestamp || Date.now()),
          },
        ]);
        // Marcar como leído si viene el ID
        if (data.messageId) {
          chatService
            .markAsRead([data.messageId])
            .catch((e) =>
              console.error("Error marking incoming message read:", e),
            );
        }
      }
    };

    socket.on("chat-partner-status", handleChatPartnerStatus);
    socket.on("chat-status", handleChatStatus);
    socket.on("p2p-message", handleP2PMessage);
    socket.on("video-call-delivered", handleVideoCallDelivered);
    socket.on("video-call-unavailable", handleVideoCallUnavailable);
    socket.on("video-call-accept", handleVideoCallAccept);
    socket.on("video-call-reject", handleVideoCallReject);
    socket.on("video-call-end", handleVideoCallEnd);

    return () => {
      socket.off("chat-partner-status", handleChatPartnerStatus);
      socket.off("chat-status", handleChatStatus);
      socket.off("p2p-message", handleP2PMessage);
      socket.off("video-call-delivered", handleVideoCallDelivered);
      socket.off("video-call-unavailable", handleVideoCallUnavailable);
      socket.off("video-call-accept", handleVideoCallAccept);
      socket.off("video-call-reject", handleVideoCallReject);
      socket.off("video-call-end", handleVideoCallEnd);

      // Notificar que cerramos el chat
      socket.emit("close-chat", {
        userId: user.id,
        roomId,
        otherUserId,
      });
    };
  }, [roomId, otherUserId, user]);

  // ── Video call actions ─────────────────────────────────────────────────────
  const startCall = () => {
    if (!user) return;
    // Set "pending" — no popup yet, waits for server confirmation
    setCallState("pending");
    socket.emit("video-call-invite", {
      callerId: user.id,
      calleeId: otherUserId,
      callerName: user.username,
      roomId: callRoomId,
    });
  };

  const cancelCall = () => {
    if (!user) return;
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }
    socket.emit("video-call-end", {
      fromUserId: user.id,
      toUserId: otherUserId,
    });
    setCallState("idle");
  };

  const handleCallEnd = () => {
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }
    setCallState("idle");
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !user) return;

    const text = inputText.trim();
    setSending(true);

    try {
      // Enviar por WebSocket (el handler del backend persiste en BD y entrega al receptor)
      socket.emit("send-p2p-message", {
        senderId: user.id,
        receiverId: otherUserId,
        text: text,
      });

      // Agregar mensaje localmente
      setMessages((prev) => [
        ...prev,
        { text, sender: "me", timestamp: new Date() },
      ]);
      setInputText("");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSending(false);
    }
  };

  const getStatusColor = () => {
    if (status === "connected") return "bg-green-500";
    if (status === "connecting") return "bg-orange-500";
    return "bg-gray-500";
  };

  const getStatusText = () => {
    if (status === "connected") return "En línea";
    if (status === "connecting") return "No conectado";
    return "Desconectado";
  };

  return (
    <>
      {/* ── Active video call ──────────────────────────────────────────── */}
      {callState === "in-call" && (
        <VideoCallModal
          roomId={callRoomId}
          isInitiator={callIsInitiator}
          otherUserId={otherUserId}
          onEnd={handleCallEnd}
        />
      )}

      {/* ── Outgoing call overlay (ringing) ───────────────────────────── */}
      {callState === "calling" && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-8 flex flex-col items-center gap-5 shadow-2xl mx-4 max-w-xs w-full">
            <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center">
              <VideoCamera className="w-8 h-8 text-orange-500 animate-pulse" />
            </div>
            <div className="text-center">
              <p className="text-white font-semibold text-lg">{title}</p>
              <p className="text-gray-400 text-sm">
                {t("videoCall.calling", { name: title })}
              </p>
            </div>
            <button
              onClick={cancelCall}
              className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-colors"
            >
              {t("common.cancel")}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col h-[400px] w-full bg-[#0a0a0a] rounded-lg border border-[#2a2a2a] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-[#2a2a2a] bg-[#1a1a1a]">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
            <span className="text-sm font-medium text-white">{title}</span>
            <span className="text-[10px] text-gray-500">{getStatusText()}</span>
          </div>
          <div className="flex items-center gap-1">
            {/* Orange video call button */}
            <button
              onClick={startCall}
              disabled={callState !== "idle"}
              title={t("videoCall.startCall")}
              className="text-orange-500 hover:text-orange-400 disabled:text-gray-600 disabled:cursor-not-allowed p-1 rounded transition-colors"
            >
              <VideoCamera className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                onClose();
              }}
              className="text-gray-400 hover:text-white p-1 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
              <p className="text-gray-500 text-sm">Inicia la conversación</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] p-2 rounded-lg text-sm ${
                  msg.sender === "me"
                    ? "bg-orange-500 text-white rounded-tr-none"
                    : "bg-[#2a2a2a] text-gray-200 rounded-tl-none"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-[#2a2a2a] bg-[#1a1a1a]">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Escribe un mensaje..."
              className="flex-1 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-orange-500 focus:outline-none disabled:opacity-50"
            />
            <button
              onClick={sendMessage}
              disabled={!inputText.trim() || sending}
              className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-900 text-white p-2 rounded-lg transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default P2PChat;
