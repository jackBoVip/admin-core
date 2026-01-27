<script setup lang="ts">
/**
 * 外观设置标签页
 * @description 主题模式、内置主题、圆角、字体缩放等设置
 */
import { computed, ref } from 'vue';
import { usePreferences, useTheme } from '../../composables';
import {
  BUILT_IN_THEME_PRESETS,
  RADIUS_OPTIONS,
  FONT_SCALE_CONFIG,
  formatScaleToPercent,
  colorsTokens,
  DEFAULT_PREFERENCES,
  getIcon,
  oklchToHex,
  type BuiltinThemeType,
  type ThemeModeType,
  type LocaleMessages,
} from '@admin-core/preferences';
import Block from './Block.vue';
import SwitchItem from './SwitchItem.vue';
import SliderItem from './SliderItem.vue';

const props = defineProps<{
  /** 当前语言包 */
  locale: LocaleMessages;
}>();

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

const radius = computed({
  get: () => preferences.value?.theme.radius ?? D.theme.radius,
  set: (value: string) => setPreferences({ theme: { radius: value } }),
});

const fontScale = computed({
  get: () => preferences.value?.theme.fontScale ?? D.theme.fontScale,
  set: (value: number) => setPreferences({ theme: { fontScale: value } }),
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
  <Block :title="locale.theme.mode">
    <div class="theme-mode-grid">
      <div class="theme-mode-item" @click="themeMode = 'light'">
        <div
          class="outline-box flex-center theme-mode-box"
          :class="{ 'outline-box-active': themeMode === 'light' }"
        >
          <span v-html="sunIcon" class="theme-mode-icon" />
        </div>
        <span class="theme-mode-label">{{ locale.theme.modeLight }}</span>
      </div>
      <div class="theme-mode-item" @click="themeMode = 'dark'">
        <div
          class="outline-box flex-center theme-mode-box"
          :class="{ 'outline-box-active': themeMode === 'dark' }"
        >
          <span v-html="moonIcon" class="theme-mode-icon" />
        </div>
        <span class="theme-mode-label">{{ locale.theme.modeDark }}</span>
      </div>
      <div class="theme-mode-item" @click="themeMode = 'auto'">
        <div
          class="outline-box flex-center theme-mode-box"
          :class="{ 'outline-box-active': themeMode === 'auto' }"
        >
          <span v-html="monitorIcon" class="theme-mode-icon" />
        </div>
        <span class="theme-mode-label">{{ locale.theme.modeAuto }}</span>
      </div>
    </div>
  </Block>

  <!-- 内置主题 -->
  <Block :title="locale.theme.builtinTheme">
    <div class="theme-presets-grid">
      <div
        v-for="preset in BUILT_IN_THEME_PRESETS.filter(p => p.type !== 'custom')"
        :key="preset.type"
        class="theme-preset-item"
        @click="builtinType = preset.type"
      >
        <div
          class="outline-box flex-center theme-preset-box"
          :class="{ 'outline-box-active': builtinType === preset.type }"
        >
          <div
            class="theme-preset-color"
            :style="{ backgroundColor: preset.color || colorsTokens.presetFallback }"
          />
        </div>
        <span class="theme-preset-label">{{ getThemePresetName(preset.nameKey) || preset.type }}</span>
      </div>
      <!-- 自定义颜色 -->
      <div class="theme-preset-item" @click="builtinType = 'custom'">
        <div
          class="outline-box flex-center theme-preset-box"
          :class="{ 'outline-box-active': builtinType === 'custom' }"
        >
          <div class="theme-preset-custom" @click.stop="openColorPicker">
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
  <Block :title="locale.theme.radius">
    <div class="radius-options">
      <button
        v-for="r in RADIUS_OPTIONS"
        :key="r"
        class="radius-option"
        :class="{ active: radius === r }"
        @click="radius = r"
      >
        {{ r }}
      </button>
    </div>
  </Block>

  <!-- 字体缩放 -->
  <Block :title="locale.theme.fontSize">
    <SliderItem
      v-model="fontScale"
      :min="FONT_SCALE_CONFIG.min"
      :max="FONT_SCALE_CONFIG.max"
      :step="FONT_SCALE_CONFIG.step"
      :format-value="formatScaleToPercent"
    />
  </Block>

  <!-- 颜色模式 -->
  <Block :title="locale.theme.colorMode">
    <SwitchItem v-model="colorFollowPrimaryLight" :label="locale.theme.colorFollowPrimaryLight" />
    <SwitchItem v-model="colorFollowPrimaryDark" :label="locale.theme.colorFollowPrimaryDark" />
    <SwitchItem v-if="!isDark" v-model="semiDarkSidebar" :label="locale.theme.semiDarkSidebar" :icon="semiDarkSidebarIcon" />
    <SwitchItem v-if="!isDark" v-model="semiDarkHeader" :label="locale.theme.semiDarkHeader" :icon="semiDarkHeaderIcon" />
    <SwitchItem v-model="colorGrayMode" :label="locale.theme.colorGrayMode" />
    <SwitchItem v-model="colorWeakMode" :label="locale.theme.colorWeakMode" />
  </Block>

</template>
