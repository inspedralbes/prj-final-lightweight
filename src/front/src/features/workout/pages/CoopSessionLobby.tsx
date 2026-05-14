import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import axios from "axios";

export default function CoopSessionLobby() {
  const { t } = useTranslation();
  const navigate = useNavigate();
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

  // Helper to extract error message from Axios or regular errors
  const getErrorMessage = (error: any, defaultMsg: string): string => {
    if (axios.isAxiosError(error)) {
      if (error.response?.data?.message) {
        return error.response.data.message;
      } else if (error.message) {
        return error.message;
      }
    } else if (error instanceof Error) {
      return error.message;
    }
    return defaultMsg;
  };

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

  const searchRequestIdRef = useRef(0);

  const handleSearchUsers = useCallback(
    async (query: string) => {
      const trimmedQuery = query.trim();
      if (trimmedQuery.length < 2) {
        searchRequestIdRef.current += 1;
        setSearchResults([]);
        setSearchError(null);
        setSearchLoading(false);
        return;
      }

      const requestId = ++searchRequestIdRef.current;
      try {
        setSearchLoading(true);
        setSearchError(null);
        const results = await friendInvitationService.searchUsers(trimmedQuery);
        if (requestId !== searchRequestIdRef.current) return;
        setSearchResults(results);
      } catch (error) {
        if (requestId !== searchRequestIdRef.current) return;
        console.error("Search error", error);
        setSearchError(
          t("friendSession.searchError") || "Could not search for users.",
        );
        setSearchResults([]);
      } finally {
        if (requestId === searchRequestIdRef.current) {
          setSearchLoading(false);
        }
      }
    },
    [t],
  );

  useEffect(() => {
    loadPendingInvitations();
    const interval = window.setInterval(loadPendingInvitations, 30000); // Increased to 30s to reduce API calls
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

  const handleSendInvitation = async (user: UserSearchResult) => {
    if (invitedIds.includes(user.id)) return;

    const removeFromSearch = (currentResults: UserSearchResult[]) =>
      currentResults.filter((item) => item.id !== user.id);

    try {
      const invitation = await friendInvitationService.sendInvitation(user.id);
      setInvitedIds((ids) => [...ids, user.id]);
      setSearchResults(removeFromSearch);
      setPendingInvites((list) => [invitation, ...list]);
      toast.success(
        t("friendSession.inviteSentToast", { username: user.username }) ||
          `Invitation sent to ${user.username}`,
      );
    } catch (error) {
      console.error("Send invitation failed", error);
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        // Invitation already exists, mark as invited and remove from search results
        setInvitedIds((ids) => [...ids, user.id]);
        setSearchResults(removeFromSearch);
        toast.info(
          t("friendSession.inviteAlreadySent", { username: user.username }) ||
            `Invitation already sent to ${user.username}`,
        );
      } else {
        const message = getErrorMessage(
          error,
          t("friendSession.sendInviteFailed") || "Could not send invitation.",
        );
        toast.error(message);
      }
    }
  };

  const handleAccept = async (invitationId: number) => {
    try {
      setActiveInviteId(invitationId);
      const result = await friendInvitationService.acceptInvitation(invitationId);
      setPendingInvites((list) =>
        list.filter((invite) => invite.id !== invitationId),
      );
      toast.success(
        t("friendSession.acceptSuccess") || "Invitation accepted.",
      );
      // Navigate to the room immediately after acceptance as guest
      navigate(`/room/${result.roomId}`, { state: { isHost: false } });
    } catch (error) {
      console.error("Accept failed", error);
      const message = getErrorMessage(
        error,
        t("friendSession.acceptError") || "Unable to accept invitation.",
      );
      toast.error(message);
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
      const message = getErrorMessage(
        error,
        t("friendSession.rejectError") || "Unable to reject invitation.",
      );
      toast.error(message);
    } finally {
      setRejectingInviteId(null);
    }
  };

  const pendingCount = pendingInvites.length;
  const inviteButtonText = useMemo(
    () => t("friendSession.openSearchButton") || "Buscar amigos para invitar",
    [t],
  );

  return (
    <Layout>
      <div className="min-h-screen bg-[#0a0a0a] p-4 md:p-8">
        <div className="mx-auto max-w-7xl space-y-10">
          <div className="rounded-[2rem] border border-slate-900 bg-[#0a0a0a] p-8 shadow-2xl shadow-orange-500/5">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-orange-400 font-semibold">
                  {t("friendSession.sectionLabel") || "ENTRENAMIENTO CON AMIGO"}
                </p>
                <h1 className="text-4xl font-bold text-white">
                  {t("friendSession.mainTitle") || "Sesión con amigo"}
                </h1>
                <p className="max-w-2xl text-slate-400 leading-7 mt-3">
                  {t("friendSession.mainSubtitle") ||
                    "Crea o únete a una sesión de entrenamiento en vivo con un amigo."}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
              >
                {inviteButtonText}
              </button>
            </div>
          </div>

          <section className="grid gap-8 xl:grid-cols-[1.4fr_0.9fr]">
            <div className="rounded-[2rem] border border-slate-900 bg-[#0a0a0a] p-8 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-white">
                    {t("friendSession.pendingTitle") || "Invitaciones pendientes"}
                  </h2>
                  <p className="text-sm text-slate-400">
                    {t("friendSession.pendingSubtitle") ||
                      "Revisa las invitaciones de amigos y acepta o rechaza desde aquí."}
                  </p>
                </div>
                <span className="inline-flex items-center rounded-full bg-slate-800 px-3 py-1 text-sm font-semibold text-slate-300">
                  {pendingCount} {t("friendSession.pendingCountSuffix") || "pendientes"}
                </span>
              </div>

              {pendingLoading ? (
                <div className="rounded-[1.5rem] border border-slate-700 bg-slate-900 p-8 text-center text-slate-400">
                  {t("friendSession.loadingPending") || "Cargando tus invitaciones..."}
                </div>
              ) : pendingInvites.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-slate-800 bg-[#060606] p-10 text-center text-slate-500">
                  <p className="text-lg font-medium text-white">
                    {t("friendSession.noPendingTitle") || "No hay invitaciones pendientes"}
                  </p>
                  <p className="mt-3 text-sm text-slate-400">
                    {t("friendSession.noPendingSubtitle") ||
                      "Cuando un amigo te invite, la invitación aparecerá aquí."}
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
