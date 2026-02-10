<script setup lang="ts">
/**
 * 通用设置标签页
 * @description 语言、动画、小部件等通用设置
 */
import { computed, ref, onUnmounted, watch, watchEffect } from 'vue';
import { usePreferences, getPreferencesManager } from '../../composables';
import {
  PAGE_TRANSITION_OPTIONS,
  DEFAULT_PREFERENCES,
  supportedLocales,
  translateOptions,
  getFeatureItemConfig,
  logger,
  type LocaleMessages,
  type SupportedLanguagesType,
  type PageTransitionType,
  type GeneralTabConfig,
  type ResolvedFeatureConfig,
} from '@admin-core/preferences';
import Block from './Block.vue';
import SwitchItem from './SwitchItem.vue';
import SelectItem from './SelectItem.vue';
import SliderItem from './SliderItem.vue';
import InputItem from './InputItem.vue';
import TransitionPreview from './TransitionPreview.vue';

// 清空密码按钮状态（使用 ref 存储定时器，避免多实例冲突）
const isClearing = ref(false);
const clearingTimerRef = ref<ReturnType<typeof setTimeout> | null>(null);

// 清理定时器
onUnmounted(() => {
  if (clearingTimerRef.value) {
    clearTimeout(clearingTimerRef.value);
    clearingTimerRef.value = null;
  }
});

const props = defineProps<{
  /** 当前语言包 */
  locale: LocaleMessages;
  /** UI 配置 */
  uiConfig?: GeneralTabConfig;
}>();

// ========== UI 配置解析（使用 computed 缓存） ==========
// 配置获取辅助函数（响应式）
const getConfig = (blockKey: keyof GeneralTabConfig, itemKey?: string): ResolvedFeatureConfig =>
  getFeatureItemConfig(props.uiConfig, blockKey, itemKey);

// 缓存常用配置项（避免模板中重复计算）
const configs = computed(() => ({
  // 基础设置
  language: getConfig('language'),
  dynamicTitle: getConfig('dynamicTitle'),
  // 版权设置
  copyright: getConfig('copyright'),
  copyrightEnable: getConfig('copyright', 'enable'),
  copyrightCompanyName: getConfig('copyright', 'companyName'),
  copyrightCompanySiteLink: getConfig('copyright', 'companySiteLink'),
  copyrightDate: getConfig('copyright', 'date'),
  copyrightIcp: getConfig('copyright', 'icp'),
  copyrightIcpLink: getConfig('copyright', 'icpLink'),
  // 锁屏设置
  lockScreen: getConfig('lockScreen'),
  lockScreenEnable: getConfig('lockScreen', 'enable'),
  lockScreenAutoLockTime: getConfig('lockScreen', 'autoLockTime'),
  lockScreenClearPassword: getConfig('lockScreen', 'clearPassword'),
  // 水印设置
  watermark: getConfig('watermark'),
  watermarkEnable: getConfig('watermark', 'enable'),
  watermarkAppendDate: getConfig('watermark', 'appendDate'),
  watermarkContent: getConfig('watermark', 'content'),
  watermarkAngle: getConfig('watermark', 'angle'),
  watermarkFontSize: getConfig('watermark', 'fontSize'),
  // 动画设置
  transition: getConfig('transition'),
  transitionEnable: getConfig('transition', 'enable'),
  transitionProgress: getConfig('transition', 'progress'),
  transitionName: getConfig('transition', 'name'),
}));

const { preferences, setPreferences } = usePreferences();

// 默认值简写
const D = DEFAULT_PREFERENCES;

// 翻译后的选项
const animationOptions = computed(() =>
  translateOptions(PAGE_TRANSITION_OPTIONS, props.locale)
);
const TRANSITION_RENDER_CHUNK = 12;
const transitionRenderCount = ref(TRANSITION_RENDER_CHUNK);
const visibleAnimationOptions = computed(() =>
  animationOptions.value.slice(0, transitionRenderCount.value)
);

watch(animationOptions, (list) => {
  transitionRenderCount.value = Math.min(TRANSITION_RENDER_CHUNK, list.length);
}, { immediate: true });

watchEffect((onCleanup) => {
  if (transitionRenderCount.value >= animationOptions.value.length) return;
  const frame = requestAnimationFrame(() => {
    transitionRenderCount.value = Math.min(
      transitionRenderCount.value + TRANSITION_RENDER_CHUNK,
      animationOptions.value.length
    );
  });
  onCleanup(() => cancelAnimationFrame(frame));
});

// 语言选项
const languageOptions = supportedLocales.map(l => ({
  label: l.label,
  value: l.value,
}));

// 自动锁屏时间选项（memoized）
const autoLockTimeOptions = computed(() => [
  { label: props.locale.common.disable, value: 0 },
  { label: `1 ${props.locale.lockScreen.minute}`, value: 1 },
  { label: `5 ${props.locale.lockScreen.minute}`, value: 5 },
  { label: `15 ${props.locale.lockScreen.minute}`, value: 15 },
  { label: `30 ${props.locale.lockScreen.minute}`, value: 30 },
  { label: `60 ${props.locale.lockScreen.minute}`, value: 60 },
]);

// ========== 通用设置 ==========
const appLocale = computed({
  get: () => preferences.value?.app.locale ?? D.app.locale,
  set: (value: SupportedLanguagesType) => setPreferences({ app: { locale: value } }),
});

const dynamicTitle = computed({
  get: () => preferences.value?.app.dynamicTitle ?? D.app.dynamicTitle,
  set: (value: boolean) => setPreferences({ app: { dynamicTitle: value } }),
});

const footerEnable = computed(() => preferences.value?.footer.enable ?? D.footer.enable);

const copyrightSettingShow = computed(
  () => preferences.value?.copyright.settingShow ?? D.copyright.settingShow
);

const copyrightEnable = computed({
  get: () => preferences.value?.copyright.enable ?? D.copyright.enable,
  set: (value: boolean) => setPreferences({ copyright: { enable: value } }),
});

const copyrightCompanyName = computed({
  get: () => preferences.value?.copyright.companyName ?? D.copyright.companyName,
  set: (value: string) => setPreferences({ copyright: { companyName: value } }),
});

const copyrightCompanySiteLink = computed({
  get: () => preferences.value?.copyright.companySiteLink ?? D.copyright.companySiteLink,
  set: (value: string) => setPreferences({ copyright: { companySiteLink: value } }),
});

const copyrightDate = computed({
  get: () => preferences.value?.copyright.date ?? D.copyright.date,
  set: (value: string) => setPreferences({ copyright: { date: value } }),
});

const copyrightIcp = computed({
  get: () => preferences.value?.copyright.icp ?? D.copyright.icp,
  set: (value: string) => setPreferences({ copyright: { icp: value } }),
});

const copyrightIcpLink = computed({
  get: () => preferences.value?.copyright.icpLink ?? D.copyright.icpLink,
  set: (value: string) => setPreferences({ copyright: { icpLink: value } }),
});

const watermark = computed({
  get: () => preferences.value?.app.watermark ?? D.app.watermark,
  set: (value: boolean) => setPreferences({ app: { watermark: value } }),
});

const watermarkContent = computed({
  get: () => preferences.value?.app.watermarkContent ?? D.app.watermarkContent,
  set: (value: string) => setPreferences({ app: { watermarkContent: value } }),
});

const watermarkAngle = computed({
  get: () => preferences.value?.app.watermarkAngle ?? D.app.watermarkAngle,
  set: (value: number) => setPreferences({ app: { watermarkAngle: value } }),
});

const watermarkAppendDate = computed({
  get: () => preferences.value?.app.watermarkAppendDate ?? D.app.watermarkAppendDate,
  set: (value: boolean) => setPreferences({ app: { watermarkAppendDate: value } }),
});

const watermarkFontSize = computed({
  get: () => preferences.value?.app.watermarkFontSize ?? D.app.watermarkFontSize,
  set: (value: number) => setPreferences({ app: { watermarkFontSize: value } }),
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
  get: () => (preferences.value?.transition.name ?? D.transition.name) as PageTransitionType,
  set: (value: PageTransitionType) => setPreferences({ transition: { name: value } }),
});

// 锁屏设置
const widgetLockScreen = computed({
  get: () => preferences.value?.widget.lockScreen ?? D.widget.lockScreen,
  set: (value: boolean) => setPreferences({ widget: { lockScreen: value } }),
});

const autoLockTime = computed({
  get: () => preferences.value?.lockScreen.autoLockTime ?? D.lockScreen.autoLockTime,
  set: (value: number) => setPreferences({ lockScreen: { autoLockTime: value } }),
});

const hasPassword = computed(() => !!preferences.value?.lockScreen.password);
const copyrightItemDisabled = computed(() => !footerEnable.value || !copyrightEnable.value);

// 清空密码（带错误处理）
const clearPassword = () => {
  if (isClearing.value) return;
  
  try {
    setPreferences({ lockScreen: { password: '' } });
    // 立即保存到存储，确保密码被清除
    try {
      getPreferencesManager()?.flush?.();
    } catch {}
    
    isClearing.value = true;
    
    // 清除之前的定时器
    if (clearingTimerRef.value) {
      clearTimeout(clearingTimerRef.value);
    }
    
    clearingTimerRef.value = setTimeout(() => {
      isClearing.value = false;
      clearingTimerRef.value = null;
    }, 2000);
  } catch (error) {
    logger.error('[GeneralTab] Failed to clear password:', error);
  }
};

const handleTransitionOptionActivate = (e: Event) => {
  if (!transitionEnable.value || configs.value.transitionName.disabled) return;
  const value = (e.currentTarget as HTMLElement).dataset.value as PageTransitionType | undefined;
  if (value) {
    transitionName.value = value;
  }
};
</script>

<template>
  <!-- 基础设置 -->
  <Block v-if="configs.language.visible" :title="locale.general.title">
    <SelectItem 
      v-model="appLocale" 
      :label="locale.general.language" 
      :options="languageOptions" 
      :disabled="configs.language.disabled"
    />
    <SwitchItem 
      v-if="configs.dynamicTitle.visible"
      v-model="dynamicTitle" 
      :label="locale.general.dynamicTitle" 
      :disabled="configs.dynamicTitle.disabled"
    />
  </Block>

  <!-- 锁屏设置 -->
  <Block v-if="configs.lockScreen.visible" :title="locale.lockScreen.title">
    <SwitchItem 
      v-if="configs.lockScreenEnable.visible"
      v-model="widgetLockScreen" 
      :label="locale.widget.lockScreen" 
      :disabled="configs.lockScreenEnable.disabled"
    />
    <SelectItem
      v-if="configs.lockScreenAutoLockTime.visible"
      v-model="autoLockTime"
      :label="locale.lockScreen.autoLockTime"
      :options="autoLockTimeOptions"
      :disabled="!widgetLockScreen || configs.lockScreenAutoLockTime.disabled"
    />
    <div 
      v-if="configs.lockScreenClearPassword.visible && (hasPassword || isClearing)" 
      class="select-item"
    >
      <span class="select-item-label">{{ locale.lockScreen.clearPassword }}</span>
      <div class="select-item-control">
        <button 
          class="preferences-btn preferences-btn-primary pref-disabled pref-disabled-trigger" 
          :disabled="isClearing || configs.lockScreenClearPassword.disabled"
          :aria-disabled="(isClearing || configs.lockScreenClearPassword.disabled) || undefined"
          :data-disabled="(isClearing || configs.lockScreenClearPassword.disabled) ? 'true' : undefined"
          @click="clearPassword"
        >
          {{ isClearing ? locale.lockScreen.cleared : locale.common.clear }}
        </button>
      </div>
    </div>
  </Block>

  <!-- 水印设置 -->
  <Block v-if="configs.watermark.visible" :title="locale.general.watermark">
    <SwitchItem 
      v-if="configs.watermarkEnable.visible"
      v-model="watermark" 
      :label="locale.general.watermarkEnable" 
      :disabled="configs.watermarkEnable.disabled"
    />
    <template v-if="watermark">
      <SwitchItem 
        v-if="configs.watermarkAppendDate.visible"
        v-model="watermarkAppendDate" 
        :label="locale.general.watermarkAppendDate" 
        :disabled="configs.watermarkAppendDate.disabled"
      />
      <InputItem 
        v-if="configs.watermarkContent.visible"
        v-model="watermarkContent" 
        :label="locale.general.watermarkContent" 
        :placeholder="locale.general.watermarkContentPlaceholder"
        :disabled="configs.watermarkContent.disabled"
      />
      <SliderItem 
        v-if="configs.watermarkAngle.visible"
        v-model="watermarkAngle" 
        :label="locale.general.watermarkAngle" 
        :min="-90" 
        :max="90" 
        :step="1"
        unit="°"
        :disabled="configs.watermarkAngle.disabled"
      />
      <SliderItem 
        v-if="configs.watermarkFontSize.visible"
        v-model="watermarkFontSize" 
        :label="locale.general.watermarkFontSize" 
        :min="10" 
        :max="32" 
        :step="1"
        unit="px"
        :disabled="configs.watermarkFontSize.disabled"
      />
    </template>
  </Block>

  <!-- 版权设置 -->
  <Block
    v-if="configs.copyright.visible && copyrightSettingShow"
    :title="locale.copyright.title"
  >
    <SwitchItem
      v-if="configs.copyrightEnable.visible"
      v-model="copyrightEnable"
      :label="locale.copyright.enable"
      :disabled="!footerEnable || configs.copyrightEnable.disabled"
    />
      <InputItem
        v-if="configs.copyrightCompanyName.visible"
        v-model="copyrightCompanyName"
        :label="locale.copyright.companyName"
        inline
        :disabled="copyrightItemDisabled || configs.copyrightCompanyName.disabled"
      />
      <InputItem
        v-if="configs.copyrightCompanySiteLink.visible"
        v-model="copyrightCompanySiteLink"
        :label="locale.copyright.companySiteLink"
        inline
        :disabled="copyrightItemDisabled || configs.copyrightCompanySiteLink.disabled"
      />
      <InputItem
        v-if="configs.copyrightDate.visible"
        v-model="copyrightDate"
        :label="locale.copyright.date"
        inline
        :disabled="copyrightItemDisabled || configs.copyrightDate.disabled"
      />
      <InputItem
        v-if="configs.copyrightIcp.visible"
        v-model="copyrightIcp"
        :label="locale.copyright.icp"
        inline
        :disabled="copyrightItemDisabled || configs.copyrightIcp.disabled"
      />
      <InputItem
        v-if="configs.copyrightIcpLink.visible"
        v-model="copyrightIcpLink"
        :label="locale.copyright.icpLink"
        inline
        :disabled="copyrightItemDisabled || configs.copyrightIcpLink.disabled"
      />
  </Block>

  <!-- 动画设置 -->
  <Block v-if="configs.transition.visible" :title="locale.transition.title">
    <SwitchItem 
      v-if="configs.transitionEnable.visible"
      v-model="transitionEnable" 
      :label="locale.transition.enable" 
      :disabled="configs.transitionEnable.disabled"
    />
    <SwitchItem 
      v-if="configs.transitionProgress.visible"
      v-model="transitionProgress" 
      :label="locale.transition.progress" 
      :disabled="configs.transitionProgress.disabled"
    />
    <div 
      v-if="configs.transitionName.visible"
      class="transition-presets-grid" 
      role="radiogroup" 
      :aria-label="locale.transition.name"
    >
      <div
        v-for="opt in visibleAnimationOptions"
        :key="opt.value"
        class="transition-preset-item pref-disabled data-active:text-foreground data-active:font-semibold aria-checked:text-foreground"
        role="radio"
        :tabindex="(!transitionEnable || configs.transitionName.disabled) ? -1 : 0"
        :aria-checked="transitionName === opt.value"
        :aria-label="opt.label"
        :aria-disabled="!transitionEnable || configs.transitionName.disabled"
        :data-state="transitionName === opt.value ? 'active' : 'inactive'"
        :data-disabled="(!transitionEnable || configs.transitionName.disabled) ? 'true' : undefined"
        :data-value="opt.value"
        @click="handleTransitionOptionActivate"
        @keydown.enter.space.prevent="handleTransitionOptionActivate"
      >
        <div
          class="outline-box flex-center transition-preset-box pref-disabled"
          :class="{ 
            'outline-box-active': transitionName === opt.value, 
            'disabled': !transitionEnable || configs.transitionName.disabled 
          }"
          :data-disabled="(!transitionEnable || configs.transitionName.disabled) ? 'true' : undefined"
          :data-state="transitionName === opt.value ? 'active' : 'inactive'"
        >
          <TransitionPreview 
            :transition="opt.value as PageTransitionType" 
            :enabled="transitionEnable" 
            :active="transitionName === opt.value"
            :compact="true" 
          />
        </div>
        <span class="transition-preset-label">{{ opt.label }}</span>
      </div>
    </div>
  </Block>
</template>
