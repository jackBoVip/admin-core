/**
 * 中文语言包
 */

export const zhCN = {
  // ========== 通用 ==========
  common: {
    confirm: '确认',
    cancel: '取消',
    save: '保存',
    reset: '重置',
    close: '关闭',
    enable: '启用',
    disable: '禁用',
    yes: '是',
    no: '否',
    loading: '加载中...',
    noData: '暂无数据',
    search: '搜索',
    all: '全部',
    clear: '清除',
    back: '返回',
  },

  // ========== 偏好设置 ==========
  preferences: {
    title: '偏好设置',
    description: '自定义偏好设置 & 实时预览',
    resetTip: '重置偏好设置',
    resetSuccess: '设置已重置',
    copyConfig: '复制配置',
    copySuccess: '配置已复制到剪贴板',
    copied: '已复制',
    importConfig: '导入配置',
    importSuccess: '配置导入成功',
    importErrorTitle: '导入失败',
    importErrorClipboardAccess: '无法访问剪贴板，请检查浏览器权限',
    importErrorEmpty: '剪贴板为空',
    importErrorParse: '配置格式错误，请检查 JSON 格式是否正确',
    importErrorValidation: '配置数据无效，请确保是完整的偏好设置配置',
    clearCache: '清除缓存并注销',
    enableSticky: '固定标签导航栏',
    disableSticky: '取消固定标签导航栏',
  },

  // ========== 主题 ==========
  theme: {
    title: '主题',
    mode: '主题模式',
    modeLight: '浅色',
    modeDark: '深色',
    modeAuto: '跟随系统',
    colorPrimary: '主色调',
    colorCustom: '自定义',
    radius: '圆角',
    fontSize: '字体缩放',
    fontScaleSmall: '小',
    fontScaleLarge: '大',
    builtinTheme: '内置主题',
    other: '其他',
    // 内置主题名称
    presetDefault: '默认',
    presetViolet: '紫罗兰',
    presetPink: '樱花粉',
    presetYellow: '柠檬黄',
    presetSkyBlue: '天蓝色',
    presetGreen: '浅绿色',
    presetDeepGreen: '深绿色',
    presetDeepBlue: '深蓝色',
    presetOrange: '橙黄色',
    presetRose: '玫瑰红',
    presetZinc: '锌色灰',
    presetNeutral: '中性色',
    presetSlate: '石板灰',
    presetGray: '中灰色',
    // 颜色模式
    colorMode: '颜色模式',
    colorFollowPrimaryLight: '浅色背景跟随主题',
    colorFollowPrimaryDark: '深色背景跟随主题',
    semiDarkSidebar: '深色侧边栏',
    semiDarkHeader: '深色顶栏',
    colorGrayMode: '灰色模式',
    colorWeakMode: '色弱模式',
  },

  // ========== 布局 ==========
  layout: {
    title: '布局',
    type: '布局类型',
    sidebarNav: '侧边导航',
    sidebarNavDesc: '经典的左侧菜单布局',
    sidebarMixedNav: '侧边混合导航',
    sidebarMixedNavDesc: '双列侧边菜单',
    headerNav: '顶部导航',
    headerNavDesc: '菜单在顶部展示',
    headerSidebarNav: '顶部通栏',
    headerSidebarNavDesc: '顶部通栏配合左侧菜单',
    mixedNav: '混合导航',
    mixedNavDesc: '顶部一级菜单+侧边二级菜单',
    headerMixedNav: '顶部混合导航',
    headerMixedNavDesc: '顶部菜单+侧边补充菜单',
    fullContent: '全屏内容',
    fullContentDesc: '无导航，纯内容展示',
    contentWidth: '内容宽度',
    contentWide: '宽屏',
    contentCompact: '紧凑',
  },

  // ========== 功能区 ==========
  panel: {
    title: '功能区',
    enable: '启用功能区',
    position: '显示位置',
    positionLeft: '左侧',
    positionRight: '右侧',
    collapsed: '折叠状态',
    collapsedButton: '显示折叠按钮',
    width: '展开宽度',
    collapsedWidth: '折叠宽度',
  },

  // ========== 侧边栏 ==========
  sidebar: {
    title: '侧边栏',
    enable: '启用侧边栏',
    collapsed: '折叠状态',
    collapsedButton: '显示折叠按钮',
    collapsedShowTitle: '折叠时显示标题',
    expandOnHover: '悬停时展开',
    fixedButton: '显示固定按钮',
    width: '宽度',
    collapseWidth: '折叠宽度',
  },

  // ========== 顶栏 ==========
  header: {
    title: '顶栏',
    enable: '启用顶栏',
    height: '高度',
    mode: '顶栏模式',
    modeFixed: '固定',
    modeStatic: '静态',
    modeAuto: '自动',
    modeAutoScroll: '滚动时隐藏',
    menuAlign: '菜单对齐',
    menuAlignStart: '左对齐',
    menuAlignCenter: '居中',
    menuAlignEnd: '右对齐',
    menuLauncher: '菜单启动器',
    menuLauncherTip: '将顶栏菜单折叠为按钮，点击弹出菜单面板',
  },

  // ========== 标签栏 ==========
  tabbar: {
    title: '标签栏',
    enable: '启用标签栏',
    showIcon: '显示图标',
    draggable: '可拖拽排序',
    persist: '持久化标签',
    keepAlive: '页面缓存',
    maxCount: '最大标签数',
    styleType: '标签样式',
    styleChrome: 'Chrome 风格',
    styleCard: '卡片风格',
    stylePlain: '朴素风格',
    styleBrisk: '轻快风格',
  },

  // ========== 面包屑 ==========
  breadcrumb: {
    title: '面包屑',
    enable: '启用面包屑',
    showIcon: '显示图标',
    showHome: '显示首页',
    hideOnlyOne: '只有一个时隐藏',
    styleType: '样式',
    styleNormal: '默认',
    styleBackground: '带背景',
  },

  // ========== 导航 ==========
  navigation: {
    title: '导航',
    accordion: '手风琴模式',
    split: '分割菜单',
    styleType: '导航风格',
    styleRounded: '圆润',
    stylePlain: '朴素',
  },

  // ========== 页脚 ==========
  footer: {
    title: '页脚',
    enable: '启用页脚',
    fixed: '固定页脚',
  },

  // ========== 过渡动画 ==========
  transition: {
    title: '动画',
    enable: '启用页面动画',
    progress: '显示进度条',
    loading: '页面加载动画',
    name: '动画效果',
    nameFade: '淡入淡出',
    nameFadeDesc: '简单的透明度变化',
    nameFadeSlide: '淡入滑动',
    nameFadeSlideDesc: '淡入同时水平滑动',
    nameFadeUp: '淡入上滑',
    nameFadeUpDesc: '淡入同时向上滑动',
    nameFadeDown: '淡入下滑',
    nameFadeDownDesc: '淡入同时向下滑动',
    nameSlideLeft: '左滑',
    nameSlideLeftDesc: '从右向左滑入',
    nameSlideRight: '右滑',
    nameSlideRightDesc: '从左向右滑入',
  },

  // ========== 小部件 ==========
  widget: {
    title: '小部件',
    fullscreen: '全屏按钮',
    languageToggle: '语言切换',
    themeToggle: '主题切换',
    globalSearch: '全局搜索',
    lockScreen: '锁屏按钮',
    notification: '通知按钮',
    sidebarToggle: '侧边栏按钮',
    refresh: '刷新按钮',
    timezone: '时区选择',
  },

  // ========== 快捷键 ==========
  shortcutKeys: {
    title: '快捷键',
    enable: '启用快捷键',
    globalPreferences: '打开设置',
    globalSearch: '全局搜索',
    globalLogout: '登出',
    globalLockScreen: '锁屏',
  },

  // ========== 锁屏 ==========
  lockScreen: {
    title: '锁屏',
    unlock: '解锁',
    entry: '进入系统',
    screenButton: '锁定屏幕',
    backToLogin: '返回登录',
    logoutConfirm: '确定要退出登录吗？',
    setPassword: '设置锁屏密码',
    enterPassword: '请输入锁屏密码',
    passwordError: '密码错误',
    passwordPlaceholder: '请输入密码',
    confirmPassword: '确认密码',
    confirmPasswordPlaceholder: '请再次输入密码',
    passwordMismatch: '两次输入的密码不一致',
    passwordMinLength: '密码至少 {0} 位',
    setPasswordTip: '首次锁屏需要设置解锁密码',
    confirmAndLock: '确认并锁定',
    showPassword: '显示密码',
    hidePassword: '隐藏密码',
    clearPassword: '清空锁屏密码',
    cleared: '已清空',
    autoLockTime: '自动锁屏时间',
    autoLockTimeTip: '进入无操作状态后自动锁屏的时间（分钟）',
    minute: '分钟',
  },

  // ========== 通用设置 ==========
  general: {
    title: '通用',
    language: '语言',
    dynamicTitle: '动态标题',
    watermark: '水印',
    watermarkEnable: '启用水印',
    watermarkContent: '水印内容',
    watermarkContentPlaceholder: '请输入水印文字',
    watermarkAngle: '水印角度',
    watermarkAppendDate: '附加日期',
    watermarkFontSize: '字体大小',
    checkUpdates: '检查更新',
  },
};

export default zhCN;
