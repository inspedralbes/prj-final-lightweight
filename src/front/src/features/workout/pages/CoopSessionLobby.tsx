import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/shared/hooks/useToast";
import Layout from "@/shared/layout/Layout";
import type {
  FriendInvitation,
  UserSearchResult,
} from "@/features/workout/services/friendInvitationService";
import { friendInvitationService } from "@/features/workout/services/friendInvitationService";
import PendingInvitationCard from "@/features/workout/components/PendingInvitationCard";
import UserSearchModal from "@/features/workout/components/UserSearchModal";

export default function FriendSessionLobby() {
  const { t } = useTranslation();
  const toast = useToast();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<FriendInvitation[]>([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [activeInviteId, setActiveInviteId] = useState<number | null>(null);
  const [rejectingInviteId, setRejectingInviteId] = useState<number | null>(null);
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [invitedIds, setInvitedIds] = useState<number[]>([]);

  const loadPendingInvitations = useCallback(async () => {
    try {
      setPendingLoading(true);
      const invitations = await friendInvitationService.getPendingInvitations();
      setPendingInvites(invitations);
    } catch (error) {
      console.error("Error loading pending invites", error);
      toast.error(
        t("friendSession.pendingLoadError") ||
          "Unable to load pending invitations.",
      );
    } finally {
      setPendingLoading(false);
    }
  }, [toast, t]);

  useEffect(() => {
    loadPendingInvitations();
    const interval = window.setInterval(loadPendingInvitations, 10000);
    return () => window.clearInterval(interval);
  }, [loadPendingInvitations]);

  useEffect(() => {
    const handleInviteNotification = () => {
      loadPendingInvitations();
      toast.success(
        t("friendSession.notificationReceived") ||
          "You received a new friend invitation.",
      );
    };

    window.addEventListener("friend-invite:notify", handleInviteNotification);
    return () => {
      window.removeEventListener(
        "friend-invite:notify",
        handleInviteNotification,
      );
    };
  }, [loadPendingInvitations, t, toast]);

  const handleSearchUsers = async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    try {
      setSearchLoading(true);
      setSearchError(null);
      const results = await friendInvitationService.searchUsers(query);
      setSearchResults(results);
    } catch (error) {
      console.error("Search error", error);
      setSearchError(
        t("friendSession.searchError") || "Could not search for users.",
      );
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSendInvitation = async (user: UserSearchResult) => {
    if (invitedIds.includes(user.id)) return;

    try {
      const invitation = await friendInvitationService.sendInvitation(user.id);
      setInvitedIds((ids) => [...ids, user.id]);
      setPendingInvites((list) => [invitation, ...list]);
      toast.success(
        t("friendSession.inviteSentToast", { username: user.username }) ||
          `Invitation sent to ${user.username}`,
      );
    } catch (error) {
      console.error("Send invitation failed", error);
      const message =
        error instanceof Error
          ? error.message
          : t("friendSession.sendInviteFailed") ||
            "Could not send invitation.";
      toast.error(message);
    }
  };

  const handleAccept = async (invitationId: number) => {
    try {
      setActiveInviteId(invitationId);
      await friendInvitationService.acceptInvitation(invitationId);
      setPendingInvites((list) =>
        list.filter((invite) => invite.id !== invitationId),
      );
      toast.success(
        t("friendSession.acceptSuccess") || "Invitation accepted.",
      );
    } catch (error) {
      console.error("Accept failed", error);
      toast.error(
        error instanceof Error
          ? error.message
          : t("friendSession.acceptError") ||
            "Unable to accept invitation.",
      );
    } finally {
      setActiveInviteId(null);
    }
  };

  const handleReject = async (invitationId: number) => {
    try {
      setRejectingInviteId(invitationId);
      await friendInvitationService.rejectInvitation(invitationId);
      setPendingInvites((list) =>
        list.filter((invite) => invite.id !== invitationId),
      );
      toast.success(
        t("friendSession.rejectSuccess") || "Invitation rejected.",
      );
    } catch (error) {
      console.error("Reject failed", error);
      toast.error(
        error instanceof Error
          ? error.message
          : t("friendSession.rejectError") ||
            "Unable to reject invitation.",
      );
    } finally {
      setRejectingInviteId(null);
    }
  };

  const pendingCount = pendingInvites.length;
  const inviteButtonText = useMemo(
    () => t("friendSession.openSearchButton") || "Search friends to invite",
    [t],
  );

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-3">
                <p className="text-sm uppercase tracking-[0.2em] text-orange-400">
                  {t("friendSession.sectionLabel") || "Friend Training"}
                </p>
                <h1 className="text-3xl font-semibold text-white">
                  {t("friendSession.mainTitle") || "Train with a friend"}
                </h1>
                <p className="max-w-2xl text-slate-400">
                  {t("friendSession.mainSubtitle") ||
                    "Search online users, send invitations, and respond to friend requests in one place."}
                </p>
              </div>

              <button
                onClick={() => setIsSearchOpen(true)}
                className="inline-flex items-center justify-center rounded-2xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
              >
                {inviteButtonText}
              </button>
            </div>
          </section>

          <section className="grid gap-8 xl:grid-cols-[1.3fr_0.9fr]">
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-2xl font-semibold text-white">
                      {t("friendSession.pendingTitle") || "Pending invitations"}
                    </h2>
                    <p className="text-sm text-slate-500">
                      {t("friendSession.pendingSubtitle") ||
                        "Review the friend invitations you have received."}
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-slate-800 px-3 py-1 text-sm font-semibold text-slate-300">
                    {pendingCount} {t("friendSession.pendingCountSuffix") || "pending"}
                  </span>
                </div>

                {pendingLoading ? (
                  <div className="rounded-3xl border border-slate-800 bg-slate-950 p-8 text-center text-slate-400">
                    {t("friendSession.loadingPending") || "Loading your invitations..."}
                  </div>
                ) : pendingInvites.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-950 p-10 text-center text-slate-500">
                    <p className="text-lg font-medium text-slate-100">
                      {t("friendSession.noPendingTitle") || "No pending invitations"}
                    </p>
                    <p className="mt-3 text-sm text-slate-400">
                      {t("friendSession.noPendingSubtitle") ||
                        "When a friend invites you, the invitation will appear here."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingInvites.map((invite) => (
                      <PendingInvitationCard
                        key={invite.id}
                        invitation={invite}
                        onAccept={() => handleAccept(invite.id)}
                        onReject={() => handleReject(invite.id)}
                        loadingAccept={activeInviteId === invite.id}
                        loadingReject={rejectingInviteId === invite.id}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <aside className="rounded-3xl border border-slate-800 bg-slate-900 p-8 text-slate-300">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-white">
                  {t("friendSession.howItWorksTitle") || "How it works"}
                </h2>
                <div className="space-y-3 text-sm leading-7 text-slate-400">
                  <p>{t("friendSession.howItWorksStep1") || "Search online users by username."}</p>
                  <p>{t("friendSession.howItWorksStep2") || "Send a friend invitation to someone online."}</p>
                  <p>{t("friendSession.howItWorksStep3") || "Accept invitations to start a shared session."}</p>
                </div>
              </div>
              <div className="mt-8 rounded-3xl bg-slate-950/80 border border-slate-800 p-5">
                <p className="text-sm uppercase tracking-[0.2em] text-orange-400 mb-3">
                  {t("friendSession.tipLabel") || "Tip"}
                </p>
                <p className="text-slate-400 text-sm">
                  {t("friendSession.tipText") ||
                    "If a friend is online, they will receive your invitation instantly."}
                </p>
              </div>
            </aside>
          </section>
        </div>

        <UserSearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          onSearch={handleSearchUsers}
          searchResults={searchResults}
          isLoading={searchLoading}
          error={searchError}
          onInvite={handleSendInvitation}
          invitedIds={invitedIds}
        />
      </div>
    </Layout>
  );
}
