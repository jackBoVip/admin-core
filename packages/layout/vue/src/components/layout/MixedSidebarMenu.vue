<script setup lang="ts">
/**
 * 混合侧边栏菜单组件（双列菜单）
 * @description 左侧显示一级菜单图标，右侧显示选中菜单的子菜单
 * @features
 * - 记住每个一级菜单最后激活的子菜单
 * - 支持悬停展开子菜单
 * - 点击无子菜单项直接导航
 */
import { computed, ref, watch } from 'vue';
import { useLayoutContext, useSidebarState } from '../../composables';
import { useMenuState } from '../../composables/use-layout-state';
import type { MenuItem } from '@admin-core/layout';
import {
  isMenuActive,
  hasActiveChild as checkHasActiveChild,
  getIconDefinition,
  getIconRenderType,
  findMenuByPath,
} from '@admin-core/layout';

const context = useLayoutContext();
const { extraVisible, layoutComputed } = useSidebarState();
const { activeKey, handleSelect } = useMenuState();

// Logo 配置
const logoConfig = computed(() => context.props.logo || {});
// 主题（考虑 semiDarkSidebar）
const theme = computed(() => layoutComputed.value?.sidebarTheme || 'light');

// 定义事件
const emit = defineEmits<{
  (e: 'rootMenuChange', menu: MenuItem | null): void;
}>();

// 菜单数据
const menus = computed<MenuItem[]>(() => context.props.menus || []);

// 当前选中的一级菜单
const selectedRootMenu = ref<MenuItem | null>(null);

// 记录每个一级菜单最后激活的子菜单路径（类似 vben 的 defaultSubMap）
const lastActiveSubMenuMap = new Map<string, string>();

// 同步 selectedRootMenu 变化到父组件
watch(selectedRootMenu, (menu) => {
  emit('rootMenuChange', menu);
});

// 根据当前路径自动选中一级菜单，并记录激活的子菜单
watch(
  [activeKey, menus],
  ([key, menuList]) => {
    if (!key || !menuList.length) return;
    
    // 查找当前激活菜单所属的一级菜单
    const currentMenu = findMenuByPath(menuList, key);
    if (currentMenu) {
      // 找到根菜单
      const rootMenu = menuList.find(m => {
        if (m.key === currentMenu.key || m.path === key) return true;
        return checkHasActiveChild(m, key);
      });
      if (rootMenu) {
        selectedRootMenu.value = rootMenu;
        extraVisible.value = !!(rootMenu.children && rootMenu.children.length > 0);
        // 记录该一级菜单最后激活的子菜单
        if (rootMenu.children?.length) {
          lastActiveSubMenuMap.set(rootMenu.key, key);
        }
      }
    }
  },
  { immediate: true }
);

// 处理一级菜单悬停
const onRootMenuEnter = (item: MenuItem) => {
  selectedRootMenu.value = item;
  if (item.children?.length) {
    extraVisible.value = true;
  }
};

// 处理一级菜单点击
const onRootMenuClick = (item: MenuItem) => {
  selectedRootMenu.value = item;
  
  if (item.children?.length) {
    extraVisible.value = true;
    // 自动激活子菜单：优先使用上次记录的，否则使用第一个
    const autoActivateChild = context.props.sidebar?.autoActivateChild ?? true;
    if (autoActivateChild) {
      const lastActivePath = lastActiveSubMenuMap.get(item.key);
      const firstChildPath = item.children[0]?.path || item.children[0]?.key;
      const targetPath = lastActivePath || firstChildPath;
      if (targetPath && targetPath !== activeKey.value) {
        handleSelect(targetPath);
      }
    }
  } else if (item.path) {
    handleSelect(item.key);
  }
};

// 判断一级菜单是否选中 - 使用 computed 缓存避免重复计算
const rootActiveMap = computed(() => {
  const map = new Map<string, boolean>();
  menus.value.forEach(item => {
    map.set(item.key, 
      selectedRootMenu.value?.key === item.key || 
      isMenuActive(item, activeKey.value) ||
      checkHasActiveChild(item, activeKey.value)
    );
  });
  return map;
});

// 判断一级菜单是否选中
const isRootActive = (item: MenuItem) => rootActiveMap.value.get(item.key) ?? false;

// 判断图标类型
const getIconType = (icon: string | undefined) => {
  if (!icon) return null;
  return getIconRenderType(icon);
};

// 获取 SVG 图标路径
const getSvgPath = (icon: string | undefined): string => {
  if (!icon) return '';
  const def = getIconDefinition(icon);
  return def?.path || '';
};

// 获取 SVG 图标 viewBox
const getSvgViewBox = (icon: string | undefined) => {
  if (!icon) return '0 0 24 24';
  const def = getIconDefinition(icon);
  return def?.viewBox || '0 0 24 24';
};

</script>

<template>
  <div class="mixed-sidebar-menu">
    <!-- Logo 区域 -->
    <div v-if="logoConfig.enable !== false" class="mixed-sidebar-menu__logo">
      <div class="flex h-header items-center justify-center">
        <img
          v-if="logoConfig.source"
          :src="theme === 'dark' && logoConfig.sourceDark ? logoConfig.sourceDark : logoConfig.source"
          :alt="context.props.appName || 'Logo'"
          class="h-8 w-8 object-contain"
        />
        <span v-else-if="context.props.appName" class="text-lg font-bold">
          {{ context.props.appName.charAt(0) }}
        </span>
        <span v-else class="text-lg">🏠</span>
      </div>
    </div>
    
    <!-- 一级菜单（只显示图标） -->
    <nav class="mixed-sidebar-menu__root">
      <template v-for="item in menus" :key="item.key">
        <div
          v-if="!item.hidden"
          class="mixed-sidebar-menu__root-item"
          :class="{ 'mixed-sidebar-menu__root-item--active': isRootActive(item) }"
          :title="item.name"
          @mouseenter="onRootMenuEnter(item)"
          @click="onRootMenuClick(item)"
        >
          <!-- 图标 -->
          <span v-if="item.icon" class="mixed-sidebar-menu__icon">
            <svg
              v-if="getIconType(item.icon) === 'svg'"
              class="h-5 w-5"
              :viewBox="getSvgViewBox(item.icon)"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path :d="getSvgPath(item.icon)" />
            </svg>
            <template v-else>{{ item.icon }}</template>
          </span>
          <span v-else class="mixed-sidebar-menu__icon">
            {{ item.name.charAt(0) }}
          </span>
          
          <!-- 名称（缩略） -->
          <span class="mixed-sidebar-menu__root-name">{{ item.name }}</span>
        </div>
      </template>
    </nav>
  </div>
</template>

<script lang="ts">
// 导出子菜单组件供扩展区域使用
import { defineComponent, h } from 'vue';
import type { PropType } from 'vue';

export const MixedSidebarSubMenu = defineComponent({
  name: 'MixedSidebarSubMenu',
  props: {
    menus: {
      type: Array as PropType<MenuItem[]>,
      default: () => [],
    },
    activeKey: {
      type: String,
      default: '',
    },
    title: {
      type: String,
      default: '',
    },
    collapsed: {
      type: Boolean,
      default: false,
    },
    pinned: {
      type: Boolean,
      default: true,
    },
    showCollapseBtn: {
      type: Boolean,
      default: true,
    },
    showPinBtn: {
      type: Boolean,
      default: true,
    },
  },
  emits: ['select', 'collapse', 'togglePin'],
  setup(props, { emit }) {
    const expandedKeys = ref<Set<string>>(new Set());

    const toggleExpand = (key: string) => {
      if (expandedKeys.value.has(key)) {
        expandedKeys.value.delete(key);
      } else {
        expandedKeys.value.add(key);
      }
    };

    const isActive = (item: MenuItem) => {
      return item.key === props.activeKey || item.path === props.activeKey;
    };

    const hasActiveChild = (item: MenuItem): boolean => {
      if (!item.children?.length) return false;
      return item.children.some(
        child => isActive(child) || hasActiveChild(child)
      );
    };

    const onClick = (item: MenuItem) => {
      if (item.children?.length) {
        toggleExpand(item.key);
      } else {
        emit('select', item.key);
      }
    };

    const getIconType = (icon: string | undefined) => {
      if (!icon) return null;
      return getIconRenderType(icon);
    };

    const getSvgPath = (icon: string | undefined): string => {
      if (!icon) return '';
      const def = getIconDefinition(icon);
      return def?.path || '';
    };

    const renderMenuItem = (item: MenuItem, level: number) => {
      if (item.hidden) return null;

      const active = isActive(item);
      const hasChildren = Boolean(item.children?.length);
      const expanded = expandedKeys.value.has(item.key);
      const hasActive = hasActiveChild(item);

      const itemClass = [
        'mixed-sidebar-submenu__item',
        `mixed-sidebar-submenu__item--level-${level}`,
        active && 'mixed-sidebar-submenu__item--active',
        hasActive && 'mixed-sidebar-submenu__item--has-active-child',
      ].filter(Boolean).join(' ');

      const children = [
        // 图标
        item.icon && h('span', { class: 'mixed-sidebar-submenu__icon' }, 
          getIconType(item.icon) === 'svg'
            ? h('svg', {
                class: 'h-4 w-4',
                viewBox: '0 0 24 24',
                fill: 'none',
                stroke: 'currentColor',
                'stroke-width': '2',
              }, h('path', { d: getSvgPath(item.icon) }))
            : item.icon
        ),
        // 名称（折叠时隐藏）
        !props.collapsed && h('span', { class: 'mixed-sidebar-submenu__name' }, item.name),
        // 箭头（折叠时隐藏）
        !props.collapsed && hasChildren && h('span', {
          class: ['mixed-sidebar-submenu__arrow', expanded && 'mixed-sidebar-submenu__arrow--expanded'].filter(Boolean).join(' '),
        }, h('svg', {
          class: 'h-4 w-4',
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          'stroke-width': '2',
        }, h('path', { d: 'M9 18l6-6-6-6' }))),
      ];

      const elements = [
        h('div', {
          class: itemClass,
          onClick: () => onClick(item),
        }, children),
      ];

      // 子菜单（折叠时不显示）
      if (!props.collapsed && hasChildren && expanded) {
        elements.push(
          h('div', { class: 'mixed-sidebar-submenu__children' },
            item.children!.map(child => renderMenuItem(child, level + 1))
          )
        );
      }

      return h('div', { class: 'mixed-sidebar-submenu__group', key: item.key }, elements);
    };

    return () => {
      // vben 风格的按钮布局：
      // - 折叠按钮在左下角（只在固定模式下显示）
      // - 固定按钮在右下角（只在未折叠时显示）
      const collapseBtn = props.showCollapseBtn && h('button', {
        class: 'mixed-sidebar-submenu__collapse-btn',
        onClick: () => emit('collapse'),
        title: props.collapsed ? '展开' : '收起',
      }, h('svg', {
        class: 'h-4 w-4',
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '2',
      }, h('path', { d: props.collapsed ? 'M13 7l5 5-5 5M6 7l5 5-5 5' : 'M11 17l-5-5 5-5m7 10l-5-5 5-5' })));
      
      const pinBtn = props.showPinBtn && h('button', {
        class: 'mixed-sidebar-submenu__pin-btn',
        onClick: () => emit('togglePin'),
        title: props.pinned ? '取消固定' : '固定',
      }, h('svg', {
        class: 'h-3.5 w-3.5',
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '2',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
      }, props.pinned 
        ? [
            h('line', { x1: '2', x2: '22', y1: '2', y2: '22' }),
            h('line', { x1: '12', x2: '12', y1: '17', y2: '22' }),
            h('path', { d: 'M9 9v1.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h12' }),
            h('path', { d: 'M15 9.34V6h1a2 2 0 0 0 0-4H7.89' }),
          ]
        : [
            h('line', { x1: '12', x2: '12', y1: '17', y2: '22' }),
            h('path', { d: 'M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z' }),
          ]
      ));
      
      const containerClass = [
        'mixed-sidebar-submenu',
        props.collapsed && 'mixed-sidebar-submenu--collapsed',
      ].filter(Boolean).join(' ');
      
      return h('div', { class: containerClass }, [
        // 折叠按钮（左下角）
        collapseBtn,
        // 固定按钮（右下角）
        pinBtn,
        // 标题（折叠模式不显示）
        !props.collapsed && props.title && h('div', { class: 'mixed-sidebar-submenu__title' }, props.title),
        // 菜单列表
        h('nav', { class: 'mixed-sidebar-submenu__nav' },
          props.menus.map(item => renderMenuItem(item, 0))
        ),
      ]);
    };
  },
});
</script>

<style>
/* 混合侧边栏菜单样式 */
.mixed-sidebar-menu {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.mixed-sidebar-menu__root {
  padding: 0.5rem 0;
}

.mixed-sidebar-menu__root-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 0.5rem;
  margin: 0.25rem 0.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.7);
  transition: all 150ms ease;
}

.mixed-sidebar-menu__root-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.mixed-sidebar-menu__root-item--active {
  background-color: var(--primary, #3b82f6) !important;
  color: #ffffff !important;
}

.mixed-sidebar-menu__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  font-size: 1.25rem;
  margin-bottom: 0.25rem;
}

.mixed-sidebar-menu__root-name {
  font-size: 0.625rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  text-align: center;
}

/* 子菜单样式 */
.mixed-sidebar-submenu {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.mixed-sidebar-submenu__title {
  padding: 1rem 1rem 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--foreground, #1f2937);
  border-bottom: 1px solid var(--border, rgba(0, 0, 0, 0.1));
  margin-bottom: 0.5rem;
}

.mixed-sidebar-submenu__nav {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

.mixed-sidebar-submenu__item {
  display: flex;
  align-items: center;
  padding: 0.625rem 0.75rem;
  margin: 0.125rem 0;
  border-radius: 0.375rem;
  cursor: pointer;
  color: var(--foreground, #4b5563);
  transition: all 150ms ease;
  font-size: 0.875rem;
}

.mixed-sidebar-submenu__item:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: var(--foreground, #1f2937);
}

.mixed-sidebar-submenu__item--active {
  background-color: var(--primary, #3b82f6) !important;
  color: #ffffff !important;
}

.mixed-sidebar-submenu__item--has-active-child {
  color: var(--primary, #3b82f6);
}

.mixed-sidebar-submenu__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  margin-right: 0.5rem;
  flex-shrink: 0;
}

.mixed-sidebar-submenu__name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mixed-sidebar-submenu__arrow {
  display: flex;
  align-items: center;
  margin-left: 0.5rem;
  transition: transform 200ms ease;
  flex-shrink: 0;
}

.mixed-sidebar-submenu__arrow--expanded {
  transform: rotate(90deg);
}

.mixed-sidebar-submenu__children {
  margin-left: 0.75rem;
  border-left: 1px solid var(--border, rgba(0, 0, 0, 0.1));
  padding-left: 0.5rem;
}

.mixed-sidebar-submenu__item--level-1 {
  padding-left: 1rem;
}

.mixed-sidebar-submenu__item--level-2 {
  padding-left: 1.25rem;
}

/* 浅色主题 */
.layout-sidebar--light .mixed-sidebar-menu__root-item {
  color: #4b5563;
}

.layout-sidebar--light .mixed-sidebar-menu__root-item:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: #1f2937;
}

/* 深色主题下子菜单样式 */
.layout-sidebar--dark .mixed-sidebar-submenu__title {
  color: rgba(255, 255, 255, 0.9);
  border-bottom-color: rgba(255, 255, 255, 0.1);
}

.layout-sidebar--dark .mixed-sidebar-submenu__item {
  color: rgba(255, 255, 255, 0.7);
}

.layout-sidebar--dark .mixed-sidebar-submenu__item:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.95);
}

.layout-sidebar--dark .mixed-sidebar-submenu__item--active {
  background-color: var(--primary, #3b82f6) !important;
  color: #ffffff !important;
}

.layout-sidebar--dark .mixed-sidebar-submenu__item--has-active-child {
  color: var(--primary, #3b82f6);
}

.layout-sidebar--dark .mixed-sidebar-submenu__children {
  border-left-color: rgba(255, 255, 255, 0.1);
}
</style>
