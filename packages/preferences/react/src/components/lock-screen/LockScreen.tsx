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
  lockBodyScrollForLockScreen,
  restoreBodyScrollForLockScreen,
  type LockScreenBodyLockState,
  type LocaleMessages,
  type LockScreenComponentProps,
} from '@admin-core/preferences';
import React, { memo, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { getPreferencesManager, usePreferences } from '../../hooks';
import { Icon } from '../Icon';
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
  const focusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bodyLockStateRef = useRef<LockScreenBodyLockState | null>(null);

  const isLocked = preferences.lockScreen.isLocked;
  const savedPassword = preferences.lockScreen.password;
  const currentLocale = preferences.app.locale || 'zh-CN';
  const locale = useMemo(() => getLocaleByPreferences(preferences) as LocaleMessages, [preferences]);

  // 同步 showUnlockForm 到 ref
  useEffect(() => {
    showUnlockFormRef.current = showUnlockForm;
  }, [showUnlockForm]);

  // Body 滚动锁定：锁屏时禁止滚动并补偿滚动条宽度
  useEffect(() => {
    if (!isLocked) {
      if (bodyLockStateRef.current) {
        restoreBodyScrollForLockScreen(bodyLockStateRef.current);
        bodyLockStateRef.current = null;
      }
      return;
    }

    bodyLockStateRef.current = lockBodyScrollForLockScreen();

    return () => {
      if (bodyLockStateRef.current) {
        restoreBodyScrollForLockScreen(bodyLockStateRef.current);
        bodyLockStateRef.current = null;
      }
    };
  }, [isLocked]);

  useEffect(() => {
    if (showUnlockForm) {
      // 清理之前的定时器
      if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
      focusTimerRef.current = setTimeout(() => inputRef.current?.focus(), 100);
    }
    return () => {
      if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
    };
  }, [showUnlockForm]);

  const toggleUnlockForm = useCallback(() => {
    setShowUnlockForm(prev => !prev); setPassword(''); setError('');
  }, []);

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

    setShowUnlockForm(false);
  }, [password, savedPassword, locale, setPreferences, preferences]);

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
          setShowUnlockForm(false);
          break;
        case 'submit':
          handleUnlockRef.current?.();
          break;
        case 'showUnlockForm':
          setShowUnlockForm(true);
          setPassword('');
          setError('');
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isLocked]); // 仅依赖 isLocked，使用 ref 获取其他最新状态

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

  if (!isLocked) return null;

  return createPortal(
    <div className="preferences-lock-screen" role="dialog" aria-modal="true" aria-label={locale.lockScreen.title}>
      <div className="preferences-lock-backdrop" aria-hidden="true">
        {actualBgImage && <div className="preferences-lock-backdrop-image" style={bgImageStyle} />}
        <div className="preferences-lock-orb orb-1" data-orb="1" />
        <div className="preferences-lock-orb orb-2" data-orb="2" />
        <div className="preferences-lock-orb orb-3" data-orb="3" />
        <div className="preferences-lock-grid" />
      </div>

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

        <section
          className={`preferences-lock-unlock ${showUnlockForm ? 'visible' : ''}`}
          data-visible={showUnlockForm ? 'true' : undefined}
          role="form"
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
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder={error || locale.lockScreen.passwordPlaceholder}
              aria-label={locale.lockScreen.passwordPlaceholder}
              aria-invalid={!!error}
              autoComplete="current-password"
            />
            <button className="preferences-lock-unlock-btn" onClick={handleUnlock} aria-label={locale.lockScreen.entry}>
              <Icon name="arrowRight" size="sm" />
            </button>
          </div>
          {onLogout && <button className="preferences-lock-unlock-logout" onClick={onLogout}>{locale.lockScreen.backToLogin}</button>}
        </section>
      </div>
    </div>,
    document.body
  );
});

LockScreen.displayName = 'LockScreen';
