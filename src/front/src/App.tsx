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
import RoutineCreate from "./pages/RoutineCreate";
import RoutineEdit from "./pages/RoutineEdit";
import ProtectedRoute from "./components/ProtectedRoute";

// Conectamos al backend en el puerto 3000
const socket = io(import.meta.env.VITE_BACK_URL);

function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    // 1. Escuchar evento de conexión
    socket.on("connect", () => {
      console.log("✅ Conectado al servidor con ID:", socket.id);
      setIsConnected(true);
    });

    // 2. Escuchar evento de desconexión
    socket.on("disconnect", () => {
      console.log("❌ Desconectado del servidor");
      setIsConnected(false);
    });

    // Limpieza al cerrar
    return () => {
      socket.off("connect");
      socket.off("disconnect");
    };
  }, []);

  const WebsocketTest = (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white font-sans">
      <h1 className="text-4xl font-bold mb-8">Test de WebSockets 🔌</h1>

      <div
        className={`p-6 rounded-xl text-2xl font-semibold transition-colors duration-500 ${isConnected
          ? "bg-green-600 shadow-[0_0_20px_rgba(22,163,74,0.5)]"
          : "bg-red-600 shadow-[0_0_20px_rgba(220,38,38,0.5)]"
          }`}
      >
        {isConnected ? "ESTADO: CONECTADO 🟢" : "ESTADO: DESCONECTADO 🔴"}
      </div>

      <p className="mt-8 text-gray-400">
        Mira la terminal de tu Backend para ver el mensaje de conexión.
      </p>
    </div>
  );


  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/client-home" element={<ClientHome />} />
        {/* Ruta pública para sesiones */}
        <Route path="/session/:code" element={<Session />} />
        {/* Rutas protegidas */}
        <Route
          path="/home"
          element={
            <ProtectedRoute requiredRole="COACH">
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requiredRole="COACH">
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/routine/create"
          element={
            <ProtectedRoute requiredRole="COACH">
              <RoutineCreate />
            </ProtectedRoute>
          }
        />
        <Route
          path="/routine/:id/edit"
          element={
            <ProtectedRoute requiredRole="COACH">
              <RoutineEdit />
            </ProtectedRoute>
          }
        />
        <Route path="/ws" element={WebsocketTest} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

