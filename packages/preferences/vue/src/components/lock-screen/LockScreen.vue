<script setup lang="ts">
/**
 * 锁屏页面组件
 * @description 经典居中布局，极致毛玻璃质感，高级交互反馈
 * 行为逻辑（背景决策、解锁流程、键盘交互、body 滚动锁定）由 @admin-core/preferences 提供的 LockScreen helpers 统一处理。
 */
import { ref, computed, watch, nextTick, onUnmounted } from 'vue';
import { getPreferencesManager, usePreferences } from '../../composables';
import {
  getLocaleByPreferences,
  defaultLockScreenBg,
  computeLockScreenBackground,
  unlockWithPassword,
  getLockScreenKeyAction,
  lockBodyScrollForLockScreen,
  restoreBodyScrollForLockScreen,
  type LockScreenBodyLockState,
  type LocaleMessages,
} from '@admin-core/preferences';
import LockScreenTime from './LockScreenTime.vue';
import Icon from '../Icon';

/**
 * 锁屏组件入参。
 * @description 定义用户信息、退出回调与背景覆盖图等外部可配置项。
 */
export interface LockScreenProps {
  /** 返回登录页/退出登录回调。 */
  onLogout?: () => void;
  /** 头像。 */
  avatar?: string;
  /** 用户名。 */
  username?: string;
  /** 背景图片 URL，传入空字符串禁用背景，不传则使用默认背景。 */
  backgroundImage?: string;
}

const props = withDefaults(defineProps<LockScreenProps>(), {
  username: 'Admin',
});

/**
 * 锁屏键盘动作类型。
 * @description 由 `getLockScreenKeyAction` 解析键盘事件后返回的标准动作结构。
 */
type LockScreenKeyAction = ReturnType<typeof getLockScreenKeyAction>;

/**
 * 当前生效的背景图
 * @description 复用 core helper 解析优先级：显式传入 > 偏好配置 > 默认背景。
 */
const { preferences, setPreferences } = usePreferences();

/**
 * 最终背景图地址。
 * @description 优先使用外部覆盖背景，其次使用偏好配置，最后回退到默认锁屏背景。
 */
const actualBgImage = computed(() =>
  computeLockScreenBackground({
    preferences: preferences.value,
    overrideImage: props.backgroundImage,
  }) ?? defaultLockScreenBg
);

/**
 * 背景图片内联样式
 * @description 直接挂载到背景节点，避免跨层 CSS 变量在 Teleport 场景下失效。
 */
const bgImageStyle = computed(() => {
  if (!actualBgImage.value) {
    return undefined;
  }
  return {
    backgroundImage: `url(${actualBgImage.value})`,
    backgroundPosition: 'center',
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
  };
});

/**
 * 解锁输入密码
 * @description 保存用户在锁屏界面输入的明文密码，仅用于本地校验流程。
 */
const password = ref('');
/**
 * 解锁失败提示文案
 * @description 校验失败后显示给用户的错误信息。
 */
const error = ref('');
/**
 * 是否显示解锁表单
 * @description 控制锁屏中心区“按钮态”和“输入态”的切换。
 */
const showUnlockForm = ref(false);
/**
 * 密码输入框引用
 * @description 用于弹出解锁框后执行自动聚焦。
 */
const inputRef = ref<HTMLInputElement | null>(null);
/**
 * 聚焦延时器引用
 * @description 缓存 `setTimeout` 句柄，便于重复触发和卸载时安全清理。
 */
const focusTimerRef = ref<ReturnType<typeof setTimeout> | null>(null);
/**
 * 页面滚动锁状态引用
 * @description 记录锁屏时注入到 `body` 的滚动锁上下文，解锁或卸载时用于恢复。
 */
const bodyLockStateRef = ref<LockScreenBodyLockState | null>(null);

/**
 * 是否处于锁屏状态
 * @description 从偏好状态读取锁屏标记，作为整个锁屏浮层的渲染开关。
 */
const isLocked = computed(() => {
  const locked = preferences.value?.lockScreen.isLocked ?? false;
  return locked;
});
/**
 * 已保存的密码哈希
 * @description 读取偏好中保存的锁屏密码摘要，用于解锁校验。
 */
const savedPassword = computed(() => preferences.value?.lockScreen.password ?? '');
/**
 * 当前语言标识
 * @description 从偏好设置读取应用语言，用于时间与文案的本地化显示。
 */
const currentLocale = computed(() => preferences.value?.app?.locale || 'zh-CN');

/**
 * 当前语言包对象。
 * @description 使用可选链与默认值，避免依赖非空断言。
 */
const locale = computed(() => {
  if (!preferences.value) return {} as LocaleMessages;
  return getLocaleByPreferences(preferences.value) as LocaleMessages;
});

/**
 * 解锁面板状态镜像引用
 * @description 存储最新显示状态，供全局键盘监听器读取，避免因闭包导致状态过期。
 */
const showUnlockFormRef = ref(showUnlockForm);
/**
 * 同步解锁面板状态镜像。
 * @description 将 `showUnlockForm` 的最新值写入引用，供全局键盘监听回调安全读取。
 */
watch(showUnlockForm, (val) => { showUnlockFormRef.value = val; });

/**
 * 切换解锁面板显示状态
 * @description 与 React 版本保持一致：仅在展示面板时重置密码和错误提示。
 */
const toggleUnlockForm = () => {
  const next = !showUnlockForm.value;
  if (next) {
    password.value = '';
    error.value = '';
  }
  showUnlockForm.value = next;
};

/**
 * 处理锁屏场景下的全局键盘事件
 * @description 根据 helper 计算结果执行显示面板、提交解锁或隐藏面板等动作。
 * @param e 键盘事件对象。
 */
const handleGlobalKeyDown = (e: KeyboardEvent) => {
  const action: LockScreenKeyAction = getLockScreenKeyAction(e, {
    showUnlockForm: showUnlockFormRef.value,
  });

  switch (action.type) {
    case 'hideUnlockForm':
      /**
       * 隐藏解锁面板。
       * @description 与 React 版本一致，隐藏时不主动重置密码与错误状态。
       */
      showUnlockForm.value = false;
      break;
    case 'submit':
      handleUnlock();
      break;
    case 'showUnlockForm':
      if (!showUnlockFormRef.value) {
        toggleUnlockForm();
      }
      break;
    default:
      break;
  }
};

/**
 * 锁定状态副作用管理。
 * @description 锁定时注入滚动锁并注册全局键盘监听；解锁时恢复并移除监听。
 */
watch(isLocked, (locked) => {
  /**
   * SSR 环境保护。
   * @description 非浏览器运行环境下不访问 Window/Document 对象。
   */
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  
  if (locked) {
    bodyLockStateRef.value = lockBodyScrollForLockScreen();
    showUnlockForm.value = false;
    /**
     * 仅在锁定态注册监听器。
     */
    window.addEventListener('keydown', handleGlobalKeyDown);
  } else {
    if (bodyLockStateRef.value) {
      restoreBodyScrollForLockScreen(bodyLockStateRef.value);
      bodyLockStateRef.value = null;
    }
    /**
     * 解锁态移除监听器。
     */
    window.removeEventListener('keydown', handleGlobalKeyDown);
  }
}, { immediate: true });

/**
 * 监听解锁面板显隐状态。
 * @description 展开时延迟聚焦密码框；收起时清理待执行聚焦任务，避免焦点抖动。
 */
watch(showUnlockForm, (show) => {
  if (show) {
    nextTick(() => {
      /**
       * 清理旧聚焦定时器。
       * @description 避免重复设置导致焦点闪动。
       */
      if (focusTimerRef.value) clearTimeout(focusTimerRef.value);
      focusTimerRef.value = setTimeout(() => inputRef.value?.focus(), 100);
    });
  } else if (focusTimerRef.value) {
    clearTimeout(focusTimerRef.value);
    focusTimerRef.value = null;
  }
});

/**
 * 执行解锁校验流程
 * @description
 * 使用核心 helper 校验输入密码并尝试更新锁屏状态；
 * 校验失败时展示错误文案，成功时关闭解锁面板。
 */
const handleUnlock = () => {
  const result = unlockWithPassword({
    password: password.value,
    savedPassword: savedPassword.value,
    locale: locale.value,
    setPreferences: (partial) => setPreferences(partial),
    flushPreferences: () => {
      const manager = getPreferencesManager();
      manager?.flush?.();
    },
  });

  if (!result.success) {
    error.value = result.errorMessage ?? '';
    return;
  }

  showUnlockForm.value = false;
};

/**
 * 组件卸载清理。
 * @description 统一移除键盘监听、清理定时器并恢复 body 滚动锁定状态。
 */
onUnmounted(() => {
  /**
   * 卸载时清理全局键盘监听。
   */
  window.removeEventListener('keydown', handleGlobalKeyDown);
  /**
   * 卸载时清理聚焦定时器。
   */
  if (focusTimerRef.value) clearTimeout(focusTimerRef.value);
  /**
   * 卸载时恢复 body 滚动状态。
   */
  if (bodyLockStateRef.value) {
    restoreBodyScrollForLockScreen(bodyLockStateRef.value);
    bodyLockStateRef.value = null;
  }
});

</script>

<template>
  <Teleport to="body">
    <div v-if="isLocked" class="preferences-lock-screen" role="dialog" aria-modal="true" :aria-label="locale.lockScreen?.title">
      <div class="preferences-lock-backdrop" aria-hidden="true">
        <div v-if="actualBgImage" class="preferences-lock-backdrop-image" :style="bgImageStyle" />
        <div class="preferences-lock-orb orb-1" data-orb="1" />
        <div class="preferences-lock-orb orb-2" data-orb="2" />
        <div class="preferences-lock-orb orb-3" data-orb="3" />
        <div class="preferences-lock-grid" />
      </div>

      <div class="preferences-lock-content minimal" data-variant="minimal">
        <section
          class="preferences-lock-time-center"
          :class="{ compact: showUnlockForm }"
          :data-compact="showUnlockForm ? 'true' : undefined"
        >
          <LockScreenTime :locale="currentLocale" />
          <button 
            v-show="!showUnlockForm" 
            class="preferences-lock-cta minimal" 
            data-variant="minimal"
            @click="toggleUnlockForm"
          >
            {{ locale.lockScreen?.unlock }}
          </button>
        </section>

        <section
          class="preferences-lock-unlock"
          :class="{ visible: showUnlockForm }"
          :data-visible="showUnlockForm ? 'true' : undefined"
          role="form"
        >
          <div
            class="preferences-lock-unlock-box"
            :class="{ 'has-error': error }"
            :data-error="error ? 'true' : undefined"
          >
            <input
              ref="inputRef"
              type="password"
              class="preferences-lock-unlock-input"
              :class="{ 'has-error': error }"
              :data-error="error ? 'true' : undefined"
              v-model="password"
              :placeholder="error || locale.lockScreen?.passwordPlaceholder"
              :aria-label="locale.lockScreen?.passwordPlaceholder"
              :aria-invalid="!!error"
              autocomplete="current-password"
              @input="error = ''"
            />
            <button class="preferences-lock-unlock-btn" @click="handleUnlock" :aria-label="locale.lockScreen?.entry">
              <Icon name="arrowRight" size="sm" />
            </button>
          </div>
          <button v-if="onLogout" class="preferences-lock-unlock-logout" @click="onLogout">
            {{ locale.lockScreen?.backToLogin }}
          </button>
        </section>
      </div>
    </div>
  </Teleport>
</template>
