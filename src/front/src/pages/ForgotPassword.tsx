import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const [username, setUsername] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Recuperación solicitada para:', username);
    alert('Funcionalidad simulada: Se enviaría un correo.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center text-yellow-400">Recuperar Contraseña</h2>
        <p className="text-gray-400 text-sm mb-6 text-center">
          Introduce tu usuario y te ayudaremos (Simulado MVP).
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium">Usuario</label>
            <input
              type="text"
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-yellow-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded transition duration-200"
          >
            Enviar Solicitud
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <Link to="/" className="text-gray-400 hover:text-white">
            ← Volver al Login
          </Link>
        </div>
      </div>
    </div>
  );
}