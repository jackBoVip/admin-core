<script setup lang="ts">
/**
 * 偏好设置提供者组件模块。
 * @description 自动集成锁屏、快捷键、水印与设置抽屉能力，并在首次加载时自动初始化管理器。
 */
import { computed, ref, provide, readonly } from 'vue';
import { 
  getPreferencesManager,
  usePreferences, 
  useLockScreen, 
  useShortcutKeys,
  initPreferences,
  isPreferencesInitialized,
  type PreferencesContextValue,
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

/**
 * Provider 组件入参结构。
 * @description 统一约束触发器、抽屉、用户信息与锁屏背景等配置项。
 */
export interface PreferencesProviderProps {
  /** 是否显示触发按钮。 */
  showTrigger?: boolean;
  /** 触发按钮配置。 */
  triggerProps?: PreferencesTriggerProps;
  /** 抽屉配置。 */
  drawerProps?: PreferencesDrawerProps;
  /** 用户头像 URL。 */
  avatar?: string;
  /** 用户名。 */
  username?: string;
  /** 锁屏背景图片 URL，传入空字符串禁用背景，不传则使用默认背景。 */
  lockScreenBackground?: string;
  /** UI 配置（控制功能项显示/禁用），等同于 `drawerProps.uiConfig`。 */
  uiConfig?: PreferencesDrawerUIConfig;
}

/**
 * Provider 对外事件签名。
 */
export interface PreferencesProviderEmits {
  /** 用户点击退出登录时触发。 */
  (e: 'logout'): void;
  /** 用户触发全局搜索时触发。 */
  (e: 'search'): void;
  /** 进入锁屏状态后触发。 */
  (e: 'lock'): void;
  /** 成功解锁后触发。 */
  (e: 'unlock'): void;
}

/**
 * 自动初始化偏好设置管理器。
 * @description 确保在调用 `usePreferences` 之前完成初始化，避免运行时空实例。
 */
if (!isPreferencesInitialized()) {
  try {
    initPreferences({ namespace: 'admin-core' });
  } catch (initError) {
    logger.error('Failed to initialize preferences manager', initError);
    throw initError;
  }
}

/**
 * Provider 组件入参。
 * @description 定义触发器、抽屉、用户信息与锁屏背景等全局配置项。
 */
const props = withDefaults(defineProps<PreferencesProviderProps>(), {
  showTrigger: true,
});

/**
 * Provider 对外事件定义。
 */
const emit = defineEmits<PreferencesProviderEmits>();

/**
 * 偏好设置写入能力。
 * @description 用于锁屏流程中写入锁屏状态等偏好更新。
 */
const { setPreferences } = usePreferences();
/**
 * 锁屏状态与动作能力。
 * @description 提供当前锁屏状态、密码状态与解锁方法。
 */
const {
  isLocked,
  hasPassword,
  isEnabled: isLockEnabled,
  unlock: doUnlock,
} = useLockScreen();

/**
 * 抽屉打开状态。
 */
const drawerOpen = ref(false);

/**
 * 锁屏密码弹窗状态。
 */
const passwordModalOpen = ref(false);

/**
 * 打开偏好设置抽屉
 * @description 将抽屉显示状态设置为打开。
 */
const openPreferences = () => { drawerOpen.value = true; };
/**
 * 关闭偏好设置抽屉
 * @description 将抽屉显示状态设置为关闭。
 */
const closePreferences = () => { drawerOpen.value = false; };
/**
 * 切换偏好设置抽屉开关状态
 * @description 在打开与关闭之间进行状态翻转。
 */
const togglePreferences = () => { drawerOpen.value = !drawerOpen.value; };

/**
 * 执行锁屏流程
 * @description
 * 仅在锁屏功能启用时生效；若未设置锁屏密码则先弹出密码设置框，
 * 否则直接将锁屏状态写入偏好并触发 `lock` 事件。
 */
const lock = () => {
  /**
   * 锁屏能力开关检查。
   * @description 未启用锁屏能力时直接返回，不执行后续流程。
   */
  if (!isLockEnabled.value) {
    return;
  }

  /**
   * 密码存在性检查。
   * @description 未设置密码时先引导用户完成密码设置。
   */
  if (!hasPassword.value) {
    passwordModalOpen.value = true;
    return;
  }

  /**
   * 已有密码时直接进入锁屏状态。
   * @description 更新偏好状态并同步持久化后通知外层。
   */
  setPreferences({ lockScreen: { isLocked: true } });
  try {
    getPreferencesManager()?.flush?.();
  } catch {}
  emit('lock');
};

/**
 * 处理密码设置成功事件
 * @description 关闭密码弹窗并向外层发出锁屏完成通知。
 */
const handlePasswordSuccess = () => {
  passwordModalOpen.value = false;
  emit('lock');
};

/**
 * 执行解锁流程
 * @description 调用锁屏模块解锁能力并刷新持久化状态，然后触发 `unlock` 事件。
 */
const unlock = () => {
  doUnlock();
  try {
    getPreferencesManager()?.flush?.();
  } catch {}
  emit('unlock');
};

/**
 * 处理退出登录动作
 * @description 向外层抛出 `logout` 事件，由宿主应用统一处理退出逻辑。
 */
const handleLogout = () => {
  emit('logout');
};

/**
 * 注册全局快捷键监听。
 * @description 统一通过 `emit` 向外派发事件，避免同名 prop/emit 双触发。
 */
useShortcutKeys({
  onPreferences: togglePreferences,
  onSearch: () => emit('search'),
  onLockScreen: lock,
  onLogout: handleLogout,
});

/**
 * 上下文锁屏状态（`ComputedRef`）。
 * @description 将锁屏状态转换为计算属性，匹配上下文类型约束并保持只读语义。
 */
const contextLocked = computed(() => isLocked.value);
/**
 * 上下文密码状态（`ComputedRef`）。
 * @description 将密码状态转换为计算属性，匹配上下文类型约束并保持只读语义。
 */
const contextHasPassword = computed(() => hasPassword.value);
/**
 * 上下文锁屏功能开关（`ComputedRef`）。
 * @description 将锁屏功能状态转换为计算属性，匹配上下文类型约束并保持只读语义。
 */
const contextLockEnabled = computed(() => isLockEnabled.value);

/**
 * 注入偏好上下文。
 * @description 向子组件暴露抽屉控制、锁屏能力及只读状态引用。
 */
const preferencesContextValue: PreferencesContextValue = {
  openPreferences,
  closePreferences,
  togglePreferences,
  isPreferencesOpen: readonly(drawerOpen),
  lock,
  unlock,
  isLocked: contextLocked,
  hasPassword: contextHasPassword,
  isLockEnabled: contextLockEnabled,
};
provide('preferencesContext', preferencesContextValue);
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
