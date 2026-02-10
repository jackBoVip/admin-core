<script setup lang="ts">
/**
 * 布局设置标签页
 * @description 布局类型、侧边栏、顶栏、标签栏等设置
 */
import { computed, type WritableComputedRef } from 'vue';
import { usePreferences } from '../../composables';
import {
  DEFAULT_PREFERENCES,
  getContentWidthIcon,
  isHeaderMenuLayout,
  createLayoutPreviewCache,
  getLayoutTabConfigs,
  getLayoutTabOptions,
  getLayoutPreviewOptions,
  createLayoutTabUpdater,
  type LayoutType,
  type LocaleMessages,
  type LayoutHeaderModeType,
  type LayoutHeaderMenuAlignType,
  type TabsStyleType,
  type ContentWidthType,
  type PanelPositionType,
  type Preferences,
  type DeepPartial,
  type LayoutTabConfig,
} from '@admin-core/preferences';
import Block from './Block.vue';
import SwitchItem from './SwitchItem.vue';
import SelectItem from './SelectItem.vue';
import NumberItem from './NumberItem.vue';

const props = defineProps<{
  /** 当前语言包 */
  locale: LocaleMessages;
  /** UI 配置（控制功能项显示/禁用） */
  uiConfig?: LayoutTabConfig;
}>();

// ========== UI 配置解析（使用 computed 缓存） ==========
const configs = computed(() => getLayoutTabConfigs(props.uiConfig));

const { preferences, setPreferences } = usePreferences();
const updater = createLayoutTabUpdater(setPreferences);

// 默认值简写
const D = DEFAULT_PREFERENCES;

// ========== 工厂函数：减少重复的 computed 定义 ==========

/**
 * 创建双向绑定的 computed
 * @param path - 偏好设置路径，如 'sidebar.collapsed'
 * @param defaultValue - 默认值
 */
function createPreferenceComputed<T>(
  path: string,
  defaultValue: T
): WritableComputedRef<T> {
  const keys = path.split('.');
  return computed({
    get: () => {
      let value: unknown = preferences.value;
      for (const key of keys) {
        value = (value as Record<string, unknown>)?.[key];
      }
      return (value ?? defaultValue) as T;
    },
    set: (newValue: T) => {
      // 构建嵌套更新对象
      const update = keys.reduceRight<Record<string, unknown>>(
        (acc, key, index) => (index === keys.length - 1 ? { [key]: newValue } : { [key]: acc }),
        {}
      );
      setPreferences(update as DeepPartial<Preferences>);
    },
  });
}

const layoutTabOptions = computed(() => getLayoutTabOptions(props.locale));
const layoutOptions = computed(() => layoutTabOptions.value.layoutOptions);
const tabsStyleOptions = computed(() => layoutTabOptions.value.tabsStyleOptions);
const headerMenuAlignOptions = computed(() => layoutTabOptions.value.headerMenuAlignOptions);

// ========== 使用工厂函数简化 computed 定义 ==========

// 布局设置
const layout = createPreferenceComputed<LayoutType>('app.layout', D.app.layout);
const contentCompact = createPreferenceComputed<'wide' | 'compact'>('app.contentCompact', D.app.contentCompact);

const handleSetLayout = (value: LayoutType) => {
  updater.setLayout(value);
};

const handleSetContentWide = () => {
  updater.setContentWide();
};

const handleSetContentCompact = () => {
  updater.setContentCompactMode();
};

// 是否允许显示折叠按钮的布局（仅 sidebar-nav）
const isCollapseButtonAllowedLayout = computed(() => {
  return layout.value === 'sidebar-nav';
});
// 侧边栏折叠是否可用（sidebar-mixed-nav 下禁用）
const isSidebarCollapseDisabled = computed(() =>
  layout.value === 'sidebar-mixed-nav' || layout.value === 'header-mixed-nav'
);
const isHeaderNavLayout = computed(() => layout.value === 'header-nav');
const isBreadcrumbDisabledLayout = computed(
  () =>
    layout.value === 'header-nav' ||
    layout.value === 'mixed-nav' ||
    layout.value === 'header-mixed-nav'
);

// 侧边栏设置
const sidebarCollapsed = createPreferenceComputed<boolean>('sidebar.collapsed', D.sidebar.collapsed);
const sidebarCollapsedButtonRaw = createPreferenceComputed<boolean>('sidebar.collapsedButton', D.sidebar.collapsedButton);
// 折叠按钮：在非允许布局下强制返回 false
const sidebarCollapsedButton = computed({
  get: () => isCollapseButtonAllowedLayout.value ? sidebarCollapsedButtonRaw.value : false,
  set: (value: boolean) => {
    if (isCollapseButtonAllowedLayout.value) {
      sidebarCollapsedButtonRaw.value = value;
    }
  },
});
const sidebarExpandOnHover = createPreferenceComputed<boolean>('sidebar.expandOnHover', D.sidebar.expandOnHover);

// 顶栏设置
const headerEnable = createPreferenceComputed<boolean>('header.enable', D.header.enable);
const headerMode = createPreferenceComputed<LayoutHeaderModeType>('header.mode', D.header.mode);
const headerMenuAlign = createPreferenceComputed<LayoutHeaderMenuAlignType>('header.menuAlign', D.header.menuAlign);
const headerMenuLauncher = createPreferenceComputed<boolean>('header.menuLauncher', D.header.menuLauncher);

// 菜单启动器是否可用（顶栏启用 + 顶部菜单布局）
const menuLauncherEnabled = computed(() => {
  const isHeaderMixedNav = layout.value === 'header-mixed-nav';
  return headerEnable.value && isHeaderMenuLayout(layout.value) && !isHeaderMixedNav;
});
const menuAlignEnabled = computed(() => {
  return headerEnable.value && isHeaderMenuLayout(layout.value);
});

// 标签栏设置
const tabbarEnable = createPreferenceComputed<boolean>('tabbar.enable', D.tabbar.enable);
const tabbarPersist = createPreferenceComputed<boolean>('tabbar.persist', D.tabbar.persist);
const tabbarKeepAlive = createPreferenceComputed<boolean>('tabbar.keepAlive', D.tabbar.keepAlive);
const tabbarMaxCount = createPreferenceComputed<number>('tabbar.maxCount', D.tabbar.maxCount);
const tabbarShowIcon = createPreferenceComputed<boolean>('tabbar.showIcon', D.tabbar.showIcon);
const tabbarShowMore = createPreferenceComputed<boolean>('tabbar.showMore', D.tabbar.showMore);
const tabbarShowMaximize = createPreferenceComputed<boolean>('tabbar.showMaximize', D.tabbar.showMaximize);
const tabbarDraggable = createPreferenceComputed<boolean>('tabbar.draggable', D.tabbar.draggable);
const tabbarWheelable = createPreferenceComputed<boolean>('tabbar.wheelable', D.tabbar.wheelable);
const tabbarMiddleClickToClose = createPreferenceComputed<boolean>('tabbar.middleClickToClose', D.tabbar.middleClickToClose);
const tabbarStyleType = createPreferenceComputed<TabsStyleType>('tabbar.styleType', D.tabbar.styleType);

// 面包屑设置
const breadcrumbEnable = createPreferenceComputed<boolean>('breadcrumb.enable', D.breadcrumb.enable);
const breadcrumbShowIcon = createPreferenceComputed<boolean>('breadcrumb.showIcon', D.breadcrumb.showIcon);
const breadcrumbEnableDisplay = computed(() => isBreadcrumbDisabledLayout.value ? false : breadcrumbEnable.value);
const breadcrumbShowIconDisplay = computed(() => isBreadcrumbDisabledLayout.value ? false : breadcrumbShowIcon.value);

// 页脚设置
const footerEnable = createPreferenceComputed<boolean>('footer.enable', D.footer.enable);
const footerFixed = createPreferenceComputed<boolean>('footer.fixed', D.footer.fixed);

// 小部件设置
const widgetFullscreen = createPreferenceComputed<boolean>('widget.fullscreen', D.widget.fullscreen);
const widgetGlobalSearch = createPreferenceComputed<boolean>('widget.globalSearch', D.widget.globalSearch);
const widgetThemeToggle = createPreferenceComputed<boolean>('widget.themeToggle', D.widget.themeToggle);
const widgetLanguageToggle = createPreferenceComputed<boolean>('widget.languageToggle', D.widget.languageToggle);

// 功能区设置
const panelEnable = createPreferenceComputed<boolean>('panel.enable', D.panel.enable);
const panelPosition = createPreferenceComputed<PanelPositionType>('panel.position', D.panel.position);
const panelCollapsed = createPreferenceComputed<boolean>('panel.collapsed', D.panel.collapsed);

// 动态预览图选项（根据当前偏好设置）
const previewOptions = computed(() =>
  getLayoutPreviewOptions(preferences.value ?? D)
);

// 缓存预览图（避免每次渲染重新生成）
const previewSvgCache = computed(() => {
  const options = previewOptions.value;
  return createLayoutPreviewCache(layoutOptions.value, options);
});

// 生成布局预览图（从缓存获取）
const getPreviewSvg = (layoutType: LayoutType) => previewSvgCache.value[layoutType];

const handleLayoutTypeActivate = (e: Event) => {
  if (configs.value.layoutType.disabled) return;
  const value = (e.currentTarget as HTMLElement).dataset.value as LayoutType | undefined;
  if (value) {
    handleSetLayout(value);
  }
};

const handleContentWidthActivate = (e: Event) => {
  if (configs.value.contentWidth.disabled) return;
  const value = (e.currentTarget as HTMLElement).dataset.value as ContentWidthType | undefined;
  if (!value) return;
  if (value === 'wide') {
    handleSetContentWide();
  } else {
    handleSetContentCompact();
  }
};

</script>

<template>
  <!-- 布局类型 -->
  <Block v-if="configs.layoutType.visible" :title="locale.layout.type">
    <div class="layout-presets-grid" role="radiogroup" :aria-label="locale.layout.type">
      <div
        v-for="opt in layoutOptions"
        :key="opt.value"
        class="layout-preset-item data-active:text-foreground data-active:font-semibold data-disabled:opacity-50 data-disabled:cursor-not-allowed data-disabled:[&_*]:cursor-not-allowed aria-checked:text-foreground"
        :class="{ disabled: configs.layoutType.disabled }"
        role="radio"
        :tabindex="configs.layoutType.disabled ? -1 : 0"
        :aria-checked="layout === opt.value"
        :aria-label="opt.label"
        :aria-disabled="configs.layoutType.disabled"
        :data-state="layout === opt.value ? 'active' : 'inactive'"
        :data-disabled="configs.layoutType.disabled ? 'true' : undefined"
        :data-value="opt.value"
        @click="handleLayoutTypeActivate"
        @keydown.enter.space.prevent="handleLayoutTypeActivate"
      >
        <div
          class="outline-box flex-center layout-preset-box"
          :class="{ 'outline-box-active': layout === opt.value, disabled: configs.layoutType.disabled }"
          :data-disabled="configs.layoutType.disabled ? 'true' : undefined"
          :data-state="layout === opt.value ? 'active' : 'inactive'"
        >
          <div class="layout-preset-preview" v-html="getPreviewSvg(opt.value as LayoutType)" />
        </div>
        <span class="layout-preset-label">{{ opt.label }}</span>
      </div>
    </div>
  </Block>

  <!-- 内容宽度 -->
  <Block v-if="configs.contentWidth.visible" :title="locale.layout.contentWidth">
    <div class="content-width-grid" role="radiogroup" :aria-label="locale.layout.contentWidth">
      <div 
        class="content-width-item data-active:text-foreground data-active:font-semibold data-disabled:opacity-50 data-disabled:cursor-not-allowed data-disabled:[&_*]:cursor-not-allowed aria-checked:text-foreground" 
        :class="{ disabled: configs.contentWidth.disabled }"
        role="radio"
        :tabindex="configs.contentWidth.disabled ? -1 : 0"
        :aria-checked="contentCompact === 'wide'"
        :aria-label="locale.layout.contentWide"
        :aria-disabled="configs.contentWidth.disabled"
        :data-state="contentCompact === 'wide' ? 'active' : 'inactive'"
        :data-disabled="configs.contentWidth.disabled ? 'true' : undefined"
        data-value="wide"
        @click="handleContentWidthActivate"
        @keydown.enter.space.prevent="handleContentWidthActivate"
      >
        <div
          class="outline-box flex-center content-width-box"
          :class="{ 'outline-box-active': contentCompact === 'wide', disabled: configs.contentWidth.disabled }"
        :data-disabled="configs.contentWidth.disabled ? 'true' : undefined"
        :data-state="contentCompact === 'wide' ? 'active' : 'inactive'"
        >
          <div class="content-width-preview" v-html="getContentWidthIcon('wide' as ContentWidthType)" />
        </div>
        <span class="content-width-label">{{ locale.layout.contentWide }}</span>
      </div>
      <div 
        class="content-width-item data-active:text-foreground data-active:font-semibold data-disabled:opacity-50 data-disabled:cursor-not-allowed data-disabled:[&_*]:cursor-not-allowed aria-checked:text-foreground" 
        :class="{ disabled: configs.contentWidth.disabled }"
        role="radio"
        :tabindex="configs.contentWidth.disabled ? -1 : 0"
        :aria-checked="contentCompact === 'compact'"
        :aria-label="locale.layout.contentCompact"
        :aria-disabled="configs.contentWidth.disabled"
        :data-state="contentCompact === 'compact' ? 'active' : 'inactive'"
        :data-disabled="configs.contentWidth.disabled ? 'true' : undefined"
        data-value="compact"
        @click="handleContentWidthActivate"
        @keydown.enter.space.prevent="handleContentWidthActivate"
      >
        <div
          class="outline-box flex-center content-width-box"
          :class="{ 'outline-box-active': contentCompact === 'compact', disabled: configs.contentWidth.disabled }"
        :data-disabled="configs.contentWidth.disabled ? 'true' : undefined"
        :data-state="contentCompact === 'compact' ? 'active' : 'inactive'"
        >
          <div class="content-width-preview" v-html="getContentWidthIcon('compact' as ContentWidthType)" />
        </div>
        <span class="content-width-label">{{ locale.layout.contentCompact }}</span>
      </div>
    </div>
  </Block>

  <!-- 侧边栏 -->
  <Block v-if="configs.sidebar.visible" :title="locale.sidebar.title">
    <SwitchItem 
      v-if="configs.sidebarCollapsed.visible"
      :model-value="sidebarCollapsed"
      @update:modelValue="updater.setSidebarCollapsed"
      :label="locale.sidebar.collapsed" 
      :disabled="isHeaderNavLayout || configs.sidebarCollapsed.disabled || isSidebarCollapseDisabled"
    />
    <SwitchItem 
      v-if="configs.sidebarCollapsedButton.visible"
      :model-value="sidebarCollapsedButton"
      @update:modelValue="updater.setSidebarCollapsedButton"
      :label="locale.sidebar.collapsedButton" 
      :disabled="isHeaderNavLayout || configs.sidebarCollapsedButton.disabled || !isCollapseButtonAllowedLayout"
    />
    <SwitchItem 
      v-if="configs.sidebarExpandOnHover.visible"
      :model-value="sidebarExpandOnHover"
      @update:modelValue="updater.setSidebarExpandOnHover"
      :label="locale.sidebar.expandOnHover" 
      :disabled="isHeaderNavLayout || configs.sidebarExpandOnHover.disabled"
    />
  </Block>

  <!-- 功能区 -->
  <Block v-if="configs.panel.visible" :title="locale.panel.title">
    <SwitchItem 
      v-if="configs.panelEnable.visible"
      :model-value="panelEnable"
      @update:modelValue="updater.setPanelEnable"
      :label="locale.panel.enable" 
      :disabled="configs.panelEnable.disabled"
    />
    <SelectItem
      v-if="configs.panelPosition.visible"
      :model-value="panelPosition"
      @update:modelValue="updater.setPanelPosition"
      :label="locale.panel.position"
      :options="[
        { label: locale.panel.positionLeft, value: 'left' },
        { label: locale.panel.positionRight, value: 'right' },
      ]"
      :disabled="!panelEnable || configs.panelPosition.disabled"
    />
    <SwitchItem 
      v-if="configs.panelCollapsed.visible"
      :model-value="panelCollapsed"
      @update:modelValue="updater.setPanelCollapsed"
      :label="locale.panel.collapsed" 
      :disabled="!panelEnable || configs.panelCollapsed.disabled" 
    />
  </Block>

  <!-- 顶栏 -->
  <Block v-if="configs.header.visible" :title="locale.header.title">
    <SwitchItem 
      v-if="configs.headerEnable.visible"
      :model-value="headerEnable"
      @update:modelValue="updater.setHeaderEnable"
      :label="locale.header.enable" 
      :disabled="configs.headerEnable.disabled"
    />
    <SelectItem
      v-if="configs.headerMode.visible"
      :model-value="headerMode"
      @update:modelValue="updater.setHeaderMode"
      :label="locale.header.mode"
      :options="[
        { label: locale.header.modeFixed, value: 'fixed' },
        { label: locale.header.modeStatic, value: 'static' },
        { label: locale.header.modeAuto, value: 'auto' },
        { label: locale.header.modeAutoScroll, value: 'auto-scroll' },
      ]"
      :disabled="!headerEnable || configs.headerMode.disabled"
    />
    <SelectItem
      v-if="configs.headerMenuAlign.visible"
      :model-value="headerMenuAlign"
      @update:modelValue="updater.setHeaderMenuAlign"
      :label="locale.header.menuAlign"
      :options="headerMenuAlignOptions"
      :disabled="!menuAlignEnabled || configs.headerMenuAlign.disabled"
    />
    <SwitchItem
      v-if="configs.headerMenuLauncher.visible"
      :model-value="headerMenuLauncher"
      @update:modelValue="updater.setHeaderMenuLauncher"
      :label="locale.header.menuLauncher"
      :tip="locale.header.menuLauncherTip"
      :disabled="!menuLauncherEnabled || configs.headerMenuLauncher.disabled"
    />
  </Block>

  <!-- 标签栏 -->
  <Block v-if="configs.tabbar.visible" :title="locale.tabbar.title">
    <SwitchItem 
      v-if="configs.tabbarEnable.visible"
      :model-value="tabbarEnable"
      @update:modelValue="updater.setTabbarEnable"
      :label="locale.tabbar.enable" 
      :disabled="configs.tabbarEnable.disabled"
    />
    <SwitchItem 
      v-if="configs.tabbarPersist.visible"
      :model-value="tabbarPersist"
      @update:modelValue="updater.setTabbarPersist"
      :label="locale.tabbar.persist" 
      :disabled="!tabbarEnable || configs.tabbarPersist.disabled"
    />
    <SwitchItem 
      v-if="configs.tabbarKeepAlive.visible"
      :model-value="tabbarKeepAlive"
      @update:modelValue="updater.setTabbarKeepAlive"
      :label="locale.tabbar.keepAlive" 
      :disabled="!tabbarEnable || configs.tabbarKeepAlive.disabled"
    />
    <NumberItem
      v-if="configs.tabbarMaxCount.visible"
      v-model="tabbarMaxCount"
      :label="locale.tabbar.maxCount"
      :tip="locale.tabbar.maxCountTip"
      :min="0"
      :step="1"
      :disabled="!tabbarEnable || configs.tabbarMaxCount.disabled"
    />
    <SwitchItem 
      v-if="configs.tabbarShowIcon.visible"
      :model-value="tabbarShowIcon"
      @update:modelValue="updater.setTabbarShowIcon"
      :label="locale.tabbar.showIcon" 
      :disabled="!tabbarEnable || configs.tabbarShowIcon.disabled" 
    />
    <SwitchItem 
      v-if="configs.tabbarShowMore.visible"
      :model-value="tabbarShowMore"
      @update:modelValue="updater.setTabbarShowMore"
      :label="locale.tabbar.showMore" 
      :disabled="!tabbarEnable || configs.tabbarShowMore.disabled" 
    />
    <SwitchItem 
      v-if="configs.tabbarShowMaximize.visible"
      :model-value="tabbarShowMaximize"
      @update:modelValue="updater.setTabbarShowMaximize"
      :label="locale.tabbar.showMaximize" 
      :disabled="!tabbarEnable || configs.tabbarShowMaximize.disabled" 
    />
    <SwitchItem 
      v-if="configs.tabbarDraggable.visible"
      :model-value="tabbarDraggable"
      @update:modelValue="updater.setTabbarDraggable"
      :label="locale.tabbar.draggable" 
      :disabled="!tabbarEnable || configs.tabbarDraggable.disabled" 
    />
    <SwitchItem 
      v-if="configs.tabbarWheelable.visible"
      :model-value="tabbarWheelable"
      @update:modelValue="updater.setTabbarWheelable"
      :label="locale.tabbar.wheelable" 
      :tip="locale.tabbar.wheelableTip"
      :disabled="!tabbarEnable || configs.tabbarWheelable.disabled" 
    />
    <SwitchItem 
      v-if="configs.tabbarMiddleClickToClose.visible"
      :model-value="tabbarMiddleClickToClose"
      @update:modelValue="updater.setTabbarMiddleClickToClose"
      :label="locale.tabbar.middleClickClose" 
      :disabled="!tabbarEnable || configs.tabbarMiddleClickToClose.disabled" 
    />
    <SelectItem 
      v-if="configs.tabbarStyleType.visible"
      :model-value="tabbarStyleType"
      @update:modelValue="updater.setTabbarStyleType"
      :label="locale.tabbar.styleType" 
      :options="tabsStyleOptions" 
      :disabled="!tabbarEnable || configs.tabbarStyleType.disabled" 
    />
  </Block>

  <!-- 面包屑 -->
  <Block v-if="configs.breadcrumb.visible" :title="locale.breadcrumb.title">
    <SwitchItem 
      v-if="configs.breadcrumbEnable.visible"
      :model-value="breadcrumbEnableDisplay"
      @update:modelValue="updater.setBreadcrumbEnable"
      :label="locale.breadcrumb.enable" 
      :disabled="isBreadcrumbDisabledLayout || configs.breadcrumbEnable.disabled"
    />
    <SwitchItem 
      v-if="configs.breadcrumbShowIcon.visible"
      :model-value="breadcrumbShowIconDisplay"
      @update:modelValue="updater.setBreadcrumbShowIcon"
      :label="locale.breadcrumb.showIcon" 
      :disabled="isBreadcrumbDisabledLayout || !breadcrumbEnableDisplay || configs.breadcrumbShowIcon.disabled" 
    />
  </Block>

  <!-- 页脚 -->
  <Block v-if="configs.footer.visible" :title="locale.footer.title">
    <SwitchItem 
      v-if="configs.footerEnable.visible"
      :model-value="footerEnable"
      @update:modelValue="updater.setFooterEnable"
      :label="locale.footer.enable" 
      :disabled="configs.footerEnable.disabled"
    />
    <SwitchItem 
      v-if="configs.footerFixed.visible"
      :model-value="footerFixed"
      @update:modelValue="updater.setFooterFixed"
      :label="locale.footer.fixed" 
      :disabled="!footerEnable || configs.footerFixed.disabled" 
    />
  </Block>

  <!-- 小部件 -->
  <Block v-if="configs.widget.visible" :title="locale.widget.title">
    <SwitchItem 
      v-if="configs.widgetFullscreen.visible"
      :model-value="widgetFullscreen"
      @update:modelValue="updater.setWidgetFullscreen"
      :label="locale.widget.fullscreen" 
      :disabled="configs.widgetFullscreen.disabled"
    />
    <SwitchItem 
      v-if="configs.widgetGlobalSearch.visible"
      :model-value="widgetGlobalSearch"
      @update:modelValue="updater.setWidgetGlobalSearch"
      :label="locale.widget.globalSearch" 
      :disabled="configs.widgetGlobalSearch.disabled"
    />
    <SwitchItem 
      v-if="configs.widgetThemeToggle.visible"
      :model-value="widgetThemeToggle"
      @update:modelValue="updater.setWidgetThemeToggle"
      :label="locale.widget.themeToggle" 
      :disabled="configs.widgetThemeToggle.disabled"
    />
    <SwitchItem 
      v-if="configs.widgetLanguageToggle.visible"
      :model-value="widgetLanguageToggle"
      @update:modelValue="updater.setWidgetLanguageToggle"
      :label="locale.widget.languageToggle" 
      :disabled="configs.widgetLanguageToggle.disabled"
    />
  </Block>
</template>
