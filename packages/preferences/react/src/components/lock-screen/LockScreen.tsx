/**
 * 锁屏页面组件
 * @description 经典居中布局，极致毛玻璃质感，高级交互反馈
 * 行为逻辑（背景决策、解锁流程、键盘交互、body 滚动锁定）由 @admin-core/preferences 提供的 LockScreen helpers 统一处理。
 */
import {
  getLocaleByPreferences,
  computeLockScreenBackground,
  unlockWithPassword,
  getLockScreenKeyAction,
  type LocaleMessages,
  type LockScreenComponentProps,
} from '@admin-core/preferences';
import React, { memo, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  getPreferencesManager,
  usePreferences,
  useDeferredFocus,
} from '../../hooks';
import { Icon } from '../Icon';
import { LockScreenBackdrop } from './LockScreenBackdrop';
import { LockScreenTime } from './LockScreenTime';

export type LockScreenProps = LockScreenComponentProps;

export const LockScreen: React.FC<LockScreenProps> = memo(({
  onLogout,
  // avatar/username 保留用于将来扩展
  avatar: _avatar,
  username: _username = 'Admin',
  backgroundImage,
}) => {
  // 计算实际使用的背景图片：复用 core helper，优先级为 props.override > preferences.lockScreen.backgroundImage > 默认图
  const { preferences, setPreferences } = usePreferences();
  const actualBgImage = useMemo(
    () =>
      computeLockScreenBackground({
        preferences,
        overrideImage: backgroundImage,
      }),
    [preferences, backgroundImage],
  );
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showUnlockForm, setShowUnlockForm] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const handleUnlockRef = useRef<(() => void) | null>(null);
  const showUnlockFormRef = useRef(showUnlockForm);

  const isLocked = preferences.lockScreen.isLocked;
  const savedPassword = preferences.lockScreen.password;
  const currentLocale = preferences.app.locale || 'zh-CN';
  const locale = useMemo(() => getLocaleByPreferences(preferences) as LocaleMessages, [preferences]);
  const portalTarget = typeof document === 'undefined' ? null : document.body;

  // 同步 showUnlockForm 到 ref
  useEffect(() => {
    showUnlockFormRef.current = showUnlockForm;
  }, [showUnlockForm]);

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    // 每次修改密码时清除错误提示，避免用户修正后仍看到旧错误
    if (error) {
      setError('');
    }
  }, [error]);

  // 解锁表单打开/关闭行为统一封装，便于在按钮点击与键盘事件中复用
  const openUnlockForm = useCallback(() => {
    setShowUnlockForm(true);
    setPassword('');
    setError('');
  }, []);

  const closeUnlockForm = useCallback(() => {
    setShowUnlockForm(false);
  }, []);

  const toggleUnlockForm = useCallback(() => {
    if (showUnlockFormRef.current) {
      closeUnlockForm();
    } else {
      openUnlockForm();
    }
  }, [closeUnlockForm, openUnlockForm]);

  const handleUnlock = useCallback(() => {
    const result = unlockWithPassword({
      password,
      savedPassword,
      locale,
      setPreferences: (partial) => setPreferences(partial),
      flushPreferences: () => {
        const manager = getPreferencesManager();
        manager?.flush?.();
      },
    });

    if (!result.success) {
      setError(result.errorMessage || '');
      return;
    }

    closeUnlockForm();
  }, [password, savedPassword, locale, setPreferences, closeUnlockForm]);

  // 保持 handleUnlock 的最新引用
  useEffect(() => {
    handleUnlockRef.current = handleUnlock;
  }, [handleUnlock]);

  // 全局键盘事件（使用 ref + helper 避免频繁重新注册且保证两端行为一致）
  useEffect(() => {
    if (!isLocked) return;
    
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const action = getLockScreenKeyAction(e, {
        showUnlockForm: showUnlockFormRef.current,
      });

      switch (action.type) {
        case 'hideUnlockForm':
          closeUnlockForm();
          break;
        case 'submit':
          handleUnlockRef.current?.();
          break;
        case 'showUnlockForm':
          openUnlockForm();
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isLocked, closeUnlockForm, openUnlockForm]); // 仅依赖 isLocked，使用 ref 获取其他最新状态

  // 解锁表单展示时延迟聚焦输入框，避免直接在 render 阶段调用 focus
  useDeferredFocus<HTMLInputElement>(inputRef, {
    enabled: showUnlockForm,
    delay: 100,
  });

  // 背景图片样式 - 使用 useMemo 避免每次渲染创建新对象
  const bgImageStyle = useMemo(() => {
    if (!actualBgImage) return undefined;
    return {
      backgroundImage: `url(${actualBgImage})`,
      backgroundPosition: 'center',
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
    } as React.CSSProperties;
  }, [actualBgImage]);

  if (!isLocked || !portalTarget) return null;

  return createPortal(
    <div className="preferences-lock-screen" role="dialog" aria-modal="true" aria-label={locale.lockScreen.title}>
      <LockScreenBackdrop backgroundImage={actualBgImage} backgroundStyle={bgImageStyle} />

      <div className="preferences-lock-content minimal" data-variant="minimal">
        <section
          className={`preferences-lock-time-center ${showUnlockForm ? 'compact' : ''}`}
          data-compact={showUnlockForm ? 'true' : undefined}
        >
          <LockScreenTime locale={currentLocale} />
          {!showUnlockForm && (
            <button
              className="preferences-lock-cta minimal"
              data-variant="minimal"
              onClick={toggleUnlockForm}
            >
              {locale.lockScreen.unlock}
            </button>
          )}
        </section>

        <form
          className={`preferences-lock-unlock ${showUnlockForm ? 'visible' : ''}`}
          data-visible={showUnlockForm ? 'true' : undefined}
          aria-label={locale.lockScreen.passwordPlaceholder}
          onSubmit={(e) => {
            e.preventDefault();
            handleUnlock();
          }}
        >
          <div
            className={`preferences-lock-unlock-box ${error ? 'has-error' : ''}`}
            data-error={error ? 'true' : undefined}
          >
            <input
              ref={inputRef}
              type="password"
              className={`preferences-lock-unlock-input ${error ? 'has-error' : ''}`}
              data-error={error ? 'true' : undefined}
              value={password}
              onChange={handlePasswordChange}
              placeholder={error || locale.lockScreen.passwordPlaceholder}
              aria-label={locale.lockScreen.passwordPlaceholder}
              aria-invalid={!!error}
              autoComplete="current-password"
            />
            <button
              className="preferences-lock-unlock-btn"
              type="submit"
              aria-label={locale.lockScreen.entry}
            >
              <Icon name="arrowRight" size="sm" />
            </button>
          </div>
          {onLogout && (
            <button
              type="button"
              className="preferences-lock-unlock-logout"
              onClick={onLogout}
            >
              {locale.lockScreen.backToLogin}
            </button>
          )}
        </form>
      </div>
    </div>,
    portalTarget
  );
});

LockScreen.displayName = 'LockScreen';
