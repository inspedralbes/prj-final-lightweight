import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Lock, ArrowRight } from "@/shared/components/Icons";
import { useTranslation } from "react-i18next";
import { useToast } from "@/shared/hooks/useToast";
import { AuthPageHeader } from "@/shared/layout/AuthPageHeader";
import api from "@/shared/utils/api";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationError, setValidationError] = useState("");
  const [backendError, setBackendError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { t } = useTranslation();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");
    setBackendError(false);

    if (newPassword.length < 8) {
      setValidationError(t("auth.passwordMinLength", { count: 8 }));
      return;
    }
    if (newPassword !== confirmPassword) {
      setValidationError(t("auth.passwordsDoNotMatch", "Las contraseñas no coinciden."));
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/auth/reset-password", { token, password: newPassword });
      toast.success(t("messages.success"), t("messages.passwordResetSuccess"));
      setTimeout(() => navigate("/login"), 2000);
    } catch {
      setBackendError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AuthPageHeader />
      <div className="h-screen w-full flex overflow-hidden bg-zinc-950 text-white">
        {/* Columna izquierda decorativa */}
        <div
          className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col items-center justify-center"
          style={{
            backgroundImage: "url('/background.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black z-10" />
          <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-r from-transparent to-black z-20" />
          <div className="relative z-30 text-center px-8">
            <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-orange-400 to-orange-600 mb-4 whitespace-pre-line">
              {t("auth.loginDecorativeTitle")}
            </h1>
            <p className="text-gray-300 text-lg mt-6 max-w-sm">
              {t("auth.forgotPasswordSubtitle")}
            </p>
          </div>
        </div>

        {/* Columna derecha — formulario */}
        <div className="w-full lg:w-1/2 h-full flex items-center justify-center p-6 pt-20 bg-black overflow-y-auto">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <h2 className="text-4xl font-extrabold mb-2 text-white">
                {t("auth.resetPassword")}
              </h2>
              <p className="text-gray-200">{t("auth.forgotPasswordHint")}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nueva contraseña */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  {t("auth.newPassword")}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t("auth.passwordPlaceholder")}
                    data-testid="reset-password-new"
                    className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Confirmar contraseña */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  {t("auth.confirmPassword")}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t("auth.passwordConfirmPlaceholder")}
                    data-testid="reset-password-confirm"
                    className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                    required
                  />
                </div>
              </div>

              {validationError && (
                <p data-testid="reset-password-validation-error" className="text-red-400 text-sm">{validationError}</p>
              )}

              {backendError && (
                <div data-testid="reset-token-error" className="text-sm text-red-400 space-y-1">
                  <p>{t("auth.resetTokenInvalid")}</p>
                  <Link to="/forgot-password" className="text-orange-400 hover:text-orange-300 underline">
                    {t("auth.requestNewReset")}
                  </Link>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                data-testid="reset-password-submit"
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-700 text-black font-bold rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
              >
                {isLoading ? t("common.loading") : t("auth.resetPasswordButton")}
                {!isLoading && <ArrowRight className="w-5 h-5" />}
              </button>
            </form>

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
