/**
 * 资源文件导出
 * @description 将资源文件作为模块导出，便于在不同构建环境中使用
 */

/**
 * 默认锁屏背景图片资源。
 * @description 使用相对路径导入，交由构建工具解析为可访问 URL。
 */
import lockScreenBgUrl from './lock-screen-bg.jpg';

/** 默认锁屏背景图片 URL */
export const defaultLockScreenBg = lockScreenBgUrl;
