import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Check, Loader, Ticket } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useToast } from "../hooks/useToast";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import { invitationsService } from "../services/invitationsService";

export default function ClientInvitations() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const toast = useToast();
  const { user } = useAuth();

  // Sección A: Generar Código
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sección B: Canjear Código
  const [inputCode, setInputCode] = useState("");
  const [loadingAccept, setLoadingAccept] = useState(false);

  // Generar nuevo código
  const handleGenerateCode = async () => {
    setLoadingGenerate(true);
    try {
      const response = await invitationsService.generateCode();
      setGeneratedCode(response.code);
      toast.success(t("invitations.codeGenerated") || "Code generated successfully");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to generate invitation code";
      toast.error(message);
    } finally {
      setLoadingGenerate(false);
    }
  };

  // Copiar código al portapapeles
  const handleCopyCode = async () => {
    if (!generatedCode) return;

    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      toast.success(t("invitations.codeCopied") || "Code copied to clipboard");

      // Resetear estado después de 2 segundos
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error(t("invitations.copyFailed") || "Failed to copy code");
    }
  };

  // Canjear código de invitación
  const handleAcceptCode = async () => {
    if (!inputCode.trim()) {
      toast.error(t("invitations.enterCode") || "Please enter a code");
      return;
    }

    setLoadingAccept(true);
    try {
      const response = await invitationsService.acceptInvitationCode(inputCode);
      const acceptedCode = inputCode;
      setInputCode("");
      toast.success(
        t("invitations.codeAccepted") || "Successfully connected to your friend!"
      );
      // Redirigir automàticament a la sala virtual com a convidat
      setTimeout(() => {
        navigate(`/room/${acceptedCode}`, { state: { isHost: false } });
      }, 1500);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to accept invitation code";
      toast.error(message);
    } finally {
      setLoadingAccept(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-950 to-black p-4 md:p-8">
        {/* Header */}
        <div className="mb-12 flex items-center gap-4">
          <div className="p-3 bg-orange-500/10 rounded-lg">
            <Ticket className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              {t("invitations.mainTitle") || "Invitations"}
            </h1>
            <p className="text-gray-400 mt-1">
              {t("invitations.mainSubtitle") ||
                "Manage your invitation codes and connect with friends"}
            </p>
          </div>
        </div>

        {/* Grid de dos columnas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* ========== SECCIÓN A: Generar Código ========== */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 hover:border-orange-500/30 transition-colors">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                {t("invitations.generateTitle") || "Invite a friend"}
              </h2>
              <p className="text-sm text-gray-400">
                {t("invitations.generateSubtitle") ||
                  "Share your invitation code with a friend"}
              </p>
            </div>

            {/* Botón Generar */}
            <button
              onClick={handleGenerateCode}
              disabled={loadingGenerate || !!generatedCode}
              className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 mb-6"
            >
              {loadingGenerate ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  {t("common.generating") || "Generating..."}
                </>
              ) : generatedCode ? (
                <>
                  <Check className="w-5 h-5 text-green-400" />
                  {t("invitations.generated") || "Generated"}
                </>
              ) : (
                t("invitations.generateButton") || "Generate code"
              )}
            </button>

            {/* Mostrar código generado */}
            {generatedCode && (
              <div className="bg-zinc-800 border border-orange-500/30 rounded-lg p-4 space-y-3">
                <p className="text-xs font-semibold text-orange-400 uppercase tracking-wider">
                  {t("invitations.yourCode") || "Your code"}
                </p>
                <div className="bg-zinc-950 border border-zinc-700 rounded-lg p-4 font-mono text-sm md:text-base text-white break-all select-all cursor-pointer hover:border-orange-500/50 transition-colors">
                  {generatedCode}
                </div>

                {/* Botón Copiar */}
                <button
                  onClick={handleCopyCode}
                  className="w-full py-2 px-3 bg-zinc-700 hover:bg-zinc-600 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 group text-sm"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-400" />
                      <span>{t("invitations.copied") || "Copied!"}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 group-hover:text-orange-400" />
                      <span>{t("invitations.copyButton") || "Copy code"}</span>
                    </>
                  )}
                </button>

                {/* Botón Entrar al Gimnàs Virtual */}
                <button
                  onClick={() => navigate(`/room/${generatedCode}`, { state: { isHost: true } })}
                  className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Ticket className="w-5 h-5" />
                  <span>{t("virtualGym.enterButton") || "Entrar al Gimnàs Virtual"}</span>
                </button>
              </div>
            )}

            {/* Info box */}
            {!generatedCode && (
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 text-center">
                <p className="text-sm text-orange-200">
                  {t("invitations.generateInfo") ||
                    "Click the button to generate a unique code"}
                </p>
              </div>
            )}
          </div>

          {/* ========== SECCIÓN B: Canjear Código ========== */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 hover:border-orange-500/30 transition-colors">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                {t("invitations.redeemTitle") || "Have a code?"}
              </h2>
              <p className="text-sm text-gray-400">
                {t("invitations.redeemSubtitle") ||
                  "Enter the code you received from your friend"}
              </p>
            </div>

            {/* Input para código */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t("invitations.codeInput") || "Invitation Code"}
                </label>
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !loadingAccept) {
                      handleAcceptCode();
                    }
                  }}
                  placeholder={t("invitations.codePlaceholder") || "Enter the code here..."}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/50 transition-all"
                />
              </div>

              {/* Botón Canjear */}
              <button
                onClick={handleAcceptCode}
                disabled={loadingAccept || !inputCode.trim()}
                className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                {loadingAccept ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    {t("common.checking") || "Checking..."}
                  </>
                ) : (
                  t("invitations.redeemButton") || "Join"
                )}
              </button>
            </div>

            {/* Info box */}
            <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-sm text-blue-200">
                {t("invitations.redeemInfo") ||
                  "Paste the code you received and connect with your friend"}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-12 max-w-5xl mx-auto">
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6 text-center">
            <p className="text-sm text-gray-400">
              {t("invitations.footerInfo") ||
                "Your invitation codes help you stay connected with your fitness community. Share them securely with trusted friends and coaches."}
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
