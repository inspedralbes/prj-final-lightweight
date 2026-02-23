import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, ArrowRight } from '../components/Icons';
import api from '../utils/api';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useToast } from '../hooks/useToast';
import { LoadingScreen } from '../components/LoadingScreen';
import { AuthPageHeader } from '../components/AuthPageHeader';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useTranslation();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', { username, password });
      const token = res.data?.access_token;
      const user = res.data?.user;

      if (token && user) {
        login({ id: user.id, username: user.username, role: user.role, token });
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        toast.success(t('messages.loginSuccess'));

        // Mostrar loading screen por 5 segundos
        setShowLoadingScreen(true);
        
        setTimeout(() => {
          if (user.role === 'COACH') {
            navigate('/dashboard');
          } else {
            navigate('/client-home');
          }
        }, 5000);
      } else {
        toast.error(t('messages.errorOccurred'), t('messages.invalidInput'));
        setIsLoading(false);
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast.error(t('auth.invalidCredentials'));
      } else {
        console.error('Error during login:', error);
        toast.error(t('messages.errorOccurred'));
      }
      setIsLoading(false);
    }
  };

  return (
    <>
      <LoadingScreen isVisible={showLoadingScreen} message={t('common.loading')} />
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
          <div className="mt-8">
            <AuthPageHeader />
          </div>
        </div>
      </div>

      {/* Columna Derecha - Formulario */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-black">
        <div className="w-full max-w-md">
          {/* Títulos */}
          <div className="mb-8">
            <h2 className="text-4xl font-bold mb-2 text-white">{t('auth.login')}</h2>
            <p className="text-gray-400">{t('auth.loginButton')} a LightWeight</p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Input - Nom d'usuari */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('common.save').toUpperCase()}</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t('auth.email')}
                  className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                  required
                />
              </div>
            </div>

            {/* Input - Contrasenya */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-gray-300">{t('auth.password')}</label>
                <Link to="/forgot-password" className="text-xs text-orange-500 hover:text-orange-400 transition-colors">
                  {t('auth.forgotPassword')}
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.password')}
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

            {/* Botón Principal */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-700 text-black font-bold rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
            >
              {isLoading ? t('common.loading') : t('auth.loginButton')}
              {!isLoading && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>

          {/* Pie del formulario */}
          <p className="mt-6 text-center text-gray-400 text-sm">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="text-orange-500 hover:text-orange-400 font-semibold transition-colors">
              {t('auth.registerButton')}
            </Link>
          </p>
        </div>
      </div>
    </div>
    </>
  );
}