import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Login from "@/features/auth/pages/Login";
import Register from "@/features/auth/pages/Register";
import ForgotPassword from "@/features/auth/pages/ForgotPassword";
import CoachDashboard from "@/features/coach/pages/CoachDashboard";
import ClientDashboard from "@/features/client/pages/ClientDashboard";
import CoachClientList from "@/features/coach/pages/CoachClientList";
import RoutineExercisesEdit from "@/features/routines/pages/RoutineExercisesEdit";
import CoopSessionLobby from "@/features/workout/pages/CoopSessionLobby";
import ClientMyCoach from "@/features/client/pages/ClientMyCoach";
import WorkoutRoom from "@/features/workout/pages/WorkoutRoom";
import SoloWorkoutSession from "@/features/workout/pages/SoloWorkoutSession";
import ProtectedRoute from "@/features/auth/components/ProtectedRoute";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useNotification } from "@/features/notifications/context/NotificationContext";
import NotificationCenter from "@/features/notifications/components/NotificationCenter";
import VideoCallModal from "@/features/chat/components/VideoCallModal";
import { VideoCamera } from "@/shared/components/Icons";
import { useRingtone } from "@/shared/hooks/useRingtone";

import { socket } from "@/features/workout/services/socket";
import { chatService } from "@/features/chat/services/chatService";
import type { P2PMessage } from "@/features/chat/services/chatService";

// Ruta raíz inteligente: redirige según rol o a /login
const RootRedirect = () => {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "COACH") return <Navigate to="/dashboard" replace />;
  return <Navigate to="/client-home" replace />;
};

// Componente wrapper que escucha las notificaciones del socket
const AppContent = () => {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const { addNotification, clearAll } = useNotification();
  const { user } = useAuth();
  const { t } = useTranslation();
  const ringtone = useRingtone();

  // ── Global incoming-call state ────────────────────────────────────────────
  type IncomingCall = {
    callerId: number;
    callerName: string;
    callRoomId: string;
  };
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [calleeActiveCall, setCalleeActiveCall] = useState<{
    callRoomId: string;
    callerId: number;
  } | null>(null);

  // Play / stop ringtone based on incoming call state
  useEffect(() => {
    if (incomingCall) ringtone.play();
    else ringtone.stop();
  }, [incomingCall]); // eslint-disable-line react-hooks/exhaustive-deps

  const acceptIncomingCall = () => {
    if (!incomingCall || !user) return;
    socket.emit("video-call-accept", {
      callerId: incomingCall.callerId,
      calleeId: user.id,
      roomId: incomingCall.callRoomId,
    });
    setCalleeActiveCall({
      callRoomId: incomingCall.callRoomId,
      callerId: incomingCall.callerId,
    });
    setIncomingCall(null);
  };

  const rejectIncomingCall = () => {
    if (!incomingCall || !user) return;
    socket.emit("video-call-reject", {
      callerId: incomingCall.callerId,
      calleeId: user.id,
    });
    setIncomingCall(null);
  };

  const handleCalleeCallEnd = () => setCalleeActiveCall(null);

  const handleNotificationChatClick = (roomId: string) => {
    console.log("[Notification] Opening chat for room:", roomId);
    // El evento será manejado por las páginas que tengan el chat abierto
    // Se puede expandir para abrir el chat automáticamente usando un evento global
    window.dispatchEvent(new CustomEvent("openChat", { detail: { roomId } }));
  };

  useEffect(() => {
    // Reconnect socket when a user session is present (e.g. after logout+login).
    // On first load the socket auto-connects; on subsequent logins it may be disconnected.
    if (user && !socket.connected) {
      socket.connect();
    }
  }, [user]);

  useEffect(() => {
    socket.on("connect", () => {
      setIsConnected(true);
      if (user) {
        console.log("[Socket] connected - emitting register-user for", user.id);
        socket.emit("register-user", user.id);
      }
    });
    socket.on("disconnect", () => setIsConnected(false));

    // ── Global video-call-invite listener (always alive) ─────────────────
    socket.on(
      "video-call-invite",
      (payload: {
        callerId: number;
        calleeId: number;
        callerName: string;
        roomId: string;
      }) => {
        if (!user || Number(payload.calleeId) !== Number(user.id)) return;
        console.log(
          "[VideoCall] Global incoming call from",
          payload.callerName,
        );
        setIncomingCall({
          callerId: payload.callerId,
          callerName: payload.callerName,
          callRoomId: payload.roomId,
        });
      },
    );

    // Dismiss incoming popup if caller cancelled before we answered
    socket.on(
      "video-call-end",
      (payload: { fromUserId: number; toUserId: number }) => {
        if (!user || Number(payload.toUserId) !== Number(user.id)) return;
        setIncomingCall((prev) => {
          if (prev && Number(prev.callerId) === Number(payload.fromUserId)) {
            console.log(
              "[VideoCall] Caller cancelled — dismissing incoming popup",
            );
            return null;
          }
          return prev;
        });
      },
    );

    // Escuchar notificaciones de chat P2P con preview de mensaje
    socket.on("p2p-message-notification", (data: any) => {
      console.log("[P2P Message Notification]", data);
      const preview =
        data.text.length > 50 ? data.text.substring(0, 50) + "..." : data.text;
      const senderName = data.fromUsername || data.from || "Alguien";
      const roomId =
        user?.role === "CLIENT"
          ? `chat_client_${user.id}`
          : `chat_client_${data.from}`;
      // isLive=true: real-time message — un-dismiss if room was previously dismissed
      addNotification(
        roomId,
        `${senderName} te ha enviado: ${preview}`,
        senderName,
        true,
      );
    });

    // Registrar el usuario con su ID (también emitir cuando cambie user)
    if (user) {
      console.log("[Socket] emitting register-user for", user.id);
      socket.emit("register-user", user.id);

      // Al conectarse o recargar, pedir mensajes no leídos para generar notificaciones
      chatService
        .getUnreadMessages()
        .then((msgs: P2PMessage[]) => {
          // Group by room so we call addNotification ONCE per room with the real count.
          // Calling it once per message would accumulate count on every reconnect/navigation.
          type RoomEntry = { count: number; latestMsg: P2PMessage };
          const byRoom: Record<string, RoomEntry> = {};
          msgs.forEach((m) => {
            const roomId =
              user?.role === "CLIENT"
                ? `chat_client_${user.id}`
                : `chat_client_${m.senderId}`;
            if (!byRoom[roomId]) {
              byRoom[roomId] = { count: 0, latestMsg: m };
            }
            byRoom[roomId].count++;
            byRoom[roomId].latestMsg = m; // keep the latest preview
          });
          Object.entries(byRoom).forEach(([roomId, { count, latestMsg }]) => {
            const preview =
              latestMsg.text.length > 50
                ? latestMsg.text.substring(0, 50) + "..."
                : latestMsg.text;
            const senderName =
              latestMsg.sender?.username || `Usuario ${latestMsg.senderId}`;
            // isLive=false: don't un-dismiss; initialCount=count: real DB unread total
            addNotification(
              roomId,
              `${senderName} te ha enviado: ${preview}`,
              senderName,
              false,
              count,
            );
          });
        })
        .catch((err) => {
          console.error("Error fetching unread messages:", err);
        });
    }

    // Escuchar invitaciones de coach en tiempo real (solo para CLIENTs)
    // Las invitaciones ahora se gestionan directamente en /clients/invitations

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("p2p-message-notification");
      socket.off("video-call-invite");
      socket.off("video-call-end");
    };
  }, [addNotification, user]);

  // Limpiar notificaciones al cerrar sesión
  useEffect(() => {
    if (!user) {
      clearAll();
    }
  }, [user, clearAll]);

  return (
    <>
      <BrowserRouter>
        <Routes>
          {/* Ruta raíz con redirección inteligente por rol */}
          <Route path="/" element={<RootRedirect />} />

          {/* Rutas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Rutas protegidas para COACH */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requiredRole="COACH">
                <CoachDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients"
            element={
              <ProtectedRoute requiredRole="COACH">
                <CoachClientList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/routine/:id/edit"
            element={
              <ProtectedRoute>
                <RoutineExercisesEdit />
              </ProtectedRoute>
            }
          />

          {/* Rutas protegidas para CLIENT */}
          <Route
            path="/client-home"
            element={
              <ProtectedRoute requiredRole="CLIENT">
                <ClientDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients/invitations"
            element={
              <ProtectedRoute requiredRole="CLIENT">
                <ClientMyCoach />
              </ProtectedRoute>
            }
          />
          <Route
            path="/friend-session"
            element={
              <ProtectedRoute requiredRole="CLIENT">
                <CoopSessionLobby />
              </ProtectedRoute>
            }
          />
          <Route
            path="/room/:roomId"
            element={
              <ProtectedRoute requiredRole="CLIENT">
                <WorkoutRoom />
              </ProtectedRoute>
            }
          />
          {/* /programs removed — unused placeholder page deleted */}

          {/* Ruta de debug WebSocket */}
          <Route
            path="/ws"
            element={
              <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white">
                <h1 className="text-4xl font-bold mb-8">
                  Test de WebSockets 🔌
                </h1>
                <div
                  className={`p-6 rounded-xl text-2xl font-semibold ${isConnected ? "bg-green-600" : "bg-red-600"}`}
                >
                  {isConnected
                    ? "ESTADO: CONECTADO 🟢"
                    : "ESTADO: DESCONECTADO 🔴"}
                </div>
              </div>
            }
          />
          <Route
            path="/workout/:id"
            element={
              <ProtectedRoute>
                <SoloWorkoutSession />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>

      {/* Notification Center */}
      <NotificationCenter
        onChatClick={handleNotificationChatClick}
        position={user?.role === "CLIENT" ? "top-right" : "bottom-right"}
      />

      {/* ── Global incoming video call popup ──────────────────────────────── */}
      {incomingCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-8 flex flex-col items-center gap-5 shadow-2xl mx-4 max-w-xs w-full">
            <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center">
              <VideoCamera className="w-8 h-8 text-orange-500 animate-pulse" />
            </div>
            <div className="text-center">
              <p className="text-white font-semibold text-lg">
                {incomingCall.callerName}
              </p>
              <p className="text-gray-400 text-sm">
                {t("videoCall.incomingCall", { name: incomingCall.callerName })}
              </p>
            </div>
            <div className="flex gap-3 w-full">
              <button
                onClick={rejectIncomingCall}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-colors"
              >
                {t("videoCall.reject")}
              </button>
              <button
                onClick={acceptIncomingCall}
                className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium transition-colors"
              >
                {t("videoCall.accept")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── VideoCallModal for callee after accepting ─────────────────────── */}
      {calleeActiveCall && (
        <VideoCallModal
          roomId={calleeActiveCall.callRoomId}
          isInitiator={false}
          otherUserId={calleeActiveCall.callerId}
          onEnd={handleCalleeCallEnd}
        />
      )}
    </>
  );
};

export default AppContent;
