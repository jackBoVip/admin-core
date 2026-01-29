/**
 * Tailwind CSS v4 预设 - 简化版
 * @description 
 * Tailwind v4 通过 @theme 指令自动从 CSS 变量生成工具类，
 * 因此这里只需要定义 v4 未自动处理的配置。
 *
 * @theme 指令已定义（在 variables.css 中）：
 * - 所有颜色 (--color-*)
 * - 圆角 (--radius-*)
 * - 间距 (--spacing-*)
 * - 动画时长 (--duration-*)
 * - Z-Index (--z-*)
 *
 * 此预设仅补充 v4 不支持自动映射的配置。
 */

import type { Config } from 'tailwindcss';

/**
 * Admin Core Tailwind 预设
 * @description 补充 @theme 指令未覆盖的配置
 */
export const adminCorePreset: Partial<Config> = {
  darkMode: 'class',
  theme: {
    extend: {
      // ========== 字体大小（需要指定 lineHeight） ==========
      fontSize: {
        base: ['var(--font-size-base)', { lineHeight: '1.5' }],
        menu: ['var(--menu-font-size)', { lineHeight: '1.5' }],
      },

      // ========== 额外的高度/宽度别名 ==========
      height: {
        header: 'var(--admin-header-height)',
        footer: 'var(--admin-footer-height)',
        tabbar: 'var(--admin-tabbar-height)',
        // 动态视口高度（移动端兼容）
        dvh: '100dvh',
        svh: '100svh',
        lvh: '100lvh',
      },
      width: {
        sidebar: 'var(--admin-sidebar-width)',
        'sidebar-collapsed': 'var(--admin-sidebar-collapsed-width)',
        drawer: 'var(--admin-drawer-width)',
      },
      maxWidth: {
        drawer: 'var(--admin-drawer-width)',
      },
      padding: {
        content: 'var(--admin-content-padding)',
      },

      // ========== 缓动函数别名 ==========
      transitionTimingFunction: {
        DEFAULT: 'var(--admin-easing-default)',
        in: 'var(--admin-easing-in)',
        out: 'var(--admin-easing-out)',
      },

      // ========== 关键帧动画（Radix UI 组件使用） ==========
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'collapsible-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-collapsible-content-height)' },
        },
        'collapsible-up': {
          from: { height: 'var(--radix-collapsible-content-height)' },
          to: { height: '0' },
        },
        // 复制成功动画
        'copy-success': {
          '0%': { transform: 'scale(0.8)', opacity: '0.5' },
          '50%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down var(--admin-duration-normal) var(--admin-easing-out)',
        'accordion-up': 'accordion-up var(--admin-duration-normal) var(--admin-easing-out)',
        'collapsible-down': 'collapsible-down var(--admin-duration-normal) var(--admin-easing-out)',
        'collapsible-up': 'collapsible-up var(--admin-duration-normal) var(--admin-easing-out)',
        'copy-success': 'copy-success 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },

      // ========== 容器查询断点 ==========
      containers: {
        drawer: '384px',
        'drawer-sm': '320px',
        'drawer-xs': '280px',
      },
    },
  },
};
