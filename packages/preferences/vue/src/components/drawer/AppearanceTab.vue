<script setup lang="ts">
/**
 * 外观设置标签页组件模块。
 * @description 提供主题模式、主题预设、圆角、字体缩放与颜色策略等外观配置能力。
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

/**
 * 外观标签页入参
 * @description 提供本地化文案与功能项 UI 配置。
 */
export interface AppearanceTabProps {
  /** 当前语言包。 */
  locale: LocaleMessages;
  /** 界面配置（控制功能项显示/禁用）。 */
  uiConfig?: AppearanceTabConfig;
}

const props = defineProps<AppearanceTabProps>();

/**
 * UI 配置解析区。
 * @description 按分组读取外观功能项可见性与禁用状态，并通过 computed 缓存。
 */
/**
 * 获取外观标签页功能配置
 * @description 统一解析分组与子项配置，返回可见/禁用状态。
 * @param blockKey 配置分组键。
 * @param itemKey 分组内功能项键。
 * @returns 解析后的功能配置。
 */
const getConfig = (blockKey: keyof AppearanceTabConfig, itemKey?: string): ResolvedFeatureConfig =>
  getFeatureItemConfig(props.uiConfig, blockKey, itemKey);

/**
 * 外观标签页功能配置快照。
 * @description 汇总各分组功能项的可见与禁用状态。
 */
const configs = computed(() => ({
  themeMode: getConfig('themeMode'),
  builtinTheme: getConfig('builtinTheme'),
  radius: getConfig('radius'),
  fontSize: getConfig('fontSize'),
  colorMode: getConfig('colorMode'),
  colorFollowPrimaryLight: getConfig('colorMode', 'colorFollowPrimaryLight'),
  colorFollowPrimaryDark: getConfig('colorMode', 'colorFollowPrimaryDark'),
  semiDarkSidebar: getConfig('colorMode', 'semiDarkSidebar'),
  semiDarkHeader: getConfig('colorMode', 'semiDarkHeader'),
  colorGrayMode: getConfig('colorMode', 'colorGrayMode'),
  colorWeakMode: getConfig('colorMode', 'colorWeakMode'),
}));

/**
 * 获取主题预设的本地化名称
 * @description 根据预设名称键从当前语言包中读取显示文案。
 * @param nameKey 主题预设名称键。
 * @returns 对应语言文案，未命中时返回 `undefined`。
 */
function getThemePresetName(nameKey: string): string | undefined {
  const themeLocale = props.locale.theme as Record<string, string | undefined>;
  return themeLocale[nameKey];
}

/**
 * 偏好状态与更新方法
 * @description 用于读取当前主题配置并写回用户调整结果。
 */
const { preferences, setPreferences } = usePreferences();
/**
 * 深色模式标记
 * @description 指示当前实际主题模式是否为深色，用于条件展示配置项。
 */
const { isDark } = useTheme();

/**
 * 默认偏好常量引用
 * @description 作为各类主题字段的兜底初始值来源。
 */
const D = DEFAULT_PREFERENCES;

/**
 * 主题模式绑定
 * @description 在浅色、深色与跟随系统之间切换。
 */
const themeMode = computed({
  get: () => preferences.value?.theme.mode ?? D.theme.mode,
  set: (value: ThemeModeType) => setPreferences({ theme: { mode: value } }),
});

/**
 * 内置主题类型绑定
 * @description 选择预设主题类型，`custom` 表示自定义主色方案。
 */
const builtinType = computed({
  get: () => preferences.value?.theme.builtinType ?? D.theme.builtinType,
  set: (value: BuiltinThemeType) => setPreferences({ theme: { builtinType: value } }),
});

/**
 * 主色绑定值
 * @description 更新主色时自动切换到 `custom` 内置主题类型。
 */
const colorPrimary = computed({
  get: () => preferences.value?.theme.colorPrimary ?? D.theme.colorPrimary,
  set: (value: string) => setPreferences({ theme: { colorPrimary: value, builtinType: 'custom' } }),
});

/** 主色 HEX 视图值（供颜色输入控件展示）。 */
const colorPrimaryHex = computed(() => oklchToHex(colorPrimary.value));

/** 可展示的内置主题预设列表（排除 `custom`）。 */
const themePresets = computed(() => BUILT_IN_THEME_PRESETS.filter(p => p.type !== 'custom'));
/**
 * 主题预设分批渲染大小
 * @description 用于控制每帧追加渲染的预设数量，降低初次渲染压力。
 */
const PRESET_RENDER_CHUNK = 12;
/**
 * 当前已渲染预设数量
 * @description 配合 `watchEffect` 逐帧增长，实现平滑渲染。
 */
const presetRenderCount = ref(PRESET_RENDER_CHUNK);
/** 当前批次可见的主题预设列表。 */
const visibleThemePresets = computed(() =>
  themePresets.value.slice(0, presetRenderCount.value)
);

/**
 * 监听主题预设集合变化。
 * @description 当预设列表更新时重置首屏渲染数量，防止沿用旧列表长度。
 */
watch(themePresets, (list) => {
  presetRenderCount.value = Math.min(PRESET_RENDER_CHUNK, list.length);
}, { immediate: true });

/**
 * 逐帧追加主题预设渲染数量。
 * @description 通过 `requestAnimationFrame` 分批渲染预设项，降低大量选项时的首帧压力。
 */
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

/**
 * 圆角方案绑定
 * @description 在预设圆角级别之间切换，统一更新主题半径变量。
 */
const radius = computed({
  get: () => preferences.value?.theme.radius ?? D.theme.radius,
  set: (value: string) => setPreferences({ theme: { radius: value } }),
});

/**
 * 字体缩放百分比绑定
 * @description 存储层为小数倍率，展示层使用百分比表达（80-150）。
 */
const fontScalePercent = computed({
  get: () => Math.round((preferences.value?.theme.fontScale ?? D.theme.fontScale) * 100),
  set: (value: number) => setPreferences({ theme: { fontScale: value / 100 } }),
});

/**
 * 侧边栏半深色模式开关
 * @description 控制暗色主题下侧边栏是否使用半深色渲染。
 */
const semiDarkSidebar = computed({
  get: () => preferences.value?.theme.semiDarkSidebar ?? D.theme.semiDarkSidebar,
  set: (value: boolean) => setPreferences({ theme: { semiDarkSidebar: value } }),
});

/**
 * 头部半深色模式开关
 * @description 控制暗色主题下顶部区域是否使用半深色渲染。
 */
const semiDarkHeader = computed({
  get: () => preferences.value?.theme.semiDarkHeader ?? D.theme.semiDarkHeader,
  set: (value: boolean) => setPreferences({ theme: { semiDarkHeader: value } }),
});

/**
 * 浅色主题跟随主色开关
 * @description 开启后浅色主题语义色会基于主色动态调整。
 */
const colorFollowPrimaryLight = computed({
  get: () => preferences.value?.app.colorFollowPrimaryLight ?? D.app.colorFollowPrimaryLight,
  set: (value: boolean) => setPreferences({ app: { colorFollowPrimaryLight: value } }),
});

/**
 * 深色主题跟随主色开关
 * @description 开启后深色主题语义色会基于主色动态调整。
 */
const colorFollowPrimaryDark = computed({
  get: () => preferences.value?.app.colorFollowPrimaryDark ?? D.app.colorFollowPrimaryDark,
  set: (value: boolean) => setPreferences({ app: { colorFollowPrimaryDark: value } }),
});

/**
 * 灰阶模式开关
 * @description 开启后应用整体色彩转为灰阶展示。
 */
const colorGrayMode = computed({
  get: () => preferences.value?.app.colorGrayMode ?? D.app.colorGrayMode,
  set: (value: boolean) => setPreferences({ app: { colorGrayMode: value } }),
});

/**
 * 色弱友好模式开关
 * @description 开启后启用色弱可读性更高的色彩策略。
 */
const colorWeakMode = computed({
  get: () => preferences.value?.app.colorWeakMode ?? D.app.colorWeakMode,
  set: (value: boolean) => setPreferences({ app: { colorWeakMode: value } }),
});

/**
 * 浅色模式图标
 * @description 用于主题模式切换项中的浅色选项展示。
 */
const sunIcon = getIcon('sun');
/**
 * 深色模式图标
 * @description 用于主题模式切换项中的深色选项展示。
 */
const moonIcon = getIcon('moon');
/**
 * 自动模式图标
 * @description 用于“跟随系统”主题模式展示。
 */
const monitorIcon = getIcon('monitor');
/**
 * 侧边栏半深色图标
 * @description 颜色模式中侧边栏半深色开关的辅助图标。
 */
const semiDarkSidebarIcon = getIcon('semiDarkSidebar');
/**
 * 顶栏半深色图标
 * @description 颜色模式中顶栏半深色开关的辅助图标。
 */
const semiDarkHeaderIcon = getIcon('semiDarkHeader');
/**
 * 自定义主题图标
 * @description 在自定义主色入口中展示“编辑”含义。
 */
const pencilIcon = getIcon('pencil');

/**
 * 颜色输入控件引用
 * @description 指向隐藏的 `input[type=color]`，用于程序化唤起系统取色器。
 */
const colorInputRef = ref<HTMLInputElement | null>(null);

/**
 * 打开原生颜色选择器
 * @description 通过触发隐藏 `input[type=color]` 的点击事件唤起系统拾色面板。
 */
const openColorPicker = () => {
  colorInputRef.value?.click();
};
</script>

<template>
  <!-- 主题模式 -->
  <Block v-if="configs.themeMode.visible" :title="locale.theme.mode">
    <div class="theme-mode-grid" role="radiogroup" :aria-label="locale.theme.mode">
      <div 
        class="theme-mode-item pref-disabled data-active:text-foreground data-active:font-semibold aria-checked:text-foreground" 
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
        class="theme-mode-item pref-disabled data-active:text-foreground data-active:font-semibold aria-checked:text-foreground" 
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
        class="theme-mode-item pref-disabled data-active:text-foreground data-active:font-semibold aria-checked:text-foreground" 
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
        class="theme-preset-item pref-disabled data-active:text-foreground data-active:font-semibold aria-checked:text-foreground"
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
        class="theme-preset-item pref-disabled data-active:text-foreground data-active:font-semibold aria-checked:text-foreground"
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
              <span v-html="pencilIcon" class="theme-preset-custom-icon" />
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
      class="radius-options pref-disabled"
      :class="{ disabled: configs.radius.disabled }"
      :data-disabled="configs.radius.disabled ? 'true' : undefined"
    >
      <button
        v-for="r in RADIUS_OPTIONS"
        :key="r"
        class="radius-option data-active:text-foreground data-active:font-semibold"
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
