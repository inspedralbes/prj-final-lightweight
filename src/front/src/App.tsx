import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

// Conectamos al backend en el puerto 3000
const socket = io('http://localhost:3000');

function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    // 1. Escuchar evento de conexión
    socket.on('connect', () => {
      console.log('✅ Conectado al servidor con ID:', socket.id);
      setIsConnected(true);
    });

    // 2. Escuchar evento de desconexión
    socket.on('disconnect', () => {
      console.log('❌ Desconectado del servidor');
      setIsConnected(false);
    });

    // Limpieza al cerrar
    return () => {
      socket.off('connect');
      socket.off('disconnect');
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white font-sans">
      <h1 className="text-4xl font-bold mb-8">Test de WebSockets 🔌</h1>
      
      <div className={`p-6 rounded-xl text-2xl font-semibold transition-colors duration-500 ${
        isConnected ? 'bg-green-600 shadow-[0_0_20px_rgba(22,163,74,0.5)]' : 'bg-red-600 shadow-[0_0_20px_rgba(220,38,38,0.5)]'
      }`}>
        {isConnected ? 'ESTADO: CONECTADO 🟢' : 'ESTADO: DESCONECTADO 🔴'}
      </div>

      <p className="mt-8 text-gray-400">
        Mira la terminal de tu Backend para ver el mensaje de conexión.
      </p>
    </div>
  );
}

export default App;