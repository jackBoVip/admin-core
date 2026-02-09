<script setup lang="ts">
/**
 * 偏好设置提供者组件
 * @description 自动集成锁屏、快捷键等功能，用户无需手动添加
 * 自动初始化偏好设置管理器，用户无需手动调用 initPreferences
 */
import { ref, provide, readonly } from 'vue';
import { 
  getPreferencesManager,
  usePreferences, 
  useLockScreen, 
  useShortcutKeys,
  initPreferences,
  isPreferencesInitialized,
} from '../composables';
import LockScreen from './lock-screen/LockScreen.vue';
import LockPasswordModal from './lock-screen/LockPasswordModal.vue';
import PreferencesDrawer from './drawer/PreferencesDrawer.vue';
import PreferencesTrigger from './drawer/PreferencesTrigger.vue';
import Watermark from './Watermark.vue';
import type { PreferencesDrawerUIConfig } from '@admin-core/preferences';
import { logger } from '@admin-core/preferences';

/** 触发按钮配置 */
export interface PreferencesTriggerProps {
  /** 是否显示 */
  show?: boolean;
}

/** 抽屉配置 */
export interface PreferencesDrawerProps {
  /** 是否显示遮罩 */
  showOverlay?: boolean;
  /** 点击遮罩关闭 */
  closeOnOverlay?: boolean;
  /** 是否显示固定按钮 */
  showPinButton?: boolean;
  /** UI 配置（控制功能项显示/禁用） */
  uiConfig?: PreferencesDrawerUIConfig;
}

// 自动初始化偏好设置管理器（确保在 usePreferences 调用前初始化）
if (!isPreferencesInitialized()) {
  try {
    initPreferences({ namespace: 'admin-core' });
  } catch (initError) {
    logger.error('Failed to initialize preferences manager', initError);
    throw initError;
  }
}

const props = withDefaults(defineProps<{
  /** 是否显示触发按钮 */
  showTrigger?: boolean;
  /** 触发按钮配置 */
  triggerProps?: PreferencesTriggerProps;
  /** 抽屉配置 */
  drawerProps?: PreferencesDrawerProps;
  /** 用户头像 URL */
  avatar?: string;
  /** 用户名 */
  username?: string;
  /** 锁屏背景图片 URL，传入空字符串禁用背景，不传则使用默认背景 */
  lockScreenBackground?: string;
  /** UI 配置（控制功能项显示/禁用）- 便捷属性，等同于 drawerProps.uiConfig */
  uiConfig?: PreferencesDrawerUIConfig;
}>(), {
  showTrigger: true,
});

const emit = defineEmits<{
  (e: 'logout'): void;
  (e: 'search'): void;
  (e: 'lock'): void;
  (e: 'unlock'): void;
}>();

const { setPreferences } = usePreferences();
const {
  isLocked,
  hasPassword,
  isEnabled: isLockEnabled,
  unlock: doUnlock,
} = useLockScreen();

// 抽屉状态
const drawerOpen = ref(false);

// 密码设置弹窗状态
const passwordModalOpen = ref(false);

// 打开/关闭抽屉
const openPreferences = () => { drawerOpen.value = true; };
const closePreferences = () => { drawerOpen.value = false; };
const togglePreferences = () => { drawerOpen.value = !drawerOpen.value; };

// 锁屏操作（只使用 emit，避免重复调用）
const lock = () => {
  // 检查锁屏功能是否启用
  if (!isLockEnabled.value) {
    return;
  }

  // 如果没有设置密码，弹出设置密码弹窗
  if (!hasPassword.value) {
    passwordModalOpen.value = true;
    return;
  }

  // 已有密码，直接锁屏
  setPreferences({ lockScreen: { isLocked: true } });
  try {
    getPreferencesManager()?.flush?.();
  } catch {}
  emit('lock');
};

// 密码设置成功后的回调（已锁屏）
const handlePasswordSuccess = () => {
  passwordModalOpen.value = false;
  emit('lock');
};

const unlock = () => {
  doUnlock();
  try {
    getPreferencesManager()?.flush?.();
  } catch {}
  emit('unlock');
};

// 退出登录处理（只使用 emit，避免 Vue 3 中 @event 同时触发 prop 和 emit 导致的重复调用）
const handleLogout = () => {
  emit('logout');
};

// 注册全局快捷键（只使用 emit，避免重复调用）
useShortcutKeys({
  onPreferences: togglePreferences,
  onSearch: () => emit('search'),
  onLockScreen: lock,
  onLogout: handleLogout,
});

// 提供给子组件的上下文
provide('preferencesContext', {
  openPreferences,
  closePreferences,
  togglePreferences,
  isPreferencesOpen: readonly(drawerOpen),
  lock,
  unlock,
  isLocked: readonly(isLocked),
  hasPassword: readonly(hasPassword),
  isLockEnabled: readonly(isLockEnabled),
});
</script>

<template>
  <slot />

  <!-- 水印 - 自动渲染 -->
  <Watermark />

  <!-- 锁屏页面 - 自动渲染 -->
  <LockScreen
    :on-logout="handleLogout"
    :avatar="avatar"
    :username="username"
    v-bind="lockScreenBackground !== undefined ? { 'background-image': lockScreenBackground } : {}"
  />

  <!-- 锁屏密码设置弹窗 -->
  <LockPasswordModal
    v-model:open="passwordModalOpen"
    @success="handlePasswordSuccess"
  />

  <!-- 触发按钮 -->
  <PreferencesTrigger 
    v-if="showTrigger" 
    v-bind="props.triggerProps"
    @click="openPreferences" 
  />

  <!-- 偏好设置抽屉 -->
  <PreferencesDrawer 
    v-model:open="drawerOpen" 
    v-bind="props.drawerProps"
    :ui-config="props.uiConfig ?? props.drawerProps?.uiConfig" 
  />
</template>
