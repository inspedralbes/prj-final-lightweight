import { useState } from "react";
import { Copy, Check, Loader, UserPlus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useToast } from "../hooks/useToast";
import Layout from "../components/Layout";
import { invitationsService } from "../services/invitationsService";

export default function CoachInviteClient() {
  const { t } = useTranslation();
  const toast = useToast();

  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerateCode = async () => {
    setLoadingGenerate(true);
    try {
      const response = await invitationsService.generateCode();
      setGeneratedCode(response.code);
      toast.success(
        t("coachInvite.codeGenerated") || "Invitation code generated",
      );
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

  const handleCopyCode = async () => {
    if (!generatedCode) return;
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      toast.success(t("coachInvite.codeCopied") || "Code copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("coachInvite.copyFailed") || "Failed to copy code");
    }
  };

  const handleReset = () => {
    setGeneratedCode(null);
    setCopied(false);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-950 to-black p-4 md:p-8">
        {/* Header */}
        <div className="mb-12 flex items-center gap-4">
          <div className="p-3 bg-orange-500/10 rounded-lg">
            <UserPlus className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              {t("coachInvite.mainTitle") || "Invite a Client"}
            </h1>
            <p className="text-gray-400 mt-1">
              {t("coachInvite.mainSubtitle") ||
                "Generate a unique code so your client can link to you"}
            </p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 hover:border-orange-500/30 transition-colors">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                {t("coachInvite.generateTitle") || "Generate invitation code"}
              </h2>
              <p className="text-sm text-gray-400">
                {t("coachInvite.generateSubtitle") ||
                  "Your client will use this code to link their account to yours"}
              </p>
            </div>

            {/* Botón Generar */}
            {!generatedCode && (
              <button
                onClick={handleGenerateCode}
                disabled={loadingGenerate}
                className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 mb-6"
              >
                {loadingGenerate ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    {t("common.generating") || "Generating..."}
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    {t("coachInvite.generateButton") ||
                      "Generate invitation code"}
                  </>
                )}
              </button>
            )}

            {/* Mostrar código generado */}
            {generatedCode && (
              <div className="bg-zinc-800 border border-orange-500/30 rounded-lg p-4 space-y-3 mb-6">
                <p className="text-xs font-semibold text-orange-400 uppercase tracking-wider">
                  {t("coachInvite.yourCode") || "Invitation code"}
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
                      <span>{t("coachInvite.copied") || "Copied!"}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 group-hover:text-orange-400" />
                      <span>{t("coachInvite.copyButton") || "Copy code"}</span>
                    </>
                  )}
                </button>

                {/* Botón Generar otro */}
                <button
                  onClick={handleReset}
                  className="w-full py-2 px-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-gray-300 font-medium rounded-lg transition-all duration-200 text-sm"
                >
                  {t("coachInvite.generateAnother") || "Generate another code"}
                </button>
              </div>
            )}

            {/* Info box */}
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
              <p className="text-sm text-orange-200">
                {t("coachInvite.infoBox") ||
                  "Share this code with your client. They will use it in their 'Join Coach' section to link their account to you. Each code can only be used once."}
              </p>
            </div>
          </div>

          {/* Footer Info */}
          <div className="mt-8">
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6 text-center">
              <p className="text-sm text-gray-400">
                {t("coachInvite.footerInfo") ||
                  "Once your client accepts the invitation, they will appear in your client list and you will be able to assign routines and follow their progress."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
