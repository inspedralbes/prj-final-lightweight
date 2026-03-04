import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader, CheckCircle, UserX, Bell, UserCheck } from "lucide-react";
import { Check, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/shared/hooks/useToast";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useNotification } from "@/features/notifications/context/NotificationContext";
import Layout from "@/shared/layout/Layout";
import { invitationsService } from "@/shared/services/invitationsService";
import {
  myCoachService,
  type MyCoachInfo,
} from "@/features/client/services/myCoachService";

interface PendingInvite {
  id: number;
  code: string;
  coachName: string;
  coachId: number;
}

export default function CoachClientInvitation() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const toast = useToast();
  const { updateCoachId } = useAuth();
  const { notifications, removeNotification } = useNotification();

  const [linked, setLinked] = useState(false);

  // Estado del coach actual
  const [coachInfo, setCoachInfo] = useState<MyCoachInfo | null>(null);
  const [loadingCoachInfo, setLoadingCoachInfo] = useState(true);
  const [loadingUnlink, setLoadingUnlink] = useState(false);
  const [confirmUnlink, setConfirmUnlink] = useState(false);

  // Invitaciones pendientes
  const [pending, setPending] = useState<PendingInvite[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);

  useEffect(() => {
    myCoachService
      .getMe()
      .then((info) => {
        setCoachInfo(info);
        if (!info?.hasCoach) loadPending();
      })
      .catch(() => {
        setCoachInfo(null);
        loadPending();
      })
      .finally(() => setLoadingCoachInfo(false));
  }, []);

  // Recargar pendientes cuando se acepta un evento externo (desde NotificationCenter)
  useEffect(() => {
    const handler = () => loadPending();
    window.addEventListener("coach-invitation-accepted", handler);
    return () =>
      window.removeEventListener("coach-invitation-accepted", handler);
  }, []);

  const loadPending = () => {
    setLoadingPending(true);
    invitationsService
      .getPendingForMe()
      .then(setPending)
      .catch(() => setPending([]))
      .finally(() => setLoadingPending(false));
  };

  const handleUnlinkFromCoach = async () => {
    setLoadingUnlink(true);
    try {
      await myCoachService.unlinkFromCoach();
      updateCoachId(null);
      setCoachInfo({ hasCoach: false, coachId: null, coach: null });
      setConfirmUnlink(false);
      toast.success(
        t("invitations.unlinkSuccess") || "Coach association removed",
      );
      loadPending();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to unlink from coach";
      toast.error(message);
    } finally {
      setLoadingUnlink(false);
    }
  };

  const handleAcceptInvite = async (inv: PendingInvite) => {
    setAcceptingId(inv.id);
    try {
      const response = await invitationsService.acceptInvitationCode(inv.code);
      if (response.coachId) updateCoachId(response.coachId);
      // Limpiar todas las notificaciones de invitacion del campana
      notifications
        .filter((n) => n.type === "invite")
        .forEach((n) => removeNotification(n.id));
      setLinked(true);
      setPending([]);
      // Notificar a Layout para que refresque el badge de invitaciones
      window.dispatchEvent(new Event("coach-invitation-accepted"));
      setTimeout(() => navigate("/client-home"), 2000);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to accept invitation";
      toast.error(message);
    } finally {
      setAcceptingId(null);
    }
  };

  const handleRejectInvite = async (id: number) => {
    setRejectingId(id);
    try {
      await invitationsService.rejectInvitation(id);
      setPending((prev) => prev.filter((i) => i.id !== id));
      // Notificar a Layout para que refresque el badge
      window.dispatchEvent(new Event("coach-invitation-accepted"));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to reject invitation";
      toast.error(message);
    } finally {
      setRejectingId(null);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b p-4 md:p-8">
        {/* Header */}
        <div className="mb-12 flex items-center gap-4">
          <div className="p-3 bg-orange-500/10 rounded-lg">
            <UserCheck className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              {t("invitations.mainTitle") || "Invitations"}
            </h1>
            <p className="text-gray-400 mt-1">
              {t("invitations.mainSubtitle") ||
                "Review and respond to coach invitations"}
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
            /* Sin coach → lista de invitaciones pendientes */
            <div className="space-y-4">
              {loadingPending ? (
                <div className="flex justify-center py-16">
                  <Loader className="w-8 h-8 animate-spin text-orange-500" />
                </div>
              ) : pending.length > 0 ? (
                <>
                  <p className="text-sm text-gray-400 mb-2">
                    {t("invitations.pendingSubtitle") ||
                      "You have pending invitations from coaches waiting for your response."}
                  </p>
                  {pending.map((inv) => (
                    <div
                      key={inv.id}
                      className="bg-zinc-900 border border-orange-500/30 rounded-lg p-6 flex items-center gap-4"
                    >
                      <div className="p-3 bg-orange-500/10 rounded-lg flex-shrink-0">
                        <UserCheck className="w-6 h-6 text-orange-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold">
                          {inv.coachName}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {t("invitations.wantsToCoachYou") ||
                            "wants to be your coach"}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleAcceptInvite(inv)}
                          disabled={acceptingId === inv.id}
                          className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors text-sm"
                        >
                          {acceptingId === inv.id ? (
                            <Loader className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                          {t("invitations.acceptButton") || "Accept"}
                        </button>
                        <button
                          onClick={() => handleRejectInvite(inv.id)}
                          disabled={
                            rejectingId === inv.id || acceptingId === inv.id
                          }
                          className="flex items-center gap-1.5 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 disabled:opacity-50 text-gray-300 font-semibold rounded-lg transition-colors text-sm"
                        >
                          <X className="w-4 h-4" />
                          {t("invitations.rejectButton") || "Decline"}
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                /* Sin invitaciones pendientes */
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-12 text-center">
                  <div className="p-4 bg-zinc-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                    <Bell className="w-8 h-8 text-gray-500" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">
                    {t("invitations.noPendingTitle") ||
                      "No pending invitations"}
                  </h2>
                  <p className="text-sm text-gray-400 max-w-sm mx-auto">
                    {t("invitations.noPendingSubtitle") ||
                      "When a coach invites you, their invitation will appear here so you can accept or decline it."}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
