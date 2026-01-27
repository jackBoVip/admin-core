/**
 * English Language Pack
 */

export const enUS = {
  // ========== Common ==========
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
  },

  // ========== Preferences ==========
  preferences: {
    title: 'Preferences',
    description: 'Customize preferences & Live preview',
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

  // ========== Theme ==========
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
    // Built-in theme names
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
    // Color modes
    colorMode: 'Color Mode',
    colorFollowPrimaryLight: 'Light Background Follow Theme',
    colorFollowPrimaryDark: 'Dark Background Follow Theme',
    semiDarkSidebar: 'Semi-Dark Sidebar',
    semiDarkHeader: 'Semi-Dark Header',
    colorGrayMode: 'Grayscale Mode',
    colorWeakMode: 'Color Weak Mode',
  },

  // ========== Layout ==========
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

  // ========== Sidebar ==========
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

  // ========== Header ==========
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
  },

  // ========== Tabbar ==========
  tabbar: {
    title: 'Tabs',
    enable: 'Enable Tabs',
    showIcon: 'Show Icon',
    draggable: 'Draggable',
    persist: 'Persist Tabs',
    keepAlive: 'Keep Alive',
    maxCount: 'Max Tab Count',
    styleType: 'Tab Style',
    styleChrome: 'Chrome Style',
    styleCard: 'Card Style',
    stylePlain: 'Plain Style',
    styleBrisk: 'Brisk Style',
  },

  // ========== Breadcrumb ==========
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

  // ========== Navigation ==========
  navigation: {
    title: 'Navigation',
    accordion: 'Accordion Mode',
    split: 'Split Menu',
    styleType: 'Navigation Style',
    styleRounded: 'Rounded',
    stylePlain: 'Plain',
  },

  // ========== Footer ==========
  footer: {
    title: 'Footer',
    enable: 'Enable Footer',
    fixed: 'Fixed Footer',
  },

  // ========== Transition ==========
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

  // ========== Widget ==========
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

  // ========== Shortcut Keys ==========
  shortcutKeys: {
    title: 'Shortcuts',
    enable: 'Enable Shortcuts',
    globalPreferences: 'Open Settings',
    globalSearch: 'Global Search',
    globalLogout: 'Logout',
    globalLockScreen: 'Lock Screen',
  },

  // ========== General ==========
  general: {
    title: 'General',
    language: 'Language',
    dynamicTitle: 'Dynamic Title',
    watermark: 'Watermark',
    colorWeakMode: 'Color Weak Mode',
    colorGrayMode: 'Gray Mode',
    checkUpdates: 'Check Updates',
  },
};

export default enUS;
