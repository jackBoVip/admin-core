<script setup lang="ts">
/**
 * 通用设置标签页组件模块。
 * @description 提供语言、动态标题、锁屏、水印、版权与页面过渡动画等通用能力配置。
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

/**
 * 清空密码进行中状态
 * @description 控制“清空密码”按钮的短暂反馈态，防止重复触发。
 */
const isClearing = ref(false);
/**
 * 清空密码反馈定时器引用
 * @description 缓存定时器句柄，便于组件卸载时统一清理。
 */
const clearingTimerRef = ref<ReturnType<typeof setTimeout> | null>(null);

/**
 * 组件卸载清理。
 * @description 清理“清空密码”反馈定时器，防止卸载后仍触发状态更新。
 */
onUnmounted(() => {
  if (clearingTimerRef.value) {
    clearTimeout(clearingTimerRef.value);
    clearingTimerRef.value = null;
  }
});

/**
 * 通用标签页入参
 * @description 提供当前语言包及通用功能项 UI 配置。
 */
export interface GeneralTabProps {
  /** 当前语言包。 */
  locale: LocaleMessages;
  /** 界面配置（控制功能项显示/禁用）。 */
  uiConfig?: GeneralTabConfig;
}

/**
 * 通用下拉选项结构。
 */
interface GeneralSelectOption {
  /** 展示标签。 */
  label: string;
  /** 选项值。 */
  value: string;
}

/**
 * 自动锁屏时长选项结构。
 */
interface AutoLockTimeOption {
  /** 展示标签。 */
  label: string;
  /** 自动锁屏时长（分钟）。 */
  value: number;
}

const props = defineProps<GeneralTabProps>();

/**
 * UI 配置解析区。
 * @description 通过响应式函数统一获取各分组/子项的可见与禁用状态。
 */
/**
 * 获取通用标签页功能配置
 * @description 统一读取分组及子项配置，输出带默认值的可见/禁用状态。
 * @param blockKey 配置分组键。
 * @param itemKey 分组内功能项键。
 * @returns 解析后的功能配置。
 */
const getConfig = (blockKey: keyof GeneralTabConfig, itemKey?: string): ResolvedFeatureConfig =>
  getFeatureItemConfig(props.uiConfig, blockKey, itemKey);

/**
 * 通用标签页功能配置快照。
 * @description 汇总各分组功能项的可见与禁用状态。
 */
const configs = computed(() => ({
  language: getConfig('language'),
  dynamicTitle: getConfig('dynamicTitle'),
  copyright: getConfig('copyright'),
  copyrightEnable: getConfig('copyright', 'enable'),
  copyrightCompanyName: getConfig('copyright', 'companyName'),
  copyrightCompanySiteLink: getConfig('copyright', 'companySiteLink'),
  copyrightDate: getConfig('copyright', 'date'),
  copyrightIcp: getConfig('copyright', 'icp'),
  copyrightIcpLink: getConfig('copyright', 'icpLink'),
  lockScreen: getConfig('lockScreen'),
  lockScreenEnable: getConfig('lockScreen', 'enable'),
  lockScreenAutoLockTime: getConfig('lockScreen', 'autoLockTime'),
  lockScreenClearPassword: getConfig('lockScreen', 'clearPassword'),
  watermark: getConfig('watermark'),
  watermarkEnable: getConfig('watermark', 'enable'),
  watermarkAppendDate: getConfig('watermark', 'appendDate'),
  watermarkContent: getConfig('watermark', 'content'),
  watermarkAngle: getConfig('watermark', 'angle'),
  watermarkFontSize: getConfig('watermark', 'fontSize'),
  transition: getConfig('transition'),
  transitionEnable: getConfig('transition', 'enable'),
  transitionProgress: getConfig('transition', 'progress'),
  transitionName: getConfig('transition', 'name'),
}));

/**
 * 偏好状态与更新方法
 * @description 读取通用配置项当前值并写回用户操作结果。
 */
const { preferences, setPreferences } = usePreferences();

/**
 * 默认偏好常量引用
 * @description 为各项设置提供兜底默认值。
 */
const D = DEFAULT_PREFERENCES;

/** 翻译后的页面过渡动画选项。 */
const animationOptions = computed(() =>
  translateOptions(PAGE_TRANSITION_OPTIONS, props.locale)
);
/**
 * 动画选项分批渲染数量
 * @description 控制每轮追加渲染的动画预览项数量。
 */
const TRANSITION_RENDER_CHUNK = 12;
/**
 * 当前已渲染动画选项数量
 * @description 配合 `watchEffect` 逐帧增长，降低初次渲染开销。
 */
const transitionRenderCount = ref(TRANSITION_RENDER_CHUNK);
/** 当前批次可见的动画选项列表。 */
const visibleAnimationOptions = computed(() =>
  animationOptions.value.slice(0, transitionRenderCount.value)
);

/**
 * 监听动画选项列表变化。
 * @description 当可选动画集合变更时，重置首批渲染数量，避免沿用旧列表长度。
 */
watch(animationOptions, (list) => {
  transitionRenderCount.value = Math.min(TRANSITION_RENDER_CHUNK, list.length);
}, { immediate: true });

/**
 * 逐帧追加动画预览项。
 * @description 使用 `requestAnimationFrame` 按批次扩展渲染数量，降低大列表首屏渲染压力。
 */
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

/** 可选语言列表。 */
const languageOptions: GeneralSelectOption[] = supportedLocales.map((l) => ({
  label: l.label,
  value: l.value,
}));

/** 自动锁屏时间候选项（分钟）。 */
const autoLockTimeOptions = computed<AutoLockTimeOption[]>(() => [
  { label: props.locale.common.disable, value: 0 },
  { label: `1 ${props.locale.lockScreen.minute}`, value: 1 },
  { label: `5 ${props.locale.lockScreen.minute}`, value: 5 },
  { label: `15 ${props.locale.lockScreen.minute}`, value: 15 },
  { label: `30 ${props.locale.lockScreen.minute}`, value: 30 },
  { label: `60 ${props.locale.lockScreen.minute}`, value: 60 },
]);

/**
 * 语言设置绑定
 * @description 控制应用语言并同步到偏好配置。
 */
const appLocale = computed({
  get: () => preferences.value?.app.locale ?? D.app.locale,
  set: (value: SupportedLanguagesType) => setPreferences({ app: { locale: value } }),
});

/**
 * 动态标题开关绑定
 * @description 控制页面标题是否根据路由动态更新。
 */
const dynamicTitle = computed({
  get: () => preferences.value?.app.dynamicTitle ?? D.app.dynamicTitle,
  set: (value: boolean) => setPreferences({ app: { dynamicTitle: value } }),
});

/** 页脚启用状态。 */
const footerEnable = computed(() => preferences.value?.footer.enable ?? D.footer.enable);

/**
 * 版权设置展示开关
 * @description 控制偏好面板是否展示版权设置分组。
 */
const copyrightSettingShow = computed(
  () => preferences.value?.copyright.settingShow ?? D.copyright.settingShow
);

/**
 * 版权启用开关绑定
 * @description 控制页脚版权信息是否实际渲染。
 */
const copyrightEnable = computed({
  get: () => preferences.value?.copyright.enable ?? D.copyright.enable,
  set: (value: boolean) => setPreferences({ copyright: { enable: value } }),
});

/**
 * 版权公司名称绑定
 * @description 设置页脚版权主体文案。
 */
const copyrightCompanyName = computed({
  get: () => preferences.value?.copyright.companyName ?? D.copyright.companyName,
  set: (value: string) => setPreferences({ copyright: { companyName: value } }),
});

/**
 * 公司官网链接绑定
 * @description 设置版权区域公司名称跳转链接。
 */
const copyrightCompanySiteLink = computed({
  get: () => preferences.value?.copyright.companySiteLink ?? D.copyright.companySiteLink,
  set: (value: string) => setPreferences({ copyright: { companySiteLink: value } }),
});

/**
 * 版权年份绑定
 * @description 设置版权文案中的年份字段。
 */
const copyrightDate = computed({
  get: () => preferences.value?.copyright.date ?? D.copyright.date,
  set: (value: string) => setPreferences({ copyright: { date: value } }),
});

/**
 * ICP 文案绑定
 * @description 设置备案号显示文本。
 */
const copyrightIcp = computed({
  get: () => preferences.value?.copyright.icp ?? D.copyright.icp,
  set: (value: string) => setPreferences({ copyright: { icp: value } }),
});

/**
 * ICP 链接绑定
 * @description 设置备案号点击跳转地址。
 */
const copyrightIcpLink = computed({
  get: () => preferences.value?.copyright.icpLink ?? D.copyright.icpLink,
  set: (value: string) => setPreferences({ copyright: { icpLink: value } }),
});

/**
 * 水印启用开关绑定
 * @description 控制页面全局水印开关。
 */
const watermark = computed({
  get: () => preferences.value?.app.watermark ?? D.app.watermark,
  set: (value: boolean) => setPreferences({ app: { watermark: value } }),
});

/**
 * 水印内容绑定
 * @description 设置水印显示文本。
 */
const watermarkContent = computed({
  get: () => preferences.value?.app.watermarkContent ?? D.app.watermarkContent,
  set: (value: string) => setPreferences({ app: { watermarkContent: value } }),
});

/**
 * 水印角度绑定
 * @description 设置水印倾斜角度（单位：度）。
 */
const watermarkAngle = computed({
  get: () => preferences.value?.app.watermarkAngle ?? D.app.watermarkAngle,
  set: (value: number) => setPreferences({ app: { watermarkAngle: value } }),
});

/**
 * 水印追加日期开关绑定
 * @description 控制水印内容是否自动追加当天日期。
 */
const watermarkAppendDate = computed({
  get: () => preferences.value?.app.watermarkAppendDate ?? D.app.watermarkAppendDate,
  set: (value: boolean) => setPreferences({ app: { watermarkAppendDate: value } }),
});

/**
 * 水印字体大小绑定
 * @description 设置水印文本字体大小（单位：像素）。
 */
const watermarkFontSize = computed({
  get: () => preferences.value?.app.watermarkFontSize ?? D.app.watermarkFontSize,
  set: (value: number) => setPreferences({ app: { watermarkFontSize: value } }),
});

/**
 * 页面过渡启用开关绑定
 * @description 控制路由切换过渡动画是否生效。
 */
const transitionEnable = computed({
  get: () => preferences.value?.transition.enable ?? D.transition.enable,
  set: (value: boolean) => setPreferences({ transition: { enable: value } }),
});

/**
 * 页面过渡进度条开关绑定
 * @description 控制路由切换进度条显示。
 */
const transitionProgress = computed({
  get: () => preferences.value?.transition.progress ?? D.transition.progress,
  set: (value: boolean) => setPreferences({ transition: { progress: value } }),
});

/**
 * 页面过渡动画名称绑定
 * @description 设置当前路由切换动画类型。
 */
const transitionName = computed({
  get: () => (preferences.value?.transition.name ?? D.transition.name) as PageTransitionType,
  set: (value: PageTransitionType) => setPreferences({ transition: { name: value } }),
});

/**
 * 锁屏组件开关绑定
 * @description 控制锁屏功能组件是否启用。
 */
const widgetLockScreen = computed({
  get: () => preferences.value?.widget.lockScreen ?? D.widget.lockScreen,
  set: (value: boolean) => setPreferences({ widget: { lockScreen: value } }),
});

/**
 * 自动锁屏时长绑定
 * @description 设置用户无操作后自动锁屏的分钟数。
 */
const autoLockTime = computed({
  get: () => preferences.value?.lockScreen.autoLockTime ?? D.lockScreen.autoLockTime,
  set: (value: number) => setPreferences({ lockScreen: { autoLockTime: value } }),
});

/** 是否已设置锁屏密码。 */
const hasPassword = computed(() => !!preferences.value?.lockScreen.password);
/** 版权分组子项是否禁用。 */
const copyrightItemDisabled = computed(() => !footerEnable.value || !copyrightEnable.value);

/**
 * 清空锁屏密码
 * @description 清空密码后立即持久化，并短暂展示“已清空”按钮状态反馈。
 */
const clearPassword = () => {
  if (isClearing.value) return;
  
  try {
    setPreferences({ lockScreen: { password: '' } });
    /**
     * 立即持久化清空结果。
     * @description 确保密码清除不依赖后续异步批量写入。
     */
    try {
      getPreferencesManager()?.flush?.();
    } catch {}
    
    isClearing.value = true;
    
    /**
     * 清理旧反馈定时器。
     * @description 避免多次点击产生并发回滚任务。
     */
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

/**
 * 处理动画类型项激活事件
 * @description 从选项节点读取动画类型并更新页面切换动画配置。
 * @param e 点击或键盘激活事件对象。
 */
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
