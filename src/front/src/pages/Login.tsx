import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // try {
    //   const res = 
  
  };


  return (
    // CAMBIO AQUÍ: w-full y h-screen para ocupar todo
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-900 text-white">
      
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold mb-6 text-center text-blue-400">Iniciar Sesión</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium">Usuario</label>
            <input
              type="text"
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Tu usuario"
            />
          </div>
          
          <div>
            <label className="block mb-1 text-sm font-medium">Contraseña</label>
            <input
              type="password"
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-200 cursor-pointer"
          >
            Entrar
          </button>
        </form>

        <div className="mt-6 text-center text-sm space-y-2">
          <p>
            <Link to="/forgot-password" className="text-blue-400 hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </p>
          <p className="text-gray-400">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-blue-400 hover:underline">
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}