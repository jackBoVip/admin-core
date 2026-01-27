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

/* ========== 平台检测 ==========*/

/**
 * 检测当前平台
 * @returns 平台类型
 */
export function getPlatform(): PlatformType {
  if (!hasNavigator) {
    return 'windows'; // SSR 默认
  }

  const userAgent = navigator.userAgent.toLowerCase();

  if (userAgent.includes('mac')) return 'macOs';
  if (userAgent.includes('linux')) return 'linux';
  return 'windows';
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
 * 是否为移动设备
 */
export function isMobile(): boolean {
  if (!hasNavigator) {
    return false;
  }

  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
    navigator.userAgent.toLowerCase()
  );
}

/**
 * 是否为触摸设备
 */
export function isTouchDevice(): boolean {
  if (!isBrowser) {
    return false;
  }

  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
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
