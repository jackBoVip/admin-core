/**
 * 锁屏密码设置弹窗
 * @description 极简高级风格，支持国际化、无障碍
 */
import {
  getLocaleByPreferences,
  getIcon,
  hashPasswordSync,
  PASSWORD_MIN_LENGTH,
} from '@admin-core/preferences';
import React, { memo, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  getPreferencesManager,
  usePreferences,
  useDeferredFocus,
} from '../../hooks';
import type { LocaleMessages } from '@admin-core/preferences';

/**
 * 锁屏密码设置弹窗参数。
 */
export interface LockPasswordModalProps {
  /** 是否显示 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 设置成功后回调 */
  onSuccess: () => void;
}

/**
 * 锁屏密码弹窗文案集合。
 * @description 汇总弹窗渲染与交互提示所需的本地化文本。
 */
interface LockPasswordModalTexts {
  /** 弹窗标题。 */
  title: string;
  /** 弹窗副标题。 */
  subtitle: string;
  /** 主密码输入占位文案。 */
  passwordPlaceholder: string;
  /** 确认密码输入占位文案。 */
  confirmPlaceholder: string;
  /** 提交按钮文案。 */
  submit: string;
  /** 密码最小长度校验文案。 */
  minLengthError: string;
  /** 两次密码不一致校验文案。 */
  mismatchError: string;
  /** “显示密码”按钮文案。 */
  showPassword: string;
  /** “隐藏密码”按钮文案。 */
  hidePassword: string;
  /** 关闭按钮文案。 */
  close: string;
}

/**
 * 锁屏密码弹窗图标资源集合。
 */
interface LockPasswordModalIcons {
  /** 关闭按钮图标。 */
  close: string;
  /** 显示密码图标。 */
  eye: string;
  /** 隐藏密码图标。 */
  eyeOff: string;
}

/**
 * 锁屏密码设置弹窗组件。
 */
export const LockPasswordModal: React.FC<LockPasswordModalProps> = memo(({
  open,
  onClose,
  onSuccess,
}) => {
  /**
   * 偏好状态与更新方法。
   */
  const { preferences, setPreferences } = usePreferences();
  /**
   * 主密码输入值。
   */
  const [password, setPassword] = useState('');
  /**
   * 确认密码输入值。
   */
  const [confirmPassword, setConfirmPassword] = useState('');
  /**
   * 表单错误提示文案。
   */
  const [error, setError] = useState('');
  /**
   * 主密码是否明文显示。
   */
  const [showPassword, setShowPassword] = useState(false);
  /**
   * 确认密码是否明文显示。
   */
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  /**
   * 是否处于关闭动画过程。
   */
  const [isClosing, setIsClosing] = useState(false);
  /**
   * 主密码输入框引用。
   */
  const inputRef = useRef<HTMLInputElement>(null);
  /**
   * 关闭动画定时器引用。
   */
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * 清理关闭动画定时器。
   * @description 防止组件卸载后仍触发异步回调。
   */
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  /**
   * 当前语言包对象。
   * @description 基于偏好设置解析锁屏模块文案。
   */
  const locale = useMemo(() => {
    return getLocaleByPreferences(preferences) as LocaleMessages;
  }, [preferences]);
  /**
   * Teleport 挂载目标节点。
   */
  const portalTarget = typeof document === 'undefined' ? null : document.body;

  /**
   * 构建弹窗文案集合。
   * @description 从国际化资源读取并补齐兜底值，最小长度文案会注入动态参数。
   */
  const texts = useMemo<LockPasswordModalTexts>(() => {
    const ls = locale.lockScreen || {};
    const common = locale.common || {};
    const minLengthText = ls.passwordMinLength ?? '';
    return {
      title: ls.setPassword ?? '',
      subtitle: ls.setPasswordTip ?? '',
      passwordPlaceholder: ls.passwordPlaceholder ?? '',
      confirmPlaceholder: ls.confirmPasswordPlaceholder ?? '',
      submit: ls.confirmAndLock ?? '',
      minLengthError: minLengthText.replace('{0}', String(PASSWORD_MIN_LENGTH)),
      mismatchError: ls.passwordMismatch ?? '',
      showPassword: ls.showPassword ?? '',
      hidePassword: ls.hidePassword ?? '',
      close: common.close ?? '',
    };
  }, [locale]);

  /**
   * 弹窗图标资源。
   * @description 组件生命周期内保持稳定，避免重复解析 SVG 字符串。
   */
  const icons = useMemo<LockPasswordModalIcons>(() => ({
    close: getIcon('close'),
    eye: getIcon('eye'),
    eyeOff: getIcon('eyeOff'),
  }), []);

  /**
   * 监听弹窗开关状态。
   * @description 打开时退出关闭动画态；关闭时清理定时器并重置表单字段状态。
   */
  useEffect(() => {
    if (open) {
      setIsClosing(false);
    } else {
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

  /**
   * 弹窗打开后延迟聚焦主密码输入框。
   * @description 避免动画首帧时直接聚焦导致视觉抖动。
   */
  useDeferredFocus(inputRef, {
    enabled: open,
    delay: 100,
  });

  /**
   * 关闭密码弹窗
   * @description 先进入关闭动画状态，延迟触发 `onClose` 以匹配过渡时长。
   */
  const handleClose = useCallback(() => {
    setIsClosing(true);
    /**
     * 清理已有关闭定时器。
     * @description 防止快速重复触发关闭造成多次回调。
     */
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      onClose();
    }, 200);
  }, [onClose]);

  /**
   * 提交并校验锁屏密码
   * @description 校验通过后写入哈希密码并立即将锁屏状态置为已锁定。
   */
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
    try {
      getPreferencesManager()?.flush?.();
    } catch {}

    setPassword('');
    setConfirmPassword('');
    setError('');
    onSuccess();
  }, [password, confirmPassword, texts, setPreferences, onSuccess]);

  /**
   * 处理弹窗输入键盘事件
   * @description 回车提交，Esc 关闭。
   * @param e React 键盘事件对象。
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
    if (e.key === 'Escape') handleClose();
  };

  /**
   * 切换主密码可见性
   * @description 在明文和密文显示之间切换主密码输入框。
   */
  const handleTogglePassword = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  /**
   * 切换确认密码可见性
   * @description 在明文和密文显示之间切换确认密码输入框。
   */
  const handleToggleConfirmPassword = useCallback(() => {
    setShowConfirmPassword((prev) => !prev);
  }, []);

  if (!open) return null;

  /**
   * 遮罩层 className。
   * @description 根据关闭动画状态动态附加过渡类。
   */
  const overlayClass = `preferences-lock-modal-overlay ${isClosing ? 'is-closing' : ''}`;
  /**
   * 弹窗卡片 className。
   * @description 与遮罩层同步控制关闭动画样式。
   */
  const cardClass = `preferences-lock-modal-card ${isClosing ? 'is-closing' : ''}`;

  if (!portalTarget) return null;

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
    portalTarget
  );
});

LockPasswordModal.displayName = 'LockPasswordModal';
