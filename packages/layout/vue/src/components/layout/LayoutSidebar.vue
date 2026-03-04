<script setup lang="ts">
/**
 * 侧边栏组件
 * @description 参考常见 admin 布局实现的混合侧边栏逻辑
 * 
 * 状态说明：
 * - extraVisible: 子菜单面板是否可见（由是否有子菜单决定）
 * - expandOnHover: 是否悬停展开（true=悬停显示，false=固定）
 * - extraCollapsed: 子菜单面板是否折叠（折叠后只显示图标列）
 */
import { computed, onMounted, ref, watch } from 'vue';
import { useLayoutContext, useLayoutComputed, useSidebarState } from '../../composables';
import { useMenuState } from '../../composables/use-layout-state';
import SidebarMenu from './SidebarMenu.vue';
import MixedSidebarMenu, { MixedSidebarSubMenu } from './MixedSidebarMenu.vue';
import LayoutIcon from '../common/LayoutIcon.vue';
import { 
  DEFAULT_SIDEBAR_CONFIG, 
  LAYOUT_ICONS, 
  ANIMATION_CLASSES, 
  LAYOUT_STYLE_CONSTANTS,
  type MenuItem,
} from '@admin-core/layout';
import { getPreferencesManager } from '@admin-core/preferences-vue';

/**
 * 布局上下文
 * @description 提供侧栏配置、菜单数据与布局交互能力。
 */
const context = useLayoutContext();
/**
 * 布局派生状态
 * @description 提供当前布局模式与侧栏主题等计算值。
 */
const layoutComputed = useLayoutComputed();
const {
  collapsed,
  expandOnHovering,
  extraVisible,
  extraCollapsed,
  expandOnHover,
  width,
  handleMouseEnter,
  handleMouseLeave,
} = useSidebarState();
const { activeKey, handleSelect } = useMenuState();

/**
 * 侧栏配置
 * @description 直接引用 `context.props.sidebar` 保持响应式追踪。
 */
const sidebarConfig = computed(() => {
  /** 访问 `context.props.sidebar` 可建立响应式依赖。 */
  const sidebar = context.props.sidebar;
  return sidebar || {};
});
/**
 * Logo 配置
 * @description 读取侧栏 logo 展示配置并做空对象兜底。
 */
const logoConfig = computed(() => context.props.logo || {});
/**
 * 侧栏主题
 * @description 使用派生主题，兼容半深色侧栏策略。
 */
const theme = computed(() => layoutComputed.value.sidebarTheme || 'light');
/**
 * 偏好管理器引用
 * @description 用于同步 `expandOnHover` 到偏好持久化层。
 */
const preferencesManager = ref<ReturnType<typeof getPreferencesManager> | null>(null);

onMounted(() => {
  try {
    preferencesManager.value = getPreferencesManager();
  } catch {
    preferencesManager.value = null;
  }
});

/**
 * 是否混合侧栏模式
 * @description 包含 `sidebar-mixed-nav` 与 `header-mixed-nav` 两类布局。
 */
const isMixedMode = computed(() => 
  layoutComputed.value.isSidebarMixedNav || layoutComputed.value.isHeaderMixedNav
);

/**
 * 是否允许显示折叠按钮（基础布局规则）
 * @description 仅 `sidebar-nav` 默认允许显示折叠按钮。
 */
const isCollapseButtonAllowedLayout = computed(() => {
  const layout = layoutComputed.value.currentLayout;
  return layout === 'sidebar-nav';
});

/**
 * 当前选中的一级菜单
 * @description 混合模式下用于渲染右侧子菜单面板。
 */
const selectedRootMenu = ref<MenuItem | null>(null);
/**
 * 上次同步的激活键
 * @description 避免重复执行根菜单同步逻辑。
 */
const lastActiveKey = ref('');
/**
 * 菜单集合
 * @description 从上下文读取菜单并做空数组兜底。
 */
const menus = computed<MenuItem[]>(() => context.props.menus || []);
/**
 * 规范化菜单键值为可比较字符串。
 *
 * @param value 原始键值。
 * @returns 规范化后的字符串键。
 */
const normalizeKey = (value: unknown) => (value == null || value === '' ? '' : String(value));

/**
 * 获取菜单节点的唯一标识（优先 key，其次 path/name）。
 *
 * @param menu 菜单节点。
 * @returns 菜单标识字符串。
 */
const getMenuId = (menu: MenuItem | null) =>
  menu ? normalizeKey(menu.key ?? menu.path ?? menu.name ?? '') : '';

/**
 * 判断菜单是否匹配目标键（同时比较 key 与 path）。
 *
 * @param menu 菜单节点。
 * @param key 目标键。
 * @returns 是否匹配。
 */
const menuMatchesKey = (menu: MenuItem, key: string) => {
  const target = normalizeKey(key);
  if (!target) return false;
  return normalizeKey(menu.key ?? '') === target || normalizeKey(menu.path ?? '') === target;
};

/**
 * 判断菜单树内是否包含目标键。
 *
 * @param menu 根菜单节点。
 * @param key 目标键。
 * @returns 是否命中当前节点或其任意后代节点。
 */
const menuContainsKey = (menu: MenuItem, key: string): boolean => {
  if (menuMatchesKey(menu, key)) return true;
  if (!menu.children?.length) return false;
  const stack = [...menu.children];
  while (stack.length > 0) {
    const item = stack.pop();
    if (!item) continue;
    if (menuMatchesKey(item, key)) return true;
    if (item.children?.length) {
      for (let i = item.children.length - 1; i >= 0; i -= 1) {
        stack.push(item.children[i]);
      }
    }
  }
  return false;
};

/**
 * 根据当前激活键在一级菜单中查找匹配根节点。
 *
 * @param key 激活菜单键。
 * @returns 命中的一级菜单；未命中时返回 `null`。
 */
const findRootMenuByKey = (key: string) => {
  if (!key) return null;
  for (const item of menus.value) {
    if (item.hidden) continue;
    if (menuContainsKey(item, key)) return item;
  }
  return null;
};

/**
 * 更新当前选中的一级菜单。
 *
 * @param menu 新选中的一级菜单。
 */
const onRootMenuChange = (menu: MenuItem | null) => {
  selectedRootMenu.value = menu;
};

/**
 * 同步路由激活的一级菜单，确保混合模式子菜单可见。
 */
watch(
  [() => activeKey.value, menus, isMixedMode],
  ([key, menuList, mixed]) => {
    if (!mixed || !key || !menuList.length) return;
    const shouldSync = !selectedRootMenu.value || lastActiveKey.value !== key;
    if (!shouldSync) return;
    lastActiveKey.value = key;
    const root = findRootMenuByKey(key);
    if (!root) return;
    if (getMenuId(selectedRootMenu.value) !== getMenuId(root)) {
      selectedRootMenu.value = root;
    }
    const hasChildren = !!root.children?.length;
    if (extraVisible.value !== hasChildren) {
      extraVisible.value = hasChildren;
    }
  },
  { immediate: true }
);

/**
 * 当前子菜单集合
 * @description 取选中一级菜单的 children 作为右侧面板内容。
 */
const subMenus = computed(() => selectedRootMenu.value?.children || []);
/**
 * 子菜单面板标题
 * @description 展示当前选中一级菜单名称。
 */
const subMenuTitle = computed(() => selectedRootMenu.value?.name || '');

/**
 * 是否显示子菜单面板内容
 * @description 需同时满足“存在子菜单”与“extraVisible 为真”。
 */
const showExtraContent = computed(() => {
  if (!subMenus.value.length) return false;
  return extraVisible.value;
});

/**
 * 子菜单面板生效折叠状态
 * @description 悬停展开模式下强制不折叠。
 */
const effectiveExtraCollapsed = computed(() => (expandOnHover.value ? false : extraCollapsed.value));

/**
 * 切换混合模式下子菜单面板折叠状态。
 */
const handleExtraCollapseToggle = () => {
  extraCollapsed.value = !extraCollapsed.value;
};

/**
 * 切换子菜单面板固定模式与悬停展开模式。
 */
const handleTogglePin = () => {
  const nextHoverMode = !expandOnHover.value;
  expandOnHover.value = nextHoverMode;
  if (!nextHoverMode && subMenus.value.length) {
    extraVisible.value = true;
  }
  extraCollapsed.value = false;
  /** 同步偏好设置，避免后续渲染被旧配置覆盖。 */
  preferencesManager.value?.setPreferences({ sidebar: { expandOnHover: nextHoverMode } });
};

/**
 * 固定模式下确保子菜单面板可见，避免内容区与侧边栏重叠。
 */
watch(
  [() => isMixedMode.value, () => expandOnHover.value, subMenus],
  ([mixed, hover, menus]) => {
    if (!mixed || hover) return;
    const nextVisible = menus.length > 0;
    if (extraVisible.value !== nextVisible) {
      extraVisible.value = nextVisible;
    }
  },
  { immediate: true }
);

/**
 * 侧栏根类名
 * @description 根据主题、折叠、混合模式与移动端状态生成。
 */
const sidebarClass = computed(() => [
  'layout-sidebar',
  `layout-sidebar--${theme.value}`,
  {
    'layout-sidebar--collapsed': collapsed.value && !expandOnHovering.value,
    'layout-sidebar--expand-on-hover': expandOnHovering.value,
    'layout-sidebar--mixed': isMixedMode.value,
    'layout-sidebar--hidden': sidebarConfig.value.hidden,
    'layout-sidebar--mobile-visible': context.props.isMobile && !collapsed.value,
  },
]);

/**
 * 混合模式图标列宽度
 * @description 取配置值，缺省回退默认侧栏配置。
 */
const mixedWidth = computed(() => sidebarConfig.value.mixedWidth || DEFAULT_SIDEBAR_CONFIG.mixedWidth);

/**
 * 子菜单面板折叠宽度
 * @description 取配置值，缺省回退默认折叠宽度。
 */
const extraCollapsedWidth = computed(() => sidebarConfig.value.extraCollapsedWidth || DEFAULT_SIDEBAR_CONFIG.extraCollapsedWidth);

/**
 * 子菜单面板当前宽度
 * @description 根据是否显示与折叠状态动态计算宽度。
 */
const extraWidthValue = computed(() => {
  if (!showExtraContent.value) return 0;
  return effectiveExtraCollapsed.value ? extraCollapsedWidth.value : (sidebarConfig.value.width || DEFAULT_SIDEBAR_CONFIG.width);
});

/**
 * 主侧栏内联样式
 * @description 混合模式固定为图标列宽，普通模式使用侧栏宽度状态。
 */
const sidebarStyle = computed(() => {
  if (isMixedMode.value) {
    return { width: `${mixedWidth.value}px` };
  }
  return { width: `${width.value}px` };
});

/**
 * 子菜单面板内联样式
 * @description 固定定位于图标列右侧，并按显示状态设置宽度。
 */
const extraStyle = computed(() => ({
  left: `${mixedWidth.value}px`,
  width: showExtraContent.value ? `${extraWidthValue.value}px` : LAYOUT_STYLE_CONSTANTS.ZERO_PX,
}));

/**
 * 是否 `header-sidebar-nav` 布局
 * @description 该布局允许在头部保留侧栏折叠控制入口。
 */
const isHeaderSidebarNav = computed(() => layoutComputed.value.currentLayout === 'header-sidebar-nav');
/**
 * 是否 `mixed-nav` 布局
 * @description 用于折叠按钮可见性与菜单展示分支判断。
 */
const isMixedNavLayout = computed(() => layoutComputed.value.currentLayout === 'mixed-nav');

/**
 * 是否显示主侧栏折叠按钮
 * @description 综合布局模式、sidebar 配置与禁用项开关判断。
 */
const showCollapseButton = computed(() => {
  const allowedLayout =
    isCollapseButtonAllowedLayout.value || isHeaderSidebarNav.value || isMixedNavLayout.value;
  if (!allowedLayout) {
    return false;
  }
  
  /** 直接读取 sidebar 配置中的 `collapsedButton` 开关。 */
  const collapsedButton = context.props.sidebar?.collapsedButton;
  const disabled = context.props.disabled?.sidebarCollapseButton;
  
  return collapsedButton !== false && disabled !== true;
});

/**
 * 折叠按钮图标名称
 * @description 根据侧栏折叠状态切换图标。
 */
const collapseIconName = computed(() =>
  collapsed.value ? 'sidebar-toggle-collapsed' : 'sidebar-toggle'
);

/**
 * 折叠按钮图标类名
 * @description 组合基础图标类与旋转动画类。
 */
const collapseIconClass = computed(() =>
  `${LAYOUT_ICONS.sidebarCollapse.className} ${ANIMATION_CLASSES.iconRotate}`
);

/**
 * 切换主侧边栏折叠状态。
 */
const toggleCollapse = () => {
  context.toggleSidebarCollapse();
};
</script>

<template>
  <aside
    :class="sidebarClass"
    :style="sidebarStyle"
    :data-theme="theme"
    :data-collapsed="collapsed && !expandOnHovering ? 'true' : undefined"
    :data-hidden="sidebarConfig.hidden ? 'true' : undefined"
    :data-mixed="isMixedMode ? 'true' : undefined"
    :data-expand-on-hover="expandOnHovering ? 'true' : undefined"
    :data-mobile-visible="context.props.isMobile && !collapsed ? 'true' : undefined"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <div class="layout-sidebar__inner flex h-full flex-col">
      <!-- Logo 区域 -->
      <div
        v-if="logoConfig.enable !== false && !isMixedMode && !isHeaderSidebarNav && !isMixedNavLayout && !layoutComputed.isHeaderMixedNav"
        class="layout-sidebar__logo shrink-0"
      >
        <slot name="logo">
          <div class="flex h-header items-center justify-center px-3">
            <img
              v-if="logoConfig.source"
              :src="theme === 'dark' && logoConfig.sourceDark ? logoConfig.sourceDark : logoConfig.source"
              :alt="context.props.appName || 'Logo'"
              class="h-8 w-auto object-contain"
              :style="{ objectFit: logoConfig.fit || 'contain' }"
            />
            <span
              v-if="!collapsed || sidebarConfig.collapsedShowTitle"
              class="ml-2 truncate text-lg font-semibold transition-opacity sidebar-collapsed:opacity-80"
            >
              {{ context.props.appName || '' }}
            </span>
          </div>
        </slot>
      </div>

      <!-- 菜单区域 -->
      <div class="layout-sidebar__menu flex-1 overflow-hidden">
        <div class="layout-scroll-container h-full overflow-y-auto overflow-x-hidden scrollbar-elegant">
          <slot name="menu">
            <!-- 混合模式：只显示一级菜单图标 -->
            <MixedSidebarMenu v-if="isMixedMode" @root-menu-change="onRootMenuChange" />
            <!-- 普通模式：显示完整菜单 -->
            <SidebarMenu v-else />
          </slot>
        </div>
      </div>

      <!-- 额外内容插槽 -->
      <div v-if="$slots.extra" class="layout-sidebar__extra-slot shrink-0">
        <slot name="extra" />
      </div>

      <!-- 底部区域 -->
      <div v-if="showCollapseButton" class="layout-sidebar__footer shrink-0 border-t border-border/10">
        <slot name="footer">
          <!-- 折叠按钮 -->
          <button
            type="button"
            class="flex w-full items-center justify-center py-3 transition-colors sidebar-dark:hover:bg-white/5 sidebar-light:hover:bg-black/5"
            :title="collapsed ? context.t('layout.sidebar.expand') : context.t('layout.sidebar.collapse')"
            @click="toggleCollapse"
          >
            <LayoutIcon :name="collapseIconName" size="md" :className="collapseIconClass" />
          </button>
        </slot>
      </div>
    </div>

    <!-- 混合菜单扩展区域（子菜单） -->
    <div
      v-if="isMixedMode"
      class="layout-sidebar__extra"
      :class="{ 'layout-sidebar__extra--visible': showExtraContent }"
      :data-visible="showExtraContent ? 'true' : undefined"
      :style="extraStyle"
    >
      <slot name="mixed-menu">
        <MixedSidebarSubMenu
          v-if="showExtraContent"
          :menus="subMenus"
          :active-key="activeKey"
          :title="subMenuTitle"
          :collapsed="effectiveExtraCollapsed"
          :pinned="!expandOnHover"
          :show-collapse-btn="!expandOnHover"
          :show-pin-btn="!effectiveExtraCollapsed"
          :theme="theme"
          @select="handleSelect"
          @collapse="handleExtraCollapseToggle"
          @toggle-pin="handleTogglePin"
        />
      </slot>
    </div>
  </aside>
</template>

<style>
/* 样式已在核心 CSS 中定义 */
</style>
