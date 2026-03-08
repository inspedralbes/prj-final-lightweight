import React, { createContext, useContext, useState, useCallback } from "react";

export interface ChatNotification {
  type: "chat";
  id: string;
  roomId: string;
  senderUsername?: string;
  message: string;
  timestamp: Date;
  read: boolean;
  /** Number of unread messages in this room (one notification object = N actual messages) */
  count: number;
}

export interface InviteNotification {
  type: "invite";
  id: string;
  coachId: number;
  coachName: string;
  invitationCode: string;
  invitationId: number;
  timestamp: Date;
  read: boolean;
}

export type AppNotification = ChatNotification | InviteNotification;

interface NotificationContextType {
  notifications: AppNotification[];
  addNotification: (
    roomId: string,
    message: string,
    senderUsername?: string,
    isLive?: boolean,
    initialCount?: number,
  ) => void;
  addInviteNotification: (
    coachId: number,
    coachName: string,
    invitationCode: string,
    invitationId: number,
  ) => void;
  markAsRead: (id: string) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  unreadCount: number;
  /** IDs of toasts the user has dismissed (hidden locally, badge still counts) */
  dismissedToastIds: Set<string>;
  dismissToast: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  // Dismissed toast IDs live here so they survive navigation (component remounts)
  const [dismissedToastIds, setDismissedToastIds] = useState<Set<string>>(
    new Set(),
  );

  const dismissToast = useCallback((id: string) => {
    setDismissedToastIds((prev) => new Set(prev).add(id));
  }, []);

  const addNotification = useCallback(
    (
      roomId: string,
      message: string,
      senderUsername?: string,
      isLive = false,
      initialCount = 1,
    ) => {
      setNotifications((prev) => {
        // Stable ID per room — reuse if an unread notification already exists for this room.
        const existingIdx = prev.findIndex(
          (n): n is ChatNotification =>
            n.type === "chat" && n.roomId === roomId && !n.read,
        );
        const id = existingIdx >= 0 ? prev[existingIdx].id : `chat-${roomId}`;
        if (existingIdx >= 0) {
          if (!isLive) {
            // DB reload: notification already tracked — do not touch count,
            // only update the preview text so it stays current.
            const updated = [...prev];
            const existing = updated[existingIdx] as ChatNotification;
            updated[existingIdx] = { ...existing, message, senderUsername };
            return updated;
          }
          // Live socket message: increment count, update preview
          const updated = [...prev];
          const existing = updated[existingIdx] as ChatNotification;
          updated[existingIdx] = {
            ...existing,
            message,
            senderUsername,
            timestamp: new Date(),
            count: existing.count + 1,
          };
          return updated;
        }
        // First time we see this room — use initialCount from DB grouping or 1 for live
        const notification: ChatNotification = {
          type: "chat",
          id,
          roomId,
          senderUsername,
          message,
          timestamp: new Date(),
          read: false,
          count: initialCount,
        };
        return [notification, ...prev];
      });

      // A genuinely new live message on a dismissed room should un-dismiss
      // so the toast reappears to alert the user.
      if (isLive) {
        setDismissedToastIds((prev) => {
          const stableId = `chat-${roomId}`;
          if (!prev.has(stableId)) return prev;
          const next = new Set(prev);
          next.delete(stableId);
          return next;
        });
      }
    },
    [],
  );

  const addInviteNotification = useCallback(
    (
      coachId: number,
      coachName: string,
      invitationCode: string,
      invitationId: number,
    ) => {
      setNotifications((prev) => {
        // Deduplicar: no añadir si ya existe una notificación para esta invitación
        const alreadyExists = prev.some(
          (n) => n.type === "invite" && n.invitationId === invitationId,
        );
        if (alreadyExists) return prev;
        const id = `invite-${invitationId}`;
        const notification: InviteNotification = {
          type: "invite",
          id,
          coachId,
          coachName,
          invitationCode,
          invitationId,
          timestamp: new Date(),
          read: false,
        };
        return [notification, ...prev];
      });
    },
    [],
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true, count: 0 } : n)),
    );
    // Also clear from dismissed so badge disappears cleanly
    setDismissedToastIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setDismissedToastIds(new Set());
  }, []);

  const unreadCount = notifications.reduce(
    (sum, n) => sum + (n.type === "chat" ? n.count : n.read ? 0 : 1),
    0,
  );

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        addInviteNotification,
        markAsRead,
        removeNotification,
        clearAll,
        unreadCount,
        dismissedToastIds,
        dismissToast,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification debe usarse dentro de NotificationProvider",
    );
  }
  return context;
};
