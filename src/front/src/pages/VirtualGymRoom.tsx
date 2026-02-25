import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Users, LogOut, Wifi, WifiOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../hooks/useToast";
import Layout from "../components/Layout";
import io, { Socket } from "socket.io-client";

interface RoomUser {
  id: string;
  username: string;
}

export default function VirtualGymRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const toast = useToast();
  const { user } = useAuth();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [usersInRoom, setUsersInRoom] = useState<RoomUser[]>([]);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  // Conectar al socket cuando monta el componente
  useEffect(() => {
    if (!roomId || !user) return;

    // Crear la conexión al servidor de WebSockets
    const apiUrl = import.meta.env.VITE_BACK_URL || 'http://localhost:3000';
    const newSocket = io(apiUrl, {
      path: "/socket.io/",
      transports: ["websocket", "polling"],
      auth: {
        token: localStorage.getItem("token"),
      },
      query: {
        roomId,
      },
    });

    // Evento: conexión establecida
    newSocket.on("connect", () => {
      console.log("✅ Conectado al servidor WebSocket");
      setIsConnected(true);
      setIsConnecting(false);

      // Emitir evento para unirse a la sala
      newSocket.emit("joinRoom", {
        roomId: roomId,
        userId: user.id,
        username: user.username,
      });

      toast.success(t("virtualGym.connectedToRoom") || "Connected to virtual gym");
    });

    // Evento: actualización de usuarios en la sala
    newSocket.on("roomUsersUpdate", (data: { usersInRoom: RoomUser[] }) => {
      console.log("👥 Usuarios en la sala actualizado:", data.usersInRoom);
      setUsersInRoom(data.usersInRoom);
    });

    // Evento: error
    newSocket.on("error", (error: any) => {
      console.error("❌ Error WebSocket:", error);
      toast.error(t("virtualGym.connectionError") || "Connection error");
    });

    // Evento: desconexión
    newSocket.on("disconnect", () => {
      console.log("❌ Desconectado del servidor");
      setIsConnected(false);
    });

    setSocket(newSocket);

    // Limpiar al desmontar
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [roomId, user, t, toast]);

  // Salir de la sala
  const handleLeaveRoom = () => {
    if (socket) {
      socket.emit("leaveRoom", {
        roomId: roomId,
        userId: user?.id,
      });
      socket.disconnect();
    }
    navigate("/client-home");
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-950 to-black p-4 md:p-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-500/10 rounded-lg">
                <Users className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white">
                  {t("virtualGym.title") || "Gimnàs Virtual - Sessiò en directe"}
                </h1>
                <p className="text-gray-400 mt-1">
                  {t("virtualGym.subtitle") || "Entrena en companyia"}
                </p>
              </div>
            </div>

            {/* Status indicator */}
            <div className="flex items-center gap-2">
              {isConnected ? (
                <>
                  <Wifi className="w-5 h-5 text-green-400 animate-pulse" />
                  <span className="text-green-400 font-medium text-sm">
                    {t("virtualGym.connected") || "Connectat"}
                  </span>
                </>
              ) : (
                <>
                  <WifiOff className="w-5 h-5 text-red-400" />
                  <span className="text-red-400 font-medium text-sm">
                    {t("virtualGym.disconnected") || "Desconnectat"}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Room info */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <p className="text-sm text-gray-400">
              {t("virtualGym.roomCode") || "Codi de sala"}:{" "}
              <span className="font-mono text-white">{roomId}</span>
            </p>
          </div>
        </div>

        {/* Main content: Users in room */}
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">
              {t("virtualGym.usersOnline") || "Usuaris en línia"} ({usersInRoom.length})
            </h2>

            {isConnecting ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-orange-500/20 border-2 border-orange-500 border-t-orange-400 animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-400">{t("virtualGym.connecting") || "Connectant..."}</p>
                </div>
              </div>
            ) : usersInRoom.length === 0 ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-12 text-center">
                <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">{t("virtualGym.noUsers") || "Ningú en la sala"}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {usersInRoom.map((roomUser) => (
                  <div
                    key={roomUser.id}
                    className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-orange-500/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                          <Users className="w-6 h-6 text-orange-500" />
                        </div>
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-zinc-900"></div>
                      </div>
                      <div>
                        <p className="text-white font-semibold">{roomUser.username}</p>
                        <p className="text-xs text-green-400">
                          {t("virtualGym.online") || "En línia"}
                        </p>
                      </div>
                    </div>
                    <div className="h-24 bg-zinc-800/50 rounded-lg border border-zinc-700 flex items-center justify-center">
                      <p className="text-xs text-gray-500 text-center px-2">
                        {t("virtualGym.videoPlaceholder") || "Vídeo en directe"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer: Leave button */}
        <div className="fixed bottom-8 left-0 right-0 flex justify-center z-50">
          <button
            onClick={handleLeaveRoom}
            className="py-3 px-6 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all duration-200 flex items-center gap-2 shadow-lg"
          >
            <LogOut className="w-5 h-5" />
            <span>{t("virtualGym.leaveButton") || "Sortir de la sala"}</span>
          </button>
        </div>
      </div>
    </Layout>
  );
}
