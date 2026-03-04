/**
 * Table Vue 偏好语言同步 Composable。
 * @description 订阅偏好中心语言并归一化为 table-core 支持的 locale。
 */
import { getDefaultPreferencesStore } from '@admin-core/preferences';
import { normalizeTableLocale } from '@admin-core/table-core';
import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue';

/** 默认偏好设置 store 实例。 */
const preferencesStore = getDefaultPreferencesStore();

/**
 * 解析偏好设置中的语言并映射到表格支持语言。
 * @returns 标准化后的语言标识。
 */
function resolvePreferencesLocale() {
  const preferences = preferencesStore.getPreferences();
  return normalizeTableLocale(preferences?.app?.locale);
}

/**
 * 偏好语言值类型。
 * @description 由 `normalizeTableLocale` 归一化后可被 table-core 直接消费。
 */
type PreferencesLocaleValue = ReturnType<typeof normalizeTableLocale>;

/**
 * `usePreferencesLocale` 返回值类型。
 * @description 响应式持有当前偏好语言的 `Ref`。
 */
export type UsePreferencesLocaleReturn = Ref<PreferencesLocaleValue>;

/**
 * 订阅偏好设置语言变化。
 * @description 将偏好中心语言实时映射为 table 可识别语言，并在组件生命周期内自动管理订阅。
 * @returns 当前语言响应式引用。
 */
export function usePreferencesLocale(): UsePreferencesLocaleReturn {
  /**
   * 当前偏好语言
   * @description 与偏好中心保持同步的表格语言标识。
   */
  const locale = ref<PreferencesLocaleValue>(resolvePreferencesLocale());
  /**
   * 偏好订阅取消函数。
   */
  let unsubscribe: null | (() => void) = null;

  /**
   * 组件挂载后初始化语言并建立偏好订阅。
   */
  onMounted(() => {
    locale.value = resolvePreferencesLocale();
    unsubscribe = preferencesStore.subscribe((preferences) => {
      locale.value = normalizeTableLocale(preferences?.app?.locale);
    });
  });

  /**
   * 组件卸载前清理偏好订阅。
   */
  onBeforeUnmount(() => {
    unsubscribe?.();
    unsubscribe = null;
  });

  return locale;
}
