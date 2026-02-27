import React, { useState } from 'react';
import { useNotification } from '../context/NotificationContext';
import { X, MessageCircle } from './Icons';

interface NotificationCenterProps {
  onChatClick?: (roomId: string) => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ onChatClick }) => {
  const { notifications, markAsRead, removeNotification, unreadCount } = useNotification();
  const [expanded, setExpanded] = useState(false);

  const truncateText = (text: string, maxLength: number = 50) => {
    if (text.length > maxLength) {
      return text.substring(0, maxLength) + '...';
    }
    return text;
  };

  const handleClick = (roomId: string, id: string) => {
    markAsRead(id);
    onChatClick?.(roomId);
    setExpanded(false);
  };

  return (
    <div className="fixed bottom-20 right-4 space-y-2 z-50 max-w-sm">
      {/* Badge de notificaciones con toggle */}
      {unreadCount > 0 && (
        <div className="flex justify-end">
          <button
            onClick={() => setExpanded(!expanded)}
            className="bg-orange-500 hover:bg-orange-600 text-white rounded-full w-12 h-12 flex items-center justify-center text-sm font-bold shadow-lg hover:shadow-xl transition-all"
            title={`${unreadCount} notificaciones sin leer`}
          >
            {unreadCount}
          </button>
        </div>
      )}

      {/* Lista de notificaciones expandida */}
      {expanded && (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-3 space-y-2 shadow-2xl max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="text-gray-500 text-sm text-center py-4">
              No hay notificaciones
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg border transition-all cursor-pointer hover:border-orange-500/50 ${
                  notification.read
                    ? 'bg-[#0a0a0a] border-[#2a2a2a] text-gray-400'
                    : 'bg-orange-500/10 border-orange-500/30 text-white'
                }`}
                onClick={() => handleClick(notification.roomId, notification.id)}
              >
                <div className="flex items-start gap-2">
                  <MessageCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium line-clamp-2">
                      {truncateText(
                        notification.senderUsername
                          ? `${notification.senderUsername}: ${notification.message}`
                          : notification.message
                      )}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-1">
                      {notification.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNotification(notification.id);
                    }}
                    className="flex-shrink-0 text-gray-500 hover:text-gray-300 p-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Lista flotante de notificaciones sin expandir (antigua versión) */}
      {!expanded && notifications.slice(0, 2).map((notification) => (
        <div
          key={notification.id}
          className={`p-3 rounded-lg border transition-all cursor-pointer hover:border-orange-500/50 ${
            notification.read
              ? 'bg-[#1a1a1a] border-[#2a2a2a] text-gray-400'
              : 'bg-orange-500 border-orange-600 text-white shadow-lg shadow-orange-500/20'
          }`}
          onClick={() => handleClick(notification.roomId, notification.id)}
        >
          <div className="flex items-start gap-2">
            <MessageCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium line-clamp-2">
                {truncateText(
                  notification.senderUsername
                    ? `${notification.senderUsername}: ${notification.message}`
                    : notification.message
                )}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeNotification(notification.id);
              }}
              className={`flex-shrink-0 ${
                notification.read ? 'text-gray-500 hover:text-gray-400' : 'text-white hover:text-orange-100'
              } p-1`}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationCenter;
