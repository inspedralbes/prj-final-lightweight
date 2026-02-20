import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, ArrowRight } from '../components/Icons';
import api from '../utils/api';
import axios from 'axios';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [role, setRole] = useState<'CLIENT' | 'COACH'>('CLIENT');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', { username, password, role });
      const token = res.data?.access_token;
      const user = res.data?.user;
      if (token) {
        localStorage.setItem('token', token);
        if (user) {
          localStorage.setItem('username', user.username);
          localStorage.setItem('userRole', user.role);
          localStorage.setItem('userId', user.id);
        }
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        if (rememberMe) {
          localStorage.setItem('rememberedUsername', username);
        }
        
        if (user.role === 'COACH') {
          navigate('/dashboard');
        } else {
          navigate('/client-home');
        }
      } else {
        window.alert('Resposta inesperada del servidor.');
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        window.alert('Credencials invàlides. Verifica l\'usuari i la contrasenya.');
        return;
      }
      console.error('Error durant inici de sessió:', error);
      window.alert('Va ocórrer un error al iniciar sessió. Prova de nou.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-zinc-950 text-white">
      {/* Columna Izquierda - Decorativa */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col items-center justify-center">
        <div
          className="absolute inset-0 bg-gradient-to-br from-orange-900/40 via-black/60 to-black/80 z-10"
          style={{
            backgroundImage:
              'url(\'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800"%3E%3Crect fill="%23000" width="1200" height="800"/%3E%3Cg fill="%23111" opacity="0.3"%3E%3Ccircle cx="400" cy="300" r="150"/%3E%3Ccircle cx="800" cy="500" r="200"/%3E%3C/g%3E%3C/svg%3E\')',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="relative z-20 text-center px-8">
          <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-orange-400 to-orange-600 mb-4">
            SUPERA<br />ELS TEUS<br />LÍMITS
          </h1>
          <p className="text-gray-300 text-lg mt-6 max-w-sm">
            Entrena amb els millors coaches i assoleix els teus objectius de fitness.
          </p>
        </div>
      </div>

      {/* Columna Derecha - Formulario */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-black">
        <div className="w-full max-w-md">
          {/* Títulos */}
          <div className="mb-8">
            <h2 className="text-4xl font-bold mb-2">Inicia Sessió</h2>
            <p className="text-gray-400">Accedeix a LightWeight i comença el teu entrenament.</p>
          </div>

          {/* Selector de Rol */}
          <div className="mb-8 flex gap-3">
            <button
              onClick={() => setRole('CLIENT')}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                role === 'CLIENT'
                  ? 'bg-orange-500 text-black'
                  : 'bg-zinc-900 text-gray-300 hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              Client
            </button>
            <button
              onClick={() => setRole('COACH')}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                role === 'COACH'
                  ? 'bg-orange-500 text-black'
                  : 'bg-zinc-900 text-gray-300 hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              Entrenador
            </button>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Input - Nom d'usuari */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">NOM D&apos;USUARI</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Introdueix el teu nom d'usuari"
                  className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                  required
                />
              </div>
            </div>

            {/* Input - Contrasenya */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-gray-300">CONTRASENYA</label>
                <Link to="/forgot-password" className="text-xs text-orange-500 hover:text-orange-400 transition-colors">
                  Has oblidat la contrasenya?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Introdueix la teva contrasenya"
                  className="w-full pl-10 pr-10 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Checkbox - Recorda'm */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 bg-zinc-900 border border-zinc-800 rounded cursor-pointer accent-orange-500"
              />
              <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-400 cursor-pointer hover:text-gray-300 transition-colors">
                Recorda'm
              </label>
            </div>

            {/* Botón Principal */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-700 text-black font-bold rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Carregant...' : 'INICIAR SESSIÓ'}
              {!isLoading && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>

          {/* Pie del formulario */}
          <p className="mt-6 text-center text-gray-400 text-sm">
            No tens compte?{' '}
            <Link to="/register" className="text-orange-500 hover:text-orange-400 font-semibold transition-colors">
              Registra't
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}