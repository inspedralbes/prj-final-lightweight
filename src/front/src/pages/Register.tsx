import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import axios from 'axios';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'COACH' | 'CLIENT'>('COACH');

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', { username, password, role });
      window.alert('Registro exitoso. Redirigiendo a login.');
      navigate('/');
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        window.alert('El usuario ya existe. Elija otro nombre de usuario.');
        return;
      }
      console.error('Error durante registro:', error);
      window.alert('Ocurrió un error al registrar. Intente nuevamente.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold mb-6 text-center text-green-400">Crear Cuenta</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-2 text-sm font-medium">Tipo de Cuenta</label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setRole("COACH")}
                className={`flex-1 py-2 px-4 rounded transition-all border ${role === "COACH"
                  ? "bg-green-600 border-green-500 text-white font-bold"
                  : "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                  }`}
              >
                Coach
              </button>
              <button
                type="button"
                onClick={() => setRole("CLIENT")}
                className={`flex-1 py-2 px-4 rounded transition-all border ${role === "CLIENT"
                  ? "bg-green-600 border-green-500 text-white font-bold"
                  : "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                  }`}
              >
                Cliente
              </button>
            </div>
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium">Elige un Usuario</label>
            <input
              type="text"
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-green-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium">Contraseña</label>
            <input
              type="password"
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-green-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition duration-200"
          >
            Registrarse
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <p className="text-gray-400">
            ¿Ya tienes cuenta?{' '}
            <Link to="/" className="text-green-400 hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}