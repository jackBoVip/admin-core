/**
 * 偏好设置管理器。
 * @description 提供框架无关的偏好状态维护、持久化与订阅通知能力。
 */

import { DEFAULT_PREFERENCES, getDefaultPreferences } from '../config/defaults';
import { validatePreferencesConfig } from '../helpers/drawer-config';
import {
  deepMerge,
  safeMerge,
  deepClone,
  diff,
  diffWithKeys,
  hasChanges,
  createStorageManager,
  isBrowser,
  logger,
} from '../utils';
import { initThemeTransitionTracking, runThemeTransition } from '../utils/theme-transition';
import { updateAllCSSVariables, getActualThemeMode, setDOMSelectors } from './css-updater';
import type {
  DeepPartial,
  Preferences,
  PreferencesInitOptions,
  PreferencesKeys,
  StorageAdapter,
} from '../types';

/**
 * 偏好设置变更监听器。
 * @description 在偏好更新后接收最新快照与变更键列表。
 */
export type PreferencesListener = (
  preferences: Preferences,
  changedKeys: string[]
) => void;

/**
 * 偏好设置存储键名。
 * @description 用于持久化差异配置的固定键名后缀。
 */
const PREFERENCES_STORAGE_KEY = 'preferences';

/**
 * 偏好设置管理器。
 * @description
 * 设计原则：
 * 1. 框架无关：不依赖 Vue/React 的响应式系统
 * 2. 可扩展：支持自定义存储适配器
 * 3. 持久化：自动保存到本地存储
 */
/** 默认存储防抖时间（毫秒） */
const STORAGE_DEBOUNCE_MS = 300;

/**
 * PreferencesManager 类定义。
 * @description 封装偏好初始化、更新、持久化、监听与重置全流程。
 */
export class PreferencesManager {
  /** 当前偏好设置状态 */
  private state: Preferences;

  /** 初始状态（用于重置） */
  private initialState: Preferences;

  /** 存储管理器 */
  private storage: StorageAdapter;

  /** 命名空间 */
  private namespace: string;

  /** 初始化选项 */
  private options: PreferencesInitOptions;

  /** 变更监听器（最大数量限制，防止内存泄漏） */
  private static readonly MAX_LISTENERS = 100;
  private listeners: Set<PreferencesListener> = new Set();

  /** 媒体查询监听器 */
  private mediaQueryListener?: MediaQueryList;

  /** 是否已初始化 */
  private initialized = false;

  /** 存储防抖定时器 */
  private saveDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  /** 页面卸载时保存处理 */
  private pageHideHandler?: () => void;

  /** 缓存的差异（避免重复计算） */
  private cachedDiff: DeepPartial<Preferences> | null = null;

  /** 是否正在执行 flush（防止重复调用） */
  private isFlushing = false;

  /**
   * 创建偏好设置管理器。
   * @param options 初始化选项。
   */
  constructor(options: PreferencesInitOptions = { namespace: 'admin-core' }) {
    this.namespace = options.namespace;
    this.options = options;

    /* 创建存储管理器。 */
    this.storage = options.storage ?? createStorageManager({
      prefix: this.namespace,
    });

    /* 加载初始状态。 */
    const storedPrefs = this.loadFromStorage();
    const defaultPrefs = getDefaultPreferences();

    /* 合并配置优先级：存储 > 覆盖 > 默认。 */
    this.state = deepMerge(
      defaultPrefs,
      options.overrides ?? {},
      storedPrefs ?? {}
    );

    /* 关键修复：如果 `isLocked = true` 但未设置密码，自动解锁。 */
    /* 这可避免刷新后因异常存储状态而进入错误锁屏。 */
    if (this.state.lockScreen.isLocked && !this.state.lockScreen.password) {
      console.warn('[PreferencesManager] Auto-unlocking: isLocked=true but no password set');
      logger.warn('[PreferencesManager] Auto-unlocking: isLocked=true but no password set', {
        isLocked: this.state.lockScreen.isLocked,
        hasPassword: this.state.lockScreen.password !== '',
        autoLockTime: this.state.lockScreen.autoLockTime,
        timestamp: new Date().toISOString(),
      });
      this.state.lockScreen.isLocked = false;
    }

    /* 保存初始状态。 */
    this.initialState = deepClone(this.state);

  }

  /**
   * 初始化管理器
   * @description 应用初始设置、监听系统主题变化
   * @returns 无返回值
   */
  init(): void {
    if (this.initialized) return;

    /* 设置 DOM 选择器（用于深色侧边栏/顶栏功能）。 */
    if (this.options.selectors) {
      setDOMSelectors(this.options.selectors);
    }

    /* 应用 CSS 变量。 */
    this.applyPreferences();

    /* 监听系统主题变化。 */
    this.watchSystemTheme();

    /* 初始化主题切换动画位置追踪。 */
    initThemeTransitionTracking();

    /* 页面卸载时强制保存，避免防抖未落盘导致刷新后状态回退。 */
    if (isBrowser) {
      this.pageHideHandler = () => {
        if (this.saveDebounceTimer) {
          this.saveToStorage();
          this.saveDebounceTimer = null;
        }
      };
      window.addEventListener('pagehide', this.pageHideHandler);
      window.addEventListener('beforeunload', this.pageHideHandler);
    }

    this.initialized = true;
  }

  /**
   * 销毁管理器
   * @returns 无返回值
   */
  destroy(): void {
    /* 移除媒体查询监听。 */
    if (this.mediaQueryListener) {
      this.mediaQueryListener.removeEventListener('change', this.handleSystemThemeChange);
    }

    /* 清除防抖定时器。 */
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
      this.saveDebounceTimer = null;
    }

    if (this.pageHideHandler && isBrowser) {
      window.removeEventListener('pagehide', this.pageHideHandler);
      window.removeEventListener('beforeunload', this.pageHideHandler);
      this.pageHideHandler = undefined;
    }

    /* 清空监听器。 */
    this.listeners.clear();

    /* 清除缓存。 */
    this.cachedDiff = null;

    this.initialized = false;
  }

  /**
   * 获取当前偏好设置
   * @returns 偏好设置对象
   */
  getPreferences(): Readonly<Preferences> {
    return this.state;
  }

  /**
   * 获取当前存储中的偏好设置快照
   * @description 用于在运行时校验内存状态与持久化状态是否一致
   * @returns 持久化存储中的偏好设置差异；不存在时返回 `null`
   */
  getStoredPreferences(): DeepPartial<Preferences> | null {
    return this.loadFromStorage();
  }

  /**
   * 获取某个分类的偏好设置
   * @param key - 分类键名
   * @returns 该分类的设置
   */
  get<K extends PreferencesKeys>(key: K): Readonly<Preferences[K]> {
    return this.state[key];
  }

  /**
   * 更新偏好设置
   * @param updates - 要更新的设置（支持深度部分更新）
   * @param persist - 是否持久化（默认 true）
   * @returns 无返回值
   */
  setPreferences(updates: DeepPartial<Preferences>, persist = true): void {
    const prevState = this.state;
    const prevActualTheme = getActualThemeMode(prevState.theme.mode);

    if (updates.lockScreen) {
      /* 早期检查：锁屏状态与密码均未变化时提前返回。 */
      if (
        updates.lockScreen.isLocked !== undefined &&
        updates.lockScreen.isLocked === prevState.lockScreen.isLocked &&
        (updates.lockScreen.password === undefined ||
          updates.lockScreen.password === prevState.lockScreen.password)
      ) {
        return;
      }
    }

    /* 深度合并更新（`safeMerge` 不修改原对象）。 */
    this.state = safeMerge(this.state, updates);

    /* 检查是否有变化。 */
    if (!hasChanges(prevState, this.state)) return;

    /* 清除缓存差异（状态已变化）。 */
    this.cachedDiff = null;

    const nextActualTheme = getActualThemeMode(this.state.theme.mode);
    const { keys: changedKeys } = diffWithKeys(prevState, this.state);

    /* 应用 CSS 变量并通知监听器。 */
    /* 主题切换时放入同一过渡回调，避免局部更新与扩散动画时序错位。 */
    if (prevActualTheme !== nextActualTheme) {
      runThemeTransition(nextActualTheme, () => {
        this.applyPreferences();
        this.notifyListeners(changedKeys);
      });
    } else {
      this.applyPreferences();
      this.notifyListeners(changedKeys);
    }

    /* 持久化（使用防抖，避免频繁写入）。 */
    if (persist) {
      this.debouncedSaveToStorage();
    }
  }

  /**
   * 立即持久化当前偏好设置
   * @description 用于锁屏等需要立即落盘的场景
   * @returns 无返回值
   */
  flush(): void {
    /* 防止重复调用。 */
    if (this.isFlushing) {
      return;
    }

    this.isFlushing = true;

    try {
      if (this.saveDebounceTimer) {
        clearTimeout(this.saveDebounceTimer);
        this.saveDebounceTimer = null;
      }
      this.saveToStorage();
      this.isFlushing = false;
    } catch (error) {
      this.isFlushing = false;
      throw error;
    }
  }

  /**
   * 更新某个分类的设置
   * @param key - 分类键名
   * @param value - 设置值
   * @param persist - 是否持久化
   */
  set<K extends PreferencesKeys>(
    key: K,
    value: DeepPartial<Preferences[K]>,
    persist = true
  ): void {
    this.setPreferences({ [key]: value } as DeepPartial<Preferences>, persist);
  }

  /**
   * 重置偏好设置
   * @param toDefault - 是否重置为默认值（否则重置为初始值）
   * @returns 无返回值
   */
  reset(toDefault = true): void {
    const newState = toDefault ? getDefaultPreferences() : deepClone(this.initialState);

    /* 保留语言设置。 */
    newState.app.locale = this.state.app.locale;

    this.state = newState;
    /* 清除差异缓存。 */
    this.cachedDiff = null;
    this.applyPreferences();
    /* 重置时立即保存。 */
    this.saveToStorage();
    this.notifyListeners(['*']);
  }

  /**
   * 重置某个分类的设置
   * @param key - 分类键名
   * @returns 无返回值
   */
  resetCategory<K extends PreferencesKeys>(key: K): void {
    this.set(key, DEFAULT_PREFERENCES[key] as DeepPartial<Preferences[K]>);
  }

  /**
   * 添加变更监听器
   * @param listener - 监听函数
   * @returns 取消监听函数
   */
  subscribe(listener: PreferencesListener): () => void {
    /* 检查监听器数量限制。 */
    if (this.listeners.size >= PreferencesManager.MAX_LISTENERS) {
      logger.warn(
        `[PreferencesManager] Max listeners (${PreferencesManager.MAX_LISTENERS}) reached. ` +
        'Consider removing unused listeners to prevent memory leaks.'
      );
    }
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * 获取当前实际主题模式
   * @returns 'light' 或 'dark'
   */
  getActualThemeMode(): 'light' | 'dark' {
    return getActualThemeMode(this.state.theme.mode);
  }

  /**
   * 切换主题模式
   * @returns 无返回值
   */
  toggleThemeMode(): void {
    const currentMode = this.getActualThemeMode();
    this.set('theme', { mode: currentMode === 'light' ? 'dark' : 'light' });
  }

  /**
   * 切换侧边栏折叠状态
   * @returns 无返回值
   */
  toggleSidebarCollapsed(): void {
    this.set('sidebar', { collapsed: !this.state.sidebar.collapsed });
  }

  /**
   * 导出配置为 JSON
   * @returns JSON 字符串
   */
  exportConfig(): string {
    return JSON.stringify(this.state, null, 2);
  }

  /**
   * 导入配置
   * @param config - JSON 字符串或对象
   * @param skipValidation - 是否跳过完整验证（默认 false）
   * @returns 无返回值
   * @throws 配置格式错误时抛出异常
   */
  importConfig(config: string | DeepPartial<Preferences>, skipValidation = false): void {
    let parsed: DeepPartial<Preferences>;

    if (typeof config === 'string') {
      try {
        parsed = JSON.parse(config);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`[PreferencesManager] Failed to parse config: ${message}`);
      }
    } else {
      parsed = config;
    }

    /* 基本类型验证。 */
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('[PreferencesManager] Invalid config: must be an object');
    }

    /* 完整配置验证（可选）。 */
    if (!skipValidation) {
      const fullConfig = deepMerge(getDefaultPreferences(), parsed);
      const validation = validatePreferencesConfig(fullConfig);
      if (!validation.valid) {
        throw new Error(`[PreferencesManager] Invalid config: ${validation.error}`);
      }
    }

    this.setPreferences(parsed);
  }

  /**
   * 获取与默认值的差异（带缓存）
   * @returns 差异对象
   */
  getDiff(): DeepPartial<Preferences> {
    if (!this.cachedDiff) {
      this.cachedDiff = diff(DEFAULT_PREFERENCES, this.state);
    }
    return this.cachedDiff;
  }

  /* ========== 私有方法 ========== */

  /**
   * 从存储加载偏好设置
   * @returns 存储中的偏好设置差异；不存在时返回 `null`
   */
  private loadFromStorage(): DeepPartial<Preferences> | null {
    return this.storage.getItem<DeepPartial<Preferences>>(PREFERENCES_STORAGE_KEY);
  }

  /**
   * 保存偏好设置到存储（立即执行）
   * @returns 无返回值
   */
  private saveToStorage(): void {
    /* 仅保存与默认值不同的部分，优先复用缓存 diff。 */
    const diffPrefs = (this.getDiff() as DeepPartial<Preferences> | null) ?? {};

    /* 检查存储中是否已有 lockScreen，用于决定是否保留锁屏状态。 */
    const storedPrefs = this.loadFromStorage();
    const hasStoredLockScreen = storedPrefs?.lockScreen !== undefined;
    const storedIsLocked = storedPrefs?.lockScreen?.isLocked;

    /* 以下条件任一成立都需要持久化 lockScreen 状态，确保刷新后状态一致。 */
    const hasPassword = this.state.lockScreen.password !== '';
    /* 关键修复：存储锁定态与当前不一致时必须落盘，保证解锁可覆盖旧锁屏。 */
    const lockStateChanged = storedIsLocked !== undefined && storedIsLocked !== this.state.lockScreen.isLocked;
    /* 检查 lockScreen 相关字段是否有实际变化。 */
    const passwordChanged = storedPrefs?.lockScreen?.password !== this.state.lockScreen.password;
    /* 存储存在 lockScreen、设置了密码、状态变更或 diff 含 lockScreen 时，都要保存。 */
    const shouldSaveLockScreen = hasPassword || hasStoredLockScreen || this.state.lockScreen.isLocked || !!diffPrefs.lockScreen || lockStateChanged || passwordChanged;

    /* 仅保存差异，避免旧存储覆盖当前状态；恢复默认时可从存储自然移除。 */
    const finalPrefs: DeepPartial<Preferences> = {};

    /* 先处理 lockScreen，避免后续 merge 覆盖。 */
    if (shouldSaveLockScreen) {
      /* 初始化 lockScreen 对象。 */
      if (!finalPrefs.lockScreen) {
        finalPrefs.lockScreen = {};
      }

      /* 如果存储已有 lockScreen，保留其他字段（排除 isLocked）。 */
      if (storedPrefs?.lockScreen) {
        const { isLocked: _storedIsLocked, ...storedLockScreenWithoutIsLocked } = storedPrefs.lockScreen;
        /* 先合并存储中的其他字段（排除 isLocked）。 */
        finalPrefs.lockScreen = { ...storedLockScreenWithoutIsLocked, ...finalPrefs.lockScreen };
      }

      /* 合并 diffPrefs.lockScreen 的非 isLocked 字段。 */
      if (diffPrefs.lockScreen) {
        const { isLocked: _diffIsLocked, ...diffLockScreenWithoutIsLocked } = diffPrefs.lockScreen;
        /* 合并 diff 中的其他字段（排除 isLocked）。 */
        finalPrefs.lockScreen = { ...finalPrefs.lockScreen, ...diffLockScreenWithoutIsLocked };
      }

      /* 始终显式保存当前 isLocked（无论 true/false），确保解锁状态可持久化。 */
      finalPrefs.lockScreen.isLocked = this.state.lockScreen.isLocked;

      /* 如果当前有密码，或存储中曾有密码，则同步保存 password。 */
      const storedPassword = storedPrefs?.lockScreen?.password;
      if (this.state.lockScreen.password || storedPassword) {
        finalPrefs.lockScreen.password = this.state.lockScreen.password;
      }
    } else if (diffPrefs.lockScreen) {
      /* 不保存 isLocked 时，仍合并 lockScreen 里其它差异字段。 */
      if (!finalPrefs.lockScreen) {
        finalPrefs.lockScreen = {};
      }
      const { isLocked: _diffIsLocked, ...diffLockScreenWithoutIsLocked } = diffPrefs.lockScreen;
      /* 只合并非 isLocked 字段。 */
      if (Object.keys(diffLockScreenWithoutIsLocked).length > 0) {
        finalPrefs.lockScreen = { ...finalPrefs.lockScreen, ...diffLockScreenWithoutIsLocked };
      }
    }

    /* 合并 lockScreen 外的差异项；合并前暂存 lockScreen 防止被覆盖。 */
    const savedLockScreen = finalPrefs.lockScreen;
    if (Object.keys(diffPrefs).length > 0) {
      const { lockScreen: _diffLockScreen, ...diffPrefsWithoutLockScreen } = diffPrefs;
      Object.assign(finalPrefs, diffPrefsWithoutLockScreen);
      /* 关键修复：恢复 lockScreen，确保不被覆盖。 */
      if (savedLockScreen) {
        finalPrefs.lockScreen = savedLockScreen;
      }
    }

    /* 关键修复：保存前再次兜底设置 lockScreen，确保 isLocked/ password 一致。 */
    if (shouldSaveLockScreen) {
      /* 强制创建 lockScreen 对象，确保字段写入安全。 */
      if (!finalPrefs.lockScreen) {
        finalPrefs.lockScreen = {};
      }
      /* 确保 lockScreen 为对象，不是 null/undefined。 */
      if (typeof finalPrefs.lockScreen !== 'object' || finalPrefs.lockScreen === null) {
        console.warn('[PreferencesManager] lockScreen is not an object, recreating:', {
          type: typeof finalPrefs.lockScreen,
          value: finalPrefs.lockScreen,
        });
        finalPrefs.lockScreen = {};
      }
      finalPrefs.lockScreen.isLocked = this.state.lockScreen.isLocked;
      /* 若当前有密码，则同步保存 password。 */
      if (this.state.lockScreen.password) {
        finalPrefs.lockScreen.password = this.state.lockScreen.password;
      }
    }

    /* 保存前最后一次检查 lockScreen，防止异常数据结构导致状态丢失。 */
    if (shouldSaveLockScreen) {
      if (!finalPrefs.lockScreen || typeof finalPrefs.lockScreen !== 'object' || finalPrefs.lockScreen === null) {
        console.error('[PreferencesManager] CRITICAL: lockScreen is missing before save, recreating:', {
          shouldSaveLockScreen,
          hasLockScreen: !!finalPrefs.lockScreen,
          lockScreenType: typeof finalPrefs.lockScreen,
          lockScreenValue: finalPrefs.lockScreen,
        });
        finalPrefs.lockScreen = {
          isLocked: this.state.lockScreen.isLocked,
          password: this.state.lockScreen.password,
        };
      }
      /* 最后一次确保 isLocked 与 password 设置正确。 */
      finalPrefs.lockScreen.isLocked = this.state.lockScreen.isLocked;
      if (this.state.lockScreen.password) {
        finalPrefs.lockScreen.password = this.state.lockScreen.password;
      }
    }

    this.storage.setItem(PREFERENCES_STORAGE_KEY, finalPrefs);
  }

  /**
   * 防抖保存到存储
   * @returns 无返回值
   */
  private debouncedSaveToStorage(): void {
    /* 清除之前的定时器。 */
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
    }

    /* 设置新的定时器，并保存 `timerId` 校验回调上下文。 */
    const timerId = setTimeout(() => {
      /* 验证定时器仍然有效（防止 destroy 后执行）。 */
      if (this.saveDebounceTimer === timerId) {
        this.saveToStorage();
        this.saveDebounceTimer = null;
      }
    }, STORAGE_DEBOUNCE_MS);
    this.saveDebounceTimer = timerId;
  }

  /**
   * 应用偏好设置（更新 CSS 变量等）
   * @returns 无返回值
   */
  private applyPreferences(): void {
    updateAllCSSVariables(this.state);
  }

  /**
   * 监听系统主题变化
   * @description 避免重复添加监听器
   * @returns 无返回值
   */
  private watchSystemTheme(): void {
    if (!isBrowser || !window.matchMedia) return;

    /* 如果已有监听器，先移除旧的（避免重复添加）。 */
    if (this.mediaQueryListener) {
      this.mediaQueryListener.removeEventListener('change', this.handleSystemThemeChange);
    }

    this.mediaQueryListener = window.matchMedia('(prefers-color-scheme: dark)');
    this.mediaQueryListener.addEventListener('change', this.handleSystemThemeChange);
  }

  /**
   * 处理系统主题变化
   * @returns 无返回值
   */
  private handleSystemThemeChange = (): void => {
    if (this.state.theme.mode === 'auto') {
      this.applyPreferences();
      this.notifyListeners(['theme.mode']);
    }
  };

  /**
   * 通知所有监听器（带错误处理）
   * @param changedKeys - 本次更新涉及的配置路径列表
   * @returns 无返回值
   */
  private notifyListeners(changedKeys: string[]): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.state, changedKeys);
      } catch (error) {
        /* 捕获监听器错误，避免中断其他监听器。 */
        logger.error('[PreferencesManager] Listener error:', error);
      }
    });
  }
}

/**
 * 创建偏好设置管理器实例
 * @param options - 初始化选项
 * @returns 管理器实例
 */
export function createPreferencesManager(
  options?: PreferencesInitOptions
): PreferencesManager {
  return new PreferencesManager(options);
}
