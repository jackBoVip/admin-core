<script setup lang="ts">
/**
 * 标签栏组件
 * @description 支持拖拽排序、中键关闭、滚轮切换、最大化等功能
 */
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useLayoutContext, useLayoutComputed, useTabsState, useSidebarState } from '../../composables';

const context = useLayoutContext();
const layoutComputed = useLayoutComputed();
const { 
  tabs, 
  activeKey, 
  handleSelect, 
  handleClose, 
  handleCloseAll, 
  handleCloseOther, 
  handleRefresh,
  handleSort,
} = useTabsState();
const { collapsed: sidebarCollapsed } = useSidebarState();

// 配置
const tabbarConfig = computed(() => context.props.tabbar || {});
const styleType = computed(() => tabbarConfig.value.styleType || 'chrome');

// 拖拽相关状态
const dragState = ref<{
  isDragging: boolean;
  dragIndex: number | null;
  dropIndex: number | null;
}>({
  isDragging: false,
  dragIndex: null,
  dropIndex: null,
});

// 最大化状态
const isMaximized = ref(false);

// 标签列表容器引用
const tabsContainerRef = ref<HTMLElement | null>(null);
void tabsContainerRef;

// 右键菜单
const contextMenuVisible = ref(false);
const contextMenuPosition = ref({ x: 0, y: 0 });
const contextMenuTargetKey = ref<string | null>(null);

// 类名
const tabbarClass = computed(() => [
  'layout-tabbar',
  `layout-tabbar--${styleType.value}`,
  {
    'layout-tabbar--with-sidebar': layoutComputed.value.showSidebar && !context.props.isMobile,
    'layout-tabbar--collapsed': sidebarCollapsed.value && !context.props.isMobile,
  },
]);

// 样式
const tabbarStyle = computed(() => ({
  height: `${layoutComputed.value.tabbarHeight}px`,
  top: `${layoutComputed.value.headerHeight}px`,
  left: layoutComputed.value.showSidebar && !context.props.isMobile
    ? `${layoutComputed.value.sidebarWidth}px`
    : '0',
}));

// 处理标签点击
const onTabClick = (key: string) => {
  handleSelect(key);
};

// 处理标签关闭
const onTabClose = (e: Event, key: string) => {
  e.stopPropagation();
  handleClose(key);
};

// 处理右键菜单
const onContextMenu = (e: MouseEvent, key: string) => {
  e.preventDefault();
  contextMenuTargetKey.value = key;
  contextMenuPosition.value = { x: e.clientX, y: e.clientY };
  contextMenuVisible.value = true;
};

// 关闭右键菜单
const closeContextMenu = () => {
  contextMenuVisible.value = false;
  contextMenuTargetKey.value = null;
};

// 右键菜单操作
const contextMenuActions = {
  reload: () => {
    if (contextMenuTargetKey.value) {
      handleRefresh(contextMenuTargetKey.value);
    }
    closeContextMenu();
  },
  close: () => {
    if (contextMenuTargetKey.value) {
      handleClose(contextMenuTargetKey.value);
    }
    closeContextMenu();
  },
  closeOther: () => {
    if (contextMenuTargetKey.value) {
      handleCloseOther(contextMenuTargetKey.value);
    }
    closeContextMenu();
  },
  closeAll: () => {
    handleCloseAll();
    closeContextMenu();
  },
};

// 获取标签样式类 - 使用 computed 缓存避免重复计算
const tabClassMap = computed(() => {
  const map = new Map<string, (string | Record<string, boolean>)[]>();
  tabs.value.forEach((tab, index) => {
    map.set(tab.key, [
      'layout-tabbar__tab',
      `layout-tabbar__tab--${styleType.value}`,
      {
        'layout-tabbar__tab--active': tab.key === activeKey.value,
        'layout-tabbar__tab--affix': !!tab.affix,
        'layout-tabbar__tab--dragging': dragState.value.isDragging && dragState.value.dragIndex === index,
        'layout-tabbar__tab--drop-target': dragState.value.isDragging && dragState.value.dropIndex === index,
      },
    ]);
  });
  return map;
});

// 获取标签样式类
const getTabClass = (tab: typeof tabs.value[0]) => tabClassMap.value.get(tab.key) || [];

// ==================== 拖拽排序功能 ====================
const onDragStart = (e: DragEvent, index: number) => {
  if (!tabbarConfig.value.draggable) return;
  
  // 固定标签不可拖拽
  const tab = tabs.value[index];
  if (tab?.affix) {
    e.preventDefault();
    return;
  }
  
  dragState.value = {
    isDragging: true,
    dragIndex: index,
    dropIndex: null,
  };
  
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  }
};

const onDragOver = (e: DragEvent, index: number) => {
  if (!tabbarConfig.value.draggable || !dragState.value.isDragging) return;
  
  e.preventDefault();
  
  // 固定标签位置不可替换
  const tab = tabs.value[index];
  if (tab?.affix) return;
  
  dragState.value.dropIndex = index;
};

const onDragLeave = () => {
  dragState.value.dropIndex = null;
};

const onDrop = (e: DragEvent, toIndex: number) => {
  if (!tabbarConfig.value.draggable) return;
  
  e.preventDefault();
  
  const fromIndex = dragState.value.dragIndex;
  if (fromIndex !== null && fromIndex !== toIndex) {
    // 固定标签位置不可替换
    const targetTab = tabs.value[toIndex];
    if (!targetTab?.affix) {
      handleSort(fromIndex, toIndex);
    }
  }
  
  dragState.value = {
    isDragging: false,
    dragIndex: null,
    dropIndex: null,
  };
};

const onDragEnd = () => {
  dragState.value = {
    isDragging: false,
    dragIndex: null,
    dropIndex: null,
  };
};

// ==================== 中键关闭功能 ====================
const onMouseDown = (e: MouseEvent, tab: typeof tabs.value[0]) => {
  // 中键点击
  if (e.button === 1 && tabbarConfig.value.middleClickToClose !== false) {
    e.preventDefault();
    if (tab.closable !== false && !tab.affix) {
      handleClose(tab.key);
    }
  }
};

// ==================== 滚轮切换功能 ====================
const onWheel = (e: WheelEvent) => {
  if (!tabbarConfig.value.wheelable) return;
  
  e.preventDefault();
  
  const currentIndex = tabs.value.findIndex(tab => tab.key === activeKey.value);
  if (currentIndex === -1) return;
  
  let nextIndex: number;
  if (e.deltaY > 0 || e.deltaX > 0) {
    // 向下/右滚动 - 下一个标签
    nextIndex = currentIndex + 1;
    if (nextIndex >= tabs.value.length) {
      nextIndex = 0; // 循环到第一个
    }
  } else {
    // 向上/左滚动 - 上一个标签
    nextIndex = currentIndex - 1;
    if (nextIndex < 0) {
      nextIndex = tabs.value.length - 1; // 循环到最后一个
    }
  }
  
  const nextTab = tabs.value[nextIndex];
  if (nextTab) {
    handleSelect(nextTab.key);
  }
};

// ==================== 最大化功能 ====================
const toggleMaximize = () => {
  isMaximized.value = !isMaximized.value;
  // 触发事件通知父组件
  context.events?.onTabMaximize?.(isMaximized.value);
  
  // 添加/移除 body class 来控制其他元素的显示
  if (isMaximized.value) {
    document.body.classList.add('layout-content-maximized');
  } else {
    document.body.classList.remove('layout-content-maximized');
  }
};

// 监听 ESC 键退出最大化
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && isMaximized.value) {
    toggleMaximize();
  }
};

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown);
  // 确保退出时移除 class
  document.body.classList.remove('layout-content-maximized');
});
</script>

<template>
  <div :class="tabbarClass" :style="tabbarStyle" @click="closeContextMenu">
    <div class="layout-tabbar__inner flex h-full items-end">
      <!-- 左侧插槽 -->
      <div v-if="$slots.left" class="layout-tabbar__left shrink-0 px-2">
        <slot name="left" />
      </div>

      <!-- 标签列表 -->
      <div 
        ref="tabsContainerRef"
        class="layout-tabbar__tabs flex flex-1 items-end overflow-x-auto scrollbar-none"
        @wheel.passive="onWheel"
      >
        <slot>
          <div
            v-for="(tab, index) in tabs"
            :key="tab.key"
            :class="getTabClass(tab)"
            :draggable="tabbarConfig.draggable && !tab.affix"
            @click="onTabClick(tab.key)"
            @contextmenu="onContextMenu($event, tab.key)"
            @mousedown="onMouseDown($event, tab)"
            @dragstart="onDragStart($event, index)"
            @dragover="onDragOver($event, index)"
            @dragleave="onDragLeave"
            @drop="onDrop($event, index)"
            @dragend="onDragEnd"
          >
            <!-- 图标 -->
            <span v-if="tabbarConfig.showIcon && tab.icon" class="layout-tabbar__tab-icon mr-1.5">
              <slot name="tab-icon" :tab="tab">
                <span class="text-sm">{{ tab.icon }}</span>
              </slot>
            </span>
            
            <!-- 名称 -->
            <span class="layout-tabbar__tab-name truncate">
              {{ tab.name }}
            </span>
            
            <!-- 关闭按钮 -->
            <button
              v-if="tab.closable !== false && !tab.affix"
              type="button"
              class="layout-tabbar__tab-close ml-1.5 flex h-4 w-4 items-center justify-center rounded-full opacity-0 transition-opacity hover:bg-black/10 group-hover:opacity-100"
              :class="{ 'opacity-100': tab.key === activeKey }"
              @click="onTabClose($event, tab.key)"
            >
              <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </slot>
      </div>

      <!-- 右侧插槽 -->
      <div v-if="$slots.right" class="layout-tabbar__right shrink-0 px-2">
        <slot name="right" />
      </div>

      <!-- 最大化按钮 -->
      <div v-if="tabbarConfig.showMaximize" class="layout-tabbar__maximize shrink-0 px-1">
        <button
          type="button"
          class="flex h-7 w-7 items-center justify-center rounded transition-colors hover:bg-black/5"
          :title="isMaximized ? context.t('layout.tabbar.restore') : context.t('layout.tabbar.maximize')"
          @click="toggleMaximize"
        >
          <svg v-if="!isMaximized" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
          </svg>
          <svg v-else class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
          </svg>
        </button>
      </div>

      <!-- 更多操作 -->
      <div v-if="tabbarConfig.showMore !== false" class="layout-tabbar__more shrink-0 px-2">
        <slot name="extra">
          <button
            type="button"
            class="flex h-7 w-7 items-center justify-center rounded transition-colors hover:bg-black/5"
            :title="context.t('layout.common.more')"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="1" />
              <circle cx="19" cy="12" r="1" />
              <circle cx="5" cy="12" r="1" />
            </svg>
          </button>
        </slot>
      </div>
    </div>

    <!-- 右键菜单 -->
    <Teleport to="body">
      <div
        v-if="contextMenuVisible"
        class="layout-tabbar__context-menu fixed z-layout-overlay min-w-32 rounded-md border border-border bg-white py-1 shadow-lg"
        :style="{ left: `${contextMenuPosition.x}px`, top: `${contextMenuPosition.y}px` }"
      >
        <button
          type="button"
          class="flex w-full items-center px-3 py-1.5 text-sm hover:bg-gray-100"
          @click="contextMenuActions.reload"
        >
          {{ context.t('layout.tabbar.contextMenu.reload') }}
        </button>
        <button
          type="button"
          class="flex w-full items-center px-3 py-1.5 text-sm hover:bg-gray-100"
          @click="contextMenuActions.close"
        >
          {{ context.t('layout.tabbar.contextMenu.close') }}
        </button>
        <button
          type="button"
          class="flex w-full items-center px-3 py-1.5 text-sm hover:bg-gray-100"
          @click="contextMenuActions.closeOther"
        >
          {{ context.t('layout.tabbar.contextMenu.closeOther') }}
        </button>
        <button
          type="button"
          class="flex w-full items-center px-3 py-1.5 text-sm hover:bg-gray-100"
          @click="contextMenuActions.closeAll"
        >
          {{ context.t('layout.tabbar.contextMenu.closeAll') }}
        </button>
      </div>
    </Teleport>

    <!-- 点击空白关闭菜单的遮罩 -->
    <Teleport to="body">
      <div
        v-if="contextMenuVisible"
        class="fixed inset-0 z-layout-overlay"
        @click="closeContextMenu"
      />
    </Teleport>
  </div>
</template>

<style>
/* 样式已在核心 CSS 中定义 */
</style>
