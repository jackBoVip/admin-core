<script setup lang="ts">
/**
 * 侧边栏菜单组件
 * @description 自动渲染菜单数据，支持多级嵌套
 * 折叠状态下支持悬停弹出子菜单（类似 vben）
 */
import { computed, ref, onUnmounted } from 'vue';
import { useLayoutContext, useLayoutComputed, useSidebarState } from '../../composables';
import { useMenuState } from '../../composables/use-layout-state';
import type { MenuItem } from '@admin-core/layout';
import {
  hasChildren,
  isMenuActive,
  hasActiveChild as checkHasActiveChild,
  getMenuItemClassName,
  getIconDefinition,
  getIconRenderType,
} from '@admin-core/layout';

const context = useLayoutContext();
const layoutComputed = useLayoutComputed();
const { collapsed, expandOnHovering } = useSidebarState();
const { openKeys, activeKey, handleSelect, handleOpenChange } = useMenuState();

// 侧边栏主题（用于弹出菜单）
const sidebarTheme = computed(() => layoutComputed.value.sidebarTheme || 'light');

// 菜单数据
const menus = computed<MenuItem[]>(() => context.props.menus || []);

// 展开的菜单
const expandedKeys = ref<Set<string>>(new Set(openKeys.value));

// 弹出菜单状态（折叠时使用）
const popupMenu = ref<{
  item: MenuItem | null;
  visible: boolean;
  top: number;
  left: number;
}>({
  item: null,
  visible: false,
  top: 0,
  left: 0,
});

// 弹出菜单展开状态
const popupExpandedKeys = ref<Set<string>>(new Set());

// 悬停定时器
let hoverTimer: ReturnType<typeof setTimeout> | null = null;
let leaveTimer: ReturnType<typeof setTimeout> | null = null;

// 切换菜单展开
const toggleExpand = (key: string) => {
  if (expandedKeys.value.has(key)) {
    expandedKeys.value.delete(key);
  } else {
    expandedKeys.value.add(key);
  }
  handleOpenChange(Array.from(expandedKeys.value));
};

// 切换弹出菜单展开
const togglePopupExpand = (key: string) => {
  if (popupExpandedKeys.value.has(key)) {
    popupExpandedKeys.value.delete(key);
  } else {
    popupExpandedKeys.value.add(key);
  }
};

// 判断菜单是否展开
const isExpanded = (key: string) => expandedKeys.value.has(key);
const isPopupExpanded = (key: string) => popupExpandedKeys.value.has(key);

// 判断是否激活
const isActive = (item: MenuItem) => isMenuActive(item, activeKey.value);

// 判断是否有激活的子菜单
const hasActiveChildItem = (item: MenuItem) => checkHasActiveChild(item, activeKey.value);

// 处理菜单点击
const onMenuClick = (item: MenuItem) => {
  if (hasChildren(item)) {
    if (collapsed.value && !expandOnHovering.value) {
      // 折叠状态下，点击有子菜单的项不做任何操作（由悬停处理）
      return;
    }
    toggleExpand(item.key);
  } else {
    handleSelect(item.key);
    hidePopupMenu();
  }
};

// 处理弹出菜单项点击
const onPopupMenuClick = (item: MenuItem) => {
  if (hasChildren(item)) {
    togglePopupExpand(item.key);
  } else {
    handleSelect(item.key);
    hidePopupMenu();
  }
};

// 显示弹出菜单
const showPopupMenu = (item: MenuItem, event: MouseEvent) => {
  if (!collapsed.value || expandOnHovering.value) return;
  if (!hasChildren(item)) return;
  
  if (leaveTimer) {
    clearTimeout(leaveTimer);
    leaveTimer = null;
  }
  
  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  const sidebar = target.closest('.layout-sidebar');
  const sidebarRect = sidebar?.getBoundingClientRect();
  
  popupMenu.value = {
    item,
    visible: true,
    top: rect.top,
    left: sidebarRect ? sidebarRect.right : rect.right,
  };
  
  // 自动展开有激活子菜单的项
  popupExpandedKeys.value.clear();
  const expandActiveChildren = (children: MenuItem[]) => {
    for (const child of children) {
      if (hasActiveChildItem(child) || isActive(child)) {
        popupExpandedKeys.value.add(child.key);
        if (child.children) {
          expandActiveChildren(child.children);
        }
      }
    }
  };
  if (item.children) {
    expandActiveChildren(item.children);
  }
};

// 隐藏弹出菜单
const hidePopupMenu = () => {
  leaveTimer = setTimeout(() => {
    popupMenu.value.visible = false;
    popupMenu.value.item = null;
  }, 100);
};

// 取消隐藏
const cancelHidePopup = () => {
  if (leaveTimer) {
    clearTimeout(leaveTimer);
    leaveTimer = null;
  }
};

// 获取菜单项类名
const getItemClass = (item: MenuItem, level: number) => {
  return getMenuItemClassName(item, {
    level,
    isActive: isActive(item),
    isExpanded: isExpanded(item.key),
    hasActiveChild: hasActiveChildItem(item),
  });
};

// 获取弹出菜单项类名
const getPopupItemClass = (item: MenuItem, level: number) => {
  const classes = ['sidebar-menu__popup-item'];
  if (isActive(item)) classes.push('sidebar-menu__popup-item--active');
  if (hasActiveChildItem(item)) classes.push('sidebar-menu__popup-item--has-active-child');
  if (level > 0) classes.push(`sidebar-menu__popup-item--level-${level}`);
  return classes.join(' ');
};

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

// 清理定时器
onUnmounted(() => {
  if (hoverTimer) clearTimeout(hoverTimer);
  if (leaveTimer) clearTimeout(leaveTimer);
});
</script>

<template>
  <nav class="sidebar-menu">
    <!-- 一级菜单 -->
    <template v-for="item in menus" :key="item.key">
      <div v-if="!item.hidden" class="sidebar-menu__group">
        <!-- 菜单项 -->
        <div 
          :class="getItemClass(item, 0)" 
          @click="onMenuClick(item)"
          @mouseenter="showPopupMenu(item, $event)"
          @mouseleave="hidePopupMenu"
        >
          <!-- 图标 -->
          <span v-if="item.icon" class="sidebar-menu__icon">
            <svg
              v-if="getIconType(item.icon) === 'svg'"
              class="h-[1.125rem] w-[1.125rem]"
              :viewBox="getSvgViewBox(item.icon)"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path :d="getSvgPath(item.icon)" />
            </svg>
            <template v-else>{{ item.icon }}</template>
          </span>

          <!-- 名称 -->
          <span v-if="!collapsed || expandOnHovering" class="sidebar-menu__name">{{ item.name }}</span>

          <!-- 展开箭头 -->
          <span
            v-if="hasChildren(item) && (!collapsed || expandOnHovering)"
            class="sidebar-menu__arrow"
            :class="{ 'sidebar-menu__arrow--expanded': isExpanded(item.key) }"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </span>

          <!-- 折叠状态下有子菜单时显示箭头 -->
          <span
            v-if="hasChildren(item) && collapsed && !expandOnHovering"
            class="sidebar-menu__arrow-right"
          >
            <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </span>
        </div>

        <!-- 二级菜单（展开状态） -->
        <div v-if="hasChildren(item) && (!collapsed || expandOnHovering) && isExpanded(item.key)" class="sidebar-menu__submenu">
          <template v-for="child in item.children" :key="child.key">
            <div v-if="!child.hidden" class="sidebar-menu__subgroup">
              <div :class="getItemClass(child, 1)" @click="onMenuClick(child)">
                <span v-if="child.icon" class="sidebar-menu__icon">
                  <svg
                    v-if="getIconType(child.icon) === 'svg'"
                    class="h-[1.125rem] w-[1.125rem]"
                    :viewBox="getSvgViewBox(child.icon)"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path :d="getSvgPath(child.icon)" />
                  </svg>
                  <template v-else>{{ child.icon }}</template>
                </span>
                <span class="sidebar-menu__name">{{ child.name }}</span>
                <span
                  v-if="hasChildren(child)"
                  class="sidebar-menu__arrow"
                  :class="{ 'sidebar-menu__arrow--expanded': isExpanded(child.key) }"
                >
                  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </span>
              </div>

              <!-- 三级菜单 -->
              <div v-if="hasChildren(child) && isExpanded(child.key)" class="sidebar-menu__submenu">
                <template v-for="grandchild in child.children" :key="grandchild.key">
                  <div v-if="!grandchild.hidden" class="sidebar-menu__subgroup">
                    <div :class="getItemClass(grandchild, 2)" @click="onMenuClick(grandchild)">
                      <span v-if="grandchild.icon" class="sidebar-menu__icon">
                        <svg
                          v-if="getIconType(grandchild.icon) === 'svg'"
                          class="h-[1.125rem] w-[1.125rem]"
                          :viewBox="getSvgViewBox(grandchild.icon)"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <path :d="getSvgPath(grandchild.icon)" />
                        </svg>
                        <template v-else>{{ grandchild.icon }}</template>
                      </span>
                      <span class="sidebar-menu__name">{{ grandchild.name }}</span>
                      <span
                        v-if="hasChildren(grandchild)"
                        class="sidebar-menu__arrow"
                        :class="{ 'sidebar-menu__arrow--expanded': isExpanded(grandchild.key) }"
                      >
                        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </span>
                    </div>

                    <!-- 四级菜单 -->
                    <div v-if="hasChildren(grandchild) && isExpanded(grandchild.key)" class="sidebar-menu__submenu">
                      <template v-for="item4 in grandchild.children" :key="item4.key">
                        <div
                          v-if="!item4.hidden"
                          :class="getItemClass(item4, 3)"
                          @click="onMenuClick(item4)"
                        >
                          <span v-if="item4.icon" class="sidebar-menu__icon">
                            <svg
                              v-if="getIconType(item4.icon) === 'svg'"
                              class="h-[1.125rem] w-[1.125rem]"
                              :viewBox="getSvgViewBox(item4.icon)"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                            >
                              <path :d="getSvgPath(item4.icon)" />
                            </svg>
                            <template v-else>{{ item4.icon }}</template>
                          </span>
                          <span class="sidebar-menu__name">{{ item4.name }}</span>
                        </div>
                      </template>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </template>
        </div>
      </div>
    </template>

    <!-- 折叠状态下的弹出菜单 -->
    <Teleport to="body">
      <div
        v-if="popupMenu.visible && popupMenu.item && collapsed && !expandOnHovering"
        :class="['sidebar-menu__popup', `sidebar-menu__popup--${sidebarTheme}`]"
        :style="{ top: `${popupMenu.top}px`, left: `${popupMenu.left}px` }"
        @mouseenter="cancelHidePopup"
        @mouseleave="hidePopupMenu"
      >
        <!-- 弹出菜单标题 -->
        <div class="sidebar-menu__popup-title">{{ popupMenu.item.name }}</div>
        
        <!-- 子菜单列表 -->
        <div class="sidebar-menu__popup-content">
          <template v-for="child in popupMenu.item.children" :key="child.key">
            <div v-if="!child.hidden" class="sidebar-menu__popup-group">
              <div :class="getPopupItemClass(child, 0)" @click="onPopupMenuClick(child)">
                <span v-if="child.icon" class="sidebar-menu__popup-icon">
                  <svg
                    v-if="getIconType(child.icon) === 'svg'"
                    class="h-4 w-4"
                    :viewBox="getSvgViewBox(child.icon)"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path :d="getSvgPath(child.icon)" />
                  </svg>
                  <template v-else>{{ child.icon }}</template>
                </span>
                <span class="sidebar-menu__popup-name">{{ child.name }}</span>
                <span v-if="hasChildren(child)" class="sidebar-menu__popup-arrow" :class="{ 'sidebar-menu__popup-arrow--expanded': isPopupExpanded(child.key) }">
                  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </span>
              </div>
              
              <!-- 三级菜单 -->
              <div v-if="hasChildren(child) && isPopupExpanded(child.key)" class="sidebar-menu__popup-submenu">
                <template v-for="grandchild in child.children" :key="grandchild.key">
                  <div v-if="!grandchild.hidden" class="sidebar-menu__popup-group">
                    <div :class="getPopupItemClass(grandchild, 1)" @click="onPopupMenuClick(grandchild)">
                      <span v-if="grandchild.icon" class="sidebar-menu__popup-icon">
                        <svg
                          v-if="getIconType(grandchild.icon) === 'svg'"
                          class="h-4 w-4"
                          :viewBox="getSvgViewBox(grandchild.icon)"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <path :d="getSvgPath(grandchild.icon)" />
                        </svg>
                        <template v-else>{{ grandchild.icon }}</template>
                      </span>
                      <span class="sidebar-menu__popup-name">{{ grandchild.name }}</span>
                      <span v-if="hasChildren(grandchild)" class="sidebar-menu__popup-arrow" :class="{ 'sidebar-menu__popup-arrow--expanded': isPopupExpanded(grandchild.key) }">
                        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </span>
                    </div>
                    
                    <!-- 四级菜单 -->
                    <div v-if="hasChildren(grandchild) && isPopupExpanded(grandchild.key)" class="sidebar-menu__popup-submenu">
                      <template v-for="item4 in grandchild.children" :key="item4.key">
                        <div v-if="!item4.hidden" :class="getPopupItemClass(item4, 2)" @click="onPopupMenuClick(item4)">
                          <span v-if="item4.icon" class="sidebar-menu__popup-icon">
                            <svg
                              v-if="getIconType(item4.icon) === 'svg'"
                              class="h-4 w-4"
                              :viewBox="getSvgViewBox(item4.icon)"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                            >
                              <path :d="getSvgPath(item4.icon)" />
                            </svg>
                            <template v-else>{{ item4.icon }}</template>
                          </span>
                          <span class="sidebar-menu__popup-name">{{ item4.name }}</span>
                        </div>
                      </template>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </template>
        </div>
      </div>
    </Teleport>
  </nav>
</template>
