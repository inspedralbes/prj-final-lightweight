import { useEffect } from 'react';

interface LoadingScreenProps {
  isVisible: boolean;
  message?: string;
}

export const LoadingScreen = ({ isVisible, message = 'Iniciando sesión...' }: LoadingScreenProps) => {
  useEffect(() => {
    if (!isVisible) return;

    const timer = setTimeout(() => {
      // Auto hide after 3 seconds
    }, 3000);

    return () => clearTimeout(timer);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center">
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spinner-loading {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
      <div className="text-center space-y-6">
        {/* Spinner - Una sola animación */}
        <div className="flex justify-center">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-transparent border-t-orange-500 rounded-full spinner-loading"></div>
          </div>
        </div>

        {/* Mensaje */}
        <div className="space-y-2">
          <p className="text-white text-lg font-semibold">{message}</p>
          <p className="text-gray-400 text-sm">Por favor espera...</p>
        </div>
      </div>
    </div>
  );
};
