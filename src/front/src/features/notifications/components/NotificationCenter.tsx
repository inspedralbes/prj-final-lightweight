import React, { useEffect, useRef } from "react";
import { useNotification } from "@/features/notifications/context/NotificationContext";
import type { ChatNotification } from "@/features/notifications/context/NotificationContext";
import { X, MessageCircle } from "../../../shared/components/Icons";

interface NotificationCenterProps {
  onChatClick?: (roomId: string) => void;
  /** "top-right" for CLIENT (avoids overlap with floating chat button) */
  position?: "top-right" | "bottom-right";
}

const AUTO_DISMISS_MS = 5000;
const MAX_VISIBLE = 3;

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  onChatClick,
  position = "bottom-right",
}) => {
  const { notifications, markAsRead, dismissedToastIds, dismissToast } =
    useNotification();

  // Only unread chat notifications that haven't been dismissed drive the toasts
  const unreadChats = notifications.filter(
    (n): n is ChatNotification => n.type === "chat" && !n.read,
  );

  // Auto-hide timer: adds to context-level dismissed (survives navigation)
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    unreadChats.forEach((n) => {
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
      if (!unreadChats.some((n) => n.id === id) || dismissedToastIds.has(id)) {
        clearTimeout(timers.current.get(id));
        timers.current.delete(id);
      }
    });
  }, [unreadChats, dismissedToastIds, dismissToast]);

  useEffect(() => {
    return () => {
      timers.current.forEach(clearTimeout);
    };
  }, []);

  const handleClick = (roomId: string, id: string) => {
    markAsRead(id); // clears badge
    dismissToast(id); // hides toast
    onChatClick?.(roomId);
  };

  const extractPreview = (message: string, sender?: string): string => {
    const marker = "enviado: ";
    const idx = message.indexOf(marker);
    if (idx !== -1) return message.slice(idx + marker.length);
    if (sender && message.startsWith(sender + ": ")) {
      return message.slice(sender.length + 2);
    }
    return message;
  };

  const visibleChats = unreadChats.filter((n) => !dismissedToastIds.has(n.id));
  const visible = visibleChats.slice(0, MAX_VISIBLE);
  const overflow = visibleChats.length - MAX_VISIBLE;

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
          onClick={() => handleClick(n.roomId, n.id)}
        >
          <div className="shrink-0 bg-orange-500/15 rounded-lg p-1.5">
            <MessageCircle className="w-3.5 h-3.5 text-orange-400" />
          </div>
          <div className="flex-1 min-w-0">
            {n.senderUsername && (
              <p className="text-[11px] font-semibold text-orange-400 truncate leading-tight">
                {n.senderUsername}
              </p>
            )}
            <p className="text-xs text-gray-300 truncate leading-tight mt-0.5">
              {extractPreview(n.message, n.senderUsername)}
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              dismissToast(n.id); // hide toast only; badge persists until chat opened
            }}
            className="shrink-0 text-gray-600 hover:text-gray-300 transition-colors p-0.5 rounded"
            aria-label="Cerrar notificación"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationCenter;
