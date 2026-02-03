<script setup lang="ts">
/**
 * 锁屏密码设置弹窗
 * @description 极简高级风格，支持国际化、无障碍
 */
import { ref, computed, watch, nextTick, onUnmounted } from 'vue';
import { usePreferences } from '../../composables';
import {
  getLocaleByPreferences,
  getIcon,
  hashPasswordSync,
  PASSWORD_MIN_LENGTH,
  type LocaleMessages,
} from '@admin-core/preferences';

const props = withDefaults(defineProps<{
  open: boolean;
}>(), {});

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'close'): void;
  (e: 'success'): void;
}>();

const { preferences, setPreferences } = usePreferences();

const password = ref('');
const confirmPassword = ref('');
const error = ref('');
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const inputRef = ref<HTMLInputElement | null>(null);
const isClosing = ref(false);

// 定时器管理 - 使用 ref 确保每个组件实例独立
const focusTimer = ref<ReturnType<typeof setTimeout> | null>(null);
const closeTimer = ref<ReturnType<typeof setTimeout> | null>(null);

// 清理定时器的辅助函数
const clearFocusTimer = () => {
  if (focusTimer.value) {
    clearTimeout(focusTimer.value);
    focusTimer.value = null;
  }
};

const clearCloseTimer = () => {
  if (closeTimer.value) {
    clearTimeout(closeTimer.value);
    closeTimer.value = null;
  }
};

// 清理所有定时器
onUnmounted(() => {
  clearFocusTimer();
  clearCloseTimer();
});

// 国际化
const locale = computed(() => {
  if (!preferences.value) return {} as LocaleMessages;
  return getLocaleByPreferences(preferences.value) as LocaleMessages;
});

// 文本 - 使用国际化
const texts = computed(() => {
  const ls = locale.value.lockScreen || {};
  return {
    title: ls.setPassword || '设置锁屏密码',
    subtitle: ls.setPasswordTip || '首次锁屏需要设置解锁密码',
    passwordPlaceholder: ls.passwordPlaceholder || '请输入密码',
    confirmPlaceholder: ls.confirmPasswordPlaceholder || '请再次输入密码',
    submit: ls.confirmAndLock || '确认并锁定',
    minLengthError: (ls.passwordMinLength || '密码至少 {0} 位').replace('{0}', String(PASSWORD_MIN_LENGTH)),
    mismatchError: ls.passwordMismatch || '两次输入的密码不一致',
    showPassword: ls.showPassword || '显示密码',
    hidePassword: ls.hidePassword || '隐藏密码',
  };
});

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    isClosing.value = false;
    nextTick(() => {
      clearFocusTimer();
      focusTimer.value = setTimeout(() => {
        inputRef.value?.focus();
        focusTimer.value = null;
      }, 100);
    });
  } else {
    clearFocusTimer();
    clearCloseTimer();
    password.value = '';
    confirmPassword.value = '';
    error.value = '';
    showPassword.value = false;
    showConfirmPassword.value = false;
    isClosing.value = false;
  }
});

const handleClose = () => {
  isClosing.value = true;
  clearCloseTimer();
  closeTimer.value = setTimeout(() => {
    emit('update:open', false);
    emit('close');
    closeTimer.value = null;
  }, 200);
};

const handleSubmit = () => {
  if (!password.value) {
    error.value = texts.value.passwordPlaceholder;
    return;
  }
  if (password.value.length < PASSWORD_MIN_LENGTH) {
    error.value = texts.value.minLengthError;
    return;
  }
  if (password.value !== confirmPassword.value) {
    error.value = texts.value.mismatchError;
    return;
  }

  const hashedPassword = hashPasswordSync(password.value);
  setPreferences({
    lockScreen: {
      password: hashedPassword,
      isLocked: true,
    },
  });

  password.value = '';
  confirmPassword.value = '';
  error.value = '';
  emit('update:open', false);
  emit('success');
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') handleSubmit();
  if (e.key === 'Escape') handleClose();
};

const handleTogglePassword = () => {
  showPassword.value = !showPassword.value;
};

const handleToggleConfirmPassword = () => {
  showConfirmPassword.value = !showConfirmPassword.value;
};

const closeIcon = getIcon('close');
const eyeIcon = getIcon('eye');
const eyeOffIcon = getIcon('eyeOff');
</script>

<template>
  <Teleport to="body">
    <Transition name="lock-modal">
      <div 
        v-if="open || isClosing" 
        class="preferences-lock-modal-overlay" 
        :class="{ 'is-closing': isClosing }"
        role="dialog"
        aria-modal="true"
        :aria-label="texts.title"
        :data-state="isClosing ? 'closing' : 'open'"
        @click="handleClose"
      >
        <div
          class="preferences-lock-modal-card"
          :class="{ 'is-closing': isClosing }"
          :data-state="isClosing ? 'closing' : 'open'"
          @click.stop
        >
          <div class="preferences-lock-modal-header">
            <div class="preferences-lock-modal-title">
              <h3>{{ texts.title }}</h3>
              <p>{{ texts.subtitle }}</p>
            </div>
            <button 
              class="preferences-lock-modal-close" 
              @click="handleClose" 
              v-html="closeIcon"
              :aria-label="locale.common?.close || '关闭'"
            />
          </div>

          <div class="preferences-lock-modal-form">
            <div class="preferences-lock-modal-input-wrapper">
              <input
                ref="inputRef"
                :type="showPassword ? 'text' : 'password'"
                class="preferences-lock-modal-input"
                v-model="password"
                @keydown="handleKeyDown"
                :placeholder="texts.passwordPlaceholder"
                :aria-label="texts.passwordPlaceholder"
                :aria-describedby="error ? 'lock-password-error' : undefined"
                :aria-invalid="!!error"
                autocomplete="new-password"
              />
              <button 
                type="button"
                class="preferences-lock-modal-eye"
                @click="handleTogglePassword"
                :aria-label="showPassword ? texts.hidePassword : texts.showPassword"
              >
                <span v-html="showPassword ? eyeOffIcon : eyeIcon" aria-hidden="true" />
              </button>
            </div>
            <div class="preferences-lock-modal-input-wrapper">
              <input
                :type="showConfirmPassword ? 'text' : 'password'"
                class="preferences-lock-modal-input"
                v-model="confirmPassword"
                @keydown="handleKeyDown"
                :placeholder="texts.confirmPlaceholder"
                :aria-label="texts.confirmPlaceholder"
                :aria-describedby="error ? 'lock-password-error' : undefined"
                :aria-invalid="!!error"
                autocomplete="new-password"
              />
              <button 
                type="button"
                class="preferences-lock-modal-eye"
                @click="handleToggleConfirmPassword"
                :aria-label="showConfirmPassword ? texts.hidePassword : texts.showPassword"
              >
                <span v-html="showConfirmPassword ? eyeOffIcon : eyeIcon" aria-hidden="true" />
              </button>
            </div>
            
            <div v-if="error" id="lock-password-error" class="preferences-lock-modal-error" role="alert">
              {{ error }}
            </div>
            
            <button class="preferences-lock-modal-submit" @click="handleSubmit" :aria-label="texts.submit">
              {{ texts.submit }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style>
.lock-modal-enter-active,
.lock-modal-leave-active {
  transition: opacity 0.2s ease;
}
.lock-modal-enter-active .preferences-lock-modal-card,
.lock-modal-leave-active .preferences-lock-modal-card {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.lock-modal-enter-from,
.lock-modal-leave-to {
  opacity: 0;
}
.lock-modal-enter-from .preferences-lock-modal-card,
.lock-modal-leave-to .preferences-lock-modal-card {
  transform: translateY(-20px) scale(0.96);
  opacity: 0;
}
</style>
