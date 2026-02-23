import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, ArrowRight } from '../components/Icons';
import { useTranslation } from 'react-i18next';
import { useToast } from '../hooks/useToast';
import { AuthPageHeader } from '../components/AuthPageHeader';

export default function ForgotPassword() {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { t } = useTranslation();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Simular envío de email
      toast.success(t('messages.success'), 'Correo de recuperación enviado');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      toast.error(t('messages.errorOccurred'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-zinc-950 dark:bg-white text-white dark:text-black">
      {/* Columna Izquierda - Decorativa */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col items-center justify-center bg-black dark:hidden">
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
            Recupera l'accés a la teva conta i continua el teu entrenament.
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
            <h2 className="text-4xl font-bold mb-2 text-white">{t('auth.forgotPassword')}</h2>
            <p className="text-gray-400">Introdueix el teu usuari i et serà enviat un correu de recuperació.</p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Input - Nom d'usuari */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">{t('auth.email')}</label>
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

            {/* Botón Principal */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-700 text-black font-bold rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
            >
              {isLoading ? t('common.loading') : 'Enviar Solicitud'}
              {!isLoading && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>

          {/* Pie del formulario */}
          <p className="mt-6 text-center text-gray-400 text-sm">
            {t('auth.noAccount')}{' '}
            <Link to="/login" className="text-orange-500 hover:text-orange-400 font-semibold transition-colors">
              {t('auth.loginButton')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}