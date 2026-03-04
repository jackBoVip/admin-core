/**
 * React Ant Design 主题桥接 Hook。
 * @description 将 admin 偏好设置与 CSS 变量映射为 antd `ConfigProvider` 可消费的主题配置。
 */
import {
  getActualThemeMode,
  getDefaultPreferencesStore,
  type Preferences,
} from '@admin-core/preferences';
import { useEffect, useMemo, useState } from 'react';

/**
 * Ant Design CSS 变量配置。
 */
export interface AdminAntdCssVarConfig {
  /** 键名。 */
  key?: string;
  /** 样式变量前缀。 */
  prefix?: string;
}

/**
 * Ant Design 主题算法配置。
 */
export interface AdminAntdThemeAlgorithms {
  /** 深色模式算法。 */
  dark?: unknown;
  /** 浅色模式算法。 */
  light?: unknown;
}

/**
 * `ConfigProvider` 可消费的主题配置。
 */
export interface AdminAntdThemeConfig {
  /** 主题算法。 */
  algorithm?: unknown;
  /** 样式变量配置。 */
  cssVar?: AdminAntdCssVarConfig | boolean;
  /** 组件级 token 覆盖。 */
  components?: Record<string, Record<string, number | string>>;
  /** 全局 token。 */
  token?: Record<string, number | string>;
}

/**
 * `useAdminAntdTheme` 可选配置。
 */
export interface UseAdminAntdThemeOptions {
  /** 主题算法配置。 */
  algorithms?: AdminAntdThemeAlgorithms;
  /** 样式变量配置。 */
  cssVar?: AdminAntdCssVarConfig | boolean;
  /** 设计令牌覆盖项。 */
  tokenOverrides?: Record<string, number | string>;
}

/**
 * 默认偏好设置存储实例。
 */
const preferencesStore = getDefaultPreferencesStore();

/**
 * Ant Design 主题令牌值类型。
 */
type AntdTokenValue = number | string;

/**
 * Ant Design 主题令牌映射。
 */
type AntdTokenMap = Record<string, AntdTokenValue>;

/**
 * 从 DOM 上的类名和属性推断是否深色模式。
 */
function isDarkFromDom(): boolean {
  if (typeof document === 'undefined') {
    return false;
  }
  const root = document.documentElement;
  const body = document.body;
  return (
    root.classList.contains('dark') ||
    root.getAttribute('data-theme') === 'dark' ||
    body?.classList.contains('dark') ||
    body?.getAttribute('data-theme') === 'dark'
  );
}

/**
 * 读取根节点 CSS 变量。
 * @param name CSS 变量名。
 * @param fallback 读取失败时回退值。
 * @returns 变量值或回退值。
 */
function readRootCssVar(name: string, fallback: string): string {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return fallback;
  }
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
}

/**
 * 颜色解析辅助节点缓存。
 * @description 复用隐藏节点做颜色合法性验证，避免重复创建 DOM。
 */
let colorResolver: HTMLSpanElement | null = null;

/**
 * 获取颜色解析辅助节点，用于校验颜色值是否合法。
 * @returns 用于颜色解析的隐藏节点；在非浏览器环境返回 `null`。
 */
function ensureColorResolver(): HTMLSpanElement | null {
  if (typeof document === 'undefined') {
    return null;
  }
  if (!colorResolver) {
    colorResolver = document.createElement('span');
    colorResolver.setAttribute('aria-hidden', 'true');
    colorResolver.style.cssText =
      'position:fixed;left:-9999px;top:-9999px;visibility:hidden;pointer-events:none;';
    const mountTarget = document.body || document.documentElement;
    mountTarget.appendChild(colorResolver);
  }
  return colorResolver;
}

/**
 * 将数值限制在 `[0,1]` 区间。
 * @param value 原始值。
 * @returns 归一化后的值。
 */
function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  if (value < 0) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  return value;
}

/**
 * 线性 RGB 转换为 sRGB。
 * @param value 线性 RGB 通道值。
 * @returns sRGB 通道值。
 */
function linearToSrgb(value: number): number {
  const v = clamp01(value);
  if (v <= 0.0031308) {
    return 12.92 * v;
  }
  return 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
}

/**
 * 解析数值或百分比字符串。
 * @param value 原始输入值。
 * @returns 解析结果，失败返回 `null`。
 */
function parseUnitValue(value: string): null | number {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.endsWith('%')) {
    const numeric = Number.parseFloat(trimmed.slice(0, -1));
    if (!Number.isFinite(numeric)) {
      return null;
    }
    return numeric / 100;
  }
  const numeric = Number.parseFloat(trimmed);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  return numeric;
}

/**
 * 将 `oklch(...)` 颜色转换为 `rgb/rgba`。
 * @param input 原始颜色字符串。
 * @returns 转换后的颜色字符串，无法解析时返回 `null`。
 */
function oklchToRgb(input: string): null | string {
  const match = input
    .trim()
    .match(/^oklch\(\s*([^\s/]+)\s+([^\s/]+)\s+([^\s/]+)(?:\s*\/\s*([^)]+))?\s*\)$/i);
  if (!match) {
    return null;
  }

  const lRaw = parseUnitValue(match[1] ?? '');
  const cRaw = parseUnitValue(match[2] ?? '');
  const hRaw = parseUnitValue(match[3] ?? '');
  if (lRaw === null || cRaw === null || hRaw === null) {
    return null;
  }

  const alphaRaw = match[4] ? parseUnitValue(match[4]) : 1;
  const alpha = clamp01(alphaRaw ?? 1);
  const l = clamp01(lRaw);
  const c = Math.max(0, cRaw);
  const h = ((hRaw % 360) + 360) % 360;
  const hueRad = (h * Math.PI) / 180;

  const a = c * Math.cos(hueRad);
  const b = c * Math.sin(hueRad);

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;

  const l3 = l_ ** 3;
  const m3 = m_ ** 3;
  const s3 = s_ ** 3;

  const rLinear = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  const gLinear = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  const bLinear = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3;

  const r = Math.round(clamp01(linearToSrgb(rLinear)) * 255);
  const g = Math.round(clamp01(linearToSrgb(gLinear)) * 255);
  const bOut = Math.round(clamp01(linearToSrgb(bLinear)) * 255);

  if (alpha >= 1) {
    return `rgb(${r}, ${g}, ${bOut})`;
  }
  return `rgba(${r}, ${g}, ${bOut}, ${alpha})`;
}

/**
 * 归一化颜色值，确保可被浏览器和 Ant Design 正确识别。
 * @param input 原始颜色值。
 * @param fallback 第一层回退颜色。
 * @param safeFallback 最终安全回退颜色。
 * @returns 可用颜色值。
 */
function normalizeColorForAntd(
  input: string,
  fallback: string,
  safeFallback = '#1677ff'
): string {
  const value = input.trim() || fallback || safeFallback;
  const normalizedValue = oklchToRgb(value) ?? value;
  const normalizedFallback = oklchToRgb(fallback) ?? fallback;
  const normalizedSafeFallback = oklchToRgb(safeFallback) ?? safeFallback;

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return normalizedValue || normalizedSafeFallback;
  }

  const resolver = ensureColorResolver();
  if (!resolver) {
    return normalizedValue || normalizedSafeFallback;
  }

  resolver.style.color = '';
  resolver.style.color = normalizedValue;
  if (!resolver.style.color) {
    const converted = oklchToRgb(normalizedValue);
    if (converted) {
      resolver.style.color = converted;
    }
  }
  if (!resolver.style.color && fallback) {
    resolver.style.color = normalizedFallback;
    if (!resolver.style.color) {
      const converted = oklchToRgb(normalizedFallback);
      if (converted) {
        resolver.style.color = converted;
      }
    }
  }
  if (!resolver.style.color && safeFallback) {
    resolver.style.color = normalizedSafeFallback;
  }
  if (!resolver.style.color) {
    return normalizedSafeFallback;
  }

  const resolved = getComputedStyle(resolver).color.trim();
  const normalizedResolved = oklchToRgb(resolved) ?? resolved;
  return normalizedResolved || normalizedSafeFallback;
}

/**
 * 判断颜色字符串是否表示纯黑色。
 * @param value 颜色字符串。
 * @returns 是否为纯黑。
 */
function isRgbBlackColor(value: string): boolean {
  const input = value.trim().toLowerCase();
  if (!input) {
    return false;
  }

  if (input === 'black' || input === '#000' || input === '#000000' || input === '#000000ff') {
    return true;
  }

  const hex = input.match(/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
  if (hex) {
    const raw = hex[1];
    if (raw.length === 3) {
      return raw.toLowerCase() === '000';
    }
    return raw.slice(0, 6).toLowerCase() === '000000';
  }

  const rgbLike = input.match(/^rgba?\(\s*([^)]+)\)$/);
  if (!rgbLike) {
    return false;
  }
  const channels = rgbLike[1]
    .split(/[,\s/]+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => {
      if (part.endsWith('%')) {
        const percent = Number.parseFloat(part.slice(0, -1));
        return Number.isFinite(percent) ? (255 * percent) / 100 : Number.NaN;
      }
      return Number.parseFloat(part);
    });
  if (channels.length !== 3 || channels.some((channel) => !Number.isFinite(channel))) {
    return false;
  }
  return channels.every((channel) => channel === 0);
}

/**
 * 解析圆角值为数值像素。
 * @param input 圆角字符串。
 * @param fallback 解析失败时回退值。
 * @returns 圆角数值（像素）。
 */
function parseRadiusToNumber(input: string, fallback = 8): number {
  const value = input.trim();
  if (!value) {
    return fallback;
  }

  const numeric = Number.parseFloat(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  if (value.endsWith('rem')) {
    return Math.max(0, numeric * 16);
  }
  return Math.max(0, numeric);
}

/**
 * 解析当前真实主题模式。
 * @param preferences 偏好设置；为空时从 DOM 推断。
 * @returns `light` 或 `dark`。
 */
function resolveActualMode(preferences: null | Preferences): 'dark' | 'light' {
  if (!preferences) {
    return isDarkFromDom() ? 'dark' : 'light';
  }
  return getActualThemeMode(preferences.theme.mode);
}

/**
 * 基于偏好设置和 CSS 变量生成 Ant Design token。
 * @param preferences 偏好设置。
 * @param mode 当前主题模式。
 * @returns 主题 token。
 */
function resolveAntdTokens(
  preferences: null | Preferences,
  mode: 'dark' | 'light'
): AntdTokenMap {
  /**
   * 主色安全回退值。
   */
  const safePrimary = '#1677ff';
  /**
   * 偏好中心配置的主色。
   */
  const primaryFromPreferences = preferences?.theme?.colorPrimary ?? '';
  /**
   * 背景色回退值（随主题模式变化）。
   */
  const backgroundFallback = mode === 'dark' ? '#0f172a' : '#ffffff';
  /**
   * 前景色回退值（随主题模式变化）。
   */
  const foregroundFallback = mode === 'dark' ? '#e2e8f0' : '#0f172a';
  /**
   * 边框色回退值（随主题模式变化）。
   */
  const borderFallback = mode === 'dark' ? '#334155' : '#d9d9d9';
  /**
   * 从偏好主色规范化得到的候选主色。
   */
  const normalizedFromPreferences = normalizeColorForAntd(
    primaryFromPreferences,
    safePrimary,
    safePrimary
  );
  /**
   * 从 CSS 变量解析得到的候选主色。
   */
  const normalizedFromCssVar = normalizeColorForAntd(
    readRootCssVar('--primary', safePrimary),
    normalizedFromPreferences || safePrimary,
    safePrimary
  );
  /**
   * 当前解析出的主色（后续会做黑色兜底修正）。
   */
  let resolvedPrimary =
    !normalizedFromCssVar || isRgbBlackColor(normalizedFromCssVar)
      ? normalizedFromPreferences
      : normalizedFromCssVar;
  if (isRgbBlackColor(resolvedPrimary)) {
    const menuActive = normalizeColorForAntd(
      readRootCssVar('--menu-item-active', safePrimary),
      safePrimary,
      safePrimary
    );
    if (!isRgbBlackColor(menuActive)) {
      resolvedPrimary = menuActive;
    }
  }
  if (isRgbBlackColor(resolvedPrimary)) {
    resolvedPrimary = safePrimary;
  }

  return {
    borderRadius: parseRadiusToNumber(readRootCssVar('--radius', '8px'), 8),
    colorBgBase: normalizeColorForAntd(
      readRootCssVar('--background', backgroundFallback),
      backgroundFallback,
      backgroundFallback
    ),
    colorBgContainer: normalizeColorForAntd(
      readRootCssVar('--card', backgroundFallback),
      backgroundFallback,
      backgroundFallback
    ),
    colorBgElevated: normalizeColorForAntd(
      readRootCssVar('--popover', backgroundFallback),
      backgroundFallback,
      backgroundFallback
    ),
    colorBgLayout: normalizeColorForAntd(
      readRootCssVar('--muted', backgroundFallback),
      backgroundFallback,
      backgroundFallback
    ),
    colorBorder: normalizeColorForAntd(
      readRootCssVar('--border', borderFallback),
      borderFallback,
      borderFallback
    ),
    colorError: normalizeColorForAntd(
      readRootCssVar('--destructive', '#ef4444'),
      '#ef4444',
      '#ef4444'
    ),
    colorInfo: normalizeColorForAntd(
      readRootCssVar('--info', resolvedPrimary),
      resolvedPrimary,
      safePrimary
    ),
    colorPrimary: resolvedPrimary,
    colorSuccess: normalizeColorForAntd(
      readRootCssVar('--success', '#16a34a'),
      '#16a34a',
      '#16a34a'
    ),
    colorText: normalizeColorForAntd(
      readRootCssVar('--foreground', foregroundFallback),
      foregroundFallback,
      foregroundFallback
    ),
    colorTextBase: normalizeColorForAntd(
      readRootCssVar('--foreground', foregroundFallback),
      foregroundFallback,
      foregroundFallback
    ),
    colorTextSecondary: normalizeColorForAntd(
      readRootCssVar('--muted-foreground', '#64748b'),
      '#64748b',
      '#64748b'
    ),
    colorWarning: normalizeColorForAntd(
      readRootCssVar('--warning', '#f59e0b'),
      '#f59e0b',
      '#f59e0b'
    ),
  } satisfies AntdTokenMap;
}

/**
 * 构建并订阅 Admin 主题到 Ant Design 主题配置。
 * @param options 主题算法、变量与 token 覆盖配置。
 * @returns Ant Design 主题配置对象。
 */
export function useAdminAntdTheme(
  options: UseAdminAntdThemeOptions = {}
): AdminAntdThemeConfig {
  /**
   * 内部主题版本号。
   * @description 通过递增版本号触发 `useMemo` 重算主题配置。
   */
  const [version, setVersion] = useState(0);

  /**
   * 订阅偏好与 DOM 主题变化。
   * @description 通过 store 订阅与 `MutationObserver` 联动，触发版本号递增并重算主题配置。
   */
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return undefined;
    }
    /**
     * 刷新主题版本号
     * @description 递增内部版本计数，触发 `useMemo` 重新计算 Ant Design 主题配置。
     */
    const update = () => {
      setVersion((prev) => prev + 1);
    };

    const unsubscribe = preferencesStore.subscribe(update);

    const rootObserver = new MutationObserver(update);
    rootObserver.observe(document.documentElement, {
      attributeFilter: ['class', 'data-theme', 'style'],
      attributes: true,
    });

    const bodyObserver = new MutationObserver(update);
    if (document.body) {
      bodyObserver.observe(document.body, {
        attributeFilter: ['class', 'data-theme', 'style'],
        attributes: true,
      });
    }

    return () => {
      unsubscribe();
      rootObserver.disconnect();
      bodyObserver.disconnect();
    };
  }, []);

  /**
   * 计算并返回 Ant Design 主题配置。
   * @description 结合当前偏好、真实主题模式和外部覆盖项生成稳定的 `ConfigProvider` 可用配置。
   */
  return useMemo(() => {
    void version;
    /**
     * 当前偏好设置快照。
     */
    const preferences = preferencesStore.getPreferences();
    /**
     * 当前实际主题模式。
     */
    const actualMode = resolveActualMode(preferences);
    /**
     * 最终 token 集合（基础 token + 外部覆盖）。
     */
    const token = {
      ...resolveAntdTokens(preferences, actualMode),
      ...(options.tokenOverrides ?? {}),
    };
    /**
     * 主色 token。
     */
    const colorPrimary = String(token.colorPrimary ?? '#1677ff');
    /**
     * 主色悬停 token。
     */
    const colorPrimaryHover = String(token.colorInfo ?? colorPrimary);
    /**
     * 当前模式对应的主题算法实现。
     */
    const algorithm =
      actualMode === 'dark'
        ? options.algorithms?.dark
        : options.algorithms?.light;

    /**
     * 最终返回给 antd `ConfigProvider` 的主题配置。
     */
    const themeConfig: AdminAntdThemeConfig = {
      cssVar: options.cssVar ?? { key: 'admin-core' },
      components: {
        Checkbox: {
          colorPrimary,
          colorPrimaryHover,
        },
      },
      token,
    };
    if (algorithm !== undefined) {
      themeConfig.algorithm = algorithm;
    }
    return themeConfig;
  }, [
    options.algorithms?.dark,
    options.algorithms?.light,
    options.cssVar,
    options.tokenOverrides,
    version,
  ]);
}
