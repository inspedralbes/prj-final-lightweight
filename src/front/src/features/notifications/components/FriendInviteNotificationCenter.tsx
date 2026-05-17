import React, { useEffect, useRef } from "react";
import { useNotification } from "@/features/notifications/context/NotificationContext";
import type { FriendInviteNotification } from "@/features/notifications/context/NotificationContext";
import { useNavigate } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { X as XIcon } from "../../../shared/components/Icons";

interface FriendInviteNotificationCenterProps {
  position?: "top-right" | "bottom-right";
}

const AUTO_DISMISS_MS = 5000;
const MAX_VISIBLE = 3;

const FriendInviteNotificationCenter: React.FC<FriendInviteNotificationCenterProps> = ({
  position = "bottom-right",
}) => {
  const { notifications, markAsRead, dismissedToastIds, dismissToast } =
    useNotification();
  const navigate = useNavigate();

  // Only unread friend invite notifications that haven't been dismissed drive the toasts
  const unreadFriendInvites = notifications.filter(
    (n): n is FriendInviteNotification => n.type === "friend-invite" && !n.read,
  );

  // Auto-hide timer: adds to context-level dismissed (survives navigation)
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    unreadFriendInvites.forEach((n) => {
      if (!timers.current.has(n.id) && !dismissedToastIds.has(n.id)) {
        const t = setTimeout(() => {
          dismissToast(n.id);
          timers.current.delete(n.id);
        }, AUTO_DISMISS_MS);
        timers.current.set(n.id, t);
      }
    });

    // Clear timers for notifications that are gone or already dismissed
    timers.current.forEach((_t, id) => {
      if (!unreadFriendInvites.some((n) => n.id === id) || dismissedToastIds.has(id)) {
        clearTimeout(timers.current.get(id));
        timers.current.delete(id);
      }
    });
  }, [unreadFriendInvites, dismissedToastIds, dismissToast]);

  useEffect(() => {
    return () => {
      timers.current.forEach(clearTimeout);
    };
  }, []);

  const handleClick = (id: string) => {
    markAsRead(id); // clears badge
    dismissToast(id); // hides toast
    // Navigate to friend session
    navigate("/friend-session");
  };

  const visibleInvites = unreadFriendInvites.filter((n) => !dismissedToastIds.has(n.id));
  const visible = visibleInvites.slice(0, MAX_VISIBLE);
  const overflow = visibleInvites.length - MAX_VISIBLE;

  if (visible.length === 0) return null;

  const positionClass =
    position === "top-right" ? "top-6 right-4" : "bottom-6 right-4";
  const stackDirection =
    position === "top-right" ? "flex-col" : "flex-col-reverse";

  return (
    <div
      className={`fixed ${positionClass} z-50 flex ${stackDirection} gap-2 items-end pointer-events-none`}
    >
      {overflow > 0 && (
        <p className="text-[11px] text-gray-500 pr-1 pointer-events-auto">
          +{overflow} más
        </p>
      )}
      {visible.map((n) => (
        <div
          key={n.id}
          className="pointer-events-auto flex items-center gap-3 bg-[#1c1c1c] border border-[#2e2e2e] text-white rounded-xl px-3.5 py-2.5 shadow-2xl shadow-black/50 cursor-pointer hover:border-orange-500/40 hover:bg-[#222] transition-all duration-200 w-72 max-w-[90vw] animate-in slide-in-from-right-4 fade-in duration-300"
          onClick={() => handleClick(n.id)}
        >
          <div className="shrink-0 bg-orange-500/15 rounded-lg p-1.5">
            <UserPlus className="w-3.5 h-3.5 text-orange-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-orange-400 truncate leading-tight">
              {n.inviterUsername}
            </p>
            <p className="text-xs text-gray-300 truncate leading-tight mt-0.5">
              quiere entrenar contigo
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              dismissToast(n.id); // hide toast only; badge persists until accepted
            }}
            className="shrink-0 text-gray-600 hover:text-gray-300 transition-colors p-0.5 rounded"
            aria-label="Cerrar notificación"
          >
            <XIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default FriendInviteNotificationCenter;
