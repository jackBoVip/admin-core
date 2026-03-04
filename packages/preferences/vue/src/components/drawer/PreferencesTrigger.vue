<script setup lang="ts">
/**
 * 偏好设置触发按钮。
 * @description 提供浮动入口用于打开偏好抽屉，可按需通过 `show` 控制显隐。
 */
import { getIcon, getLocaleByPreferences } from '@admin-core/preferences';
import { computed } from 'vue';
import { usePreferences } from '../../composables';

/**
 * 偏好触发按钮入参
 * @description 控制悬浮触发按钮是否渲染。
 */
export interface PreferencesTriggerProps {
  /** 是否显示。 */
  show?: boolean;
}

/**
 * 偏好触发按钮事件签名。
 */
export interface PreferencesTriggerEmits {
  /** 点击触发按钮时触发。 */
  (e: 'click'): void;
}

defineProps<PreferencesTriggerProps>();

/**
 * 偏好触发按钮事件
 * @description 对外抛出点击事件以打开偏好抽屉。
 */
const emit = defineEmits<PreferencesTriggerEmits>();

/**
 * 设置图标
 * @description 触发按钮中展示的齿轮图标。
 */
const settingsIcon = getIcon('settings');
/**
 * 偏好状态引用
 * @description 用于解析当前语言环境下的标题文案。
 */
const { preferences } = usePreferences();
/**
 * 当前语言包
 * @description 基于偏好中的语言配置解析本地化文案。
 */
const locale = computed(() => getLocaleByPreferences(preferences.value));
/**
 * 按钮标题文案
 * @description 优先使用本地化标题，缺失时回退到 `Preferences`。
 */
const title = computed(() => locale.value.preferences?.title || 'Preferences');
</script>

<template>
  <button
    v-if="show !== false"
    class="preferences-trigger"
    :aria-label="title"
    :title="title"
    @click="emit('click')"
  >
    <span v-html="settingsIcon" aria-hidden="true" />
  </button>
</template>
