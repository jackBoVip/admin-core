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

/**
 * 锁屏组件参数类型别名。
 */
export type LockScreenProps = LockScreenComponentProps;

/**
 * 锁屏键盘动作类型。
 * @description 由 `getLockScreenKeyAction` 解析键盘事件后返回的标准动作结构。
 */
type LockScreenKeyAction = ReturnType<typeof getLockScreenKeyAction>;

/**
 * 锁屏主组件。
 */
export const LockScreen: React.FC<LockScreenProps> = memo(({
  onLogout,
  avatar: _avatar,
  username: _username = 'Admin',
  backgroundImage,
}) => {
  /**
   * 计算锁屏背景图。
   * @description 复用 core helper，优先级为 props 覆盖图 > 偏好设置背景图 > 默认背景图。
   */
  const { preferences, setPreferences } = usePreferences();
  const actualBgImage = useMemo(
    () =>
      computeLockScreenBackground({
        preferences,
        overrideImage: backgroundImage,
      }),
    [preferences, backgroundImage],
  );
  /**
   * 当前输入的解锁密码。
   */
  const [password, setPassword] = useState('');
  /**
   * 解锁失败错误提示。
   */
  const [error, setError] = useState('');
  /**
   * 是否显示解锁输入表单。
   */
  const [showUnlockForm, setShowUnlockForm] = useState(false);
  /**
   * 密码输入框元素引用。
   */
  const inputRef = useRef<HTMLInputElement>(null);
  /**
   * 最新解锁处理函数引用。
   * @description 供全局键盘监听器调用，避免闭包持有旧函数。
   */
  const handleUnlockRef = useRef<(() => void) | null>(null);
  /**
   * 解锁表单显示状态镜像。
   * @description 供全局键盘监听器读取最新状态。
   */
  const showUnlockFormRef = useRef(showUnlockForm);

  /**
   * 当前是否处于锁屏状态。
   */
  const isLocked = preferences.lockScreen.isLocked;
  /**
   * 当前保存的锁屏密码（哈希值）。
   */
  const savedPassword = preferences.lockScreen.password;
  /**
   * 当前应用语言代码。
   */
  const currentLocale = preferences.app.locale || 'zh-CN';
  /**
   * 当前语言包文案。
   */
  const locale = useMemo(() => getLocaleByPreferences(preferences) as LocaleMessages, [preferences]);
  /**
   * 锁屏浮层挂载目标节点。
   */
  const portalTarget = typeof document === 'undefined' ? null : document.body;

  /**
   * 同步解锁面板显示状态到 ref。
   * @description 供全局键盘事件回调读取最新值，避免闭包读取旧状态。
   */
  useEffect(() => {
    showUnlockFormRef.current = showUnlockForm;
  }, [showUnlockForm]);

  /**
   * 处理密码输入变更
   * @description 更新输入密码并在用户继续输入时清除旧错误提示。
   */
  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    /**
     * 输入变化时清理旧错误提示。
     * @description 避免用户修正密码后仍显示过期错误信息。
     */
    if (error) {
      setError('');
    }
  }, [error]);

  /**
   * 打开解锁面板
   * @description 展示解锁输入区并重置密码与错误状态。
   */
  const openUnlockForm = useCallback(() => {
    setShowUnlockForm(true);
    setPassword('');
    setError('');
  }, []);

  /**
   * 关闭解锁面板
   * @description 隐藏解锁输入区，不主动修改现有密码输入值。
   */
  const closeUnlockForm = useCallback(() => {
    setShowUnlockForm(false);
  }, []);

  /**
   * 切换解锁面板显示状态
   * @description 根据当前面板可见性在打开与关闭之间切换。
   */
  const toggleUnlockForm = useCallback(() => {
    if (showUnlockFormRef.current) {
      closeUnlockForm();
    } else {
      openUnlockForm();
    }
  }, [closeUnlockForm, openUnlockForm]);

  /**
   * 执行解锁流程
   * @description 调用核心 helper 校验密码并更新锁屏状态，失败时写入错误提示。
   */
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

  /**
   * 保持解锁回调引用为最新实现。
   * @description 供全局键盘事件在不重绑监听器的情况下调用最新逻辑。
   */
  useEffect(() => {
    handleUnlockRef.current = handleUnlock;
  }, [handleUnlock]);

  /**
   * 监听锁屏状态下的全局键盘事件。
   * @description 通过 ref 与 helper 协同，减少监听器重复注册并保证行为一致。
   */
  useEffect(() => {
    if (!isLocked) return;
    
    /**
     * 处理锁屏状态下的全局键盘事件
     * @description 根据 helper 返回动作执行显示面板、提交解锁或关闭面板。
     * @param e 浏览器键盘事件对象。
     */
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const action: LockScreenKeyAction = getLockScreenKeyAction(e, {
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
  }, [isLocked, closeUnlockForm, openUnlockForm]);

  /**
   * 解锁表单显示后延迟聚焦输入框。
   * @description 避免渲染阶段直接聚焦导致副作用时序问题。
   */
  useDeferredFocus<HTMLInputElement>(inputRef, {
    enabled: showUnlockForm,
    delay: 100,
  });

  /**
   * 生成背景样式对象。
   * @description 当背景图地址不变时复用样式对象，减少不必要渲染比较成本。
   */
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
