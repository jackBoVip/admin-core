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

/**
 * 布局标签页入参
 * @description 提供语言包与布局分组的 UI 可见性配置。
 */
export interface LayoutTabProps {
  /** 当前语言包。 */
  locale: LocaleMessages;
  /** UI 配置（控制功能项显示/禁用）。 */
  uiConfig?: LayoutTabConfig;
}

const props = defineProps<LayoutTabProps>();

/**
 * 下拉模型值类型。
 * @description 统一描述 `SelectItem` 输出的 `string | number` 联合值。
 */
type SelectModelValue = number | string;

/**
 * 布局标签页功能配置快照。
 * @description 汇总各分组功能项的可见与禁用状态。
 */
const configs = computed(() => getLayoutTabConfigs(props.uiConfig));

/**
 * 偏好状态与写回方法
 * @description 读取布局相关状态，并响应用户操作写回偏好配置。
 */
const { preferences, setPreferences } = usePreferences();
/**
 * 布局更新器
 * @description 封装布局域的常用写入操作，避免重复组装 patch。
 */
const updater = createLayoutTabUpdater(setPreferences);

/**
 * 默认偏好常量引用
 * @description 作为布局各字段的兜底默认值。
 */
const D = DEFAULT_PREFERENCES;

/**
 * 绑定工厂函数区。
 * @description 封装重复的偏好读取与写入逻辑，减少同构 computed 定义。
 */

/**
 * 创建偏好字段双向绑定计算属性
 * @description 根据点路径读取嵌套偏好值，并在写入时自动构造同路径 patch 对象。
 * @param path 偏好设置路径，如 `sidebar.collapsed`。
 * @param defaultValue 当路径值不存在时使用的兜底默认值。
 * @returns 可读可写的计算属性引用。
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
      /**
       * 构建嵌套更新对象。
       * @description 按路径从内到外组装 patch，保持 setPreferences 入参结构正确。
       */
      const update = keys.reduceRight<Record<string, unknown>>(
        (acc, key, index) => (index === keys.length - 1 ? { [key]: newValue } : { [key]: acc }),
        {}
      );
      setPreferences(update as DeepPartial<Preferences>);
    },
  });
}

/** 布局标签页本地化选项集合。 */
const layoutTabOptions = computed(() => getLayoutTabOptions(props.locale));
/** 布局类型选项。 */
const layoutOptions = computed(() => layoutTabOptions.value.layoutOptions);
/** 标签栏样式选项。 */
const tabsStyleOptions = computed(() => layoutTabOptions.value.tabsStyleOptions);
/** 顶栏菜单对齐选项。 */
const headerMenuAlignOptions = computed(() => layoutTabOptions.value.headerMenuAlignOptions);

/**
 * 当前布局类型绑定
 * @description 控制整体布局形态（侧栏、顶栏、混合等）。
 */
const layout = createPreferenceComputed<LayoutType>('app.layout', D.app.layout);
/**
 * 内容宽度模式绑定
 * @description 在宽屏与紧凑模式之间切换内容区域宽度。
 */
const contentCompact = createPreferenceComputed<'wide' | 'compact'>('app.contentCompact', D.app.contentCompact);

/**
 * 设置布局类型
 * @description 调用布局更新器将布局切换为指定类型。
 * @param value 目标布局类型。
 */
const handleSetLayout = (value: LayoutType) => {
  updater.setLayout(value);
};

/**
 * 设置内容宽度为宽屏模式
 * @description 将 `contentCompact` 切换为 `wide`。
 */
const handleSetContentWide = () => {
  updater.setContentWide();
};

/**
 * 设置内容宽度为紧凑模式
 * @description 将 `contentCompact` 切换为 `compact`。
 */
const handleSetContentCompact = () => {
  updater.setContentCompactMode();
};

/**
 * 创建下拉选择更新处理器
 * @description 将 `string | number | undefined` 事件值转换为安全调用，忽略 `undefined`。
 * @param setter 具体的偏好更新函数。
 * @returns 供组件事件绑定的值更新处理函数。
 */
const createSelectUpdateHandler =
  (setter: (value: SelectModelValue) => void) =>
  (value: SelectModelValue | undefined) => {
    if (value === undefined) return;
    setter(value);
  };

/** 当前布局是否允许显示侧边栏折叠按钮。 */
const isCollapseButtonAllowedLayout = computed(() => {
  return layout.value === 'sidebar-nav';
});
/** 侧边栏折叠能力是否禁用。 */
const isSidebarCollapseDisabled = computed(() =>
  layout.value === 'sidebar-mixed-nav' || layout.value === 'header-mixed-nav'
);
/** 是否为顶栏导航布局。 */
const isHeaderNavLayout = computed(() => layout.value === 'header-nav');
/** 当前布局是否禁用面包屑设置能力。 */
const isBreadcrumbDisabledLayout = computed(
  () =>
    layout.value === 'header-nav' ||
    layout.value === 'mixed-nav' ||
    layout.value === 'header-mixed-nav'
);

/**
 * 侧边栏折叠状态绑定
 * @description 控制侧边栏是否折叠。
 */
const sidebarCollapsed = createPreferenceComputed<boolean>('sidebar.collapsed', D.sidebar.collapsed);
/**
 * 侧边栏折叠按钮原始开关绑定
 * @description 记录用户对折叠按钮显示能力的配置值。
 */
const sidebarCollapsedButtonRaw = createPreferenceComputed<boolean>('sidebar.collapsedButton', D.sidebar.collapsedButton);
/**
 * 侧边栏折叠按钮展示开关。
 * @description 在非允许布局下强制返回 `false`，避免出现无效控制项。
 */
const sidebarCollapsedButton = computed({
  get: () => isCollapseButtonAllowedLayout.value ? sidebarCollapsedButtonRaw.value : false,
  set: (value: boolean) => {
    if (isCollapseButtonAllowedLayout.value) {
      sidebarCollapsedButtonRaw.value = value;
    }
  },
});
/**
 * 侧边栏悬停展开开关绑定
 * @description 控制侧边栏折叠后是否在悬停时自动展开。
 */
const sidebarExpandOnHover = createPreferenceComputed<boolean>('sidebar.expandOnHover', D.sidebar.expandOnHover);

/**
 * 顶栏启用开关绑定
 * @description 控制顶部导航区域是否展示。
 */
const headerEnable = createPreferenceComputed<boolean>('header.enable', D.header.enable);
/**
 * 顶栏模式绑定
 * @description 控制顶栏布局模式（固定/静态等）。
 */
const headerMode = createPreferenceComputed<LayoutHeaderModeType>('header.mode', D.header.mode);
/**
 * 顶栏菜单对齐绑定
 * @description 控制顶栏菜单在可用场景下的对齐方式。
 */
const headerMenuAlign = createPreferenceComputed<LayoutHeaderMenuAlignType>('header.menuAlign', D.header.menuAlign);
/**
 * 顶栏菜单启动器开关绑定
 * @description 控制是否显示顶栏菜单触发按钮。
 */
const headerMenuLauncher = createPreferenceComputed<boolean>('header.menuLauncher', D.header.menuLauncher);

/** 顶栏菜单启动器是否可用。 */
const menuLauncherEnabled = computed(() => {
  const isHeaderMixedNav = layout.value === 'header-mixed-nav';
  return headerEnable.value && isHeaderMenuLayout(layout.value) && !isHeaderMixedNav;
});
/** 顶栏菜单对齐设置是否可用。 */
const menuAlignEnabled = computed(() => {
  return headerEnable.value && isHeaderMenuLayout(layout.value);
});

/**
 * 标签栏启用开关绑定
 * @description 控制页面标签栏区域是否启用。
 */
const tabbarEnable = createPreferenceComputed<boolean>('tabbar.enable', D.tabbar.enable);
/** 标签栏持久化开关绑定。 */
const tabbarPersist = createPreferenceComputed<boolean>('tabbar.persist', D.tabbar.persist);
/** 标签页缓存保活开关绑定。 */
const tabbarKeepAlive = createPreferenceComputed<boolean>('tabbar.keepAlive', D.tabbar.keepAlive);
/** 标签栏最大数量绑定。 */
const tabbarMaxCount = createPreferenceComputed<number>('tabbar.maxCount', D.tabbar.maxCount);
/** 标签栏图标显示开关绑定。 */
const tabbarShowIcon = createPreferenceComputed<boolean>('tabbar.showIcon', D.tabbar.showIcon);
/** 标签栏“更多”菜单开关绑定。 */
const tabbarShowMore = createPreferenceComputed<boolean>('tabbar.showMore', D.tabbar.showMore);
/** 标签栏最大化按钮开关绑定。 */
const tabbarShowMaximize = createPreferenceComputed<boolean>('tabbar.showMaximize', D.tabbar.showMaximize);
/** 标签页拖拽排序开关绑定。 */
const tabbarDraggable = createPreferenceComputed<boolean>('tabbar.draggable', D.tabbar.draggable);
/** 标签栏滚轮切换开关绑定。 */
const tabbarWheelable = createPreferenceComputed<boolean>('tabbar.wheelable', D.tabbar.wheelable);
/** 中键关闭标签开关绑定。 */
const tabbarMiddleClickToClose = createPreferenceComputed<boolean>('tabbar.middleClickToClose', D.tabbar.middleClickToClose);
/** 标签栏样式类型绑定。 */
const tabbarStyleType = createPreferenceComputed<TabsStyleType>('tabbar.styleType', D.tabbar.styleType);

/**
 * 面包屑启用开关绑定
 * @description 控制面包屑导航是否显示。
 */
const breadcrumbEnable = createPreferenceComputed<boolean>('breadcrumb.enable', D.breadcrumb.enable);
/**
 * 面包屑图标开关绑定
 * @description 控制面包屑项是否展示图标。
 */
const breadcrumbShowIcon = createPreferenceComputed<boolean>('breadcrumb.showIcon', D.breadcrumb.showIcon);
/** 面包屑启用态（考虑布局限制后的展示值）。 */
const breadcrumbEnableDisplay = computed(() => isBreadcrumbDisabledLayout.value ? false : breadcrumbEnable.value);
/** 面包屑图标启用态（考虑布局限制后的展示值）。 */
const breadcrumbShowIconDisplay = computed(() => isBreadcrumbDisabledLayout.value ? false : breadcrumbShowIcon.value);

/**
 * 页脚启用开关绑定
 * @description 控制页脚区域是否显示。
 */
const footerEnable = createPreferenceComputed<boolean>('footer.enable', D.footer.enable);
/**
 * 页脚固定开关绑定
 * @description 控制页脚是否固定在视口底部。
 */
const footerFixed = createPreferenceComputed<boolean>('footer.fixed', D.footer.fixed);

/**
 * 全屏按钮开关绑定
 * @description 控制头部全屏组件是否可见。
 */
const widgetFullscreen = createPreferenceComputed<boolean>('widget.fullscreen', D.widget.fullscreen);
/** 全局搜索组件开关绑定。 */
const widgetGlobalSearch = createPreferenceComputed<boolean>('widget.globalSearch', D.widget.globalSearch);
/** 主题切换组件开关绑定。 */
const widgetThemeToggle = createPreferenceComputed<boolean>('widget.themeToggle', D.widget.themeToggle);
/** 语言切换组件开关绑定。 */
const widgetLanguageToggle = createPreferenceComputed<boolean>('widget.languageToggle', D.widget.languageToggle);

/**
 * 功能区启用开关绑定
 * @description 控制右侧或底部功能面板是否启用。
 */
const panelEnable = createPreferenceComputed<boolean>('panel.enable', D.panel.enable);
/**
 * 功能区位置绑定
 * @description 设置功能区位于顶部、底部或侧边等位置。
 */
const panelPosition = createPreferenceComputed<PanelPositionType>('panel.position', D.panel.position);
/**
 * 功能区折叠状态绑定
 * @description 控制功能区当前是否处于折叠状态。
 */
const panelCollapsed = createPreferenceComputed<boolean>('panel.collapsed', D.panel.collapsed);

/** 布局预览渲染选项。 */
const previewOptions = computed(() =>
  getLayoutPreviewOptions(preferences.value ?? D)
);

/** 布局预览 SVG 缓存映射。 */
const previewSvgCache = computed(() => {
  const options = previewOptions.value;
  return createLayoutPreviewCache(layoutOptions.value, options);
});

/**
 * 获取布局预览 SVG
 * @description 直接从缓存字典读取对应布局的预览图，避免重复生成。
 * @param layoutType 布局类型。
 * @returns 对应布局类型的 SVG 字符串。
 */
const getPreviewSvg = (layoutType: LayoutType) => previewSvgCache.value[layoutType];

/**
 * 处理布局类型项激活事件
 * @description 从元素 `data-value` 读取布局类型并触发布局更新。
 * @param e 点击或键盘激活事件对象。
 */
const handleLayoutTypeActivate = (e: Event) => {
  if (configs.value.layoutType.disabled) return;
  const value = (e.currentTarget as HTMLElement).dataset.value as LayoutType | undefined;
  if (value) {
    handleSetLayout(value);
  }
};

/**
 * 处理内容宽度项激活事件
 * @description 根据 `data-value` 在宽屏与紧凑模式之间切换内容宽度。
 * @param e 点击或键盘激活事件对象。
 */
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

/**
 * 功能区位置下拉更新处理器
 * @description 将下拉值安全映射到功能区位置更新动作。
 */
const handlePanelPositionChange = createSelectUpdateHandler(updater.setPanelPosition);
/**
 * 顶栏模式下拉更新处理器
 * @description 将下拉值安全映射到顶栏模式更新动作。
 */
const handleHeaderModeChange = createSelectUpdateHandler(updater.setHeaderMode);
/**
 * 顶栏菜单对齐下拉更新处理器
 * @description 将下拉值安全映射到菜单对齐更新动作。
 */
const handleHeaderMenuAlignChange = createSelectUpdateHandler(updater.setHeaderMenuAlign);
/**
 * 标签栏样式下拉更新处理器
 * @description 将下拉值安全映射到标签栏样式更新动作。
 */
const handleTabbarStyleTypeChange = createSelectUpdateHandler(updater.setTabbarStyleType);

</script>

<template>
  <!-- 布局类型 -->
  <Block v-if="configs.layoutType.visible" :title="locale.layout.type">
    <div class="layout-presets-grid" role="radiogroup" :aria-label="locale.layout.type">
      <div
        v-for="opt in layoutOptions"
        :key="opt.value"
        class="layout-preset-item pref-disabled data-active:text-foreground data-active:font-semibold aria-checked:text-foreground"
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
        class="content-width-item pref-disabled data-active:text-foreground data-active:font-semibold aria-checked:text-foreground" 
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
        class="content-width-item pref-disabled data-active:text-foreground data-active:font-semibold aria-checked:text-foreground" 
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
      @update:modelValue="handlePanelPositionChange"
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
      @update:modelValue="handleHeaderModeChange"
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
      @update:modelValue="handleHeaderMenuAlignChange"
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
      @update:modelValue="handleTabbarStyleTypeChange"
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
