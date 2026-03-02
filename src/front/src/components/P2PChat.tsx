import React, { useEffect, useRef, useState } from "react";
import { socket } from "../services/socket";
import { ArrowRight, X } from "./Icons";
import { useTranslation } from "react-i18next";
import { chatService } from "../services/chatService";
import { useAuth } from "../context/AuthContext";

interface Message {
  text: string;
  sender: "me" | "them";
  timestamp: Date;
}

interface P2PChatProps {
  roomId: string;
  onClose: () => void;
  title: string;
  isInitiator?: boolean;
  otherUserId?: number;
}

const P2PChat: React.FC<P2PChatProps> = ({
  roomId,
  onClose,
  title,
  isInitiator,
  otherUserId,
}) => {
  useTranslation();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [status, setStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("connecting");
  const [socketStatus, setSocketStatus] = useState(
    socket.connected ? "connected" : "disconnected",
  );
  const [sending, setSending] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToEnd = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToEnd();
  }, [messages]);

  useEffect(() => {
    const handleConnect = () => setSocketStatus("connected");
    const handleDisconnect = () => setSocketStatus("disconnected");
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    // Mensajes P2P recibidos por socket (fallback)
    const handleP2PMessage = (data: any) => {
      if (data && data.text) {
        setMessages((prev) => [
          ...prev,
          {
            text: data.text,
            sender: "them",
            timestamp: new Date(data.timestamp),
          },
        ]);
        // marcar en el servidor como leído si viene el ID
        if (data.messageId) {
          chatService
            .markAsRead([data.messageId])
            .catch((e) =>
              console.error("Error marking incoming message read:", e),
            );
        }
      }
    };
    socket.on("p2p-message", handleP2PMessage);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("p2p-message", handleP2PMessage);
    };
  }, []);

  // Cargar la conversación previa y marcar mensajes no leídos como leídos
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
    console.log(
      `[WebRTC] Setting up PC for room: ${roomId} (Initiator: ${isInitiator})`,
    );

    // Notificar al otro usuario que estamos en el chat
    socket.emit("chat-notification", {
      roomId,
      message: "Alguien ha abierto el chat contigo",
    });

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    pcRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("[WebRTC] Sending ICE candidate");
        socket.emit("ice-candidate", { roomId, candidate: event.candidate });
      }
    };

    const setupDataChannel = (channel: RTCDataChannel) => {
      console.log(`[WebRTC] DataChannel setup: ${channel.label}`);
      dcRef.current = channel;
      channel.onopen = () => {
        console.log("[WebRTC] DataChannel OPEN");
        setStatus("connected");
      };
      channel.onclose = () => {
        console.log("[WebRTC] DataChannel CLOSED");
        setStatus("disconnected");
      };
      channel.onmessage = (event) => {
        console.log("[WebRTC] Message received:", event.data);
        setMessages((prev) => [
          ...prev,
          { text: event.data, sender: "them", timestamp: new Date() },
        ]);
      };
    };

    if (isInitiator) {
      console.log("[WebRTC] Creating DataChannel as initiator");
      const dc = pc.createDataChannel("chat");
      setupDataChannel(dc);
    }

    socket.emit("join-room", roomId);

    // Indicar al servidor que este usuario tiene abierto este chat
    if (user && user.id) {
      socket.emit("open-chat", { userId: user.id, roomId });
    }
    const createOffer = async () => {
      console.log("[WebRTC] Creating offer...");
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("offer", { roomId, offer });
    };

    socket.on("current-peers", (data: { roomId: string; peers: string[] }) => {
      console.log("[WebRTC] current peers:", data.peers);
      if (isInitiator && data.peers.length > 0) {
        console.log(
          "[WebRTC] initiating handshake immediately based on existing peers",
        );
        createOffer();
      }
    });

    socket.on("user-joined", (data) => {
      console.log(
        `[WebRTC] Peer joined room: ${data.roomId} (Socket: ${data.socketId})`,
      );
      if (isInitiator) {
        console.log("[WebRTC] I am initiator, starting handshake...");
        createOffer();
      }
    });

    socket.on("offer", async (offer) => {
      console.log("[WebRTC] Offer received, setting remote description...");
      if (pc.signalingState !== "stable") {
        console.warn("[WebRTC] Signaling state not stable, ignoring offer");
        return;
      }
      await pc.setRemoteDescription(offer);
      console.log("[WebRTC] Creating answer...");
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer", { roomId, answer });
    });

    socket.on("answer", async (answer) => {
      console.log("[WebRTC] Answer received, setting remote description...");
      if (pc.signalingState === "stable") return;
      await pc.setRemoteDescription(answer);
    });

    socket.on("ice-candidate", async (candidate) => {
      console.log("[WebRTC] ICE candidate received");
      try {
        if (candidate) {
          await pc.addIceCandidate(candidate);
        }
      } catch (e) {
        console.error("[WebRTC] Error adding ICE candidate", e);
      }
    });

    pc.ondatachannel = (event) => {
      console.log("[WebRTC] DataChannel received");
      setupDataChannel(event.channel);
    };

    return () => {
      console.log("[WebRTC] Cleaning up...");
      // indicar al servidor que cerramos el chat
      if (user && user.id) {
        socket.emit("close-chat", { userId: user.id, roomId });
      }
      pc.close();
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
      socket.off("user-joined");
    };
  }, [roomId, isInitiator]);

  const sendMessage = async () => {
    if (!inputText.trim() || !user) return;

    const text = inputText.trim();
    setSending(true);

    try {
      // Guardar en backend y notificar siempre
      if (otherUserId) {
        await chatService.sendMessage(otherUserId, text);
        socket.emit("send-p2p-message", {
          senderId: user.id,
          receiverId: otherUserId,
          text: text,
        });
      }

      // Enviar por data channel si está abierto
      if (dcRef.current && dcRef.current.readyState === "open") {
        dcRef.current.send(text);
      }

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

  return (
    <div className="flex flex-col h-[400px] w-full bg-[#0a0a0a] rounded-lg border border-[#2a2a2a] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-[#2a2a2a] bg-[#1a1a1a]">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${status === "connected" ? "bg-green-500" : "bg-orange-500"}`}
            />
            <span className="text-sm font-medium text-white">{title}</span>
            <span className="text-[10px] text-gray-600 font-mono">
              ({roomId})
            </span>
          </div>
          <span className="text-[10px] text-gray-500">
            {status === "connected"
              ? "P2P Directo ✔"
              : `Signaling: ${socketStatus}`}
          </span>
        </div>
        <button
          onClick={() => {
            if (user && user.id)
              socket.emit("close-chat", { userId: user.id, roomId });
            onClose();
          }}
          className="text-gray-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {status !== "connected" && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
            <p className="text-gray-500 text-xs italic">
              {socketStatus === "connected"
                ? "Esperando al otro usuario..."
                : "Conectando al servidor..."}
            </p>
            {isInitiator && socketStatus === "connected" && (
              <button
                onClick={() => {
                  console.log("[WebRTC] Manual retry...");
                  socket.emit("join-room", roomId);
                  socket.emit("user-joined", { roomId });
                }}
                className="text-[10px] text-orange-500 underline"
              >
                Reintentar Handshake
              </button>
            )}
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
            placeholder="Type a message..."
            className="flex-1 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={!inputText.trim() || sending}
            className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-900 text-white p-2 rounded-lg transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        {status !== "connected" && socketStatus === "connected" && (
          <p className="text-xs text-orange-400 mt-2">
            📡 Usando fallback a servidor (P2P no disponible)
          </p>
        )}
      </div>
    </div>
  );
};

export default P2PChat;
