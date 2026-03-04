interface LoadingScreenProps {
  isVisible: boolean;
  message?: string;
}

export const LoadingScreen = ({
  isVisible,
  message = "Iniciando sesión...",
}: LoadingScreenProps) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center space-y-8">
        {/* Logo con animación */}
        <div className="flex justify-center">
          <div className="p-4 bg-orange-500/10 rounded-full animate-pulse">
            <img
              src="/LW_logo.png"
              alt="LightWeight"
              className="w-16 h-16 object-contain animate-bounce"
            />
          </div>
        </div>

        {/* Spinner */}
        <div className="flex justify-center">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-transparent border-t-orange-500 border-r-orange-500/50 rounded-full animate-spin"></div>
            <div
              className="absolute inset-2 border-4 border-transparent border-b-orange-400 rounded-full animate-spin"
              style={{
                animationDirection: "reverse",
                animationDuration: "1.5s",
              }}
            ></div>
          </div>
        </div>

        {/* Mensaje */}
        <div className="space-y-2">
          <p className="text-white text-lg font-semibold">{message}</p>
          <p className="text-gray-400 text-sm">Por favor espera...</p>
        </div>

        {/* Dots animados */}
        <div className="flex justify-center gap-2">
          <div
            className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"
            style={{ animationDelay: "0s" }}
          ></div>
          <div
            className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"
            style={{ animationDelay: "0.2s" }}
          ></div>
          <div
            className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"
            style={{ animationDelay: "0.4s" }}
          ></div>
        </div>
      </div>
    </div>
  );
};
