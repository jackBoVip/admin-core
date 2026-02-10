/**
 * 布局中文语言包
 */

export default {
  layout: {
    // 通用
    common: {
      collapse: '收起',
      expand: '展开',
      close: '关闭',
      closeAll: '关闭全部',
      closeOther: '关闭其他',
      closeLeft: '关闭左侧',
      closeRight: '关闭右侧',
      refresh: '刷新',
      maximize: '最大化',
      restore: '还原',
      pin: '固定',
      unpin: '取消固定',
      more: '更多',
      search: '搜索',
      noData: '暂无数据',
      loading: '加载中...',
    },

    // 顶栏
    header: {
      title: '顶栏',
      toggleSidebar: '切换侧边栏',
      menuLauncher: '菜单',
      search: '搜索',
      searchPlaceholder: '输入关键词搜索...',
      refresh: '刷新页面',
      fullscreen: '全屏',
      exitFullscreen: '退出全屏',
      toggleTheme: '切换主题',
      toggleLanguage: '切换语言',
      notifications: '通知',
    },

    // 侧边栏
    sidebar: {
      title: '侧边栏',
      collapse: '收起侧边栏',
      expand: '展开侧边栏',
      pin: '固定侧边栏',
      unpin: '取消固定',
    },

    // 标签栏
    tabbar: {
      title: '标签栏',
      close: '关闭标签',
      closeAll: '关闭全部标签',
      closeOther: '关闭其他标签',
      closeLeft: '关闭左侧标签',
      closeRight: '关闭右侧标签',
      refresh: '刷新当前页',
      maximize: '最大化',
      restore: '还原',
      newTab: '新标签页',
      contextMenu: {
        reload: '重新加载',
        close: '关闭',
        closeOther: '关闭其他',
        closeAll: '关闭全部',
        closeLeft: '关闭左侧',
        closeRight: '关闭右侧',
        maximize: '最大化',
        restoreMaximize: '还原',
        favorite: '加入收藏',
        unfavorite: '取消收藏',
        pin: '固定',
        unpin: '取消固定',
        openInNewWindow: '在新窗口打开',
      },
    },

    // 面包屑
    breadcrumb: {
      title: '面包屑',
      home: '首页',
    },

    // 页脚
    footer: {
      title: '页脚',
    },

    // 功能区
    panel: {
      title: '功能区',
      collapse: '收起功能区',
      expand: '展开功能区',
    },

    // 小部件
    widget: {
      fullscreen: {
        title: '全屏',
        enter: '进入全屏',
        exit: '退出全屏',
      },
      theme: {
        title: '主题',
        light: '浅色模式',
        dark: '深色模式',
        auto: '跟随系统',
      },
    },

    // 主题
    theme: {
      light: '浅色模式',
      dark: '深色模式',
      auto: '跟随系统',
    },

    // 通知
    notification: {
      title: '通知',
      empty: '暂无通知',
      viewAll: '查看全部',
      markAllRead: '全部已读',
      clear: '清空',
      unread: '条未读',
      justNow: '刚刚',
      minutesAgo: '分钟前',
      hoursAgo: '小时前',
      daysAgo: '天前',
    },

    // 搜索
    search: {
      placeholder: '搜索菜单、功能...',
      noResults: '未找到相关结果',
      tips: '输入关键词搜索菜单',
      navigate: '导航',
      select: '选择',
      close: '关闭',
    },

    // 用户
    user: {
      guest: '访客',
      profile: '个人中心',
      settings: '个人设置',
      lockScreen: '锁定屏幕',
      logout: '退出登录',
    },

    // 小部件 (旧版，保持兼容)
    widgetLegacy: {
      locale: {
        title: '语言',
        'zh-CN': '简体中文',
        'en-US': 'English',
      },
      notification: {
        title: '通知',
        empty: '暂无通知',
        viewAll: '查看全部',
        markAllRead: '全部已读',
        clear: '清空',
      },
      user: {
        title: '用户',
        profile: '个人中心',
        settings: '个人设置',
        logout: '退出登录',
        logoutConfirm: '确定要退出登录吗？',
      },
      search: {
        title: '搜索',
        placeholder: '搜索菜单、功能...',
        noResult: '未找到相关结果',
        history: '搜索历史',
        clearHistory: '清空历史',
      },
      lock: {
        title: '锁屏',
        lock: '锁定屏幕',
        unlock: '解锁',
        password: '锁屏密码',
        passwordPlaceholder: '请输入锁屏密码',
        passwordError: '密码错误',
        setPassword: '设置锁屏密码',
        noPassword: '未设置锁屏密码',
      },
      timezone: {
        title: '时区',
        current: '当前时区',
      },
      refresh: {
        title: '刷新',
        tooltip: '刷新当前页面',
      },
      preferences: {
        title: '偏好设置',
        tooltip: '打开偏好设置',
      },
      backToTop: {
        title: '返回顶部',
      },
    },

    // 菜单
    menu: {
      search: '搜索菜单',
      searchPlaceholder: '输入关键词搜索菜单...',
      noResult: '未找到匹配的菜单',
      expand: '展开全部',
      collapse: '收起全部',
    },

    // 内容区
    content: {
      loading: '页面加载中...',
      error: '页面加载失败',
      retry: '重试',
      empty: '暂无内容',
    },

    // 版权
    copyright: {
      powered: '技术支持',
      icp: '备案号',
    },
  },
};

export type LayoutLocale = typeof import('./zh-CN').default;
