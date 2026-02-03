/**
 * 锁屏密码设置弹窗
 * @description 极简高级风格，支持国际化、无障碍
 */
import React, { memo, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { usePreferences } from '../../hooks';
import {
  getLocaleByPreferences,
  getIcon,
  hashPasswordSync,
  PASSWORD_MIN_LENGTH,
} from '@admin-core/preferences';
import type { LocaleMessages } from '@admin-core/preferences';

export interface LockPasswordModalProps {
  /** 是否显示 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 设置成功后回调 */
  onSuccess: () => void;
}

export const LockPasswordModal: React.FC<LockPasswordModalProps> = memo(({
  open,
  onClose,
  onSuccess,
}) => {
  const { preferences, setPreferences } = usePreferences();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const focusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const locale = useMemo(() => {
    return getLocaleByPreferences(preferences) as LocaleMessages;
  }, [preferences]);

  // 文本 - 使用国际化
  const texts = useMemo(() => {
    const ls = locale.lockScreen || {};
    const common = locale.common || {};
    return {
      title: ls.setPassword || '设置锁屏密码',
      subtitle: ls.setPasswordTip || '首次锁屏需要设置解锁密码',
      passwordPlaceholder: ls.passwordPlaceholder || '请输入密码',
      confirmPlaceholder: ls.confirmPasswordPlaceholder || '请再次输入密码',
      submit: ls.confirmAndLock || '确认并锁定',
      minLengthError: (ls.passwordMinLength || '密码至少 {0} 位').replace('{0}', String(PASSWORD_MIN_LENGTH)),
      mismatchError: ls.passwordMismatch || '两次输入的密码不一致',
      showPassword: ls.showPassword || '显示密码',
      hidePassword: ls.hidePassword || '隐藏密码',
      close: common.close || '关闭',
    };
  }, [locale]);

  const icons = useMemo(() => ({
    close: getIcon('close'),
    eye: getIcon('eye'),
    eyeOff: getIcon('eyeOff'),
  }), []);

  useEffect(() => {
    if (open) {
      setIsClosing(false);
      // 清理之前的定时器
      if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
      focusTimerRef.current = setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      if (focusTimerRef.current) {
        clearTimeout(focusTimerRef.current);
        focusTimerRef.current = null;
      }
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      setPassword('');
      setConfirmPassword('');
      setError('');
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [open]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    // 清理之前的定时器
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      onClose();
    }, 200);
  }, [onClose]);

  const handleSubmit = useCallback(() => {
    if (!password) {
      setError(texts.passwordPlaceholder);
      return;
    }
    if (password.length < PASSWORD_MIN_LENGTH) {
      setError(texts.minLengthError);
      return;
    }
    if (password !== confirmPassword) {
      setError(texts.mismatchError);
      return;
    }

    const hashedPassword = hashPasswordSync(password);
    setPreferences({
      lockScreen: {
        password: hashedPassword,
        isLocked: true,
      },
    });

    setPassword('');
    setConfirmPassword('');
    setError('');
    onSuccess();
  }, [password, confirmPassword, texts, setPreferences, onSuccess]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
    if (e.key === 'Escape') handleClose();
  };

  const handleTogglePassword = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const handleToggleConfirmPassword = useCallback(() => {
    setShowConfirmPassword((prev) => !prev);
  }, []);

  if (!open) return null;

  const overlayClass = `preferences-lock-modal-overlay ${isClosing ? 'is-closing' : ''}`;
  const cardClass = `preferences-lock-modal-card ${isClosing ? 'is-closing' : ''}`;

  return createPortal(
    <div 
      className={overlayClass} 
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label={texts.title}
      data-state={isClosing ? 'closing' : 'open'}
    >
      <div
        className={cardClass}
        data-state={isClosing ? 'closing' : 'open'}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="preferences-lock-modal-header">
          <div className="preferences-lock-modal-title">
            <h3>{texts.title}</h3>
            <p>{texts.subtitle}</p>
          </div>
          <button
            className="preferences-lock-modal-close"
            onClick={handleClose}
            dangerouslySetInnerHTML={{ __html: icons.close }}
            aria-label={texts.close}
          />
        </div>

        <div className="preferences-lock-modal-form">
          <div className="preferences-lock-modal-input-wrapper">
            <input
              ref={inputRef}
              type={showPassword ? 'text' : 'password'}
              className="preferences-lock-modal-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={texts.passwordPlaceholder}
              aria-label={texts.passwordPlaceholder}
              aria-describedby={error ? 'lock-password-error' : undefined}
              aria-invalid={!!error}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="preferences-lock-modal-eye"
              onClick={handleTogglePassword}
              aria-label={showPassword ? texts.hidePassword : texts.showPassword}
            >
              <span dangerouslySetInnerHTML={{ __html: showPassword ? icons.eyeOff : icons.eye }} aria-hidden="true" />
            </button>
          </div>
          <div className="preferences-lock-modal-input-wrapper">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              className="preferences-lock-modal-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={texts.confirmPlaceholder}
              aria-label={texts.confirmPlaceholder}
              aria-describedby={error ? 'lock-password-error' : undefined}
              aria-invalid={!!error}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="preferences-lock-modal-eye"
              onClick={handleToggleConfirmPassword}
              aria-label={showConfirmPassword ? texts.hidePassword : texts.showPassword}
            >
              <span dangerouslySetInnerHTML={{ __html: showConfirmPassword ? icons.eyeOff : icons.eye }} aria-hidden="true" />
            </button>
          </div>
          
          {error && (
            <div id="lock-password-error" className="preferences-lock-modal-error" role="alert">{error}</div>
          )}
          
          <button className="preferences-lock-modal-submit" onClick={handleSubmit} aria-label={texts.submit}>
            {texts.submit}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
});

LockPasswordModal.displayName = 'LockPasswordModal';
