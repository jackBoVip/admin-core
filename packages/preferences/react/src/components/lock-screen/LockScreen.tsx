/**
 * 锁屏页面组件
 * @description 经典居中布局，极致毛玻璃质感，高级交互反馈
 */
import { getLocaleByPreferences, verifyPasswordSync, defaultLockScreenBg } from '@admin-core/preferences';
import React, { memo, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { usePreferences } from '../../hooks';
import { Icon } from '../Icon';
import { LockScreenTime } from './LockScreenTime';
import type { LocaleMessages, LockScreenComponentProps } from '@admin-core/preferences';

export type LockScreenProps = LockScreenComponentProps;

export const LockScreen: React.FC<LockScreenProps> = memo(({
  onLogout,
  // avatar/username 保留用于将来扩展
  avatar: _avatar,
  username: _username = 'Admin',
  backgroundImage,
}) => {
  // 计算实际使用的背景图片：用户传入 > 默认图片
  const actualBgImage = useMemo(() => {
    // 空字符串表示禁用背景
    if (backgroundImage === '') {
      return undefined;
    }
    // 用户传入了有效的 URL，否则使用默认背景
    return backgroundImage || defaultLockScreenBg;
  }, [backgroundImage]);
  const { preferences, setPreferences } = usePreferences();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showUnlockForm, setShowUnlockForm] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const handleUnlockRef = useRef<(() => void) | null>(null);
  const showUnlockFormRef = useRef(showUnlockForm);
  const focusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isLocked = preferences.lockScreen.isLocked;
  const savedPassword = preferences.lockScreen.password;
  const currentLocale = preferences.app.locale || 'zh-CN';
  const locale = useMemo(() => getLocaleByPreferences(preferences) as LocaleMessages, [preferences]);

  // 同步 showUnlockForm 到 ref
  useEffect(() => {
    showUnlockFormRef.current = showUnlockForm;
  }, [showUnlockForm]);

  useEffect(() => {
    // SSR 环境检查
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    
    if (isLocked) {
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      if (scrollBarWidth > 0) document.body.style.paddingRight = `${scrollBarWidth}px`;
      return () => { document.body.style.overflow = ''; document.body.style.paddingRight = ''; };
    }
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
    if (!password) { setError(locale.lockScreen.passwordPlaceholder); return; }
    // 使用哈希验证密码
    if (!verifyPasswordSync(password, savedPassword)) { setError(locale.lockScreen.passwordError); return; }
    setPreferences({ lockScreen: { isLocked: false } });
    setShowUnlockForm(false);
  }, [password, savedPassword, locale, setPreferences]);

  // 保持 handleUnlock 的最新引用
  useEffect(() => {
    handleUnlockRef.current = handleUnlock;
  }, [handleUnlock]);

  // 全局键盘事件（使用 ref 避免频繁重新注册）
  useEffect(() => {
    if (!isLocked) return;
    
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // ESC 关闭解锁面板
      if (e.code === 'Escape' && showUnlockFormRef.current) {
        e.preventDefault();
        setShowUnlockForm(false);
        return;
      }
      
      // 如果解锁面板已显示，Enter/NumpadEnter 提交
      if (showUnlockFormRef.current) {
        if (e.code === 'Enter' || e.code === 'NumpadEnter') {
          e.preventDefault();
          handleUnlockRef.current?.();
        }
        return;
      }
      
      // 空格或回车弹出解锁面板
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'NumpadEnter') {
        e.preventDefault();
        setShowUnlockForm(true);
        setPassword('');
        setError('');
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
    <div className="preferences-lock-screen" role="dialog" aria-modal="true" aria-label={locale.lockScreen.title || '锁屏'}>
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
