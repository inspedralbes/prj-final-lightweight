import { useEffect, useState } from "react";
import { Search, UserPlus, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { UserSearchResult } from "@/features/workout/services/friendInvitationService";

interface UserSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (query: string) => void;
  searchResults: UserSearchResult[];
  isLoading: boolean;
  error: string | null;
  onInvite: (user: UserSearchResult) => void;
  invitedIds: number[];
  pendingFromIds: number[];
}

export default function UserSearchModal({
  isOpen,
  onClose,
  onSearch,
  searchResults,
  isLoading,
  error,
  onInvite,
  invitedIds,
  pendingFromIds,
}: UserSearchModalProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      return;
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.trim().length < 2) {
      onSearch("");
      return;
    }

    const timeout = window.setTimeout(() => {
      onSearch(query.trim());
    }, 600);

    return () => window.clearTimeout(timeout);
  }, [query, onSearch]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800">
          <div>
            <h2 className="text-xl font-semibold text-white">
              {t("friendSession.searchTitle")}
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              {t("friendSession.searchHint")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label={t("common.close")}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <label className="block text-sm font-medium text-gray-200 mb-2">
            {t("friendSession.searchLabel")}
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 text-white pl-11 pr-4 py-3 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 outline-none"
              placeholder={t("friendSession.searchPlaceholder")}
              autoFocus
            />
          </div>

          <div className="mt-6">
            {error ? (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            {isLoading ? (
              <div className="rounded-lg bg-zinc-800 border border-zinc-700 p-6 text-center text-gray-500">
                {t("friendSession.loadingResults")}
              </div>
            ) : null}

            {!isLoading && query.trim().length > 0 && searchResults.length === 0 ? (
              <div className="rounded-lg bg-zinc-800 border border-zinc-700 p-6 text-center text-gray-500">
                {t("friendSession.noResults")}
              </div>
            ) : null}

            {!isLoading && searchResults.length > 0 && (
              <div className="mt-4 space-y-3">
                {searchResults.map((user) => {
                  const invited = invitedIds.includes(user.id);
                  const hasInvitedMe = pendingFromIds.includes(user.id);
                  const blocked = invited || hasInvitedMe;
                  return (
                    <div
                      key={user.id}
                      className="flex items-center justify-between gap-4 rounded-lg border border-zinc-700 bg-zinc-800 p-4 hover:border-orange-500/30 transition-colors"
                    >
                      <div>
                        <p className="font-semibold text-white">{user.username}</p>
                        <p className="text-sm text-gray-400">{user.role}</p>
                      </div>
                      <button
                        onClick={() => !blocked && onInvite(user)}
                        disabled={blocked}
                        className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${blocked ? "bg-zinc-700 text-gray-400 cursor-not-allowed" : "bg-orange-500 text-white hover:bg-orange-600"}`}
                      >
                        <UserPlus className="w-4 h-4 inline mr-2" />
                        {hasInvitedMe
                          ? t("friendSession.hasInvitedYou")
                          : invited
                          ? t("friendSession.invitedButton")
                          : t("friendSession.inviteButton")}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
