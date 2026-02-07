/**
 * 偏好设置管理器
 * @description 框架无关的偏好设置核心逻辑
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
 * 偏好设置变更监听器
 */
export type PreferencesListener = (
  preferences: Preferences,
  changedKeys: string[]
) => void;

/**
 * 偏好设置存储键名
 */
const PREFERENCES_STORAGE_KEY = 'preferences';

/**
 * 偏好设置管理器
 * @description
 * 设计原则：
 * 1. 框架无关：不依赖 Vue/React 的响应式系统
 * 2. 可扩展：支持自定义存储适配器
 * 3. 持久化：自动保存到本地存储
 */
/** 默认存储防抖时间（毫秒） */
const STORAGE_DEBOUNCE_MS = 300;

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

  /** 缓存的差异（避免重复计算） */
  private cachedDiff: DeepPartial<Preferences> | null = null;

  constructor(options: PreferencesInitOptions = { namespace: 'admin-core' }) {
    this.namespace = options.namespace;
    this.options = options;

    // 创建存储管理器
    this.storage = options.storage ?? createStorageManager({
      prefix: this.namespace,
    });

    // 加载初始状态
    const storedPrefs = this.loadFromStorage();
    const defaultPrefs = getDefaultPreferences();

    // 合并配置优先级：存储 > 覆盖 > 默认
    this.state = deepMerge(
      defaultPrefs,
      options.overrides ?? {},
      storedPrefs ?? {}
    );

    // 保存初始状态
    this.initialState = deepClone(this.state);
  }

  /**
   * 初始化管理器
   * @description 应用初始设置、监听系统主题变化
   */
  init(): void {
    if (this.initialized) return;

    // 设置 DOM 选择器（用于深色侧边栏/顶栏功能）
    if (this.options.selectors) {
      setDOMSelectors(this.options.selectors);
    }

    // 应用 CSS 变量
    this.applyPreferences();

    // 监听系统主题变化
    this.watchSystemTheme();

    // 初始化主题切换动画位置追踪
    initThemeTransitionTracking();

    this.initialized = true;
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    // 移除媒体查询监听
    if (this.mediaQueryListener) {
      this.mediaQueryListener.removeEventListener('change', this.handleSystemThemeChange);
    }

    // 清除防抖定时器
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
      this.saveDebounceTimer = null;
    }

    // 清空监听器
    this.listeners.clear();

    // 清除缓存
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
   */
  setPreferences(updates: DeepPartial<Preferences>, persist = true): void {
    const prevState = this.state;
    const prevActualTheme = getActualThemeMode(prevState.theme.mode);

    // 深度合并更新（safeMerge 不修改原对象）
    this.state = safeMerge(this.state, updates);

    // 检查是否有变化
    if (!hasChanges(prevState, this.state)) return;

    // 清除缓存的差异（状态已变化）
    this.cachedDiff = null;

    const nextActualTheme = getActualThemeMode(this.state.theme.mode);

    // 应用 CSS 变量（主题切换时执行扩散/收缩动画）
    if (prevActualTheme !== nextActualTheme) {
      runThemeTransition(nextActualTheme, () => {
        this.applyPreferences();
      });
    } else {
      this.applyPreferences();
    }

    // 持久化（使用防抖）
    if (persist) {
      this.debouncedSaveToStorage();
    }

    // 通知监听器（使用 diffWithKeys 一次计算差异和变更键）
    const { keys: changedKeys } = diffWithKeys(prevState, this.state);
    this.notifyListeners(changedKeys);
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
   */
  reset(toDefault = true): void {
    const newState = toDefault ? getDefaultPreferences() : deepClone(this.initialState);

    // 保留语言设置
    newState.app.locale = this.state.app.locale;

    this.state = newState;
    this.cachedDiff = null; // 清除差异缓存
    this.applyPreferences();
    this.saveToStorage(); // 重置时立即保存
    this.notifyListeners(['*']);
  }

  /**
   * 重置某个分类的设置
   * @param key - 分类键名
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
    // 检查监听器数量限制
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
   */
  toggleThemeMode(): void {
    const currentMode = this.getActualThemeMode();
    this.set('theme', { mode: currentMode === 'light' ? 'dark' : 'light' });
  }

  /**
   * 切换侧边栏折叠状态
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

    // 基本类型验证
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('[PreferencesManager] Invalid config: must be an object');
    }

    // 完整配置验证（可选）
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

  // ========== 私有方法 ==========

  /**
   * 从存储加载偏好设置
   */
  private loadFromStorage(): DeepPartial<Preferences> | null {
    return this.storage.getItem<DeepPartial<Preferences>>(PREFERENCES_STORAGE_KEY);
  }

  /**
   * 保存偏好设置到存储（立即执行）
   */
  private saveToStorage(): void {
    // 只保存与默认值不同的部分
    // 使用缓存的 diff（若缓存为空则即时计算）
    const diffPrefs = this.getDiff();
    this.storage.setItem(PREFERENCES_STORAGE_KEY, diffPrefs);
  }

  /**
   * 防抖保存到存储
   */
  private debouncedSaveToStorage(): void {
    // 清除之前的定时器
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
    }

    // 设置新的定时器，保存 timerId 用于验证回调上下文
    const timerId = setTimeout(() => {
      // 验证定时器仍然有效（防止 destroy 后执行）
      if (this.saveDebounceTimer === timerId) {
        this.saveToStorage();
        this.saveDebounceTimer = null;
      }
    }, STORAGE_DEBOUNCE_MS);
    this.saveDebounceTimer = timerId;
  }

  /**
   * 应用偏好设置（更新 CSS 变量等）
   */
  private applyPreferences(): void {
    updateAllCSSVariables(this.state);
  }

  /**
   * 监听系统主题变化
   * @description 避免重复添加监听器
   */
  private watchSystemTheme(): void {
    if (!isBrowser || !window.matchMedia) return;

    // 如果已有监听器，先移除旧的（避免重复添加）
    if (this.mediaQueryListener) {
      this.mediaQueryListener.removeEventListener('change', this.handleSystemThemeChange);
    }

    this.mediaQueryListener = window.matchMedia('(prefers-color-scheme: dark)');
    this.mediaQueryListener.addEventListener('change', this.handleSystemThemeChange);
  }

  /**
   * 处理系统主题变化
   */
  private handleSystemThemeChange = (): void => {
    if (this.state.theme.mode === 'auto') {
      this.applyPreferences();
      this.notifyListeners(['theme.mode']);
    }
  };

  /**
   * 通知所有监听器（带错误处理）
   */
  private notifyListeners(changedKeys: string[]): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.state, changedKeys);
      } catch (error) {
        // 捕获监听器错误，避免中断其他监听器
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
