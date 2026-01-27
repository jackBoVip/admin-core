/**
 * Tailwind CSS v4 预设
 * @description 将 CSS 变量映射到 Tailwind 配置
 */

import type { Config } from 'tailwindcss';

/**
 * Admin Core Tailwind 预设
 */
export const adminCorePreset: Partial<Config> = {
  darkMode: 'class',
  theme: {
    extend: {
      // ========== 颜色 ==========
      colors: {
        // 使用 CSS 变量（OKLCH 格式），支持动态主题切换
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
          50: 'var(--primary-50)',
          100: 'var(--primary-100)',
          200: 'var(--primary-200)',
          300: 'var(--primary-300)',
          400: 'var(--primary-400)',
          500: 'var(--primary-500)',
          600: 'var(--primary-600)',
          700: 'var(--primary-700)',
          800: 'var(--primary-800)',
          900: 'var(--primary-900)',
          950: 'var(--primary-950)',
        },
        success: {
          DEFAULT: 'var(--success)',
          foreground: 'var(--success-foreground)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          foreground: 'var(--warning-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        info: {
          DEFAULT: 'var(--info)',
          foreground: 'var(--info-foreground)',
        },
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
      },

      // ========== 边框圆角 ==========
      borderRadius: {
        lg: 'calc(var(--radius) + 4px)',
        md: 'calc(var(--radius) + 2px)',
        DEFAULT: 'var(--radius)',
        sm: 'calc(var(--radius) - 2px)',
      },

      // ========== 字体大小 ==========
      fontSize: {
        base: ['var(--font-size-base)', { lineHeight: '1.5' }],
        menu: ['var(--menu-font-size)', { lineHeight: '1.5' }],
      },

      // ========== 布局尺寸 ==========
      height: {
        header: 'var(--admin-header-height)',
        footer: 'var(--admin-footer-height)',
        tabbar: 'var(--admin-tabbar-height)',
      },
      width: {
        sidebar: 'var(--admin-sidebar-width)',
        'sidebar-collapsed': 'var(--admin-sidebar-collapsed-width)',
      },
      padding: {
        content: 'var(--admin-content-padding)',
      },

      // ========== 动画时长 ==========
      transitionDuration: {
        fast: 'var(--admin-duration-fast)',
        normal: 'var(--admin-duration-normal)',
        slow: 'var(--admin-duration-slow)',
      },
      transitionTimingFunction: {
        DEFAULT: 'var(--admin-easing-default)',
        in: 'var(--admin-easing-in)',
        out: 'var(--admin-easing-out)',
      },

      // ========== z-index ==========
      zIndex: {
        base: 'var(--admin-z-index-base)',
        dropdown: 'var(--admin-z-index-dropdown)',
        modal: 'var(--admin-z-index-modal)',
        popover: 'var(--admin-z-index-popover)',
        tooltip: 'var(--admin-z-index-tooltip)',
        toast: 'var(--admin-z-index-toast)',
      },

      // ========== 关键帧动画 ==========
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
      },
      animation: {
        'accordion-down': 'accordion-down var(--admin-duration-normal) var(--admin-easing-out)',
        'accordion-up': 'accordion-up var(--admin-duration-normal) var(--admin-easing-out)',
        'collapsible-down': 'collapsible-down var(--admin-duration-normal) var(--admin-easing-out)',
        'collapsible-up': 'collapsible-up var(--admin-duration-normal) var(--admin-easing-out)',
      },
    },
  },
};
