import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Clock } from "lucide-react";
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

  // Invitations received (where I am the invitee)
  const [pendingInvites, setPendingInvites] = useState<FriendInvitation[]>([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [activeInviteId, setActiveInviteId] = useState<number | null>(null);
  const [rejectingInviteId, setRejectingInviteId] = useState<number | null>(null);

  // Invitations sent (where I am the inviter, waiting for response)
  const [sentInvites, setSentInvites] = useState<FriendInvitation[]>([]);

  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [invitedIds, setInvitedIds] = useState<number[]>([]);

  const getErrorMessage = (error: any, defaultMsg: string): string => {
    if (axios.isAxiosError(error)) {
      return error.response?.data?.message || error.message || defaultMsg;
    }
    return error instanceof Error ? error.message : defaultMsg;
  };

  const loadPendingInvitations = useCallback(async () => {
    try {
      setPendingLoading(true);
      const [received, sent] = await Promise.all([
        friendInvitationService.getPendingInvitations(),
        friendInvitationService.getSentInvitations(),
      ]);
      setPendingInvites(received);
      setSentInvites(sent);
    } catch (error) {
      console.error("Error loading invitations", error);
    } finally {
      setPendingLoading(false);
    }
  }, []);

  const refreshSentInvitations = useCallback(async () => {
    try {
      const sent = await friendInvitationService.getSentInvitations();
      setSentInvites(sent);
    } catch (error) {
      console.error("Error refreshing sent invitations", error);
    }
  }, []);

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
        setSearchError(t("friendSession.searchError"));
        setSearchResults([]);
      } finally {
        if (requestId === searchRequestIdRef.current) setSearchLoading(false);
      }
    },
    [t],
  );

  const silentRefresh = useCallback(async () => {
    try {
      const [received, sent] = await Promise.all([
        friendInvitationService.getPendingInvitations(),
        friendInvitationService.getSentInvitations(),
      ]);
      setPendingInvites(received);
      setSentInvites(sent);
    } catch (error) {
      console.error("Error refreshing invitations", error);
    }
  }, []);

  // Initial load (with spinner) + silent polling every 15s
  useEffect(() => {
    loadPendingInvitations();
    const interval = window.setInterval(silentRefresh, 15000);
    return () => window.clearInterval(interval);
  }, [loadPendingInvitations, silentRefresh]);

  // Socket: new invitation received → silent reload + toast
  useEffect(() => {
    const handleInviteNotification = () => {
      silentRefresh();
      toast.success(t("friendSession.notificationReceived"));
    };
    window.addEventListener("friend-invite:notify", handleInviteNotification);
    return () => window.removeEventListener("friend-invite:notify", handleInviteNotification);
  }, [silentRefresh, t, toast]);

  // Socket: my invitation was rejected → remove from sent list + toast
  useEffect(() => {
    const handleRejected = (event: Event) => {
      const payload = (event as CustomEvent).detail;
      const invitationId = payload?.invitation?.id;
      const inviteeName = payload?.invitation?.invitee?.username;
      const inviteeId = payload?.invitation?.invitee?.id;
      if (invitationId) {
        setSentInvites((list) => list.filter((inv) => inv.id !== invitationId));
        if (inviteeId) setInvitedIds((ids) => ids.filter((id) => id !== inviteeId));
      }
      toast.error(
        inviteeName
          ? t("friendSession.inviteRejectedByUser", { username: inviteeName })
          : t("friendSession.rejectSuccess"),
      );
    };
    window.addEventListener("friend-invite:rejected", handleRejected);
    return () => { window.removeEventListener("friend-invite:rejected", handleRejected); };
  }, [t, toast]);

  // Socket: invitation accepted → host navigates to the room
  useEffect(() => {
    const handleAccepted = (event: Event) => {
      const payload = (event as CustomEvent).detail;
      console.log("[DEBUG-CSL] friend-invite:accepted window event FIRED", payload);
      if (payload?.roomId) {
        console.log(`[DEBUG-CSL] Navigating to /room/${payload.roomId} with isHost=true`);
        navigate(`/room/${payload.roomId}`, { state: { isHost: true } });
      }
    };
    window.addEventListener("friend-invite:accepted", handleAccepted);
    return () => { window.removeEventListener("friend-invite:accepted", handleAccepted); };
  }, [navigate]);

  const handleSendInvitation = async (user: UserSearchResult) => {
    if (invitedIds.includes(user.id)) return;

    const removeFromSearch = (currentResults: UserSearchResult[]) =>
      currentResults.filter((item) => item.id !== user.id);

    try {
      const invitation = await friendInvitationService.sendInvitation(user.id);
      setInvitedIds((ids) => [...ids, user.id]);
      setSearchResults(removeFromSearch);
      // Optimistic add, then confirm with server
      setSentInvites((list) => [invitation, ...list]);
      toast.success(t("friendSession.inviteSentToast", { username: user.username }));
      // Reload from server to ensure consistency
      refreshSentInvitations();
    } catch (error) {
      console.error("Send invitation failed", error);
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        setInvitedIds((ids) => [...ids, user.id]);
        setSearchResults(removeFromSearch);
        toast.info(t("friendSession.inviteAlreadySent", { username: user.username }));
        refreshSentInvitations();
      } else {
        toast.error(getErrorMessage(error, t("friendSession.sendInviteFailed") || "Could not send invitation."));
      }
    }
  };

  const handleAccept = async (invitationId: number) => {
    try {
      setActiveInviteId(invitationId);
      const result = await friendInvitationService.acceptInvitation(invitationId);
      setPendingInvites((list) => list.filter((inv) => inv.id !== invitationId));
      toast.success(t("friendSession.acceptSuccess"));
      navigate(`/room/${result.roomId}`, { state: { isHost: false } });
    } catch (error) {
      toast.error(getErrorMessage(error, t("friendSession.acceptError")));
    } finally {
      setActiveInviteId(null);
    }
  };

  const handleReject = async (invitationId: number) => {
    try {
      setRejectingInviteId(invitationId);
      await friendInvitationService.rejectInvitation(invitationId);
      setPendingInvites((list) => list.filter((inv) => inv.id !== invitationId));
      toast.success(t("friendSession.rejectSuccess"));
    } catch (error) {
      toast.error(getErrorMessage(error, t("friendSession.rejectError")));
    } finally {
      setRejectingInviteId(null);
    }
  };

  const inviteButtonText = useMemo(
    () => t("friendSession.openSearchButton"),
    [t],
  );

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-950 to-black p-4 md:p-8">
        <div className="mx-auto max-w-7xl space-y-8">

          {/* Header */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-orange-500 font-semibold mb-1">
                {t("friendSession.sectionLabel")}
              </p>
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                {t("friendSession.mainTitle")}
              </h1>
              <p className="max-w-2xl text-gray-400 mt-1">
                {t("friendSession.mainSubtitle")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="shrink-0 rounded-lg bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
            >
              {inviteButtonText}
            </button>
          </div>

          {/* Sent invitations (waiting for response) */}
          {sentInvites.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-orange-500/30 transition-colors">
              <h2 className="text-lg font-bold text-white mb-4">
                {t("friendSession.sentTitle")}
              </h2>
              <div className="space-y-3">
                {sentInvites.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between gap-4 rounded-lg border border-zinc-700 bg-zinc-800 px-5 py-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-500/15 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-orange-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">{inv.invitee.username}</p>
                        <p className="text-xs text-gray-400">{t("friendSession.sentWaiting")}</p>
                      </div>
                    </div>
                    <span className="flex items-center gap-1.5 text-xs text-orange-400 font-medium bg-orange-500/10 border border-orange-500/20 rounded-full px-3 py-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                      {t("friendSession.sentPending")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Received invitations */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 hover:border-orange-500/30 transition-colors">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {t("friendSession.pendingTitle")}
                </h2>
                <p className="text-sm text-gray-400">
                  {t("friendSession.pendingSubtitle")}
                </p>
              </div>
              <span className="inline-flex items-center rounded-full bg-zinc-800 border border-zinc-700 px-3 py-1 text-sm font-semibold text-gray-300">
                {pendingInvites.length} {t("friendSession.pendingCountSuffix")}
              </span>
            </div>

            {pendingLoading ? (
              <div className="rounded-lg border border-zinc-700 bg-zinc-800 p-8 text-center text-gray-400">
                {t("friendSession.loadingPending")}
              </div>
            ) : pendingInvites.length === 0 ? (
              <div className="rounded-lg border border-dashed border-zinc-700 bg-zinc-950 p-10 text-center">
                <p className="text-lg font-medium text-white">
                  {t("friendSession.noPendingTitle")}
                </p>
                <p className="mt-3 text-sm text-gray-400">
                  {t("friendSession.noPendingSubtitle")}
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

        <UserSearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          onSearch={handleSearchUsers}
          searchResults={searchResults}
          isLoading={searchLoading}
          error={searchError}
          onInvite={handleSendInvitation}
          invitedIds={invitedIds}
          pendingFromIds={pendingInvites.map((inv) => inv.inviter.id)}
        />
      </div>
    </Layout>
  );
}
