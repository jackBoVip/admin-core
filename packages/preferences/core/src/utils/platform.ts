/**
 * 平台检测工具
 */

import type { PlatformType } from '../types';

/* ========== SSR 兼容工具 ========== */

/**
 * 是否在浏览器环境
 */
export const isBrowser = typeof window !== 'undefined';

/**
 * 是否在服务端环境
 */
export const isServer = !isBrowser;

/**
 * 是否支持 DOM
 */
export const hasDocument = typeof document !== 'undefined';

/**
 * 是否支持 navigator
 */
export const hasNavigator = typeof navigator !== 'undefined';

/* ========== 缓存的正则表达式 ========== */

/** 移动设备检测正则（缓存避免重复创建） */
const MOBILE_DEVICE_REGEX = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;

/* ========== 平台检测 ==========*/

// 平台检测缓存（避免重复解析 userAgent）
let cachedPlatform: PlatformType | null = null;
let cachedIsMobile: boolean | null = null;
let cachedIsTouchDevice: boolean | null = null;

/**
 * 检测当前平台（带缓存）
 * @returns 平台类型
 */
export function getPlatform(): PlatformType {
  if (cachedPlatform !== null) {
    return cachedPlatform;
  }

  if (!hasNavigator) {
    cachedPlatform = 'windows'; // SSR 默认
    return cachedPlatform;
  }

  const userAgent = navigator.userAgent.toLowerCase();

  if (userAgent.includes('mac')) {
    cachedPlatform = 'macOs';
  } else if (userAgent.includes('linux')) {
    cachedPlatform = 'linux';
  } else {
    cachedPlatform = 'windows';
  }

  return cachedPlatform;
}

/**
 * 是否为 Mac 系统
 */
export function isMacOs(): boolean {
  return getPlatform() === 'macOs';
}

/**
 * 是否为 Windows 系统
 */
export function isWindows(): boolean {
  return getPlatform() === 'windows';
}

/**
 * 是否为 Linux 系统
 */
export function isLinux(): boolean {
  return getPlatform() === 'linux';
}

/**
 * 是否为移动设备（带缓存）
 */
export function isMobile(): boolean {
  if (cachedIsMobile !== null) {
    return cachedIsMobile;
  }

  if (!hasNavigator) {
    cachedIsMobile = false;
    return cachedIsMobile;
  }

  cachedIsMobile = MOBILE_DEVICE_REGEX.test(navigator.userAgent.toLowerCase());
  return cachedIsMobile;
}

/**
 * 是否为触摸设备（带缓存）
 */
export function isTouchDevice(): boolean {
  if (cachedIsTouchDevice !== null) {
    return cachedIsTouchDevice;
  }

  if (!isBrowser) {
    cachedIsTouchDevice = false;
    return cachedIsTouchDevice;
  }

  cachedIsTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  return cachedIsTouchDevice;
}

/**
 * 获取修饰键显示文本
 * @description Mac 使用 ⌘/⌥，其他系统使用 Ctrl/Alt
 * @param key - 修饰键类型
 * @returns 显示文本
 */
export function getModifierKeyText(key: 'ctrl' | 'alt' | 'shift' | 'meta'): string {
  const isMac = isMacOs();

  const keyMap: Record<string, { mac: string; other: string }> = {
    ctrl: { mac: '⌃', other: 'Ctrl' },
    alt: { mac: '⌥', other: 'Alt' },
    shift: { mac: '⇧', other: 'Shift' },
    meta: { mac: '⌘', other: 'Win' },
  };

  return isMac ? keyMap[key].mac : keyMap[key].other;
}

/**
 * 格式化快捷键显示
 * @param shortcut - 快捷键字符串（如 'Ctrl+K'）
 * @returns 格式化后的显示文本
 */
export function formatShortcut(shortcut: string): string {
  const isMac = isMacOs();

  return shortcut
    .replace(/Ctrl/gi, isMac ? '⌘' : 'Ctrl')
    .replace(/Alt/gi, isMac ? '⌥' : 'Alt')
    .replace(/Shift/gi, isMac ? '⇧' : 'Shift')
    .replace(/Meta/gi, isMac ? '⌘' : 'Win')
    .replace(/\+/g, isMac ? '' : '+');
}
