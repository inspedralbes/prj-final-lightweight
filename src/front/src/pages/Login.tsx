import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Lock, Eye, EyeOff, ArrowRight } from "../components/Icons";
import api from "../utils/api";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import { useToast } from "../hooks/useToast";
import { AuthPageHeader } from "../components/AuthPageHeader";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useTranslation();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await api.post("/auth/login", { username, password });
      const token = res.data?.access_token;
      const user = res.data?.user;

      if (token && user) {
        login({ id: user.id, username: user.username, role: user.role, token });
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        toast.success(t("messages.loginSuccess"));

        if (user.role === "COACH") {
          navigate("/dashboard");
        } else {
          navigate("/client-home");
        }
      } else {
        toast.error(t("messages.errorOccurred"), t("messages.invalidInput"));
        setIsLoading(false);
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast.error(t("auth.invalidCredentials"));
      } else {
        console.error("Error during login:", error);
        toast.error(t("messages.errorOccurred"));
      }
      setIsLoading(false);
    }
  };

  return (
    <>
      <AuthPageHeader />
      <div className="h-screen w-full flex overflow-hidden bg-zinc-950 text-white">
        {/* Columna Izquierda - Decorativa */}
        <div
          className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col items-center justify-center"
          style={{
            backgroundImage: "url('/background.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          {/* Base dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black z-10" />
          {/* Hard right-edge bleed strip */}
          <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-r from-transparent to-black z-20" />
          <div className="relative z-30 text-center px-8">
            <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-orange-400 to-orange-600 mb-4 whitespace-pre-line">
              {t("auth.loginDecorativeTitle")}
            </h1>
            <p className="text-gray-300 text-lg mt-6 max-w-sm">
              {t("auth.loginDecorativeText")}
            </p>
          </div>
        </div>

        {/* Columna Derecha - Formulario */}
        <div className="w-full lg:w-1/2 h-full flex items-center justify-center p-6 pt-20 bg-black overflow-y-auto">
          <div className="w-full max-w-md">
            {/* Títulos */}
            <div className="mb-8">
              <h2 className="text-4xl font-extrabold mb-2 text-white">
                {t("auth.login")}
              </h2>
              <p className="text-gray-200">{t("auth.loginSubtitle")}</p>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Input - Nom d'usuari */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t("auth.username")}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={t("auth.usernamePlaceholder")}
                    className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Input - Contrasenya */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-semibold text-gray-300">
                    {t("auth.password")}
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-orange-500 hover:text-orange-400 transition-colors"
                  >
                    {t("auth.forgotPassword")}
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("auth.passwordPlaceholder")}
                    className="w-full pl-10 pr-10 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Botón Principal */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-700 text-black font-bold rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
              >
                {isLoading ? t("common.loading") : t("auth.loginButton")}
                {!isLoading && <ArrowRight className="w-5 h-5" />}
              </button>
            </form>

            {/* Pie del formulario */}
            <p className="mt-6 text-center text-gray-400 text-sm">
              {t("auth.noAccount")}{" "}
              <Link
                to="/register"
                className="text-orange-500 hover:text-orange-400 font-semibold transition-colors"
              >
                {t("auth.registerButton")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
