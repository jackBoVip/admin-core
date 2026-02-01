/**
 * 通知按钮组件
 * @description 显示通知列表
 */
import { useState, useCallback, useMemo, memo } from 'react';
import { useLayoutContext } from '../../hooks';
import type { NotificationItem } from '@admin-core/layout';

export const NotificationButton = memo(function NotificationButton() {
  const { props, events, t } = useLayoutContext();
  const [isOpen, setIsOpen] = useState(false);

  const notifications = useMemo<NotificationItem[]>(
    () => props.notifications || [],
    [props.notifications]
  );

  const unreadCount = useMemo(
    () => props.unreadCount ?? notifications.filter((n) => !n.read).length,
    [props.unreadCount, notifications]
  );

  const hasUnread = unreadCount > 0;

  const handleNotificationClick = useCallback(
    (item: NotificationItem) => {
      events.onNotificationClick?.(item);
      item.onClick?.();
    },
    [events]
  );

  const formatTime = useCallback(
    (time?: Date | string) => {
      if (!time) return '';
      const date = time instanceof Date ? time : new Date(time);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 1) return t('layout.notification.justNow');
      if (minutes < 60) return `${minutes} ${t('layout.notification.minutesAgo')}`;
      if (hours < 24) return `${hours} ${t('layout.notification.hoursAgo')}`;
      if (days < 7) return `${days} ${t('layout.notification.daysAgo')}`;

      return date.toLocaleDateString();
    },
    [t]
  );

  const renderIcon = useCallback((type?: string) => {
    switch (type) {
      case 'success':
        return (
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M20 6 9 17l-5-5" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
        );
      case 'error':
        return (
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="10" />
            <path d="m15 9-6 6" />
            <path d="m9 9 6 6" />
          </svg>
        );
      default:
        return (
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
        );
    }
  }, []);

  return (
    <div className="header-widget-dropdown relative" onMouseLeave={() => setIsOpen(false)}>
      <button
        type="button"
        className="header-widget-btn relative"
        title={t('layout.header.notifications')}
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {hasUnread && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="header-widget-dropdown__menu absolute right-0 top-full z-50 mt-1 w-80 rounded-lg border bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between border-b px-4 py-3 dark:border-gray-700">
            <span className="font-medium">{t('layout.notification.title')}</span>
            {hasUnread && (
              <span className="text-xs text-gray-500">
                {unreadCount} {t('layout.notification.unread')}
              </span>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-gray-400">{t('layout.notification.empty')}</div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  className={`flex cursor-pointer gap-3 border-b px-4 py-3 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50 ${
                    !item.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                  }`}
                  onClick={() => handleNotificationClick(item)}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      item.type === 'success'
                        ? 'bg-green-100 text-green-500 dark:bg-green-900/30'
                        : item.type === 'warning'
                        ? 'bg-yellow-100 text-yellow-500 dark:bg-yellow-900/30'
                        : item.type === 'error'
                        ? 'bg-red-100 text-red-500 dark:bg-red-900/30'
                        : 'bg-blue-100 text-blue-500 dark:bg-blue-900/30'
                    }`}
                  >
                    {renderIcon(item.type)}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-start justify-between gap-2">
                      <span className={`truncate font-medium ${!item.read ? 'text-gray-900 dark:text-gray-100' : ''}`}>
                        {item.title}
                      </span>
                      {!item.read && <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />}
                    </div>
                    {item.description && (
                      <p className="mt-0.5 truncate text-sm text-gray-500">{item.description}</p>
                    )}
                    <span className="mt-1 text-xs text-gray-400">{formatTime(item.time)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex border-t dark:border-gray-700">
            <button
              type="button"
              className="flex-1 py-2.5 text-sm text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700 dark:hover:bg-gray-700/50"
            >
              {t('layout.notification.markAllRead')}
            </button>
            <div className="w-px bg-gray-200 dark:bg-gray-700" />
            <button
              type="button"
              className="flex-1 py-2.5 text-sm text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700 dark:hover:bg-gray-700/50"
            >
              {t('layout.notification.viewAll')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
