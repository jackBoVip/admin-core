/**
 * 用户下拉菜单组件
 * @description 显示用户信息和操作菜单
 */
import { useState, useCallback, useMemo, memo } from 'react';
import { useLayoutContext } from '../../hooks';

export const UserDropdown = memo(function UserDropdown() {
  const { props, events, t } = useLayoutContext();
  const [isOpen, setIsOpen] = useState(false);

  const userInfo = props.userInfo;

  const defaultAvatar = useMemo(
    () =>
      props.defaultAvatar ||
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM5OTkiIHN0cm9rZS13aWR0aD0iMiI+PGNpcmNsZSBjeD0iMTIiIGN5PSI4IiByPSI1Ii8+PHBhdGggZD0iTTIwIDIxYTggOCAwIDEgMC0xNiAwIi8+PC9zdmc+",
    [props.defaultAvatar]
  );

  const handleMenuSelect = useCallback(
    (key: string) => {
      events.onUserMenuSelect?.(key);
      setIsOpen(false);

      if (key === 'logout') {
        events.onLogout?.();
      } else if (key === 'lock') {
        events.onLockScreen?.();
      }
    },
    [events]
  );

  return (
    <div className="header-widget-dropdown relative" onMouseLeave={() => setIsOpen(false)}>
      <button
        type="button"
        className="header-widget-user flex items-center gap-2 rounded-full p-1 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
        onClick={() => setIsOpen(!isOpen)}
      >
        <img
          src={userInfo?.avatar || defaultAvatar}
          alt={userInfo?.displayName || userInfo?.username || 'User'}
          className="h-8 w-8 rounded-full object-cover"
        />
        <span className="hidden max-w-24 truncate text-sm font-medium sm:inline">
          {userInfo?.displayName || userInfo?.username || ''}
        </span>
        <svg
          className={`hidden h-4 w-4 transition-transform sm:block ${isOpen ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div className="header-widget-dropdown__menu absolute right-0 top-full z-50 mt-1 w-56 rounded-lg border bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <div className="border-b px-4 py-3 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <img
                src={userInfo?.avatar || defaultAvatar}
                alt={userInfo?.displayName || userInfo?.username || 'User'}
                className="h-10 w-10 rounded-full object-cover"
              />
              <div className="flex-1 overflow-hidden">
                <div className="truncate font-medium">
                  {userInfo?.displayName || userInfo?.username || t('layout.user.guest')}
                </div>
                {userInfo?.roles && userInfo.roles.length > 0 && (
                  <div className="truncate text-xs text-gray-500">{userInfo.roles.join(', ')}</div>
                )}
              </div>
            </div>
          </div>

          <div className="py-1">
            <button
              type="button"
              className="flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => handleMenuSelect('profile')}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="8" r="5" />
                <path d="M20 21a8 8 0 1 0-16 0" />
              </svg>
              <span>{t('layout.user.profile')}</span>
            </button>

            <button
              type="button"
              className="flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => handleMenuSelect('settings')}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span>{t('layout.user.settings')}</span>
            </button>

            <button
              type="button"
              className="flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => handleMenuSelect('lock')}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>{t('layout.user.lockScreen')}</span>
            </button>
          </div>

          <div className="border-t py-1 dark:border-gray-700">
            <button
              type="button"
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
              onClick={() => handleMenuSelect('logout')}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16,17 21,12 16,7" />
                <line x1="21" x2="9" y1="12" y2="12" />
              </svg>
              <span>{t('layout.user.logout')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
