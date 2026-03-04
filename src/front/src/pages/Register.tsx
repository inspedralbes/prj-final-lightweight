import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Lock, Eye, EyeOff, ArrowRight, Mail } from "../components/Icons";
import api from "../utils/api";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { useToast } from "../hooks/useToast";
import { AuthPageHeader } from "../components/AuthPageHeader";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState<"CLIENT" | "COACH">("CLIENT");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { t } = useTranslation();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // enforce minimum length before comparing or sending
    const MIN_PASSWORD = 6;
    if (password.length < MIN_PASSWORD) {
      toast.error(
        t("messages.errorOccurred"),
        t("auth.passwordMinLength", { count: MIN_PASSWORD }),
      );
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      toast.error(t("messages.errorOccurred"), t("messages.passwordMismatch"));
      return;
    }

    if (!acceptTerms) {
      toast.error(
        t("messages.errorOccurred"),
        t("messages.acceptTermsRequired"),
      );
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/auth/register", { username, email, password, role });
      toast.success(t("messages.registerSuccess"));
      navigate("/login");
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        toast.error(
          t("messages.errorOccurred"),
          t("messages.userAlreadyExists"),
        );
        return;
      }
      console.error("Error during registration:", error);
      toast.error(t("messages.errorOccurred"));
    } finally {
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
              {t("auth.registerDecorativeText")}
            </p>
          </div>
        </div>

        {/* Columna Derecha - Formulario */}
        <div className="w-full lg:w-1/2 h-full flex items-center justify-center p-6 pt-20 bg-black overflow-y-auto">
          <div className="w-full max-w-md">
            {/* Títulos */}
            <div className="mb-5">
              <h2 className="text-4xl font-extrabold mb-2 text-white">
                {t("auth.register")}
              </h2>
              <p className="text-gray-200">{t("auth.registerSubtitle")}</p>
            </div>

            {/* Selector de Rol */}
            <div className="mb-5 flex gap-3">
              <button
                onClick={() => setRole("CLIENT")}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                  role === "CLIENT"
                    ? "bg-orange-500 text-black"
                    : "bg-zinc-900 text-gray-300 hover:bg-zinc-800 border border-zinc-800"
                }`}
              >
                {t("auth.roleClient")}
              </button>
              <button
                onClick={() => setRole("COACH")}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                  role === "COACH"
                    ? "bg-orange-500 text-black"
                    : "bg-zinc-900 text-gray-300 hover:bg-zinc-800 border border-zinc-800"
                }`}
              >
                {t("auth.roleCoach")}
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Input - Nom d'usuari */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  {t("auth.username").toUpperCase()}
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

              {/* Input - Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  {t("auth.email").toUpperCase()}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("auth.emailPlaceholder")}
                    className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Input - Contrasenya */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  {t("auth.password").toUpperCase()}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      // clear any custom validity when user types
                      (e.currentTarget as HTMLInputElement).setCustomValidity("");
                    }}
                    onInvalid={(e) => {
                      // override browser message to only show the static hint
                      (e.currentTarget as HTMLInputElement).setCustomValidity(
                        t("auth.passwordMinLength", { count: 6 }),
                      );
                    }}
                    placeholder={t("auth.passwordPlaceholder")}
                    className="w-full pl-10 pr-10 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                    required
                    minLength={6}
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
                <p className="text-xs text-gray-500 mt-1">
                  {t("auth.passwordMinLength", { count: 6 })}
                </p>
              </div>

              {/* Input - Confirmar Contrasenya */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  {t("auth.passwordConfirm").toUpperCase()}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t("auth.passwordConfirmPlaceholder")}
                    className="w-full pl-10 pr-10 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Checkbox - Accepto els Termes */}
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="acceptTerms"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="w-4 h-4 bg-zinc-900 border border-zinc-800 rounded cursor-pointer accent-orange-500 mt-1"
                />
                <label
                  htmlFor="acceptTerms"
                  className="ml-2 text-sm text-gray-400 cursor-pointer hover:text-gray-300 transition-colors"
                >
                  {t("auth.acceptTerms")}{" "}
                  <a
                    href="#"
                    className="text-orange-500 hover:text-orange-400 font-semibold"
                  >
                    {t("auth.termsLink")}
                  </a>
                </label>
              </div>

              {/* Botón Principal */}
              <button
                type="submit"
                disabled={isLoading || !acceptTerms}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-700 text-black font-bold rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
              >
                {isLoading
                  ? t("common.loading")
                  : t("auth.registerButton").toUpperCase()}
                {!isLoading && <ArrowRight className="w-5 h-5" />}
              </button>
            </form>

            {/* Pie del formulario */}
            <p className="mt-6 text-center text-gray-400 text-sm">
              {t("auth.haveAccount")}{" "}
              <Link
                to="/login"
                className="text-orange-500 hover:text-orange-400 font-semibold transition-colors"
              >
                {t("auth.loginButton")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
