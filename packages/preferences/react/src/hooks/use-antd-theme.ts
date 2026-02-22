import {
  getActualThemeMode,
  getDefaultPreferencesStore,
  type Preferences,
} from '@admin-core/preferences';
import { useEffect, useMemo, useState } from 'react';

export interface AdminAntdCssVarConfig {
  key?: string;
  prefix?: string;
}

export interface AdminAntdThemeAlgorithms {
  dark?: unknown;
  light?: unknown;
}

export interface AdminAntdThemeConfig {
  algorithm?: unknown;
  cssVar?: AdminAntdCssVarConfig | boolean;
  components?: Record<string, Record<string, number | string>>;
  token?: Record<string, number | string>;
}

export interface UseAdminAntdThemeOptions {
  algorithms?: AdminAntdThemeAlgorithms;
  cssVar?: AdminAntdCssVarConfig | boolean;
  tokenOverrides?: Record<string, number | string>;
}

const preferencesStore = getDefaultPreferencesStore();

function isDarkFromDom() {
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

function readRootCssVar(name: string, fallback: string) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return fallback;
  }
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
}

let colorResolver: HTMLSpanElement | null = null;

function ensureColorResolver() {
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

function clamp01(value: number) {
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

function linearToSrgb(value: number) {
  const v = clamp01(value);
  if (v <= 0.0031308) {
    return 12.92 * v;
  }
  return 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
}

function parseUnitValue(value: string) {
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

function oklchToRgb(input: string) {
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

function normalizeColorForAntd(
  input: string,
  fallback: string,
  safeFallback = '#1677ff'
) {
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

function isRgbBlackColor(value: string) {
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

function parseRadiusToNumber(input: string, fallback = 8) {
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

function resolveActualMode(preferences: null | Preferences): 'dark' | 'light' {
  if (!preferences) {
    return isDarkFromDom() ? 'dark' : 'light';
  }
  return getActualThemeMode(preferences.theme.mode);
}

function resolveAntdTokens(
  preferences: null | Preferences,
  mode: 'dark' | 'light'
) {
  const safePrimary = '#1677ff';
  const primaryFromPreferences = preferences?.theme?.colorPrimary ?? '';
  const backgroundFallback = mode === 'dark' ? '#0f172a' : '#ffffff';
  const foregroundFallback = mode === 'dark' ? '#e2e8f0' : '#0f172a';
  const borderFallback = mode === 'dark' ? '#334155' : '#d9d9d9';
  const normalizedFromPreferences = normalizeColorForAntd(
    primaryFromPreferences,
    safePrimary,
    safePrimary
  );
  const normalizedFromCssVar = normalizeColorForAntd(
    readRootCssVar('--primary', safePrimary),
    normalizedFromPreferences || safePrimary,
    safePrimary
  );
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
  } satisfies Record<string, number | string>;
}

export function useAdminAntdTheme(
  options: UseAdminAntdThemeOptions = {}
): AdminAntdThemeConfig {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return undefined;
    }
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

  return useMemo(() => {
    void version;
    const preferences = preferencesStore.getPreferences();
    const actualMode = resolveActualMode(preferences);
    const token = {
      ...resolveAntdTokens(preferences, actualMode),
      ...(options.tokenOverrides ?? {}),
    };
    const colorPrimary = String(token.colorPrimary ?? '#1677ff');
    const colorPrimaryHover = String(token.colorInfo ?? colorPrimary);
    const algorithm =
      actualMode === 'dark'
        ? options.algorithms?.dark
        : options.algorithms?.light;

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
