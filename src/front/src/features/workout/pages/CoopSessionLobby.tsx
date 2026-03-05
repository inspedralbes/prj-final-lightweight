import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Check, Loader, Ticket } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/shared/hooks/useToast";
import Layout from "@/shared/layout/Layout";
import { invitationsService } from "@/shared/services/invitationsService";

export default function FriendSession() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const toast = useToast();

  // Sección A: Generar Código
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sección B: Canjear Código
  const [inputCode, setInputCode] = useState("");
  const [loadingAccept, setLoadingAccept] = useState(false);

  // Generar nuevo código de sala
  const handleGenerateCode = async () => {
    setLoadingGenerate(true);
    try {
      const response = await invitationsService.generateCode();
      setGeneratedCode(response.code);
      toast.success(
        t("friendSession.codeGenerated") || "Code generated successfully",
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to generate session code";
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
      toast.success(
        t("friendSession.codeCopied") || "Code copied to clipboard",
      );

      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error(t("friendSession.copyFailed") || "Failed to copy code");
    }
  };

  // Unirse a una sala con código
  const handleJoinSession = async () => {
    if (!inputCode.trim()) {
      toast.error(t("friendSession.enterCode") || "Please enter a code");
      return;
    }

    setLoadingAccept(true);
    try {
      const joinCode = inputCode.trim();
      setInputCode("");
      toast.success(t("friendSession.codeAccepted") || "Joining session...");
      setTimeout(() => {
        navigate(`/room/${joinCode}`, { state: { isHost: false } });
      }, 1000);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to join session";
      toast.error(message);
    } finally {
      setLoadingAccept(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b p-4 md:p-8">
        {/* Header */}
        <div className="mb-12 flex items-center gap-4">
          <div className="p-3 bg-orange-500/10 rounded-lg">
            <Ticket className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              {t("friendSession.mainTitle") || "Friend Session"}
            </h1>
            <p className="text-gray-400 mt-1">
              {t("friendSession.mainSubtitle") ||
                "Create or join a virtual gym session with a friend"}
            </p>
          </div>
        </div>

        {/* Grid de dos columnas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* ========== SECCIÓN A: Crear Sala ========== */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 hover:border-orange-500/30 transition-colors">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                {t("friendSession.generateTitle") || "Create a session"}
              </h2>
              <p className="text-sm text-gray-400">
                {t("friendSession.generateSubtitle") ||
                  "Generate a session code to share with a friend"}
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
                  {t("friendSession.generated") || "Generated"}
                </>
              ) : (
                t("friendSession.generateButton") || "Generate session code"
              )}
            </button>

            {/* Mostrar código generado */}
            {generatedCode && (
              <div className="bg-zinc-800 border border-orange-500/30 rounded-lg p-4 space-y-3">
                <p className="text-xs font-semibold text-orange-400 uppercase tracking-wider">
                  {t("friendSession.yourCode") || "Your session code"}
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
                      <span>{t("friendSession.copied") || "Copied!"}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 group-hover:text-orange-400" />
                      <span>
                        {t("friendSession.copyButton") || "Copy code"}
                      </span>
                    </>
                  )}
                </button>

                {/* Botón Entrar al Gimnasio Virtual */}
                <button
                  onClick={() =>
                    navigate(`/room/${generatedCode}`, {
                      state: { isHost: true },
                    })
                  }
                  className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Ticket className="w-5 h-5" />
                  <span>
                    {t("virtualGym.enterButton") || "Enter Virtual Gym"}
                  </span>
                </button>
              </div>
            )}

            {/* Info box */}
            {!generatedCode && (
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 text-center">
                <p className="text-sm text-orange-200">
                  {t("friendSession.generateInfo") ||
                    "Click the button to generate a unique session code"}
                </p>
              </div>
            )}
          </div>

          {/* ========== SECCIÓN B: Unirse a Sala ========== */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 hover:border-orange-500/30 transition-colors">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                {t("friendSession.redeemTitle") || "Have a session code?"}
              </h2>
              <p className="text-sm text-gray-400">
                {t("friendSession.redeemSubtitle") ||
                  "Enter the code shared by your friend to join the session"}
              </p>
            </div>

            {/* Input para código */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t("friendSession.codeInput") || "Session Code"}
                </label>
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !loadingAccept) {
                      handleJoinSession();
                    }
                  }}
                  placeholder={
                    t("friendSession.codePlaceholder") ||
                    "Enter the code here..."
                  }
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/50 transition-all"
                />
              </div>

              {/* Botón Unirse */}
              <button
                onClick={handleJoinSession}
                disabled={loadingAccept || !inputCode.trim()}
                className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                {loadingAccept ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    {t("common.checking") || "Joining..."}
                  </>
                ) : (
                  t("friendSession.redeemButton") || "Join session"
                )}
              </button>
            </div>

            {/* Info box */}
            <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-sm text-blue-200">
                {t("friendSession.redeemInfo") ||
                  "Enter the session code shared by your friend to train together in real time"}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-12 max-w-5xl mx-auto">
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6 text-center">
            <p className="text-sm text-gray-400">
              {t("friendSession.footerInfo") ||
                "Session codes let you train live with a friend in the virtual gym. Share them only with people you trust."}
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
