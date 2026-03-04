<script setup lang="ts">
/**
 * 锁屏密码设置弹窗
 * @description 极简高级风格，支持国际化、无障碍
 */
import { ref, computed, watch, nextTick, onUnmounted } from 'vue';
import { getPreferencesManager, usePreferences } from '../../composables';
import {
  getLocaleByPreferences,
  getIcon,
  hashPasswordSync,
  PASSWORD_MIN_LENGTH,
  type LocaleMessages,
} from '@admin-core/preferences';

/**
 * 锁屏密码弹窗入参。
 * @description 通过 `open` 控制弹窗显隐，由宿主组件以受控方式管理。
 */
export interface LockPasswordModalProps {
  /** 是否显示弹窗。 */
  open: boolean;
}

/**
 * 锁屏密码弹窗事件签名。
 * @description 向外同步显隐状态并通知关闭、设置成功等关键交互节点。
 */
export interface LockPasswordModalEmits {
  /** 更新受控开关状态。 */
  (e: 'update:open', value: boolean): void;
  /** 主动关闭弹窗后触发。 */
  (e: 'close'): void;
  /** 密码设置并锁屏成功后触发。 */
  (e: 'success'): void;
}

/**
 * 锁屏密码弹窗文案集合。
 */
interface LockPasswordModalTexts {
  /** 弹窗标题。 */
  title: string;
  /** 弹窗副标题。 */
  subtitle: string;
  /** 主密码输入占位文案。 */
  passwordPlaceholder: string;
  /** 确认密码输入占位文案。 */
  confirmPlaceholder: string;
  /** 提交按钮文案。 */
  submit: string;
  /** 密码最小长度校验文案。 */
  minLengthError: string;
  /** 两次密码不一致校验文案。 */
  mismatchError: string;
  /** “显示密码”按钮文案。 */
  showPassword: string;
  /** “隐藏密码”按钮文案。 */
  hidePassword: string;
}

const props = withDefaults(defineProps<LockPasswordModalProps>(), {});

/**
 * 锁屏密码弹窗事件
 * @description 向外同步显隐状态并通知关闭、设置成功等关键交互节点。
 */
const emit = defineEmits<LockPasswordModalEmits>();

/**
 * 偏好状态与写入方法
 * @description 用于读取当前语言配置并在提交成功后写入锁屏密码与锁定状态。
 */
const { preferences, setPreferences } = usePreferences();

/**
 * 主密码输入值
 * @description 保存用户输入的初次密码内容。
 */
const password = ref('');
/**
 * 确认密码输入值
 * @description 保存用户二次输入内容，用于一致性校验。
 */
const confirmPassword = ref('');
/**
 * 表单错误信息
 * @description 校验失败时向用户展示的错误提示。
 */
const error = ref('');
/**
 * 主密码是否明文显示
 * @description 控制主密码输入框的可见性切换。
 */
const showPassword = ref(false);
/**
 * 确认密码是否明文显示
 * @description 控制确认密码输入框的可见性切换。
 */
const showConfirmPassword = ref(false);
/**
 * 主密码输入框引用
 * @description 弹窗打开后用于自动聚焦。
 */
const inputRef = ref<HTMLInputElement | null>(null);
/**
 * 关闭动画状态
 * @description 关闭过程中保持节点可见，等待过渡动画结束再真正卸载。
 */
const isClosing = ref(false);

/**
 * 定时器引用集合。
 * @description 使用实例级 ref 保存，确保多个弹窗实例间互不干扰。
 */
const focusTimer = ref<ReturnType<typeof setTimeout> | null>(null);
const closeTimer = ref<ReturnType<typeof setTimeout> | null>(null);

/**
 * 清理输入框自动聚焦定时器
 * @description 取消未执行的聚焦任务，避免组件关闭后仍触发焦点操作。
 */
const clearFocusTimer = () => {
  if (focusTimer.value) {
    clearTimeout(focusTimer.value);
    focusTimer.value = null;
  }
};

/**
 * 清理弹窗关闭动画定时器
 * @description 取消延迟关闭任务，防止重复触发关闭事件。
 */
const clearCloseTimer = () => {
  if (closeTimer.value) {
    clearTimeout(closeTimer.value);
    closeTimer.value = null;
  }
};

/**
 * 组件卸载清理。
 * @description 卸载时清理所有未完成定时器，避免异步回调泄漏。
 */
onUnmounted(() => {
  clearFocusTimer();
  clearCloseTimer();
});

/**
 * 当前语言包
 * @description 基于偏好设置解析锁屏弹窗所需的本地化文案。
 */
const locale = computed(() => {
  if (!preferences.value) return {} as LocaleMessages;
  return getLocaleByPreferences(preferences.value) as LocaleMessages;
});

/**
 * 弹窗文案集合
 * @description 对锁屏语言包做容错兜底，并生成可直接渲染的文案对象。
 */
const texts = computed<LockPasswordModalTexts>(() => {
  const ls = locale.value.lockScreen || {};
  const minLengthText = ls.passwordMinLength ?? '';
  return {
    title: ls.setPassword ?? '',
    subtitle: ls.setPasswordTip ?? '',
    passwordPlaceholder: ls.passwordPlaceholder ?? '',
    confirmPlaceholder: ls.confirmPasswordPlaceholder ?? '',
    submit: ls.confirmAndLock ?? '',
    minLengthError: minLengthText.replace('{0}', String(PASSWORD_MIN_LENGTH)),
    mismatchError: ls.passwordMismatch ?? '',
    showPassword: ls.showPassword ?? '',
    hidePassword: ls.hidePassword ?? '',
  };
});

/**
 * 监听弹窗显隐状态。
 * @description 打开时执行输入框聚焦；关闭时重置表单字段、错误信息与可见性状态。
 */
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

/**
 * 关闭密码设置弹窗
 * @description 先进入关闭动画状态，动画结束后再同步 `open` 并触发关闭事件。
 */
const handleClose = () => {
  isClosing.value = true;
  clearCloseTimer();
  closeTimer.value = setTimeout(() => {
    emit('update:open', false);
    emit('close');
    closeTimer.value = null;
  }, 200);
};

/**
 * 提交并校验锁屏密码
 * @description
 * 依次执行空值、最小长度、二次确认一致性校验；
 * 校验通过后保存哈希密码并立即进入锁屏状态。
 */
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
  try {
    getPreferencesManager()?.flush?.();
  } catch {}

  password.value = '';
  confirmPassword.value = '';
  error.value = '';
  emit('update:open', false);
  emit('success');
};

/**
 * 处理输入框快捷键
 * @description 回车触发提交，Esc 触发关闭。
 * @param e 键盘事件对象。
 */
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') handleSubmit();
  if (e.key === 'Escape') handleClose();
};

/**
 * 切换主密码可见性
 * @description 在明文和密文显示模式之间切换主密码输入框状态。
 */
const handleTogglePassword = () => {
  showPassword.value = !showPassword.value;
};

/**
 * 切换确认密码可见性
 * @description 在明文和密文显示模式之间切换确认密码输入框状态。
 */
const handleToggleConfirmPassword = () => {
  showConfirmPassword.value = !showConfirmPassword.value;
};

/**
 * 关闭按钮图标
 * @description 用于弹窗右上角关闭操作按钮。
 */
const closeIcon = getIcon('close');
/**
 * 密码可见图标
 * @description 代表“显示密码”的眼睛图标。
 */
const eyeIcon = getIcon('eye');
/**
 * 密码隐藏图标
 * @description 代表“隐藏密码”的闭眼图标。
 */
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
          :aria-label="locale.common?.close ?? ''"
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
