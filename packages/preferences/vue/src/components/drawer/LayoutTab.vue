<script setup lang="ts">
/**
 * 布局设置标签页
 * @description 布局类型、侧边栏、顶栏、标签栏等设置
 */
import { computed, type WritableComputedRef } from 'vue';
import { usePreferences } from '../../composables';
import {
  LAYOUT_OPTIONS,
  TABS_STYLE_OPTIONS,
  DEFAULT_PREFERENCES,
  generateLayoutPreview,
  getContentWidthIcon,
  translateOptions,
  isHeaderMenuLayout,
  getFeatureItemConfig,
  type LayoutType,
  type LocaleMessages,
  type LayoutHeaderModeType,
  type TabsStyleType,
  type ContentWidthType,
  type PanelPositionType,
  type Preferences,
  type DeepPartial,
  type LayoutTabConfig,
  type ResolvedFeatureConfig,
} from '@admin-core/preferences';
import Block from './Block.vue';
import SwitchItem from './SwitchItem.vue';
import SelectItem from './SelectItem.vue';

const props = defineProps<{
  /** 当前语言包 */
  locale: LocaleMessages;
  /** UI 配置（控制功能项显示/禁用） */
  uiConfig?: LayoutTabConfig;
}>();

// ========== UI 配置解析（使用 computed 缓存） ==========
const getConfig = (blockKey: keyof LayoutTabConfig, itemKey?: string): ResolvedFeatureConfig =>
  getFeatureItemConfig(props.uiConfig, blockKey, itemKey);

// 缓存常用配置项
const configs = computed(() => ({
  // 布局类型
  layoutType: getConfig('layoutType'),
  // 内容宽度
  contentWidth: getConfig('contentWidth'),
  // 侧边栏
  sidebar: getConfig('sidebar'),
  sidebarCollapsed: getConfig('sidebar', 'collapsed'),
  sidebarCollapsedButton: getConfig('sidebar', 'collapsedButton'),
  sidebarExpandOnHover: getConfig('sidebar', 'expandOnHover'),
  // 功能区
  panel: getConfig('panel'),
  panelEnable: getConfig('panel', 'enable'),
  panelPosition: getConfig('panel', 'position'),
  panelCollapsed: getConfig('panel', 'collapsed'),
  // 顶栏
  header: getConfig('header'),
  headerEnable: getConfig('header', 'enable'),
  headerMode: getConfig('header', 'mode'),
  headerMenuLauncher: getConfig('header', 'menuLauncher'),
  // 标签栏
  tabbar: getConfig('tabbar'),
  tabbarEnable: getConfig('tabbar', 'enable'),
  tabbarShowIcon: getConfig('tabbar', 'showIcon'),
  tabbarDraggable: getConfig('tabbar', 'draggable'),
  tabbarStyleType: getConfig('tabbar', 'styleType'),
  // 面包屑
  breadcrumb: getConfig('breadcrumb'),
  breadcrumbEnable: getConfig('breadcrumb', 'enable'),
  breadcrumbShowIcon: getConfig('breadcrumb', 'showIcon'),
  // 页脚
  footer: getConfig('footer'),
  footerEnable: getConfig('footer', 'enable'),
  footerFixed: getConfig('footer', 'fixed'),
  // 小部件
  widget: getConfig('widget'),
  widgetFullscreen: getConfig('widget', 'fullscreen'),
  widgetThemeToggle: getConfig('widget', 'themeToggle'),
  widgetLanguageToggle: getConfig('widget', 'languageToggle'),
}));

const { preferences, setPreferences } = usePreferences();

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

// 翻译后的选项
const layoutOptions = computed(() =>
  translateOptions(LAYOUT_OPTIONS, props.locale)
);

const tabsStyleOptions = computed(() =>
  translateOptions(TABS_STYLE_OPTIONS, props.locale)
);

// ========== 使用工厂函数简化 computed 定义 ==========

// 布局设置
const layout = createPreferenceComputed<LayoutType>('app.layout', D.app.layout);
const contentCompact = createPreferenceComputed<'wide' | 'compact'>('app.contentCompact', D.app.contentCompact);

// 侧边栏设置
const sidebarCollapsed = createPreferenceComputed<boolean>('sidebar.collapsed', D.sidebar.collapsed);
const sidebarCollapsedButton = createPreferenceComputed<boolean>('sidebar.collapsedButton', D.sidebar.collapsedButton);
const sidebarExpandOnHover = createPreferenceComputed<boolean>('sidebar.expandOnHover', D.sidebar.expandOnHover);

// 顶栏设置
const headerEnable = createPreferenceComputed<boolean>('header.enable', D.header.enable);
const headerMode = createPreferenceComputed<LayoutHeaderModeType>('header.mode', D.header.mode);
const headerMenuLauncher = createPreferenceComputed<boolean>('header.menuLauncher', D.header.menuLauncher);

// 菜单启动器是否可用（顶栏启用 + 顶部菜单布局）
const menuLauncherEnabled = computed(() => {
  return headerEnable.value && isHeaderMenuLayout(layout.value);
});

// 标签栏设置
const tabbarEnable = createPreferenceComputed<boolean>('tabbar.enable', D.tabbar.enable);
const tabbarShowIcon = createPreferenceComputed<boolean>('tabbar.showIcon', D.tabbar.showIcon);
const tabbarDraggable = createPreferenceComputed<boolean>('tabbar.draggable', D.tabbar.draggable);
const tabbarStyleType = createPreferenceComputed<TabsStyleType>('tabbar.styleType', D.tabbar.styleType);

// 面包屑设置
const breadcrumbEnable = createPreferenceComputed<boolean>('breadcrumb.enable', D.breadcrumb.enable);
const breadcrumbShowIcon = createPreferenceComputed<boolean>('breadcrumb.showIcon', D.breadcrumb.showIcon);

// 页脚设置
const footerEnable = createPreferenceComputed<boolean>('footer.enable', D.footer.enable);
const footerFixed = createPreferenceComputed<boolean>('footer.fixed', D.footer.fixed);

// 小部件设置
const widgetFullscreen = createPreferenceComputed<boolean>('widget.fullscreen', D.widget.fullscreen);
const widgetThemeToggle = createPreferenceComputed<boolean>('widget.themeToggle', D.widget.themeToggle);
const widgetLanguageToggle = createPreferenceComputed<boolean>('widget.languageToggle', D.widget.languageToggle);

// 功能区设置
const panelEnable = createPreferenceComputed<boolean>('panel.enable', D.panel.enable);
const panelPosition = createPreferenceComputed<PanelPositionType>('panel.position', D.panel.position);
const panelCollapsed = createPreferenceComputed<boolean>('panel.collapsed', D.panel.collapsed);

// 动态预览图选项（根据当前偏好设置）
const previewOptions = computed(() => ({
  showSidebar: true, // 侧边栏始终显示在预览中
  sidebarCollapsed: sidebarCollapsed.value,
  showHeader: headerEnable.value,
  showTabbar: tabbarEnable.value,
  showFooter: footerEnable.value,
  // 功能区配置
  showLeftPanel: panelEnable.value && panelPosition.value === 'left',
  leftPanelCollapsed: panelCollapsed.value,
  showRightPanel: panelEnable.value && panelPosition.value === 'right',
  rightPanelCollapsed: panelCollapsed.value,
}));

// 缓存预览图（避免每次渲染重新生成）
const previewSvgCache = computed(() => {
  const options = previewOptions.value;
  const cache: Record<string, string> = {};
  for (const opt of LAYOUT_OPTIONS) {
    cache[opt.value] = generateLayoutPreview(opt.value as LayoutType, options);
  }
  return cache;
});

// 生成布局预览图（从缓存获取）
const getPreviewSvg = (layoutType: LayoutType) => previewSvgCache.value[layoutType];

</script>

<template>
  <!-- 布局类型 -->
  <Block v-if="configs.layoutType.visible" :title="locale.layout.type">
    <div class="layout-presets-grid" role="radiogroup" :aria-label="locale.layout.type">
      <div
        v-for="opt in layoutOptions"
        :key="opt.value"
        class="layout-preset-item"
        :class="{ disabled: configs.layoutType.disabled }"
        role="radio"
        :tabindex="configs.layoutType.disabled ? -1 : 0"
        :aria-checked="layout === opt.value"
        :aria-label="opt.label"
        :aria-disabled="configs.layoutType.disabled"
        @click="!configs.layoutType.disabled && (layout = opt.value as LayoutType)"
        @keydown.enter.space.prevent="!configs.layoutType.disabled && (layout = opt.value as LayoutType)"
      >
        <div
          class="outline-box flex-center layout-preset-box"
          :class="{ 'outline-box-active': layout === opt.value, disabled: configs.layoutType.disabled }"
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
        class="content-width-item" 
        :class="{ disabled: configs.contentWidth.disabled }"
        role="radio"
        :tabindex="configs.contentWidth.disabled ? -1 : 0"
        :aria-checked="contentCompact === 'wide'"
        :aria-label="locale.layout.contentWide"
        :aria-disabled="configs.contentWidth.disabled"
        @click="!configs.contentWidth.disabled && (contentCompact = 'wide')"
        @keydown.enter.space.prevent="!configs.contentWidth.disabled && (contentCompact = 'wide')"
      >
        <div
          class="outline-box flex-center content-width-box"
          :class="{ 'outline-box-active': contentCompact === 'wide', disabled: configs.contentWidth.disabled }"
        >
          <div class="content-width-preview" v-html="getContentWidthIcon('wide' as ContentWidthType)" />
        </div>
        <span class="content-width-label">{{ locale.layout.contentWide }}</span>
      </div>
      <div 
        class="content-width-item" 
        :class="{ disabled: configs.contentWidth.disabled }"
        role="radio"
        :tabindex="configs.contentWidth.disabled ? -1 : 0"
        :aria-checked="contentCompact === 'compact'"
        :aria-label="locale.layout.contentCompact"
        :aria-disabled="configs.contentWidth.disabled"
        @click="!configs.contentWidth.disabled && (contentCompact = 'compact')"
        @keydown.enter.space.prevent="!configs.contentWidth.disabled && (contentCompact = 'compact')"
      >
        <div
          class="outline-box flex-center content-width-box"
          :class="{ 'outline-box-active': contentCompact === 'compact', disabled: configs.contentWidth.disabled }"
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
      v-model="sidebarCollapsed" 
      :label="locale.sidebar.collapsed" 
      :disabled="configs.sidebarCollapsed.disabled"
    />
    <SwitchItem 
      v-if="configs.sidebarCollapsedButton.visible"
      v-model="sidebarCollapsedButton" 
      :label="locale.sidebar.collapsedButton" 
      :disabled="configs.sidebarCollapsedButton.disabled"
    />
    <SwitchItem 
      v-if="configs.sidebarExpandOnHover.visible"
      v-model="sidebarExpandOnHover" 
      :label="locale.sidebar.expandOnHover" 
      :disabled="configs.sidebarExpandOnHover.disabled"
    />
  </Block>

  <!-- 功能区 -->
  <Block v-if="configs.panel.visible" :title="locale.panel.title">
    <SwitchItem 
      v-if="configs.panelEnable.visible"
      v-model="panelEnable" 
      :label="locale.panel.enable" 
      :disabled="configs.panelEnable.disabled"
    />
    <SelectItem
      v-if="configs.panelPosition.visible"
      v-model="panelPosition"
      :label="locale.panel.position"
      :options="[
        { label: locale.panel.positionLeft, value: 'left' },
        { label: locale.panel.positionRight, value: 'right' },
      ]"
      :disabled="!panelEnable || configs.panelPosition.disabled"
    />
    <SwitchItem 
      v-if="configs.panelCollapsed.visible"
      v-model="panelCollapsed" 
      :label="locale.panel.collapsed" 
      :disabled="!panelEnable || configs.panelCollapsed.disabled" 
    />
  </Block>

  <!-- 顶栏 -->
  <Block v-if="configs.header.visible" :title="locale.header.title">
    <SwitchItem 
      v-if="configs.headerEnable.visible"
      v-model="headerEnable" 
      :label="locale.header.enable" 
      :disabled="configs.headerEnable.disabled"
    />
    <SelectItem
      v-if="configs.headerMode.visible"
      v-model="headerMode"
      :label="locale.header.mode"
      :options="[
        { label: locale.header.modeFixed, value: 'fixed' },
        { label: locale.header.modeStatic, value: 'static' },
        { label: locale.header.modeAuto, value: 'auto' },
        { label: locale.header.modeAutoScroll, value: 'auto-scroll' },
      ]"
      :disabled="!headerEnable || configs.headerMode.disabled"
    />
    <SwitchItem
      v-if="configs.headerMenuLauncher.visible"
      v-model="headerMenuLauncher"
      :label="locale.header.menuLauncher"
      :tip="locale.header.menuLauncherTip"
      :disabled="!menuLauncherEnabled || configs.headerMenuLauncher.disabled"
    />
  </Block>

  <!-- 标签栏 -->
  <Block v-if="configs.tabbar.visible" :title="locale.tabbar.title">
    <SwitchItem 
      v-if="configs.tabbarEnable.visible"
      v-model="tabbarEnable" 
      :label="locale.tabbar.enable" 
      :disabled="configs.tabbarEnable.disabled"
    />
    <SwitchItem 
      v-if="configs.tabbarShowIcon.visible"
      v-model="tabbarShowIcon" 
      :label="locale.tabbar.showIcon" 
      :disabled="!tabbarEnable || configs.tabbarShowIcon.disabled" 
    />
    <SwitchItem 
      v-if="configs.tabbarDraggable.visible"
      v-model="tabbarDraggable" 
      :label="locale.tabbar.draggable" 
      :disabled="!tabbarEnable || configs.tabbarDraggable.disabled" 
    />
    <SelectItem 
      v-if="configs.tabbarStyleType.visible"
      v-model="tabbarStyleType" 
      :label="locale.tabbar.styleType" 
      :options="tabsStyleOptions" 
      :disabled="!tabbarEnable || configs.tabbarStyleType.disabled" 
    />
  </Block>

  <!-- 面包屑 -->
  <Block v-if="configs.breadcrumb.visible" :title="locale.breadcrumb.title">
    <SwitchItem 
      v-if="configs.breadcrumbEnable.visible"
      v-model="breadcrumbEnable" 
      :label="locale.breadcrumb.enable" 
      :disabled="configs.breadcrumbEnable.disabled"
    />
    <SwitchItem 
      v-if="configs.breadcrumbShowIcon.visible"
      v-model="breadcrumbShowIcon" 
      :label="locale.breadcrumb.showIcon" 
      :disabled="!breadcrumbEnable || configs.breadcrumbShowIcon.disabled" 
    />
  </Block>

  <!-- 页脚 -->
  <Block v-if="configs.footer.visible" :title="locale.footer.title">
    <SwitchItem 
      v-if="configs.footerEnable.visible"
      v-model="footerEnable" 
      :label="locale.footer.enable" 
      :disabled="configs.footerEnable.disabled"
    />
    <SwitchItem 
      v-if="configs.footerFixed.visible"
      v-model="footerFixed" 
      :label="locale.footer.fixed" 
      :disabled="!footerEnable || configs.footerFixed.disabled" 
    />
  </Block>

  <!-- 小部件 -->
  <Block v-if="configs.widget.visible" :title="locale.widget.title">
    <SwitchItem 
      v-if="configs.widgetFullscreen.visible"
      v-model="widgetFullscreen" 
      :label="locale.widget.fullscreen" 
      :disabled="configs.widgetFullscreen.disabled"
    />
    <SwitchItem 
      v-if="configs.widgetThemeToggle.visible"
      v-model="widgetThemeToggle" 
      :label="locale.widget.themeToggle" 
      :disabled="configs.widgetThemeToggle.disabled"
    />
    <SwitchItem 
      v-if="configs.widgetLanguageToggle.visible"
      v-model="widgetLanguageToggle" 
      :label="locale.widget.languageToggle" 
      :disabled="configs.widgetLanguageToggle.disabled"
    />
  </Block>
</template>
