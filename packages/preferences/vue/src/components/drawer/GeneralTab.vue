<script setup lang="ts">
/**
 * 通用设置标签页
 * @description 语言、动画、小部件等通用设置
 */
import { computed } from 'vue';
import { usePreferences } from '../../composables';
import {
  PAGE_TRANSITION_OPTIONS,
  DEFAULT_PREFERENCES,
  supportedLocales,
  translateOptions,
  type LocaleMessages,
  type SupportedLanguagesType,
} from '@admin-core/preferences';
import Block from './Block.vue';
import SwitchItem from './SwitchItem.vue';
import SelectItem from './SelectItem.vue';

const props = defineProps<{
  /** 当前语言包 */
  locale: LocaleMessages;
}>();

const { preferences, setPreferences } = usePreferences();

// 默认值简写
const D = DEFAULT_PREFERENCES;

// 翻译后的选项
const animationOptions = computed(() =>
  translateOptions(PAGE_TRANSITION_OPTIONS, props.locale)
);

// 语言选项
const languageOptions = supportedLocales.map(l => ({
  label: l.label,
  value: l.value,
}));

// ========== 通用设置 ==========
const appLocale = computed({
  get: () => preferences.value?.app.locale ?? D.app.locale,
  set: (value: SupportedLanguagesType) => setPreferences({ app: { locale: value } }),
});

const dynamicTitle = computed({
  get: () => preferences.value?.app.dynamicTitle ?? D.app.dynamicTitle,
  set: (value: boolean) => setPreferences({ app: { dynamicTitle: value } }),
});

const watermark = computed({
  get: () => preferences.value?.app.watermark ?? D.app.watermark,
  set: (value: boolean) => setPreferences({ app: { watermark: value } }),
});

const colorWeakMode = computed({
  get: () => preferences.value?.app.colorWeakMode ?? D.app.colorWeakMode,
  set: (value: boolean) => setPreferences({ app: { colorWeakMode: value } }),
});

const colorGrayMode = computed({
  get: () => preferences.value?.app.colorGrayMode ?? D.app.colorGrayMode,
  set: (value: boolean) => setPreferences({ app: { colorGrayMode: value } }),
});

// 动画设置
const transitionEnable = computed({
  get: () => preferences.value?.transition.enable ?? D.transition.enable,
  set: (value: boolean) => setPreferences({ transition: { enable: value } }),
});

const transitionProgress = computed({
  get: () => preferences.value?.transition.progress ?? D.transition.progress,
  set: (value: boolean) => setPreferences({ transition: { progress: value } }),
});

const transitionName = computed({
  get: () => preferences.value?.transition.name ?? D.transition.name,
  set: (value: string) => setPreferences({ transition: { name: value } }),
});

// 小部件设置
const widgetFullscreen = computed({
  get: () => preferences.value?.widget.fullscreen ?? D.widget.fullscreen,
  set: (value: boolean) => setPreferences({ widget: { fullscreen: value } }),
});

const widgetThemeToggle = computed({
  get: () => preferences.value?.widget.themeToggle ?? D.widget.themeToggle,
  set: (value: boolean) => setPreferences({ widget: { themeToggle: value } }),
});

const widgetLanguageToggle = computed({
  get: () => preferences.value?.widget.languageToggle ?? D.widget.languageToggle,
  set: (value: boolean) => setPreferences({ widget: { languageToggle: value } }),
});
</script>

<template>
  <!-- 基础设置 -->
  <Block :title="locale.general.title">
    <SelectItem v-model="appLocale" :label="locale.general.language" :options="languageOptions" />
    <SwitchItem v-model="dynamicTitle" :label="locale.general.dynamicTitle" />
    <SwitchItem v-model="watermark" :label="locale.general.watermark" />
    <SwitchItem v-model="colorWeakMode" :label="locale.general.colorWeakMode" />
    <SwitchItem v-model="colorGrayMode" :label="locale.general.colorGrayMode" />
  </Block>

  <!-- 动画设置 -->
  <Block :title="locale.transition.title">
    <SwitchItem v-model="transitionEnable" :label="locale.transition.enable" />
    <SwitchItem v-model="transitionProgress" :label="locale.transition.progress" />
    <SelectItem v-model="transitionName" :label="locale.transition.name" :options="animationOptions" />
  </Block>

  <!-- 小部件 -->
  <Block :title="locale.widget.title">
    <SwitchItem v-model="widgetFullscreen" :label="locale.widget.fullscreen" />
    <SwitchItem v-model="widgetThemeToggle" :label="locale.widget.themeToggle" />
    <SwitchItem v-model="widgetLanguageToggle" :label="locale.widget.languageToggle" />
  </Block>
</template>
