import React, { useEffect, useRef, useState } from "react";
import { socket } from "@/features/workout/services/socket";
import { ArrowRight, X } from "@/shared/components/Icons";
import { chatService } from "@/features/chat/services/chatService";
import { useAuth } from "@/features/auth/context/AuthContext";

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

const P2PChat: React.FC<P2PChatProps> = ({
  roomId,
  onClose,
  title,
  otherUserId,
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  // starts in "connecting" while we wait for partner info; offline only if socket truly disconnects
  const [status, setStatus] = useState<"connected" | "connecting" | "offline">(
    "connecting",
  );
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

    return () => {
      socket.off("chat-partner-status", handleChatPartnerStatus);
      socket.off("chat-status", handleChatStatus);
      socket.off("p2p-message", handleP2PMessage);

      // Notificar que cerramos el chat
      socket.emit("close-chat", {
        userId: user.id,
        roomId,
        otherUserId,
      });
    };
  }, [roomId, otherUserId, user]);

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
    <div className="flex flex-col h-[400px] w-full bg-[#0a0a0a] rounded-lg border border-[#2a2a2a] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-[#2a2a2a] bg-[#1a1a1a]">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
          <span className="text-sm font-medium text-white">{title}</span>
          <span className="text-[10px] text-gray-500">{getStatusText()}</span>
        </div>
        <button
          onClick={() => {
            onClose();
          }}
          className="text-gray-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
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
  );
};

export default P2PChat;
