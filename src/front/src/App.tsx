import { useCallback, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Login from "@/features/auth/pages/Login";
import Register from "@/features/auth/pages/Register";
import ForgotPassword from "@/features/auth/pages/ForgotPassword";
import ResetPassword from "@/features/auth/pages/ResetPassword";
import CoachDashboard from "@/features/coach/pages/CoachDashboard";
import ClientDashboard from "@/features/client/pages/ClientDashboard";
import CoachClientList from "@/features/coach/pages/CoachClientList";
import ClientsProgressPage from "@/features/coach/pages/ClientsProgressPage";
import ClientProgressDetailPage from "@/features/coach/pages/ClientProgressDetailPage";
import RoutineExercisesEdit from "@/features/routines/pages/RoutineExercisesEdit";
import CoopSessionLobby from "@/features/workout/pages/CoopSessionLobby";
import SoloWorkoutSession from "@/features/workout/pages/SoloWorkoutSession";
import ClientMyCoach from "@/features/client/pages/ClientMyCoach";
import ClientHistoryStats from "@/features/client/pages/ClientHistoryStats";
import WorkoutRoom from "@/features/workout/pages/WorkoutRoom";
import ProtectedRoute from "@/features/auth/components/ProtectedRoute";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useNotification } from "@/features/notifications/context/NotificationContext";
import NotificationCenter from "@/features/notifications/components/NotificationCenter";
import FriendInviteNotificationCenter from "@/features/notifications/components/FriendInviteNotificationCenter";
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

// Componente que contiene las rutas y puede usar useNavigate
const AppRoutes = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Socket event listener that needs navigation
    socket.on("friend-invite:accepted", (payload: any) => {
      console.log("[Friend Invite Accepted]", payload);
      // Navigate to the room when invitation is accepted
      if (payload.roomId) {
        navigate(`/room/${payload.roomId}`, {
          state: { isHost: payload.isHost ?? true },
        });
      }
    });

    return () => {
      socket.off("friend-invite:accepted");
    };
  }, [navigate]);

  return (
    <Routes>
      {/* Ruta raíz con redirección inteligente por rol */}
      <Route path="/" element={<RootRedirect />} />

      {/* Rutas públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

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
        path="/clients/progress"
        element={
          <ProtectedRoute requiredRole="COACH">
            <ClientsProgressPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/clients/progress/:clientId"
        element={
          <ProtectedRoute requiredRole="COACH">
            <ClientProgressDetailPage />
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
        path="/client/history"
        element={
          <ProtectedRoute requiredRole="CLIENT">
            <ClientHistoryStats />
          </ProtectedRoute>
        }
      />
      <Route
        path="/workout/:id"
        element={
          <ProtectedRoute requiredRole="CLIENT">
            <SoloWorkoutSession />
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
          <ProtectedRoute>
            <WorkoutRoom />
          </ProtectedRoute>
        }
      />
      {/* /programs removed — unused placeholder page deleted */}
    </Routes>
  );
};

// Componente wrapper que escucha las notificaciones del socket
const AppContent = () => {
  const { addNotification, addFriendInviteNotification, clearAll } = useNotification();
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(socket.connected);
  const { addNotification, clearAll } = useNotification();
  const { user, logout } = useAuth();
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

  const ClientSideNotificationCenter = () => {
    const navigate = useNavigate();

    const handleNotificationChatClick = useCallback(
      (roomId: string) => {
        console.log("[Notification] Opening chat for room:", roomId);

        if (user?.role === "CLIENT") {
          navigate("/client-home");
        } else if (user?.role === "COACH") {
          navigate("/clients");
        }

        window.setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent("openChat", { detail: { roomId } }),
          );
        }, 0);
      },
      [navigate, user],
    );

    return (
      <NotificationCenter
        onChatClick={handleNotificationChatClick}
        position={user?.role === "CLIENT" ? "top-right" : "bottom-right"}
      />
    );
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
      if (user) {
        console.log("[Socket] connected - emitting register-user for", user.id);
        socket.emit("register-user", user.id);
      }
    });

    // Session expired on another device: backend cleared activeSessionToken
    // after the grace period. Clear local state and redirect to /login.
    socket.on("session-invalidated", () => {
      console.log("[Auth] session-invalidated received — logging out");
      localStorage.removeItem("token");
      localStorage.removeItem("userRole");
      localStorage.removeItem("username");
      localStorage.removeItem("userId");
      localStorage.removeItem("coachId");
      void logout();
    });

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
    socket.on("p2p-message-notification", (data: { text: string; fromUsername?: string; from?: string }) => {
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

    socket.on("friend-invite:notify", (payload: any) => {
      console.log("[Friend Invite Notify] Received payload:", payload);
      window.dispatchEvent(
        new CustomEvent("friend-invite:notify", { detail: payload }),
      );
      if (payload.invitation?.inviter?.username && payload.invitation?.id) {
        const inviterName = payload.invitation.inviter.username;
        const inviterId = payload.invitation.inviter.id;
        const friendInvitationId = payload.invitation.id;
        addFriendInviteNotification(inviterId, inviterName, friendInvitationId);
      }
    });

    socket.on("friend-invite:rejected", (payload: any) => {
      console.log("[Friend Invite Rejected] Received payload:", payload);
      const inviteeName = payload?.invitation?.invitee?.username;
      window.dispatchEvent(
        new CustomEvent("friend-invite:rejected", { detail: payload }),
      );
      if (inviteeName) {
        // Toast shown globally (visible even outside /friend-session)
        // The CoopSessionLobby also handles this to update its local state
      }
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
      socket.off("session-invalidated");
      socket.off("p2p-message-notification");
      socket.off("friend-invite:notify");
      socket.off("friend-invite:rejected");
      socket.off("video-call-invite");
      socket.off("video-call-end");
    };
  }, [addNotification, user, logout]);

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
          <Route path="/reset-password" element={<ResetPassword />} />

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
            path="/clients/progress"
            element={
              <ProtectedRoute requiredRole="COACH">
                <ClientsProgressPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients/progress/:clientId"
            element={
              <ProtectedRoute requiredRole="COACH">
                <ClientProgressDetailPage />
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
            path="/client/history"
            element={
              <ProtectedRoute requiredRole="CLIENT">
                <ClientHistoryStats />
              </ProtectedRoute>
            }
          />
          <Route
            path="/friend-session"
            element={
              <ProtectedRoute>
                <CoopSessionLobby />
              </ProtectedRoute>
            }
          />
          <Route
            path="/room/:roomId"
            element={
              <ProtectedRoute>
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
        <ClientSideNotificationCenter />
      </BrowserRouter>

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
