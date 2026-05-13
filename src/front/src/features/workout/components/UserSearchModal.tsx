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
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [query, onSearch]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-3xl bg-[#0f172a] border border-slate-700 rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-white">
              {t("friendSession.searchTitle") || "Search online friends"}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {t("friendSession.searchHint") ||
                "Type at least 2 characters to find online users."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
            aria-label={t("common.close") || "Close"}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <label className="block text-sm font-medium text-slate-200 mb-2">
            {t("friendSession.searchPlaceholder") || "Search by username or email"}
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 text-white pl-11 pr-4 py-3 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 outline-none"
              placeholder={
                t("friendSession.searchPlaceholder") || "Search by username or email"
              }
              autoFocus
            />
          </div>

          <div className="mt-6">
            {error ? (
              <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            {isLoading ? (
              <div className="rounded-2xl bg-slate-900 border border-slate-700 p-6 text-center text-slate-500">
                {t("friendSession.loadingResults") || "Searching online users..."}
              </div>
            ) : null}

            {!isLoading && query.trim().length > 0 && searchResults.length === 0 ? (
              <div className="rounded-2xl bg-slate-900 border border-slate-700 p-6 text-center text-slate-500">
                {t("friendSession.noResults") || "No users found online."}
              </div>
            ) : null}

            {!isLoading && searchResults.length > 0 && (
              <div className="mt-4 space-y-4">
                {searchResults.map((user) => {
                  const invited = invitedIds.includes(user.id);
                  return (
                    <div
                      key={user.id}
                      className="flex flex-col gap-3 rounded-3xl border border-slate-700 bg-slate-900 p-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-semibold text-white">{user.username}</p>
                          <p className="text-sm text-slate-400">
                            {user.role}
                          </p>
                        </div>
                        <button
                          onClick={() => onInvite(user)}
                          disabled={invited}
                          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${invited ? "bg-slate-700 text-slate-400 cursor-not-allowed" : "bg-orange-500 text-white hover:bg-orange-600"}`}
                        >
                          <UserPlus className="w-4 h-4 inline mr-2" />
                          {invited
                            ? t("friendSession.inviteSentButton") || "Invited"
                            : t("friendSession.sendInvite") || "Send invite"}
                        </button>
                      </div>
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
