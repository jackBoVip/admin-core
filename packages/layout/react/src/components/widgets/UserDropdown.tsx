/**
 * 用户下拉菜单组件
 * @description 显示用户信息和操作菜单
 */
import { useOpenState } from '@admin-core/shared-react';
import { useCallback, useMemo, memo, type ReactNode } from 'react';
import { useLayoutContext } from '../../hooks';
import { renderLayoutIcon } from '../../utils';

/**
 * 用户下拉菜单参数。
 */
export interface UserDropdownProps {
  /** 自定义菜单内容插槽，传入后覆盖默认菜单项。 */
  menuSlot?: ReactNode;
}

/**
 * 头部用户下拉菜单组件。
 * @param props 用户下拉参数。
 * @returns 用户头像按钮与下拉菜单节点。
 */
export const UserDropdown = memo(function UserDropdown({ menuSlot }: UserDropdownProps) {
  /**
   * 布局上下文能力。
   * @description 提供用户信息快照、国际化与交互事件分发。
   */
  const { props, events, t } = useLayoutContext();
  /**
   * 下拉展开状态与控制方法。
   */
  const { isOpen, close: handleClose, toggle: handleToggleOpen } = useOpenState();

  /**
   * 当前用户信息快照。
   */
  const userInfo = props.userInfo;

  /**
   * 默认头像地址，未配置用户头像时作为兜底资源使用。
   */
  const defaultAvatar = useMemo(
    () =>
      props.defaultAvatar ||
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM5OTkiIHN0cm9rZS13aWR0aD0iMiI+PGNpcmNsZSBjeD0iMTIiIGN5PSI4IiByPSI1Ii8+PHBhdGggZD0iTTIwIDIxYTggOCAwIDEgMC0xNiAwIi8+PC9zdmc+",
    [props.defaultAvatar]
  );

  /**
   * 处理用户菜单动作，派发统一事件并执行内置动作分支。
   *
   * @param key 菜单动作键。
   */
  const handleMenuSelect = useCallback(
    (key: string) => {
      events.onUserMenuSelect?.(key);
      handleClose();

      if (key === 'logout') {
        events.onLogout?.();
      } else if (key === 'lock') {
        events.onLockScreen?.();
      }
    },
    [events, handleClose]
  );

  /**
   * 处理菜单按钮点击事件并提取动作键。
   *
   * @param e React 鼠标事件对象。
   */
  const handleMenuClick = useCallback((e: React.MouseEvent) => {
    const key = (e.currentTarget as HTMLElement).dataset.value;
    if (key) {
      handleMenuSelect(key);
    }
  }, [handleMenuSelect]);

  /**
   * 当前展示用户名。
   * @description 优先级：displayName > username > 空字符串。
   */
  const displayName = userInfo?.displayName || userInfo?.username || '';

  return (
    <div
      className="header-widget-dropdown relative"
      data-state={isOpen ? 'open' : 'closed'}
      onMouseLeave={handleClose}
    >
      <button
        type="button"
        className="header-widget-user flex items-center gap-2 rounded-full p-1 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
        data-state={isOpen ? 'open' : 'closed'}
        onClick={handleToggleOpen}
      >
        <img
          src={userInfo?.avatar || defaultAvatar}
          alt={userInfo?.displayName || userInfo?.username || 'User'}
          className="h-8 w-8 rounded-full object-cover"
        />
        <span className="hidden max-w-24 truncate text-sm font-medium sm:inline">
          {displayName}
        </span>
        {renderLayoutIcon(
          'menu-arrow-down',
          'sm',
          `hidden transition-transform sm:block ${isOpen ? 'rotate-180' : ''}`
        )}
      </button>

      {isOpen && (
        <div
          className="header-widget-dropdown__menu absolute right-0 top-full z-50 mt-1 w-56"
          data-state="open"
        >
          <div className="border-b px-4 py-3 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <img
                src={userInfo?.avatar || defaultAvatar}
                alt={userInfo?.displayName || userInfo?.username || 'User'}
                className="h-10 w-10 rounded-full object-cover"
              />
              <div className="flex-1 overflow-hidden">
                <div className="truncate font-medium">
                  {displayName || t('layout.user.guest')}
                </div>
                {userInfo?.roles && userInfo.roles.length > 0 && (
                  <div className="truncate text-xs text-gray-500">{userInfo.roles.join(', ')}</div>
                )}
              </div>
            </div>
          </div>

          {menuSlot ?? (
            <>
              <div className="py-1">
                <button
                  type="button"
                  className="header-widget-dropdown__item group"
                  data-value="profile"
                  onClick={handleMenuClick}
                >
                  {renderLayoutIcon('user', 'sm', 'opacity-60 transition-opacity group-hover:opacity-100')}
                  <span>{t('layout.user.profile')}</span>
                </button>

                <button
                  type="button"
                  className="header-widget-dropdown__item group"
                  data-value="settings"
                  onClick={handleMenuClick}
                >
                  {renderLayoutIcon('settings', 'sm', 'opacity-60 transition-opacity group-hover:opacity-100')}
                  <span>{t('layout.user.settings')}</span>
                </button>

                <button
                  type="button"
                  className="header-widget-dropdown__item group"
                  data-value="lock"
                  onClick={handleMenuClick}
                >
                  {renderLayoutIcon('lock', 'sm', 'opacity-60 transition-opacity group-hover:opacity-100')}
                  <span>{t('layout.user.lockScreen')}</span>
                </button>
              </div>

              <div className="border-t py-1 dark:border-gray-700">
                <button
                  type="button"
                  className="header-widget-dropdown__item group text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                  data-value="logout"
                  onClick={handleMenuClick}
                >
                  {renderLayoutIcon('logout', 'sm', 'opacity-60 transition-opacity group-hover:opacity-100')}
                  <span>{t('layout.user.logout')}</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
});
