<script setup lang="ts">
/**
 * 快捷键设置标签页
 * @description 快捷键相关设置，显示快捷键组合
 */
import { computed, onMounted, ref } from 'vue';
import { usePreferences } from '../../composables';
import {
  DEFAULT_PREFERENCES,
  getShortcutKeys,
  isMacOs,
  getFeatureItemConfig,
  type LocaleMessages,
  type ShortcutKeysTabConfig,
  type ResolvedFeatureConfig,
} from '@admin-core/preferences';
import Block from './Block.vue';

const props = defineProps<{
  /** 当前语言包 */
  locale: LocaleMessages;
  /** UI 配置（控制功能项显示/禁用） */
  uiConfig?: ShortcutKeysTabConfig;
}>();

// ========== UI 配置解析（使用 computed 缓存） ==========
const getConfig = (blockKey: keyof ShortcutKeysTabConfig, itemKey?: string): ResolvedFeatureConfig =>
  getFeatureItemConfig(props.uiConfig, blockKey, itemKey);

// 缓存常用配置项
const configs = computed(() => ({
  shortcuts: getConfig('shortcuts'),
  enable: getConfig('shortcuts', 'enable'),
  globalPreferences: getConfig('shortcuts', 'globalPreferences'),
  globalSearch: getConfig('shortcuts', 'globalSearch'),
  globalLockScreen: getConfig('shortcuts', 'globalLockScreen'),
  globalLogout: getConfig('shortcuts', 'globalLogout'),
}));

const { preferences, setPreferences } = usePreferences();

// 默认值简写
const D = DEFAULT_PREFERENCES;

// 检测是否为 Mac 系统
const isMac = ref(false);
onMounted(() => {
  isMac.value = isMacOs();
});

// 获取快捷键按键列表
const getKeys = (key: string) => getShortcutKeys(key, isMac.value);

// ========== 快捷键设置 ==========
const shortcutKeysEnable = computed({
  get: () => preferences.value?.shortcutKeys.enable ?? D.shortcutKeys.enable,
  set: (value: boolean) => setPreferences({ shortcutKeys: { enable: value } }),
});

const globalPreferences = computed({
  get: () => preferences.value?.shortcutKeys.globalPreferences ?? D.shortcutKeys.globalPreferences,
  set: (value: boolean) => setPreferences({ shortcutKeys: { globalPreferences: value } }),
});

const globalSearch = computed({
  get: () => preferences.value?.shortcutKeys.globalSearch ?? D.shortcutKeys.globalSearch,
  set: (value: boolean) => setPreferences({ shortcutKeys: { globalSearch: value } }),
});

const globalLockScreen = computed({
  get: () => preferences.value?.shortcutKeys.globalLockScreen ?? D.shortcutKeys.globalLockScreen,
  set: (value: boolean) => setPreferences({ shortcutKeys: { globalLockScreen: value } }),
});

const globalLogout = computed({
  get: () => preferences.value?.shortcutKeys.globalLogout ?? D.shortcutKeys.globalLogout,
  set: (value: boolean) => setPreferences({ shortcutKeys: { globalLogout: value } }),
});

// 切换开关
const toggleEnable = () => { shortcutKeysEnable.value = !shortcutKeysEnable.value; };
const togglePreferences = () => { globalPreferences.value = !globalPreferences.value; };
const toggleSearch = () => { globalSearch.value = !globalSearch.value; };
const toggleLockScreen = () => { globalLockScreen.value = !globalLockScreen.value; };
const toggleLogout = () => { globalLogout.value = !globalLogout.value; };
</script>

<template>
  <Block v-if="configs.shortcuts.visible" :title="locale.shortcutKeys.title">
    <!-- 启用快捷键 - 主开关 -->
    <div
      v-if="configs.enable.visible"
      class="shortcut-item data-active:text-foreground data-active:font-semibold data-disabled:opacity-50 aria-checked:text-foreground"
      :class="{ disabled: configs.enable.disabled }"
      role="switch"
      :aria-checked="shortcutKeysEnable"
      :aria-disabled="configs.enable.disabled"
      :data-state="shortcutKeysEnable ? 'active' : 'inactive'"
      :data-disabled="configs.enable.disabled ? 'true' : undefined"
      :tabindex="configs.enable.disabled ? -1 : 0"
      @click="!configs.enable.disabled && toggleEnable()"
      @keydown.enter.space.prevent="!configs.enable.disabled && toggleEnable()"
    >
      <span class="shortcut-item-label">{{ locale.shortcutKeys.enable }}</span>
      <div class="shortcut-item-right">
        <div
          class="preferences-switch data-checked:border-primary data-checked:ring-1 data-checked:ring-ring/30"
          :class="{ checked: shortcutKeysEnable }"
          :data-state="shortcutKeysEnable ? 'checked' : 'unchecked'"
          :data-disabled="configs.enable.disabled ? 'true' : undefined"
        >
          <span class="preferences-switch-thumb" />
        </div>
      </div>
    </div>

    <!-- 打开设置 -->
    <div
      v-if="configs.globalPreferences.visible"
      class="shortcut-item data-active:text-foreground data-active:font-semibold data-disabled:opacity-50 aria-checked:text-foreground"
      :class="{ disabled: !shortcutKeysEnable || configs.globalPreferences.disabled }"
      role="switch"
      :aria-checked="globalPreferences"
      :aria-disabled="!shortcutKeysEnable || configs.globalPreferences.disabled"
      :data-state="globalPreferences ? 'active' : 'inactive'"
      :data-disabled="(!shortcutKeysEnable || configs.globalPreferences.disabled) ? 'true' : undefined"
      :tabindex="shortcutKeysEnable && !configs.globalPreferences.disabled ? 0 : -1"
      @click="shortcutKeysEnable && !configs.globalPreferences.disabled && togglePreferences()"
      @keydown.enter.space.prevent="shortcutKeysEnable && !configs.globalPreferences.disabled && togglePreferences()"
    >
      <span class="shortcut-item-label">{{ locale.shortcutKeys.globalPreferences }}</span>
      <div class="shortcut-item-right">
        <div class="shortcut-keys">
          <kbd v-for="k in getKeys('globalPreferences')" :key="k" class="shortcut-key">{{ k }}</kbd>
        </div>
        <div
          class="preferences-switch data-checked:border-primary data-checked:ring-1 data-checked:ring-ring/30"
          :class="{ checked: globalPreferences }"
          :data-state="globalPreferences ? 'checked' : 'unchecked'"
          :data-disabled="(!shortcutKeysEnable || configs.globalPreferences.disabled) ? 'true' : undefined"
        >
          <span class="preferences-switch-thumb" />
        </div>
      </div>
    </div>

    <!-- 全局搜索 -->
    <div
      v-if="configs.globalSearch.visible"
      class="shortcut-item data-active:text-foreground data-active:font-semibold data-disabled:opacity-50 aria-checked:text-foreground"
      :class="{ disabled: !shortcutKeysEnable || configs.globalSearch.disabled }"
      role="switch"
      :aria-checked="globalSearch"
      :aria-disabled="!shortcutKeysEnable || configs.globalSearch.disabled"
      :data-state="globalSearch ? 'active' : 'inactive'"
      :data-disabled="(!shortcutKeysEnable || configs.globalSearch.disabled) ? 'true' : undefined"
      :tabindex="shortcutKeysEnable && !configs.globalSearch.disabled ? 0 : -1"
      @click="shortcutKeysEnable && !configs.globalSearch.disabled && toggleSearch()"
      @keydown.enter.space.prevent="shortcutKeysEnable && !configs.globalSearch.disabled && toggleSearch()"
    >
      <span class="shortcut-item-label">{{ locale.shortcutKeys.globalSearch }}</span>
      <div class="shortcut-item-right">
        <div class="shortcut-keys">
          <kbd v-for="k in getKeys('globalSearch')" :key="k" class="shortcut-key">{{ k }}</kbd>
        </div>
        <div
          class="preferences-switch data-checked:border-primary data-checked:ring-1 data-checked:ring-ring/30"
          :class="{ checked: globalSearch }"
          :data-state="globalSearch ? 'checked' : 'unchecked'"
          :data-disabled="(!shortcutKeysEnable || configs.globalSearch.disabled) ? 'true' : undefined"
        >
          <span class="preferences-switch-thumb" />
        </div>
      </div>
    </div>

    <!-- 锁屏 -->
    <div
      v-if="configs.globalLockScreen.visible"
      class="shortcut-item data-active:text-foreground data-active:font-semibold data-disabled:opacity-50 aria-checked:text-foreground"
      :class="{ disabled: !shortcutKeysEnable || configs.globalLockScreen.disabled }"
      role="switch"
      :aria-checked="globalLockScreen"
      :aria-disabled="!shortcutKeysEnable || configs.globalLockScreen.disabled"
      :data-state="globalLockScreen ? 'active' : 'inactive'"
      :data-disabled="(!shortcutKeysEnable || configs.globalLockScreen.disabled) ? 'true' : undefined"
      :tabindex="shortcutKeysEnable && !configs.globalLockScreen.disabled ? 0 : -1"
      @click="shortcutKeysEnable && !configs.globalLockScreen.disabled && toggleLockScreen()"
      @keydown.enter.space.prevent="shortcutKeysEnable && !configs.globalLockScreen.disabled && toggleLockScreen()"
    >
      <span class="shortcut-item-label">{{ locale.shortcutKeys.globalLockScreen }}</span>
      <div class="shortcut-item-right">
        <div class="shortcut-keys">
          <kbd v-for="k in getKeys('globalLockScreen')" :key="k" class="shortcut-key">{{ k }}</kbd>
        </div>
        <div
          class="preferences-switch data-checked:border-primary data-checked:ring-1 data-checked:ring-ring/30"
          :class="{ checked: globalLockScreen }"
          :data-state="globalLockScreen ? 'checked' : 'unchecked'"
          :data-disabled="(!shortcutKeysEnable || configs.globalLockScreen.disabled) ? 'true' : undefined"
        >
          <span class="preferences-switch-thumb" />
        </div>
      </div>
    </div>

    <!-- 登出 -->
    <div
      v-if="configs.globalLogout.visible"
      class="shortcut-item data-active:text-foreground data-active:font-semibold data-disabled:opacity-50 aria-checked:text-foreground"
      :class="{ disabled: !shortcutKeysEnable || configs.globalLogout.disabled }"
      role="switch"
      :aria-checked="globalLogout"
      :aria-disabled="!shortcutKeysEnable || configs.globalLogout.disabled"
      :data-state="globalLogout ? 'active' : 'inactive'"
      :data-disabled="(!shortcutKeysEnable || configs.globalLogout.disabled) ? 'true' : undefined"
      :tabindex="shortcutKeysEnable && !configs.globalLogout.disabled ? 0 : -1"
      @click="shortcutKeysEnable && !configs.globalLogout.disabled && toggleLogout()"
      @keydown.enter.space.prevent="shortcutKeysEnable && !configs.globalLogout.disabled && toggleLogout()"
    >
      <span class="shortcut-item-label">{{ locale.shortcutKeys.globalLogout }}</span>
      <div class="shortcut-item-right">
        <div class="shortcut-keys">
          <kbd v-for="k in getKeys('globalLogout')" :key="k" class="shortcut-key">{{ k }}</kbd>
        </div>
        <div
          class="preferences-switch data-checked:border-primary data-checked:ring-1 data-checked:ring-ring/30"
          :class="{ checked: globalLogout }"
          :data-state="globalLogout ? 'checked' : 'unchecked'"
          :data-disabled="(!shortcutKeysEnable || configs.globalLogout.disabled) ? 'true' : undefined"
        >
          <span class="preferences-switch-thumb" />
        </div>
      </div>
    </div>
  </Block>
</template>
