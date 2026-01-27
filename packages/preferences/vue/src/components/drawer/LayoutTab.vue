<script setup lang="ts">
/**
 * 布局设置标签页
 * @description 布局类型、侧边栏、顶栏、标签栏等设置
 */
import { computed } from 'vue';
import { usePreferences } from '../../composables';
import {
  LAYOUT_OPTIONS,
  TABS_STYLE_OPTIONS,
  DEFAULT_PREFERENCES,
  getLayoutIcon,
  getContentWidthIcon,
  translateOptions,
  type LayoutType,
  type LocaleMessages,
  type LayoutHeaderModeType,
  type TabsStyleType,
  type ContentWidthType,
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
const layoutOptions = computed(() =>
  translateOptions(LAYOUT_OPTIONS, props.locale)
);

const tabsStyleOptions = computed(() =>
  translateOptions(TABS_STYLE_OPTIONS, props.locale)
);

// ========== 布局设置 ==========
const layout = computed({
  get: () => preferences.value?.app.layout ?? D.app.layout,
  set: (value: LayoutType) => setPreferences({ app: { layout: value } }),
});

const contentCompact = computed({
  get: () => preferences.value?.app.contentCompact ?? D.app.contentCompact,
  set: (value: 'wide' | 'compact') => setPreferences({ app: { contentCompact: value } }),
});

// 侧边栏设置
const sidebarCollapsed = computed({
  get: () => preferences.value?.sidebar.collapsed ?? D.sidebar.collapsed,
  set: (value: boolean) => setPreferences({ sidebar: { collapsed: value } }),
});

const sidebarCollapsedButton = computed({
  get: () => preferences.value?.sidebar.collapsedButton ?? D.sidebar.collapsedButton,
  set: (value: boolean) => setPreferences({ sidebar: { collapsedButton: value } }),
});

const sidebarExpandOnHover = computed({
  get: () => preferences.value?.sidebar.expandOnHover ?? D.sidebar.expandOnHover,
  set: (value: boolean) => setPreferences({ sidebar: { expandOnHover: value } }),
});

// 顶栏设置
const headerEnable = computed({
  get: () => preferences.value?.header.enable ?? D.header.enable,
  set: (value: boolean) => setPreferences({ header: { enable: value } }),
});

const headerMode = computed({
  get: () => preferences.value?.header.mode ?? D.header.mode,
  set: (value: LayoutHeaderModeType) => setPreferences({ header: { mode: value } }),
});

// 标签栏设置
const tabbarEnable = computed({
  get: () => preferences.value?.tabbar.enable ?? D.tabbar.enable,
  set: (value: boolean) => setPreferences({ tabbar: { enable: value } }),
});

const tabbarShowIcon = computed({
  get: () => preferences.value?.tabbar.showIcon ?? D.tabbar.showIcon,
  set: (value: boolean) => setPreferences({ tabbar: { showIcon: value } }),
});

const tabbarDraggable = computed({
  get: () => preferences.value?.tabbar.draggable ?? D.tabbar.draggable,
  set: (value: boolean) => setPreferences({ tabbar: { draggable: value } }),
});

const tabbarStyleType = computed({
  get: () => preferences.value?.tabbar.styleType ?? D.tabbar.styleType,
  set: (value: TabsStyleType) => setPreferences({ tabbar: { styleType: value } }),
});

// 面包屑设置
const breadcrumbEnable = computed({
  get: () => preferences.value?.breadcrumb.enable ?? D.breadcrumb.enable,
  set: (value: boolean) => setPreferences({ breadcrumb: { enable: value } }),
});

const breadcrumbShowIcon = computed({
  get: () => preferences.value?.breadcrumb.showIcon ?? D.breadcrumb.showIcon,
  set: (value: boolean) => setPreferences({ breadcrumb: { showIcon: value } }),
});

// 页脚设置
const footerEnable = computed({
  get: () => preferences.value?.footer.enable ?? D.footer.enable,
  set: (value: boolean) => setPreferences({ footer: { enable: value } }),
});

const footerFixed = computed({
  get: () => preferences.value?.footer.fixed ?? D.footer.fixed,
  set: (value: boolean) => setPreferences({ footer: { fixed: value } }),
});

</script>

<template>
  <!-- 布局类型 -->
  <Block :title="locale.layout.type">
    <div class="layout-presets-grid">
      <div
        v-for="opt in layoutOptions"
        :key="opt.value"
        class="layout-preset-item"
        @click="layout = opt.value as LayoutType"
      >
        <div
          class="layout-preset-box"
          :class="{ 'outline-box-active': layout === opt.value }"
        >
          <div class="layout-preset-preview" v-html="getLayoutIcon(opt.value as LayoutType)" />
        </div>
        <span class="layout-preset-label">{{ opt.label }}</span>
      </div>
    </div>
  </Block>

  <!-- 内容宽度 -->
  <Block :title="locale.layout.contentWidth">
    <div class="content-width-grid">
      <div class="content-width-item" @click="contentCompact = 'wide'">
        <div
          class="content-width-box"
          :class="{ 'outline-box-active': contentCompact === 'wide' }"
        >
          <div class="content-width-preview" v-html="getContentWidthIcon('wide' as ContentWidthType)" />
        </div>
        <span class="content-width-label">{{ locale.layout.contentWide }}</span>
      </div>
      <div class="content-width-item" @click="contentCompact = 'compact'">
        <div
          class="content-width-box"
          :class="{ 'outline-box-active': contentCompact === 'compact' }"
        >
          <div class="content-width-preview" v-html="getContentWidthIcon('compact' as ContentWidthType)" />
        </div>
        <span class="content-width-label">{{ locale.layout.contentCompact }}</span>
      </div>
    </div>
  </Block>

  <!-- 侧边栏 -->
  <Block :title="locale.sidebar.title">
    <SwitchItem v-model="sidebarCollapsed" :label="locale.sidebar.collapsed" />
    <SwitchItem v-model="sidebarCollapsedButton" :label="locale.sidebar.collapsedButton" />
    <SwitchItem v-model="sidebarExpandOnHover" :label="locale.sidebar.expandOnHover" />
  </Block>

  <!-- 顶栏 -->
  <Block :title="locale.header.title">
    <SwitchItem v-model="headerEnable" :label="locale.header.enable" />
    <SelectItem
      v-model="headerMode"
      :label="locale.header.mode"
      :options="[
        { label: locale.header.modeFixed, value: 'fixed' },
        { label: locale.header.modeStatic, value: 'static' },
        { label: locale.header.modeAuto, value: 'auto' },
        { label: locale.header.modeAutoScroll, value: 'auto-scroll' },
      ]"
    />
  </Block>

  <!-- 标签栏 -->
  <Block :title="locale.tabbar.title">
    <SwitchItem v-model="tabbarEnable" :label="locale.tabbar.enable" />
    <SwitchItem v-model="tabbarShowIcon" :label="locale.tabbar.showIcon" />
    <SwitchItem v-model="tabbarDraggable" :label="locale.tabbar.draggable" />
    <SelectItem v-model="tabbarStyleType" :label="locale.tabbar.styleType" :options="tabsStyleOptions" />
  </Block>

  <!-- 面包屑 -->
  <Block :title="locale.breadcrumb.title">
    <SwitchItem v-model="breadcrumbEnable" :label="locale.breadcrumb.enable" />
    <SwitchItem v-model="breadcrumbShowIcon" :label="locale.breadcrumb.showIcon" />
  </Block>

  <!-- 页脚 -->
  <Block :title="locale.footer.title">
    <SwitchItem v-model="footerEnable" :label="locale.footer.enable" />
    <SwitchItem v-model="footerFixed" :label="locale.footer.fixed" />
  </Block>
</template>
