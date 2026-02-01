/**
 * Layout English Language Pack
 */

import type { LayoutLocale } from './zh-CN';

const locale: LayoutLocale = {
  layout: {
    // Common
    common: {
      collapse: 'Collapse',
      expand: 'Expand',
      close: 'Close',
      closeAll: 'Close All',
      closeOther: 'Close Other',
      closeLeft: 'Close Left',
      closeRight: 'Close Right',
      refresh: 'Refresh',
      maximize: 'Maximize',
      restore: 'Restore',
      pin: 'Pin',
      unpin: 'Unpin',
      more: 'More',
      search: 'Search',
      noData: 'No Data',
      loading: 'Loading...',
    },

    // Header
    header: {
      title: 'Header',
      toggleSidebar: 'Toggle Sidebar',
      search: 'Search',
      searchPlaceholder: 'Enter keywords to search...',
      refresh: 'Refresh',
      fullscreen: 'Fullscreen',
      exitFullscreen: 'Exit Fullscreen',
      toggleTheme: 'Toggle Theme',
      toggleLanguage: 'Toggle Language',
      notifications: 'Notifications',
    },

    // Sidebar
    sidebar: {
      title: 'Sidebar',
      collapse: 'Collapse Sidebar',
      expand: 'Expand Sidebar',
      pin: 'Pin Sidebar',
      unpin: 'Unpin',
    },

    // Tabbar
    tabbar: {
      title: 'Tabs',
      close: 'Close Tab',
      closeAll: 'Close All Tabs',
      closeOther: 'Close Other Tabs',
      closeLeft: 'Close Left Tabs',
      closeRight: 'Close Right Tabs',
      refresh: 'Refresh Current Page',
      maximize: 'Maximize',
      restore: 'Restore',
      newTab: 'New Tab',
      contextMenu: {
        reload: 'Reload',
        close: 'Close',
        closeOther: 'Close Other',
        closeAll: 'Close All',
        closeLeft: 'Close Left',
        closeRight: 'Close Right',
        pin: 'Pin',
        unpin: 'Unpin',
        openInNewWindow: 'Open in New Window',
      },
    },

    // Breadcrumb
    breadcrumb: {
      title: 'Breadcrumb',
      home: 'Home',
    },

    // Footer
    footer: {
      title: 'Footer',
    },

    // Panel
    panel: {
      title: 'Panel',
      collapse: 'Collapse Panel',
      expand: 'Expand Panel',
    },

    // Widgets
    widget: {
      fullscreen: {
        title: 'Fullscreen',
        enter: 'Enter Fullscreen',
        exit: 'Exit Fullscreen',
      },
      theme: {
        title: 'Theme',
        light: 'Light Mode',
        dark: 'Dark Mode',
        auto: 'System',
      },
    },

    // Theme
    theme: {
      light: 'Light Mode',
      dark: 'Dark Mode',
      auto: 'System',
    },

    // Notification
    notification: {
      title: 'Notifications',
      empty: 'No notifications',
      viewAll: 'View All',
      markAllRead: 'Mark All Read',
      clear: 'Clear',
      unread: 'unread',
      justNow: 'Just now',
      minutesAgo: 'minutes ago',
      hoursAgo: 'hours ago',
      daysAgo: 'days ago',
    },

    // Search
    search: {
      placeholder: 'Search menus, features...',
      noResults: 'No results found',
      tips: 'Enter keywords to search menus',
      navigate: 'Navigate',
      select: 'Select',
      close: 'Close',
    },

    // User
    user: {
      guest: 'Guest',
      profile: 'Profile',
      settings: 'Settings',
      lockScreen: 'Lock Screen',
      logout: 'Logout',
    },

    // Widgets (Legacy)
    widgetLegacy: {
      locale: {
        title: 'Language',
        'zh-CN': '简体中文',
        'en-US': 'English',
      },
      notification: {
        title: 'Notifications',
        empty: 'No Notifications',
        viewAll: 'View All',
        markAllRead: 'Mark All as Read',
        clear: 'Clear',
      },
      user: {
        title: 'User',
        profile: 'Profile',
        settings: 'Settings',
        logout: 'Logout',
        logoutConfirm: 'Are you sure you want to logout?',
      },
      search: {
        title: 'Search',
        placeholder: 'Search menus, features...',
        noResult: 'No results found',
        history: 'Search History',
        clearHistory: 'Clear History',
      },
      lock: {
        title: 'Lock Screen',
        lock: 'Lock Screen',
        unlock: 'Unlock',
        password: 'Lock Password',
        passwordPlaceholder: 'Enter lock password',
        passwordError: 'Incorrect password',
        setPassword: 'Set Lock Password',
        noPassword: 'No lock password set',
      },
      timezone: {
        title: 'Timezone',
        current: 'Current Timezone',
      },
      refresh: {
        title: 'Refresh',
        tooltip: 'Refresh Current Page',
      },
      preferences: {
        title: 'Preferences',
        tooltip: 'Open Preferences',
      },
      backToTop: {
        title: 'Back to Top',
      },
    },

    // Menu
    menu: {
      search: 'Search Menu',
      searchPlaceholder: 'Enter keywords to search menu...',
      noResult: 'No matching menu found',
      expand: 'Expand All',
      collapse: 'Collapse All',
    },

    // Content
    content: {
      loading: 'Page Loading...',
      error: 'Page Load Failed',
      retry: 'Retry',
      empty: 'No Content',
    },

    // Copyright
    copyright: {
      powered: 'Powered by',
      icp: 'ICP',
    },
  },
};

export default locale;
