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

/**
 * 快捷键标签页入参
 * @description 提供语言包与快捷键分组 UI 配置。
 */
export interface ShortcutKeysTabProps {
  /** 当前语言包。 */
  locale: LocaleMessages;
  /** UI 配置（控制功能项显示/禁用）。 */
  uiConfig?: ShortcutKeysTabConfig;
}

/**
 * 快捷键配置键名。
 * @description 对应 `shortcutKeys` 分组下可展示的功能项键。
 */
type ShortcutKeySettingKey =
  | 'globalLockScreen'
  | 'globalLogout'
  | 'globalPreferences'
  | 'globalSearch';

const props = defineProps<ShortcutKeysTabProps>();

/**
 * UI 配置解析区。
 * @description 通过函数与计算属性统一解析快捷键项的可见性与禁用态。
 */
/**
 * 读取快捷键标签页功能项配置
 * @description 统一解析 block 与 item 维度配置，返回带默认值的可见/禁用状态。
 * @param blockKey 配置分组键。
 * @param itemKey 分组内的功能项键。
 * @returns 解析后的功能配置对象。
 */
const getConfig = (blockKey: keyof ShortcutKeysTabConfig, itemKey?: string): ResolvedFeatureConfig =>
  getFeatureItemConfig(props.uiConfig, blockKey, itemKey);

/**
 * 快捷键分组配置快照
 * @description 统一缓存各快捷键项的可见性与禁用状态。
 */
const configs = computed(() => ({
  shortcuts: getConfig('shortcuts'),
  enable: getConfig('shortcuts', 'enable'),
  globalPreferences: getConfig('shortcuts', 'globalPreferences'),
  globalSearch: getConfig('shortcuts', 'globalSearch'),
  globalLockScreen: getConfig('shortcuts', 'globalLockScreen'),
  globalLogout: getConfig('shortcuts', 'globalLogout'),
}));

/**
 * 偏好状态与更新方法
 * @description 读取快捷键配置并写回用户切换结果。
 */
const { preferences, setPreferences } = usePreferences();

/**
 * 默认偏好常量引用
 * @description 提供快捷键字段的兜底默认值。
 */
const D = DEFAULT_PREFERENCES;

/**
 * 是否为 Mac 系统
 * @description 控制快捷键显示文案中的修饰键样式（`Cmd`/`Ctrl`）。
 */
const isMac = ref(false);
/**
 * 组件挂载初始化。
 * @description 仅在客户端环境检测操作系统，避免服务端渲染阶段访问浏览器对象。
 */
onMounted(() => {
  isMac.value = isMacOs();
});

/**
 * 获取指定快捷键的按键组合
 * @description 根据当前操作系统（Mac/非 Mac）返回对应显示文案。
 * @param key 快捷键配置键名。
 * @returns 组成快捷键的按键数组。
 */
const getKeys = (key: ShortcutKeySettingKey) => getShortcutKeys(key, isMac.value);

/**
 * 快捷键总开关绑定
 * @description 控制整套快捷键能力是否启用。
 */
const shortcutKeysEnable = computed({
  get: () => preferences.value?.shortcutKeys.enable ?? D.shortcutKeys.enable,
  set: (value: boolean) => setPreferences({ shortcutKeys: { enable: value } }),
});

/**
 * 打开偏好设置快捷键开关绑定
 * @description 控制全局打开偏好设置快捷键是否生效。
 */
const globalPreferences = computed({
  get: () => preferences.value?.shortcutKeys.globalPreferences ?? D.shortcutKeys.globalPreferences,
  set: (value: boolean) => setPreferences({ shortcutKeys: { globalPreferences: value } }),
});

/**
 * 全局搜索快捷键开关绑定
 * @description 控制全局搜索快捷键是否生效。
 */
const globalSearch = computed({
  get: () => preferences.value?.shortcutKeys.globalSearch ?? D.shortcutKeys.globalSearch,
  set: (value: boolean) => setPreferences({ shortcutKeys: { globalSearch: value } }),
});

/**
 * 锁屏快捷键开关绑定
 * @description 控制全局锁屏快捷键是否生效。
 */
const globalLockScreen = computed({
  get: () => preferences.value?.shortcutKeys.globalLockScreen ?? D.shortcutKeys.globalLockScreen,
  set: (value: boolean) => setPreferences({ shortcutKeys: { globalLockScreen: value } }),
});

/**
 * 退出登录快捷键开关绑定
 * @description 控制全局退出登录快捷键是否生效。
 */
const globalLogout = computed({
  get: () => preferences.value?.shortcutKeys.globalLogout ?? D.shortcutKeys.globalLogout,
  set: (value: boolean) => setPreferences({ shortcutKeys: { globalLogout: value } }),
});

/**
 * 快捷键开关切换函数集合。
 * @description 针对各功能项提供独立切换入口，保持模板层调用语义清晰。
 */
/**
 * 切换快捷键总开关
 * @description 开启或关闭整套快捷键能力。
 */
const toggleEnable = () => { shortcutKeysEnable.value = !shortcutKeysEnable.value; };
/**
 * 切换“打开偏好设置”快捷键
 * @description 控制对应快捷键是否生效。
 */
const togglePreferences = () => { globalPreferences.value = !globalPreferences.value; };
/**
 * 切换“全局搜索”快捷键
 * @description 控制对应快捷键是否生效。
 */
const toggleSearch = () => { globalSearch.value = !globalSearch.value; };
/**
 * 切换“锁屏”快捷键
 * @description 控制对应快捷键是否生效。
 */
const toggleLockScreen = () => { globalLockScreen.value = !globalLockScreen.value; };
/**
 * 切换“退出登录”快捷键
 * @description 控制对应快捷键是否生效。
 */
const toggleLogout = () => { globalLogout.value = !globalLogout.value; };
</script>

<template>
  <Block v-if="configs.shortcuts.visible" :title="locale.shortcutKeys.title">
    <!-- 启用快捷键 - 主开关 -->
    <div
      v-if="configs.enable.visible"
      class="shortcut-item pref-disabled data-active:text-foreground data-active:font-semibold aria-checked:text-foreground"
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
      <span class="shortcut-item-label pref-disabled-label">{{ locale.shortcutKeys.enable }}</span>
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
      class="shortcut-item pref-disabled data-active:text-foreground data-active:font-semibold aria-checked:text-foreground"
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
      <span class="shortcut-item-label pref-disabled-label">{{ locale.shortcutKeys.globalPreferences }}</span>
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
      class="shortcut-item pref-disabled data-active:text-foreground data-active:font-semibold aria-checked:text-foreground"
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
      <span class="shortcut-item-label pref-disabled-label">{{ locale.shortcutKeys.globalSearch }}</span>
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
      class="shortcut-item pref-disabled data-active:text-foreground data-active:font-semibold aria-checked:text-foreground"
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
      <span class="shortcut-item-label pref-disabled-label">{{ locale.shortcutKeys.globalLockScreen }}</span>
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
      class="shortcut-item pref-disabled data-active:text-foreground data-active:font-semibold aria-checked:text-foreground"
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
      <span class="shortcut-item-label pref-disabled-label">{{ locale.shortcutKeys.globalLogout }}</span>
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
