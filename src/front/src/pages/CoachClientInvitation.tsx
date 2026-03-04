import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader, Link2, CheckCircle, UserX } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useToast } from "../hooks/useToast";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import { invitationsService } from "../services/invitationsService";
import { clientsService, type MyCoachInfo } from "../services/clientsService";

export default function CoachClientInvitation() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const toast = useToast();
  const { updateCoachId } = useAuth();

  const [inputCode, setInputCode] = useState("");
  const [loadingAccept, setLoadingAccept] = useState(false);
  const [linked, setLinked] = useState(false);

  // Estado del coach actual
  const [coachInfo, setCoachInfo] = useState<MyCoachInfo | null>(null);
  const [loadingCoachInfo, setLoadingCoachInfo] = useState(true);
  const [loadingUnlink, setLoadingUnlink] = useState(false);
  const [confirmUnlink, setConfirmUnlink] = useState(false);

  useEffect(() => {
    clientsService
      .getMe()
      .then((info) => setCoachInfo(info))
      .catch(() => setCoachInfo(null))
      .finally(() => setLoadingCoachInfo(false));
  }, []);

  const handleUnlinkFromCoach = async () => {
    setLoadingUnlink(true);
    try {
      await clientsService.unlinkFromCoach();
      updateCoachId(null);
      setCoachInfo({ hasCoach: false, coachId: null, coach: null });
      setConfirmUnlink(false);
      toast.success(
        t("invitations.unlinkSuccess") || "Coach association removed",
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to unlink from coach";
      toast.error(message);
    } finally {
      setLoadingUnlink(false);
    }
  };

  const handleAcceptCode = async () => {
    if (!inputCode.trim()) {
      toast.error(t("invitations.enterCode") || "Please enter a code");
      return;
    }

    setLoadingAccept(true);
    try {
      const response = await invitationsService.acceptInvitationCode(
        inputCode.trim(),
      );

      // Actualizar el coachId en el contexto de autenticación
      if (response.coachId) {
        updateCoachId(response.coachId);
      }

      setLinked(true);
      setInputCode("");
      toast.success(
        t("invitations.codeAccepted") || "Successfully linked to your coach!",
      );

      // Redirigir al client-home después de 2 segundos
      setTimeout(() => {
        navigate("/client-home");
      }, 2000);
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
            <Link2 className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              {t("invitations.mainTitle") || "Invitations"}
            </h1>
            <p className="text-gray-400 mt-1">
              {t("invitations.mainSubtitle") ||
                "Link your account to a coach using an invitation code"}
            </p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Estado de carga inicial */}
          {loadingCoachInfo ? (
            <div className="flex justify-center py-16">
              <Loader className="w-8 h-8 animate-spin text-orange-500" />
            </div>
          ) : linked ? (
            /* Éxito tras vincular */
            <div className="bg-zinc-900 border border-green-500/30 rounded-lg p-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">
                {t("invitations.linkedTitle") || "Linked successfully!"}
              </h2>
              <p className="text-gray-400">
                {t("invitations.linkedSubtitle") ||
                  "You are now linked to your coach. Redirecting to your home..."}
              </p>
            </div>
          ) : coachInfo?.hasCoach ? (
            /* Ya tiene coach → mostrar info + opción de desvincular */
            <div className="space-y-6">
              <div className="bg-zinc-900 border border-green-500/20 rounded-lg p-8">
                <div className="flex items-center gap-3 mb-6">
                  <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                  <h2 className="text-xl font-bold text-white">
                    {t("invitations.alreadyLinkedTitle") ||
                      "You already have a coach"}
                  </h2>
                </div>
                <div className="bg-zinc-800 rounded-lg p-4 mb-6">
                  <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">
                    {t("invitations.currentCoach") || "Your coach"}
                  </p>
                  <p className="text-lg font-semibold text-white">
                    {coachInfo.coach?.username ?? `Coach #${coachInfo.coachId}`}
                  </p>
                </div>

                {confirmUnlink ? (
                  <div className="bg-red-900/20 border border-red-700/40 rounded-lg p-4 space-y-3">
                    <p className="text-sm text-red-300 font-medium">
                      {t("invitations.confirmUnlinkMessage") ||
                        "Are you sure you want to remove the association with your coach? This action cannot be undone."}
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={handleUnlinkFromCoach}
                        disabled={loadingUnlink}
                        className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        {loadingUnlink ? (
                          <Loader className="w-4 h-4 animate-spin" />
                        ) : (
                          <UserX className="w-4 h-4" />
                        )}
                        {t("invitations.confirmUnlink") ||
                          "Yes, remove association"}
                      </button>
                      <button
                        onClick={() => setConfirmUnlink(false)}
                        className="flex-1 py-2 px-4 border border-zinc-600 text-gray-300 hover:bg-zinc-800 rounded-lg transition-colors"
                      >
                        {t("common.cancel") || "Cancel"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmUnlink(true)}
                    className="w-full py-3 px-4 border border-red-800 text-red-400 hover:bg-red-900/20 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <UserX className="w-5 h-5" />
                    {t("invitations.unlinkButton") ||
                      "Remove coach association"}
                  </button>
                )}
              </div>

              {/* Footer Info */}
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6 text-center">
                <p className="text-sm text-gray-400">
                  {t("invitations.unlinkInfo") ||
                    "If you remove the association, your coach will no longer be able to assign you routines or see your progress."}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 hover:border-orange-500/30 transition-colors">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">
                  {t("invitations.redeemTitle") || "Enter your invitation code"}
                </h2>
                <p className="text-sm text-gray-400">
                  {t("invitations.redeemSubtitle") ||
                    "Ask your coach for their invitation code and enter it below to link your account"}
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
                    placeholder={
                      t("invitations.codePlaceholder") ||
                      "Paste the code here..."
                    }
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/50 transition-all font-mono"
                  />
                </div>

                {/* Botón Vincular */}
                <button
                  onClick={handleAcceptCode}
                  disabled={loadingAccept || !inputCode.trim()}
                  className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {loadingAccept ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      {t("common.checking") || "Verifying..."}
                    </>
                  ) : (
                    <>
                      <Link2 className="w-5 h-5" />
                      {t("invitations.redeemButton") || "Link to coach"}
                    </>
                  )}
                </button>
              </div>

              {/* Info box */}
              <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <p className="text-sm text-blue-200">
                  {t("invitations.redeemInfo") ||
                    "Your coach will provide you with a unique invitation code. Once linked, they will be able to assign you routines and track your progress."}
                </p>
              </div>
            </div>
          )}

          {/* Footer Info */}
          <div className="mt-8">
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6 text-center">
              <p className="text-sm text-gray-400">
                {t("invitations.footerInfo") ||
                  "Invitation codes are single-use and link your account exclusively to one coach."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
