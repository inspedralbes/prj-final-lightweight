import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import ClientHome from "./pages/ClientHome";
import Clients from "./pages/Clients";
import Session from "./pages/Session";
import ExercisesEdit from "./pages/ExercisesEdit";
import ClientInvitations from "./pages/ClientInvitations";
import Programs from "./pages/Programs";
import VirtualGymRoom from "./pages/VirtualGymRoom";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import { useNotification } from "./context/NotificationContext";
import NotificationCenter from "./components/NotificationCenter";

import { socket } from "./services/socket";
import { chatService } from "./services/chatService";
import type { P2PMessage } from "./services/chatService";

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
  const { addNotification } = useNotification();
  const { user } = useAuth();

  const handleNotificationChatClick = (roomId: string) => {
    console.log("[Notification] Opening chat for room:", roomId);
    // El evento será manejado por las páginas que tengan el chat abierto
    // Se puede expandir para abrir el chat automáticamente usando un evento global
    window.dispatchEvent(new CustomEvent("openChat", { detail: { roomId } }));
  };

  useEffect(() => {
    socket.on("connect", () => {
      setIsConnected(true);
      if (user) {
        console.log("[Socket] connected - emitting register-user for", user.id);
        socket.emit("register-user", user.id);
      }
    });
    socket.on("disconnect", () => setIsConnected(false));

    // Escuchar notificaciones de chat P2P con preview de mensaje
    socket.on("p2p-message-notification", (data: any) => {
      console.log("[P2P Message Notification]", data);
      const preview =
        data.text.length > 50 ? data.text.substring(0, 50) + "..." : data.text;
      const senderName = data.fromUsername || data.from || "Alguien";
      // roomId debe ser chat_client_{clientId}. Si soy CLIENT, mi clientId es user.id.
      // Si soy COACH, el clientId viene en data.from (el remitente es el cliente).
      const roomId =
        user?.role === "CLIENT"
          ? `chat_client_${user.id}`
          : `chat_client_${data.from}`;
      addNotification(
        roomId,
        `${senderName} te ha enviado: ${preview}`,
        senderName,
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
          msgs.forEach((m) => {
            const preview =
              m.text.length > 50 ? m.text.substring(0, 50) + "..." : m.text;
            const senderName = m.sender?.username || `Usuario ${m.senderId}`;
            const roomId =
              user?.role === "CLIENT"
                ? `chat_client_${user.id}`
                : `chat_client_${m.senderId}`;
            addNotification(
              roomId,
              `${senderName} te ha enviado: ${preview}`,
              senderName,
            );
          });
        })
        .catch((err) => {
          console.error("Error fetching unread messages:", err);
        });
    }

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("p2p-message-notification");
    };
  }, [addNotification, user]);

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
          <Route path="/session/:code" element={<Session />} />

          {/* Rutas protegidas para COACH */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requiredRole="COACH">
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients"
            element={
              <ProtectedRoute requiredRole="COACH">
                <Clients />
              </ProtectedRoute>
            }
          />
          <Route
            path="/home"
            element={
              <ProtectedRoute requiredRole="COACH">
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/routine/:id/edit"
            element={
              <ProtectedRoute requiredRole="COACH">
                <ExercisesEdit />
              </ProtectedRoute>
            }
          />

          {/* Rutas protegidas para CLIENT */}
          <Route
            path="/client-home"
            element={
              <ProtectedRoute requiredRole="CLIENT">
                <ClientHome />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients/invitations"
            element={
              <ProtectedRoute requiredRole="CLIENT">
                <ClientInvitations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/room/:roomId"
            element={
              <ProtectedRoute requiredRole="CLIENT">
                <VirtualGymRoom />
              </ProtectedRoute>
            }
          />
          <Route
            path="/programs"
            element={
              <ProtectedRoute requiredRole="COACH">
                <Programs />
              </ProtectedRoute>
            }
          />

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
        </Routes>
      </BrowserRouter>

      {/* Notification Center */}
      <NotificationCenter onChatClick={handleNotificationChatClick} />
    </>
  );
};

export default AppContent;
