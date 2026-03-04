/**
 * 英文语言包。
 * @description 提供偏好设置系统英文文案键值映射。
 */

/**
 * 英文语言消息集合。
 */
export const enUS = {
  /** 通用 */
  common: {
    confirm: 'Confirm',
    cancel: 'Cancel',
    save: 'Save',
    reset: 'Reset',
    close: 'Close',
    enable: 'Enable',
    disable: 'Disable',
    yes: 'Yes',
    no: 'No',
    loading: 'Loading...',
    noData: 'No data',
    search: 'Search',
    all: 'All',
    clear: 'Clear',
    back: 'Back',
  },

  /** 偏好设置 */
  preferences: {
    title: 'Preferences',
    description: 'Customize preferences & Live preview',
    category: 'Categories',
    resetTip: 'Reset preferences',
    resetSuccess: 'Settings have been reset',
    copyConfig: 'Copy Configuration',
    copySuccess: 'Configuration copied to clipboard',
    copied: 'Copied',
    importConfig: 'Import Configuration',
    importSuccess: 'Configuration imported successfully',
    importErrorTitle: 'Import Failed',
    importErrorClipboardAccess: 'Cannot access clipboard. Please check browser permissions.',
    importErrorEmpty: 'Clipboard is empty',
    importErrorParse: 'Invalid format. Please check if JSON format is correct.',
    importErrorValidation: 'Invalid configuration data. Please ensure it is a complete preferences config.',
    clearCache: 'Clear Cache and Logout',
    enableSticky: 'Pin tab navigation bar',
    disableSticky: 'Unpin tab navigation bar',
  },

  /** 主题 */
  theme: {
    title: 'Theme',
    mode: 'Theme Mode',
    modeLight: 'Light',
    modeDark: 'Dark',
    modeAuto: 'System',
    colorPrimary: 'Primary Color',
    colorCustom: 'Custom',
    radius: 'Border Radius',
    fontSize: 'Font Scale',
    fontScaleSmall: 'Small',
    fontScaleLarge: 'Large',
    builtinTheme: 'Built-in Theme',
    other: 'Other',
    /** 内置主题名称 */
    presetDefault: 'Default',
    presetViolet: 'Violet',
    presetPink: 'Pink',
    presetYellow: 'Yellow',
    presetSkyBlue: 'Sky Blue',
    presetGreen: 'Green',
    presetDeepGreen: 'Deep Green',
    presetDeepBlue: 'Deep Blue',
    presetOrange: 'Orange',
    presetRose: 'Rose',
    presetZinc: 'Zinc',
    presetNeutral: 'Neutral',
    presetSlate: 'Slate',
    presetGray: 'Gray',
    /** 颜色模式 */
    colorMode: 'Color Mode',
    colorFollowPrimaryLight: 'Light Background Follow Theme',
    colorFollowPrimaryDark: 'Dark Background Follow Theme',
    semiDarkSidebar: 'Semi-Dark Sidebar',
    semiDarkHeader: 'Semi-Dark Header',
    colorGrayMode: 'Grayscale Mode',
    colorWeakMode: 'Color Weak Mode',
  },

  /** 布局 */
  layout: {
    title: 'Layout',
    type: 'Layout Type',
    sidebarNav: 'Sidebar Navigation',
    sidebarNavDesc: 'Classic left side menu layout',
    sidebarMixedNav: 'Sidebar Mixed Navigation',
    sidebarMixedNavDesc: 'Double column side menu',
    headerNav: 'Header Navigation',
    headerNavDesc: 'Menu displayed at top',
    headerSidebarNav: 'Header + Sidebar',
    headerSidebarNavDesc: 'Top bar with left side menu',
    mixedNav: 'Mixed Navigation',
    mixedNavDesc: 'Top primary menu + side secondary menu',
    headerMixedNav: 'Header Mixed Navigation',
    headerMixedNavDesc: 'Top menu + side supplementary menu',
    fullContent: 'Full Content',
    fullContentDesc: 'No navigation, pure content display',
    contentWidth: 'Content Width',
    contentWide: 'Wide',
    contentCompact: 'Compact',
  },

  /** 功能区 */
  panel: {
    title: 'Panel',
    enable: 'Enable Panel',
    position: 'Position',
    positionLeft: 'Left',
    positionRight: 'Right',
    collapsed: 'Collapsed',
    collapsedButton: 'Show Collapse Button',
    width: 'Width',
    collapsedWidth: 'Collapsed Width',
  },

  /** 侧边栏 */
  sidebar: {
    title: 'Sidebar',
    enable: 'Enable Sidebar',
    collapsed: 'Collapsed',
    collapsedButton: 'Show Collapse Button',
    collapsedShowTitle: 'Show Title When Collapsed',
    expandOnHover: 'Expand on Hover',
    fixedButton: 'Show Pin Button',
    width: 'Width',
    collapseWidth: 'Collapse Width',
  },

  /** 顶栏 */
  header: {
    title: 'Header',
    enable: 'Enable Header',
    height: 'Height',
    mode: 'Header Mode',
    modeFixed: 'Fixed',
    modeStatic: 'Static',
    modeAuto: 'Auto',
    modeAutoScroll: 'Hide on Scroll',
    menuAlign: 'Menu Alignment',
    menuAlignStart: 'Start',
    menuAlignCenter: 'Center',
    menuAlignEnd: 'End',
    menuLauncher: 'Menu Launcher',
    menuLauncherTip: 'Collapse header menu into a button, click to open menu panel',
  },

  /** 标签栏 */
  tabbar: {
    title: 'Tabs',
    enable: 'Enable Tabs',
    showIcon: 'Show Icon',
    showMore: 'Show More Button',
    showMaximize: 'Show Maximize Button',
    draggable: 'Draggable',
    wheelable: 'Enable Wheel Scroll',
    wheelableTip: 'When enabled, vertical wheel scrolls the tabbar horizontally',
    middleClickClose: 'Middle Click to Close',
    persist: 'Persist Tabs',
    keepAlive: 'Keep Alive',
    maxCount: 'Max Tab Count',
    maxCountTip: 'When opening new tabs, if the maximum is exceeded,\n' +
      'the oldest tab will be closed automatically.\n' +
      'Set 0 for no limit',
    styleType: 'Tab Style',
    styleChrome: 'Chrome Style',
    styleCard: 'Card Style',
    stylePlain: 'Plain Style',
    styleBrisk: 'Brisk Style',
  },

  /** 面包屑 */
  breadcrumb: {
    title: 'Breadcrumb',
    enable: 'Enable Breadcrumb',
    showIcon: 'Show Icon',
    showHome: 'Show Home',
    hideOnlyOne: 'Hide When Only One',
    styleType: 'Style',
    styleNormal: 'Normal',
    styleBackground: 'With Background',
  },

  /** 导航 */
  navigation: {
    title: 'Navigation',
    accordion: 'Accordion Mode',
    split: 'Split Menu',
    styleType: 'Navigation Style',
    styleRounded: 'Rounded',
    stylePlain: 'Plain',
  },

  /** 页脚 */
  footer: {
    title: 'Footer',
    enable: 'Enable Footer',
    fixed: 'Fixed Footer',
  },

  /** 版权 */
  copyright: {
    title: 'Copyright',
    enable: 'Enable Copyright',
    companyName: 'Company Name',
    companySiteLink: 'Company Site Link',
    date: 'Date',
    icp: 'ICP License Number',
    icpLink: 'ICP Site Link',
  },

  /** 过渡动画 */
  transition: {
    title: 'Animation',
    enable: 'Enable Page Animation',
    progress: 'Show Progress Bar',
    loading: 'Page Loading Animation',
    name: 'Animation Effect',
    nameFade: 'Fade',
    nameFadeDesc: 'Simple opacity transition',
    nameFadeSlide: 'Fade Slide',
    nameFadeSlideDesc: 'Fade with horizontal slide',
    nameFadeUp: 'Fade Up',
    nameFadeUpDesc: 'Fade with upward slide',
    nameFadeDown: 'Fade Down',
    nameFadeDownDesc: 'Fade with downward slide',
    nameSlideLeft: 'Slide Left',
    nameSlideLeftDesc: 'Slide in from right to left',
    nameSlideRight: 'Slide Right',
    nameSlideRightDesc: 'Slide in from left to right',
  },

  /** 小部件 */
  widget: {
    title: 'Widgets',
    fullscreen: 'Fullscreen Button',
    languageToggle: 'Language Toggle',
    themeToggle: 'Theme Toggle',
    globalSearch: 'Global Search',
    lockScreen: 'Lock Screen Button',
    notification: 'Notification Button',
    sidebarToggle: 'Sidebar Toggle',
    refresh: 'Refresh Button',
    timezone: 'Timezone',
  },

  /** 快捷键 */
  shortcutKeys: {
    title: 'Shortcuts',
    enable: 'Enable Shortcuts',
    globalPreferences: 'Open Settings',
    globalSearch: 'Global Search',
    globalLogout: 'Logout',
    globalLockScreen: 'Lock Screen',
  },

  /** 锁屏 */
  lockScreen: {
    title: 'Lock Screen',
    unlock: 'Unlock',
    entry: 'Enter System',
    screenButton: 'Lock Screen',
    backToLogin: 'Back to Login',
    logoutConfirm: 'Are you sure you want to logout?',
    setPassword: 'Set Lock Screen Password',
    enterPassword: 'Enter lock screen password',
    passwordError: 'Incorrect password',
    passwordPlaceholder: 'Please enter password',
    confirmPassword: 'Confirm Password',
    confirmPasswordPlaceholder: 'Please enter password again',
    passwordMismatch: 'Passwords do not match',
    passwordMinLength: 'Password must be at least {0} characters',
    setPasswordTip: 'Set a password for the first lock',
    confirmAndLock: 'Confirm & Lock',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    clearPassword: 'Clear Lock Screen Password',
    cleared: 'Cleared',
    autoLockTime: 'Auto Lock Time',
    autoLockTimeTip: 'Time to auto lock after inactivity (minutes)',
    minute: 'minute',
  },

  /** 通用设置 */
  general: {
    title: 'General',
    language: 'Language',
    dynamicTitle: 'Dynamic Title',
    watermark: 'Watermark',
    watermarkEnable: 'Enable Watermark',
    watermarkContent: 'Watermark Content',
    watermarkContentPlaceholder: 'Enter watermark text',
    watermarkAngle: 'Angle',
    watermarkAppendDate: 'Append Date',
    watermarkFontSize: 'Font Size',
    checkUpdates: 'Check Updates',
  },
};

/**
 * 默认导出英文语言包。
 */
export default enUS;
