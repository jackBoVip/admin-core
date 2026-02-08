<script setup lang="ts">
/**
 * 偏好设置触发按钮
 * @description 固定在页面右侧的设置按钮
 */
import { getIcon, getLocaleByPreferences } from '@admin-core/preferences';
import { computed } from 'vue';
import { usePreferences } from '../../composables';

defineProps<{
  /** 是否显示 */
  show?: boolean;
}>();

const emit = defineEmits<{
  (e: 'click'): void;
}>();

const settingsIcon = getIcon('settings');
const { preferences } = usePreferences();
const locale = computed(() => getLocaleByPreferences(preferences.value));
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
