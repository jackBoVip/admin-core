/**
 * 通知按钮组件
 * @description 显示通知列表
 */
import { LAYOUT_UI_TOKENS, type NotificationItem } from '@admin-core/layout';
import { useState, useCallback, useMemo, useEffect, useRef, memo } from 'react';
import { useLayoutContext } from '../../hooks';
import { renderLayoutIcon } from '../../utils';

const {
  NOTIFICATION_MAX_HEIGHT,
  NOTIFICATION_ITEM_HEIGHT,
} = LAYOUT_UI_TOKENS;

export const NotificationButton = memo(function NotificationButton() {
  const { props, events, t } = useLayoutContext();
  const [isOpen, setIsOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const listResizeObserverRef = useRef<ResizeObserver | null>(null);

  const notifications = useMemo<NotificationItem[]>(
    () => props.notifications || [],
    [props.notifications]
  );

  const unreadCount = useMemo(() => {
    if (props.unreadCount !== undefined) return props.unreadCount;
    let count = 0;
    for (const item of notifications) {
      if (!item.read) count += 1;
    }
    return count;
  }, [props.unreadCount, notifications]);

  const hasUnread = unreadCount > 0;

  const notificationMap = useMemo(() => {
    if (!isOpen) return new Map<string, NotificationItem>();
    const map = new Map<string, NotificationItem>();
    notifications.forEach((item) => {
      map.set(String(item.id), item);
    });
    return map;
  }, [notifications, isOpen]);

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

  const iconMap = useMemo(
    () => ({
      success: renderLayoutIcon('status-success', 'sm'),
      warning: renderLayoutIcon('status-warning', 'sm'),
      error: renderLayoutIcon('status-error', 'sm'),
      info: renderLayoutIcon('status-info', 'sm'),
    }),
    []
  );

  const renderIcon = useCallback(
    (type?: string) => iconMap[type === 'success' || type === 'warning' || type === 'error' ? type : 'info'],
    [iconMap]
  );

  const formattedNotifications = useMemo(() => {
    if (!isOpen) return [];
    return notifications.map((item) => ({
      ...item,
      timeLabel: formatTime(item.time),
    }));
  }, [notifications, formatTime, isOpen]);

  const [itemHeight, setItemHeight] = useState<number>(NOTIFICATION_ITEM_HEIGHT);
  const OVERSCAN = LAYOUT_UI_TOKENS.RESULT_OVERSCAN;
  const totalHeight = formattedNotifications.length * itemHeight;
  const viewportHeight = totalHeight === 0 ? NOTIFICATION_MAX_HEIGHT : Math.min(totalHeight, NOTIFICATION_MAX_HEIGHT);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - OVERSCAN);
  const endIndex = Math.min(
    formattedNotifications.length,
    Math.ceil((scrollTop + viewportHeight) / itemHeight) + OVERSCAN
  );
  const visibleNotifications = useMemo(
    () => formattedNotifications.slice(startIndex, endIndex),
    [formattedNotifications, startIndex, endIndex]
  );

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const nextTop = e.currentTarget.scrollTop;
    setScrollTop((prev) => (prev === nextTop ? prev : nextTop));
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey) return;
    e.preventDefault();
    const target = e.currentTarget;
    target.scrollTop += e.deltaY;
    const nextTop = target.scrollTop;
    setScrollTop((prev) => (prev === nextTop ? prev : nextTop));
  }, []);

  useEffect(() => {
    if (isOpen) return;
    if (listRef.current) {
      listRef.current.scrollTop = 0;
    }
    setScrollTop((prev) => (prev === 0 ? prev : 0));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const list = listRef.current;
    if (!list) return;
    const updateItemHeight = () => {
      const firstItem = list.querySelector('.layout-list-item') as HTMLElement | null;
      if (!firstItem) return;
      const height = firstItem.getBoundingClientRect().height;
      if (height > 0 && height !== itemHeight) {
        setItemHeight(height);
      }
    };
    const frame = requestAnimationFrame(updateItemHeight);
    if (typeof ResizeObserver !== 'undefined') {
      const firstItem = list.querySelector('.layout-list-item') as HTMLElement | null;
      if (firstItem) {
        const observer = new ResizeObserver(updateItemHeight);
        observer.observe(firstItem);
        listResizeObserverRef.current = observer;
      }
    }
    return () => {
      cancelAnimationFrame(frame);
      if (listResizeObserverRef.current) {
        listResizeObserverRef.current.disconnect();
        listResizeObserverRef.current = null;
      }
    };
  }, [isOpen, formattedNotifications.length, itemHeight]);

  useEffect(() => {
    if (!isOpen) return;
    const maxScrollTop = Math.max(0, totalHeight - viewportHeight);
    if (scrollTop <= maxScrollTop) return;
    const nextTop = Math.max(0, maxScrollTop);
    if (listRef.current) {
      listRef.current.scrollTop = nextTop;
    }
    setScrollTop((prev) => (prev === nextTop ? prev : nextTop));
  }, [isOpen, totalHeight, viewportHeight, scrollTop]);

  const handleNotificationItemClick = useCallback(
    (e: React.MouseEvent) => {
      const id = (e.currentTarget as HTMLElement).dataset.id;
      if (!id) return;
      const item = notificationMap.get(id);
      if (!item) return;
      events.onNotificationClick?.(item);
      item.onClick?.();
    },
    [events, notificationMap]
  );

  const handleToggleOpen = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <div
      className="header-widget-dropdown relative"
      data-state={isOpen ? 'open' : 'closed'}
      onMouseLeave={handleClose}
    >
      <button
        type="button"
        className="header-widget-btn relative"
        data-state={isOpen ? 'open' : 'closed'}
        data-unread={hasUnread ? 'true' : undefined}
        onClick={handleToggleOpen}
      >
        {renderLayoutIcon('notification', 'sm')}
        {hasUnread && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="header-widget-dropdown__menu header-widget-dropdown__menu--notification absolute right-0 top-full mt-1"
          data-state="open"
        >
          <div className="header-notification__header">
            <span className="font-medium">{t('layout.notification.title')}</span>
            {hasUnread && (
              <span className="header-notification__meta">
                {unreadCount} {t('layout.notification.unread')}
              </span>
            )}
          </div>

          <div
            className="header-notification__list layout-scroll-container"
            ref={listRef}
            onScroll={handleScroll}
            onWheel={handleWheel}
            style={{ height: `${viewportHeight}px`, position: 'relative' }}
          >
            {formattedNotifications.length === 0 ? (
              <div className="header-notification__empty">{t('layout.notification.empty')}</div>
            ) : (
              <>
                <div style={{ height: `${totalHeight}px`, pointerEvents: 'none' }} />
                {visibleNotifications.map((item, index) => {
                  const actualIndex = startIndex + index;
                  return (
                    <div
                      key={item.id}
                      data-id={String(item.id)}
                      className="header-notification__item layout-list-item"
                      data-read={item.read ? 'true' : 'false'}
                      onClick={handleNotificationItemClick}
                      style={{
                        position: 'absolute',
                        top: `${actualIndex * itemHeight}px`,
                        left: 0,
                        right: 0,
                        height: `${itemHeight}px`,
                      }}
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
                          {!item.read && <span className="header-notification__unread-dot shrink-0" />}
                        </div>
                        {item.description && (
                          <p className="header-notification__description truncate">{item.description}</p>
                        )}
                        <span className="header-notification__time">{item.timeLabel}</span>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          <div className="header-notification__footer">
            <button
              type="button"
              className="header-notification__footer-button"
            >
              {t('layout.notification.markAllRead')}
            </button>
            <div className="header-notification__divider" />
            <button
              type="button"
              className="header-notification__footer-button"
            >
              {t('layout.notification.viewAll')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
