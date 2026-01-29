<script setup lang="ts">
import { ref, computed, provide } from 'vue';
import {
  initPreferences,
  PreferencesProvider,
  usePreferences,
} from '@admin-core/preferences-vue';
import { type PreferencesDrawerUIConfig, getLocaleByPreferences } from '@admin-core/preferences';
import AppLayout from './components/AppLayout.vue';

// 初始化偏好设置
initPreferences({
  namespace: 'vue-demo',
  overrides: {
    app: {
      name: 'Vue Demo',
    },
  },
});

// UI 配置状态（全局共享）
const uiConfigState = {
  // Tab 级别
  hideShortcutKeys: ref(false),
  hideAppearanceTab: ref(false),
  disableLayoutTab: ref(false),
  
  // 头部按钮
  hideImportButton: ref(false),
  disableReset: ref(false),
  hidePinButton: ref(false),
  
  // 底部按钮
  hideCopyButton: ref(false),
  
  // 外观设置
  disableThemeMode: ref(false),
  hideBuiltinTheme: ref(false),
  disableRadius: ref(false),
  hideFontSize: ref(false),
  disableColorMode: ref(false),
  
  // 布局设置
  hideLayoutType: ref(false),
  disableContentWidth: ref(false),
  hideSidebar: ref(false),
  disablePanel: ref(false),
  hideHeader: ref(false),
  disableTabbar: ref(false),
  hideBreadcrumb: ref(false),
  disableFooterBlock: ref(false),
  
  // 通用设置
  hideLanguage: ref(false),
  disableDynamicTitle: ref(false),
  hideLockScreen: ref(false),
  disableWatermark: ref(false),
};

// 动态生成 UI 配置
const drawerUIConfig = computed<PreferencesDrawerUIConfig>(() => ({
  // Tab 级别
  shortcutKeys: { visible: !uiConfigState.hideShortcutKeys.value },
  appearance: { 
    visible: !uiConfigState.hideAppearanceTab.value,
    // 外观设置子项
    themeMode: { disabled: uiConfigState.disableThemeMode.value },
    builtinTheme: { visible: !uiConfigState.hideBuiltinTheme.value },
    radius: { disabled: uiConfigState.disableRadius.value },
    fontSize: { visible: !uiConfigState.hideFontSize.value },
    colorMode: { disabled: uiConfigState.disableColorMode.value },
  },
  layout: { 
    disabled: uiConfigState.disableLayoutTab.value,
    // 布局设置子项
    layoutType: { visible: !uiConfigState.hideLayoutType.value },
    contentWidth: { disabled: uiConfigState.disableContentWidth.value },
    sidebar: { visible: !uiConfigState.hideSidebar.value },
    panel: { disabled: uiConfigState.disablePanel.value },
    header: { visible: !uiConfigState.hideHeader.value },
    tabbar: { disabled: uiConfigState.disableTabbar.value },
    breadcrumb: { visible: !uiConfigState.hideBreadcrumb.value },
    footer: { disabled: uiConfigState.disableFooterBlock.value },
  },
  general: {
    // 通用设置子项
    language: { visible: !uiConfigState.hideLanguage.value },
    dynamicTitle: { disabled: uiConfigState.disableDynamicTitle.value },
    lockScreen: { visible: !uiConfigState.hideLockScreen.value },
    watermark: { disabled: uiConfigState.disableWatermark.value },
  },
  // 头部按钮
  headerActions: {
    import: { visible: !uiConfigState.hideImportButton.value },
    reset: { disabled: uiConfigState.disableReset.value },
    pin: { visible: !uiConfigState.hidePinButton.value },
  },
  // 底部按钮
  footerActions: {
    copy: { visible: !uiConfigState.hideCopyButton.value },
  },
}));

// 提供给子组件（Settings.vue 可以修改这些状态）
provide('uiConfigState', uiConfigState);

// 获取偏好设置和国际化
const { preferences } = usePreferences();
const locale = computed(() => getLocaleByPreferences(preferences.value));

const handleLogout = () => {
  const confirmText = locale.value?.lockScreen?.logoutConfirm || '确定要退出登录吗？';
  if (confirm(confirmText)) {
    console.log('Logout');
  }
};

const handleSearch = () => {
  console.log('Open search dialog');
};
</script>

<template>
  <PreferencesProvider
    username="Admin"
    :ui-config="drawerUIConfig"
    @logout="handleLogout"
    @search="handleSearch"
  >
    <AppLayout />
  </PreferencesProvider>
</template>
