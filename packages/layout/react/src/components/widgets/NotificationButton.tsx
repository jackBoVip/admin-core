/**
 * 通知按钮组件
 * @description 显示通知列表
 */
import { LAYOUT_UI_TOKENS, type NotificationItem } from '@admin-core/layout';
import { useListItemHeight, useOpenState, useVirtualListScroll } from '@admin-core/shared-react';
import { useState, useCallback, useMemo, useRef, memo } from 'react';
import { useLayoutContext } from '../../hooks';
import { renderLayoutIcon } from '../../utils';

const {
  NOTIFICATION_MAX_HEIGHT,
  NOTIFICATION_ITEM_HEIGHT,
} = LAYOUT_UI_TOKENS;

/**
 * 通知按钮组件。
 * @description 展示通知数量、下拉列表与滚动交互，并派发通知点击事件。
 */
export const NotificationButton = memo(function NotificationButton() {
  /**
   * 布局上下文能力。
   * @description 提供通知数据、国际化函数与事件回调。
   */
  const { props, events, t } = useLayoutContext();
  /**
   * 下拉展开状态与控制方法。
   */
  const { isOpen, close: handleClose, toggle: handleToggleOpen } = useOpenState();
  /**
   * 通知列表容器引用。
   * @description 供虚拟列表滚动计算与事件绑定使用。
   */
  const listRef = useRef<HTMLDivElement>(null);

  /**
   * 通知列表数据，统一做空值兜底。
   */
  const notifications = useMemo<NotificationItem[]>(
    () => props.notifications || [],
    [props.notifications]
  );

  /**
   * 未读数量，优先使用外部显式传入值，否则按通知读状态实时统计。
   */
  const unreadCount = useMemo(() => {
    if (props.unreadCount !== undefined) return props.unreadCount;
    let count = 0;
    for (const item of notifications) {
      if (!item.read) count += 1;
    }
    return count;
  }, [props.unreadCount, notifications]);

  /**
   * 是否存在未读通知。
   */
  const hasUnread = unreadCount > 0;

  /**
   * 以通知 ID 建立索引，便于点击事件从 DOM 数据属性快速反查对象。
   */
  const notificationMap = useMemo(() => {
    if (!isOpen) return new Map<string, NotificationItem>();
    const map = new Map<string, NotificationItem>();
    notifications.forEach((item) => {
      map.set(String(item.id), item);
    });
    return map;
  }, [notifications, isOpen]);

  /**
   * 将通知时间格式化为相对时间文本。
   *
   * @param time 通知时间。
   * @returns 可读时间文案。
   */
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

  /**
   * 通知类型与图标映射表。
   */
  const iconMap = useMemo(
    () => ({
      success: renderLayoutIcon('status-success', 'sm'),
      warning: renderLayoutIcon('status-warning', 'sm'),
      error: renderLayoutIcon('status-error', 'sm'),
      info: renderLayoutIcon('status-info', 'sm'),
    }),
    []
  );

  /**
   * 根据通知类型渲染对应图标。
   *
   * @param type 通知类型。
   * @returns 图标节点。
   */
  const renderIcon = useCallback(
    (type?: string) => iconMap[type === 'success' || type === 'warning' || type === 'error' ? type : 'info'],
    [iconMap]
  );

  /**
   * 通知渲染数据，补充格式化后的时间文案。
   */
  const formattedNotifications = useMemo(() => {
    if (!isOpen) return [];
    return notifications.map((item) => ({
      ...item,
      timeLabel: formatTime(item.time),
    }));
  }, [notifications, formatTime, isOpen]);

  const [itemHeight, setItemHeight] = useState<number>(NOTIFICATION_ITEM_HEIGHT);
  /**
   * 虚拟列表超扫行数。
   * @description 预渲染视口上下少量项以减少滚动白屏。
   */
  const OVERSCAN = LAYOUT_UI_TOKENS.RESULT_OVERSCAN;
  /**
   * 虚拟列表总高度。
   */
  const totalHeight = formattedNotifications.length * itemHeight;
  /**
   * 虚拟列表视口高度。
   */
  const viewportHeight = totalHeight === 0 ? NOTIFICATION_MAX_HEIGHT : Math.min(totalHeight, NOTIFICATION_MAX_HEIGHT);
  const { scrollTop, handleScroll, handleWheel } = useVirtualListScroll({
    isOpen,
    listRef,
    totalHeight,
    viewportHeight,
  });
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - OVERSCAN);
  /**
   * 虚拟列表结束索引（不包含）。
   */
  const endIndex = Math.min(
    formattedNotifications.length,
    Math.ceil((scrollTop + viewportHeight) / itemHeight) + OVERSCAN
  );
  /**
   * 当前可见区通知项集合。
   */
  const visibleNotifications = useMemo(
    () => formattedNotifications.slice(startIndex, endIndex),
    [formattedNotifications, startIndex, endIndex]
  );

  useListItemHeight({
    isOpen,
    listRef,
    itemHeight,
    itemCount: formattedNotifications.length,
    setItemHeight,
  });

  /**
   * 处理通知项点击并触发外部回调/内置点击逻辑。
   *
   * @param e React 鼠标事件对象。
   */
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
