import React, { useState, useRef, useEffect } from 'react';
import { Bell, AlertTriangle, CheckCircle2, Droplets, ArrowRight, Check } from 'lucide-react';
import { AppNotification } from '../types';
import { dbStore } from '../services/store';

interface NotificationBellProps {
  userId?: string;
  userRole?: string;
  onRequestSelect?: (requestId: string) => void;
}

export function NotificationBell({ userId, onRequestSelect }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      const all = dbStore.getNotifications();
      // Filter for this user or global
      const filtered = all.filter((n) => {
        if (!userId) return true;
        return n.receiverId === userId || n.receiverId === 'all';
      });
      setNotifications(filtered);
    };

    update();
    return dbStore.subscribe(update);
  }, [userId]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    dbStore.markAllNotificationsAsRead(userId);
  };

  const handleItemClick = (notif: AppNotification) => {
    dbStore.markNotificationAsRead(notif.notificationId);
    if (notif.requestId && onRequestSelect) {
      onRequestSelect(notif.requestId);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        id="notification-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white border border-slate-200 shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800 text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-rose-100 text-rose-700">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No notifications right now
              </div>
            ) : (
              notifications.slice(0, 15).map((notif) => {
                const isCritical = notif.priority === 'CRITICAL';
                return (
                  <div
                    key={notif.notificationId}
                    onClick={() => handleItemClick(notif)}
                    className={`p-3.5 text-left cursor-pointer transition-colors hover:bg-slate-50 flex items-start gap-3 ${
                      !notif.read ? 'bg-rose-50/40' : ''
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                        isCritical
                          ? 'bg-rose-100 text-rose-600'
                          : notif.type === 'DONOR_RESPONSE' || notif.type === 'REQUEST_FULFILLED'
                          ? 'bg-emerald-100 text-emerald-600'
                          : 'bg-blue-100 text-blue-600'
                      }`}
                    >
                      {isCritical ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : notif.type === 'REQUEST_FULFILLED' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Droplets className="w-4 h-4" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h5
                          className={`text-xs font-semibold truncate ${
                            !notif.read ? 'text-slate-900' : 'text-slate-700'
                          }`}
                        >
                          {notif.title}
                        </h5>
                        {!notif.read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                      <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
                        <span>
                          {new Date(notif.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {notif.requestId && (
                          <span className="text-rose-600 font-medium flex items-center gap-0.5">
                            View details <ArrowRight className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
