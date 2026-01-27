<script setup lang="ts">
/**
 * 快捷键设置标签页
 * @description 快捷键相关设置
 */
import { computed } from 'vue';
import { usePreferences } from '../../composables';
import {
  DEFAULT_PREFERENCES,
  type LocaleMessages,
} from '@admin-core/preferences';
import Block from './Block.vue';
import SwitchItem from './SwitchItem.vue';

defineProps<{
  /** 当前语言包 */
  locale: LocaleMessages;
}>();

const { preferences, setPreferences } = usePreferences();

// 默认值简写
const D = DEFAULT_PREFERENCES;

// ========== 快捷键设置 ==========
const shortcutKeysEnable = computed({
  get: () => preferences.value?.shortcutKeys.enable ?? D.shortcutKeys.enable,
  set: (value: boolean) => setPreferences({ shortcutKeys: { enable: value } }),
});

const globalSearch = computed({
  get: () => preferences.value?.shortcutKeys.globalSearch ?? D.shortcutKeys.globalSearch,
  set: (value: boolean) => setPreferences({ shortcutKeys: { globalSearch: value } }),
});

const globalLockScreen = computed({
  get: () => preferences.value?.shortcutKeys.globalLockScreen ?? D.shortcutKeys.globalLockScreen,
  set: (value: boolean) => setPreferences({ shortcutKeys: { globalLockScreen: value } }),
});
</script>

<template>
  <Block :title="locale.shortcutKeys.title">
    <SwitchItem v-model="shortcutKeysEnable" :label="locale.shortcutKeys.enable" />
    <SwitchItem
      v-model="globalSearch"
      :label="locale.shortcutKeys.globalSearch"
      :disabled="!shortcutKeysEnable"
    />
    <SwitchItem
      v-model="globalLockScreen"
      :label="locale.shortcutKeys.globalLockScreen"
      :disabled="!shortcutKeysEnable"
    />
  </Block>
</template>
