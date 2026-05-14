import { CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { FriendInvitation } from "@/features/workout/services/friendInvitationService";

interface PendingInvitationCardProps {
  invitation: FriendInvitation;
  onAccept: () => void;
  onReject: () => void;
  loadingAccept: boolean;
  loadingReject: boolean;
}

export default function PendingInvitationCard({
  invitation,
  onAccept,
  onReject,
  loadingAccept,
  loadingReject,
}: PendingInvitationCardProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 hover:border-orange-500/30 transition-colors">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-orange-500 font-semibold mb-1">
            {t("friendSession.pendingInvite")}
          </p>
          <p className="text-lg font-semibold text-white">
            {invitation.inviter.username}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {t("friendSession.inviteFrom")}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <button
          onClick={onReject}
          disabled={loadingReject}
          className="w-full sm:w-auto rounded-lg border border-zinc-700 bg-transparent px-4 py-3 text-sm font-semibold text-gray-200 hover:border-red-400 hover:text-red-300 transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loadingReject ? t("common.cancel") : t("friendSession.rejectButton")}
        </button>
        <button
          onClick={onAccept}
          disabled={loadingAccept}
          className="w-full sm:w-auto rounded-lg bg-orange-500 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-600 transition disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          {loadingAccept ? t("common.saving") : t("friendSession.acceptButton")}
        </button>
      </div>
    </div>
  );
}
