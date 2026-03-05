import React, { createContext, useContext, useState, useCallback } from "react";

export interface ChatNotification {
  type: "chat";
  id: string;
  roomId: string;
  senderUsername?: string;
  message: string;
  timestamp: Date;
  read: boolean;
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
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const addNotification = useCallback(
    (roomId: string, message: string, senderUsername?: string) => {
      const id = `${roomId}-${Date.now()}`;
      const notification: ChatNotification = {
        type: "chat",
        id,
        roomId,
        senderUsername,
        message,
        timestamp: new Date(),
        read: false,
      };
      setNotifications((prev) => [notification, ...prev]);
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
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

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
