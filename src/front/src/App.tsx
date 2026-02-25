import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
  import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import ClientHome from "./pages/ClientHome";
import Session from "./pages/Session";
import ExercisesEdit from "./pages/ExercisesEdit";
import ClientInvitations from "./pages/ClientInvitations";
import Programs from "./pages/Programs";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";

const socket = io(import.meta.env.VITE_BACK_URL);

// Ruta raíz inteligente: redirige según rol o a /login
const RootRedirect = () => {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "COACH") return <Navigate to="/dashboard" replace />;
  return <Navigate to="/client-home" replace />;
};

function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    socket.on("connect", () => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));
    return () => {
      socket.off("connect");
      socket.off("disconnect");
    };
  }, []);

  return (
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
          path="/programs"
          element={
            <ProtectedRoute requiredRole="COACH">
              <Programs />
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

        {/* Ruta de debug WebSocket */}
        <Route
          path="/ws"
          element={
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white">
              <h1 className="text-4xl font-bold mb-8">Test de WebSockets 🔌</h1>
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
  );
}

export default App;
