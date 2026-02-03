<script setup lang="ts">
/**
 * 外观设置标签页
 * @description 主题模式、内置主题、圆角、字体缩放等设置
 */
import { computed, ref, watch, watchEffect } from 'vue';
import { usePreferences, useTheme } from '../../composables';
import {
  BUILT_IN_THEME_PRESETS,
  RADIUS_OPTIONS,
  FONT_SCALE_CONFIG,
  colorsTokens,
  DEFAULT_PREFERENCES,
  getIcon,
  oklchToHex,
  getFeatureItemConfig,
  type BuiltinThemeType,
  type ThemeModeType,
  type LocaleMessages,
  type AppearanceTabConfig,
  type ResolvedFeatureConfig,
} from '@admin-core/preferences';
import Block from './Block.vue';
import SwitchItem from './SwitchItem.vue';
import SliderItem from './SliderItem.vue';

const props = defineProps<{
  /** 当前语言包 */
  locale: LocaleMessages;
  /** UI 配置 */
  uiConfig?: AppearanceTabConfig;
}>();

// ========== UI 配置解析（使用 computed 缓存） ==========
const getConfig = (blockKey: keyof AppearanceTabConfig, itemKey?: string): ResolvedFeatureConfig =>
  getFeatureItemConfig(props.uiConfig, blockKey, itemKey);

// 缓存常用配置项
const configs = computed(() => ({
  // 主题模式
  themeMode: getConfig('themeMode'),
  // 内置主题
  builtinTheme: getConfig('builtinTheme'),
  // 圆角
  radius: getConfig('radius'),
  // 字体缩放
  fontSize: getConfig('fontSize'),
  // 颜色模式
  colorMode: getConfig('colorMode'),
  colorFollowPrimaryLight: getConfig('colorMode', 'colorFollowPrimaryLight'),
  colorFollowPrimaryDark: getConfig('colorMode', 'colorFollowPrimaryDark'),
  semiDarkSidebar: getConfig('colorMode', 'semiDarkSidebar'),
  semiDarkHeader: getConfig('colorMode', 'semiDarkHeader'),
  colorGrayMode: getConfig('colorMode', 'colorGrayMode'),
  colorWeakMode: getConfig('colorMode', 'colorWeakMode'),
}));

// 获取主题预设名称（类型安全）
function getThemePresetName(nameKey: string): string | undefined {
  const themeLocale = props.locale.theme as Record<string, string | undefined>;
  return themeLocale[nameKey];
}

const { preferences, setPreferences } = usePreferences();
const { isDark } = useTheme();

// 默认值简写
const D = DEFAULT_PREFERENCES;

// ========== 主题设置 ==========
const themeMode = computed({
  get: () => preferences.value?.theme.mode ?? D.theme.mode,
  set: (value: ThemeModeType) => setPreferences({ theme: { mode: value } }),
});

const builtinType = computed({
  get: () => preferences.value?.theme.builtinType ?? D.theme.builtinType,
  set: (value: BuiltinThemeType) => setPreferences({ theme: { builtinType: value } }),
});

const colorPrimary = computed({
  get: () => preferences.value?.theme.colorPrimary ?? D.theme.colorPrimary,
  set: (value: string) => setPreferences({ theme: { colorPrimary: value, builtinType: 'custom' } }),
});

// 将 colorPrimary 转换为 HEX 格式（用于 input[type=color]）
const colorPrimaryHex = computed(() => oklchToHex(colorPrimary.value));

const themePresets = computed(() => BUILT_IN_THEME_PRESETS.filter(p => p.type !== 'custom'));
const PRESET_RENDER_CHUNK = 12;
const presetRenderCount = ref(PRESET_RENDER_CHUNK);
const visibleThemePresets = computed(() =>
  themePresets.value.slice(0, presetRenderCount.value)
);

watch(themePresets, (list) => {
  presetRenderCount.value = Math.min(PRESET_RENDER_CHUNK, list.length);
}, { immediate: true });

watchEffect((onCleanup) => {
  if (presetRenderCount.value >= themePresets.value.length) return;
  const frame = requestAnimationFrame(() => {
    presetRenderCount.value = Math.min(
      presetRenderCount.value + PRESET_RENDER_CHUNK,
      themePresets.value.length
    );
  });
  onCleanup(() => cancelAnimationFrame(frame));
});

const radius = computed({
  get: () => preferences.value?.theme.radius ?? D.theme.radius,
  set: (value: string) => setPreferences({ theme: { radius: value } }),
});

// fontScale 存储为小数 (0.8-1.5)，显示为百分比 (80-150)
const fontScalePercent = computed({
  get: () => Math.round((preferences.value?.theme.fontScale ?? D.theme.fontScale) * 100),
  set: (value: number) => setPreferences({ theme: { fontScale: value / 100 } }),
});

const semiDarkSidebar = computed({
  get: () => preferences.value?.theme.semiDarkSidebar ?? D.theme.semiDarkSidebar,
  set: (value: boolean) => setPreferences({ theme: { semiDarkSidebar: value } }),
});

const semiDarkHeader = computed({
  get: () => preferences.value?.theme.semiDarkHeader ?? D.theme.semiDarkHeader,
  set: (value: boolean) => setPreferences({ theme: { semiDarkHeader: value } }),
});

// 颜色模式设置
const colorFollowPrimaryLight = computed({
  get: () => preferences.value?.app.colorFollowPrimaryLight ?? D.app.colorFollowPrimaryLight,
  set: (value: boolean) => setPreferences({ app: { colorFollowPrimaryLight: value } }),
});

const colorFollowPrimaryDark = computed({
  get: () => preferences.value?.app.colorFollowPrimaryDark ?? D.app.colorFollowPrimaryDark,
  set: (value: boolean) => setPreferences({ app: { colorFollowPrimaryDark: value } }),
});

const colorGrayMode = computed({
  get: () => preferences.value?.app.colorGrayMode ?? D.app.colorGrayMode,
  set: (value: boolean) => setPreferences({ app: { colorGrayMode: value } }),
});

const colorWeakMode = computed({
  get: () => preferences.value?.app.colorWeakMode ?? D.app.colorWeakMode,
  set: (value: boolean) => setPreferences({ app: { colorWeakMode: value } }),
});

// 图标
const sunIcon = getIcon('sun');
const moonIcon = getIcon('moon');
const monitorIcon = getIcon('monitor');
const semiDarkSidebarIcon = getIcon('semiDarkSidebar');
const semiDarkHeaderIcon = getIcon('semiDarkHeader');

// 颜色选择器引用
const colorInputRef = ref<HTMLInputElement | null>(null);

// 打开颜色选择器
const openColorPicker = () => {
  colorInputRef.value?.click();
};
</script>

<template>
  <!-- 主题模式 -->
  <Block v-if="configs.themeMode.visible" :title="locale.theme.mode">
    <div class="theme-mode-grid" role="radiogroup" :aria-label="locale.theme.mode">
      <div 
        class="theme-mode-item data-active:text-foreground data-active:font-semibold data-disabled:opacity-50 aria-checked:text-foreground" 
        :class="{ disabled: configs.themeMode.disabled }"
        role="radio"
        :tabindex="configs.themeMode.disabled ? -1 : 0"
        :aria-checked="themeMode === 'light'"
        :aria-disabled="configs.themeMode.disabled"
        :data-state="themeMode === 'light' ? 'active' : 'inactive'"
        :data-disabled="configs.themeMode.disabled ? 'true' : undefined"
        @click="!configs.themeMode.disabled && (themeMode = 'light')"
        @keydown.enter.space.prevent="!configs.themeMode.disabled && (themeMode = 'light')"
      >
        <div
          class="outline-box flex-center theme-mode-box"
          :class="{ 'outline-box-active': themeMode === 'light', disabled: configs.themeMode.disabled }"
          :data-disabled="configs.themeMode.disabled ? 'true' : undefined"
          :data-state="themeMode === 'light' ? 'active' : 'inactive'"
        >
          <span v-html="sunIcon" class="theme-mode-icon" />
        </div>
        <span class="theme-mode-label">{{ locale.theme.modeLight }}</span>
      </div>
      <div 
        class="theme-mode-item data-active:text-foreground data-active:font-semibold data-disabled:opacity-50 aria-checked:text-foreground" 
        :class="{ disabled: configs.themeMode.disabled }"
        role="radio"
        :tabindex="configs.themeMode.disabled ? -1 : 0"
        :aria-checked="themeMode === 'dark'"
        :aria-disabled="configs.themeMode.disabled"
        :data-state="themeMode === 'dark' ? 'active' : 'inactive'"
        :data-disabled="configs.themeMode.disabled ? 'true' : undefined"
        @click="!configs.themeMode.disabled && (themeMode = 'dark')"
        @keydown.enter.space.prevent="!configs.themeMode.disabled && (themeMode = 'dark')"
      >
        <div
          class="outline-box flex-center theme-mode-box"
          :class="{ 'outline-box-active': themeMode === 'dark', disabled: configs.themeMode.disabled }"
          :data-disabled="configs.themeMode.disabled ? 'true' : undefined"
          :data-state="themeMode === 'dark' ? 'active' : 'inactive'"
        >
          <span v-html="moonIcon" class="theme-mode-icon" />
        </div>
        <span class="theme-mode-label">{{ locale.theme.modeDark }}</span>
      </div>
      <div 
        class="theme-mode-item data-active:text-foreground data-active:font-semibold data-disabled:opacity-50 aria-checked:text-foreground" 
        :class="{ disabled: configs.themeMode.disabled }"
        role="radio"
        :tabindex="configs.themeMode.disabled ? -1 : 0"
        :aria-checked="themeMode === 'auto'"
        :aria-disabled="configs.themeMode.disabled"
        :data-state="themeMode === 'auto' ? 'active' : 'inactive'"
        :data-disabled="configs.themeMode.disabled ? 'true' : undefined"
        @click="!configs.themeMode.disabled && (themeMode = 'auto')"
        @keydown.enter.space.prevent="!configs.themeMode.disabled && (themeMode = 'auto')"
      >
        <div
          class="outline-box flex-center theme-mode-box"
          :class="{ 'outline-box-active': themeMode === 'auto', disabled: configs.themeMode.disabled }"
          :data-disabled="configs.themeMode.disabled ? 'true' : undefined"
          :data-state="themeMode === 'auto' ? 'active' : 'inactive'"
        >
          <span v-html="monitorIcon" class="theme-mode-icon" />
        </div>
        <span class="theme-mode-label">{{ locale.theme.modeAuto }}</span>
      </div>
    </div>
  </Block>

  <!-- 内置主题 -->
  <Block v-if="configs.builtinTheme.visible" :title="locale.theme.builtinTheme">
    <div class="theme-presets-grid" role="radiogroup" :aria-label="locale.theme.builtinTheme">
      <div
        v-for="preset in visibleThemePresets"
        :key="preset.type"
        class="theme-preset-item data-active:text-foreground data-active:font-semibold data-disabled:opacity-50 aria-checked:text-foreground"
        :class="{ disabled: configs.builtinTheme.disabled }"
        role="radio"
        :tabindex="configs.builtinTheme.disabled ? -1 : 0"
        :aria-checked="builtinType === preset.type"
        :aria-label="getThemePresetName(preset.nameKey) || preset.type"
        :aria-disabled="configs.builtinTheme.disabled"
        :data-state="builtinType === preset.type ? 'active' : 'inactive'"
        :data-disabled="configs.builtinTheme.disabled ? 'true' : undefined"
        @click="!configs.builtinTheme.disabled && (builtinType = preset.type)"
        @keydown.enter.space.prevent="!configs.builtinTheme.disabled && (builtinType = preset.type)"
      >
        <div
          class="outline-box flex-center theme-preset-box"
          :class="{ 'outline-box-active': builtinType === preset.type, disabled: configs.builtinTheme.disabled }"
          :data-disabled="configs.builtinTheme.disabled ? 'true' : undefined"
          :data-state="builtinType === preset.type ? 'active' : 'inactive'"
        >
          <div
            class="theme-preset-color"
            :style="{ backgroundColor: preset.color || colorsTokens.presetFallback }"
          />
        </div>
        <span class="theme-preset-label">{{ getThemePresetName(preset.nameKey) || preset.type }}</span>
      </div>
      <!-- 自定义颜色 -->
      <div
        class="theme-preset-item data-active:text-foreground data-active:font-semibold data-disabled:opacity-50 aria-checked:text-foreground"
        :class="{ disabled: configs.builtinTheme.disabled }"
        role="radio"
        :tabindex="configs.builtinTheme.disabled ? -1 : 0"
        :aria-checked="builtinType === 'custom'"
        :aria-label="locale.theme.colorCustom"
        :aria-disabled="configs.builtinTheme.disabled"
        :data-state="builtinType === 'custom' ? 'active' : 'inactive'"
        :data-disabled="configs.builtinTheme.disabled ? 'true' : undefined"
        @click="!configs.builtinTheme.disabled && (builtinType = 'custom')"
        @keydown.enter.space.prevent="!configs.builtinTheme.disabled && (builtinType = 'custom')"
      >
        <div
          class="outline-box flex-center theme-preset-box"
          :class="{ 'outline-box-active': builtinType === 'custom', disabled: configs.builtinTheme.disabled }"
          :data-disabled="configs.builtinTheme.disabled ? 'true' : undefined"
          :data-state="builtinType === 'custom' ? 'active' : 'inactive'"
        >
          <div class="theme-preset-custom" @click.stop="!configs.builtinTheme.disabled && openColorPicker()">
            <div class="theme-preset-custom-inner">
              <svg
                class="theme-preset-custom-icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
              </svg>
              <input
                ref="colorInputRef"
                type="color"
                class="theme-preset-custom-input"
                :value="colorPrimaryHex"
                :disabled="configs.builtinTheme.disabled"
                @input="(e) => colorPrimary = (e.target as HTMLInputElement).value"
              />
            </div>
          </div>
        </div>
        <span class="theme-preset-label">{{ locale.theme.colorCustom }}</span>
      </div>
    </div>
  </Block>

  <!-- 圆角 -->
  <Block v-if="configs.radius.visible" :title="locale.theme.radius">
    <div
      class="radius-options"
      :class="{ disabled: configs.radius.disabled }"
      :data-disabled="configs.radius.disabled ? 'true' : undefined"
    >
      <button
        v-for="r in RADIUS_OPTIONS"
        :key="r"
        class="radius-option data-active:text-foreground data-active:font-semibold data-disabled:opacity-50"
        :class="{ active: radius === r }"
        :disabled="configs.radius.disabled"
        :data-state="radius === r ? 'active' : 'inactive'"
        :data-disabled="configs.radius.disabled ? 'true' : undefined"
        @click="radius = r"
      >
        {{ r }}
      </button>
    </div>
  </Block>

  <!-- 字体缩放 -->
  <Block v-if="configs.fontSize.visible" :title="locale.theme.fontSize">
    <SliderItem
      v-model="fontScalePercent"
      :label="locale.theme.fontSize"
      :min="FONT_SCALE_CONFIG.min * 100"
      :max="FONT_SCALE_CONFIG.max * 100"
      :step="FONT_SCALE_CONFIG.step * 100"
      unit="%"
      :disabled="configs.fontSize.disabled"
    />
  </Block>

  <!-- 颜色模式 -->
  <Block v-if="configs.colorMode.visible" :title="locale.theme.colorMode">
    <SwitchItem 
      v-if="configs.colorFollowPrimaryLight.visible"
      v-model="colorFollowPrimaryLight" 
      :label="locale.theme.colorFollowPrimaryLight" 
      :disabled="configs.colorFollowPrimaryLight.disabled"
    />
    <SwitchItem 
      v-if="configs.colorFollowPrimaryDark.visible"
      v-model="colorFollowPrimaryDark" 
      :label="locale.theme.colorFollowPrimaryDark" 
      :disabled="configs.colorFollowPrimaryDark.disabled"
    />
    <SwitchItem 
      v-if="!isDark && configs.semiDarkSidebar.visible" 
      v-model="semiDarkSidebar" 
      :label="locale.theme.semiDarkSidebar" 
      :icon="semiDarkSidebarIcon" 
      :disabled="configs.semiDarkSidebar.disabled"
    />
    <SwitchItem 
      v-if="!isDark && configs.semiDarkHeader.visible" 
      v-model="semiDarkHeader" 
      :label="locale.theme.semiDarkHeader" 
      :icon="semiDarkHeaderIcon" 
      :disabled="configs.semiDarkHeader.disabled"
    />
    <SwitchItem 
      v-if="configs.colorGrayMode.visible"
      v-model="colorGrayMode" 
      :label="locale.theme.colorGrayMode" 
      :disabled="configs.colorGrayMode.disabled"
    />
    <SwitchItem 
      v-if="configs.colorWeakMode.visible"
      v-model="colorWeakMode" 
      :label="locale.theme.colorWeakMode" 
      :disabled="configs.colorWeakMode.disabled"
    />
  </Block>

</template>
