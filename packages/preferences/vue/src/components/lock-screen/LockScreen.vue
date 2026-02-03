<script setup lang="ts">
/**
 * 锁屏页面组件
 * @description 经典居中布局，极致毛玻璃质感，高级交互反馈
 */
import { ref, computed, watch, nextTick, onUnmounted } from 'vue';
import { usePreferences } from '../../composables';
import { getLocaleByPreferences, verifyPasswordSync, defaultLockScreenBg, type LocaleMessages } from '@admin-core/preferences';
import LockScreenTime from './LockScreenTime.vue';

const props = withDefaults(defineProps<{
  /** 返回登录页/退出登录回调 */
  onLogout?: () => void;
  /** 头像 */
  avatar?: string;
  /** 用户名 */
  username?: string;
  /** 背景图片 URL，传入空字符串禁用背景，不传则使用默认背景 */
  backgroundImage?: string;
}>(), {
  username: 'Admin',
});

// 计算实际使用的背景图片：用户传入 > 默认图片
const actualBgImage = computed(() => {
  // 用户显式传入空字符串表示禁用背景
  if (props.backgroundImage === '') {
    return undefined;
  }
  // 用户传入了有效的 URL，否则使用默认背景
  return props.backgroundImage || defaultLockScreenBg;
});

// 背景图片样式 - 直接设置在背景元素上，避免 CSS 变量传递问题
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

const { preferences, setPreferences } = usePreferences();

const password = ref('');
const error = ref('');
const showUnlockForm = ref(false);
const inputRef = ref<HTMLInputElement | null>(null);
const focusTimerRef = ref<ReturnType<typeof setTimeout> | null>(null);

const isLocked = computed(() => preferences.value?.lockScreen.isLocked ?? false);
const savedPassword = computed(() => preferences.value?.lockScreen.password ?? '');
const currentLocale = computed(() => preferences.value?.app?.locale || 'zh-CN');

// 使用可选链和默认值，避免非空断言
const locale = computed(() => {
  if (!preferences.value) return {} as LocaleMessages;
  return getLocaleByPreferences(preferences.value) as LocaleMessages;
});

// 使用 ref 存储最新的函数引用，避免事件监听器频繁重新注册
const showUnlockFormRef = ref(showUnlockForm);
watch(showUnlockForm, (val) => { showUnlockFormRef.value = val; });

// 全局键盘事件处理函数（使用 ref 获取最新状态）
const handleGlobalKeyDown = (e: KeyboardEvent) => {
  // ESC 关闭解锁面板
  if (e.code === 'Escape' && showUnlockFormRef.value) {
    e.preventDefault();
    toggleUnlockForm();
    return;
  }
  
  // 如果解锁面板已显示
  if (showUnlockFormRef.value) {
    // Enter 或 NumpadEnter 提交解锁
    if (e.code === 'Enter' || e.code === 'NumpadEnter') {
      e.preventDefault();
      handleUnlock();
    }
    return;
  }
  
  // 空格或回车弹出解锁面板
  if (e.code === 'Space' || e.code === 'Enter' || e.code === 'NumpadEnter') {
    e.preventDefault();
    toggleUnlockForm();
  }
};

// 锁定状态变化时管理事件监听器（SSR 安全）
watch(isLocked, (locked) => {
  // SSR 环境检查
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  
  if (locked) {
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollBarWidth > 0) document.body.style.paddingRight = `${scrollBarWidth}px`;
    showUnlockForm.value = false;
    // 只在锁定时注册事件监听器
    window.addEventListener('keydown', handleGlobalKeyDown);
  } else {
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    // 解锁时移除事件监听器
    window.removeEventListener('keydown', handleGlobalKeyDown);
  }
}, { immediate: true });

watch(showUnlockForm, (show) => {
  if (show) {
    nextTick(() => {
      // 清理之前的定时器
      if (focusTimerRef.value) clearTimeout(focusTimerRef.value);
      focusTimerRef.value = setTimeout(() => inputRef.value?.focus(), 100);
    });
  } else if (focusTimerRef.value) {
    clearTimeout(focusTimerRef.value);
    focusTimerRef.value = null;
  }
});

const toggleUnlockForm = () => {
  showUnlockForm.value = !showUnlockForm.value;
  password.value = '';
  error.value = '';
};

const handleUnlock = () => {
  if (!password.value) { error.value = locale.value.lockScreen?.passwordPlaceholder || '请输入密码'; return; }
  // 使用哈希验证密码
  if (!verifyPasswordSync(password.value, savedPassword.value)) { error.value = locale.value.lockScreen?.passwordError || '密码错误'; return; }
  setPreferences({ lockScreen: { isLocked: false } });
  showUnlockForm.value = false;
};

onUnmounted(() => {
  // 确保清理事件监听器
  window.removeEventListener('keydown', handleGlobalKeyDown);
  // 清理定时器
  if (focusTimerRef.value) clearTimeout(focusTimerRef.value);
});

</script>

<template>
  <Teleport to="body">
    <div v-if="isLocked" class="preferences-lock-screen" role="dialog" aria-modal="true" :aria-label="locale.lockScreen?.title || '锁屏'">
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
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
              </svg>
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
