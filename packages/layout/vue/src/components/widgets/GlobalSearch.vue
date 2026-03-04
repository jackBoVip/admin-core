<script setup lang="ts">
/**
 * 全局搜索组件
 * @description 全局菜单搜索导航，支持快捷键 Ctrl+K
 */
import { computed, ref, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useLayoutContext } from '../../composables';
import LayoutIcon from '../common/LayoutIcon.vue';
import { LAYOUT_UI_TOKENS, type MenuItem } from '@admin-core/layout';

/**
 * 搜索相关 UI 令牌
 * @description 统一读取搜索结果数量与虚拟列表尺寸配置。
 */
const {
  SEARCH_MAX_RESULTS,
  SEARCH_RESULT_MAX_HEIGHT,
  SEARCH_RESULT_ITEM_HEIGHT,
} = LAYOUT_UI_TOKENS;

/**
 * 搜索结果菜单项结构，扩展父级路径与预构建搜索文本。
 */
interface SearchMenuItem extends MenuItem {
  /** 父级菜单名称路径（用于展示层级面包屑）。 */
  parentPath?: string[];
  /** 归一化后的搜索索引文本。 */
  searchText: string;
}

/**
 * 布局上下文
 * @description 提供菜单数据、路由能力与快捷键配置。
 */
const context = useLayoutContext();

/**
 * 搜索弹层开关状态。
 */
const isOpen = ref(false);
/**
 * 当前搜索关键字。
 */
const keyword = ref('');
/**
 * 键盘导航选中项索引。
 */
const selectedIndex = ref(0);
/**
 * 结果列表当前滚动位置。
 */
const scrollTop = ref(0);
/**
 * 搜索输入框引用。
 */
const inputRef = ref<HTMLInputElement | null>(null);
/**
 * 结果列表容器引用。
 */
const resultListRef = ref<HTMLDivElement | null>(null);

/**
 * 当前可搜索菜单集合。
 */
const menus = computed(() => context.props.menus || []);
/**
 * 快捷键配置项。
 */
const shortcutConfig = computed(() => context.props.shortcutKeys || {});
/**
 * 是否启用全局搜索快捷键。
 */
const shortcutEnabled = computed(
  () => shortcutConfig.value.enable !== false && shortcutConfig.value.globalSearch !== false
);

/**
 * 扁平化后的可检索菜单列表。
 */
const flatMenus = computed<SearchMenuItem[]>(() => {
  if (!isOpen.value) return [];
  const result: SearchMenuItem[] = [];
  
  /**
   * 递归拍平菜单树并生成搜索索引字段。
   *
   * @param items 当前层菜单。
   * @param parentPath 父级路径链。
   */
  const flatten = (items: MenuItem[], parentPath: string[] = []) => {
    for (const item of items) {
      const currentPath = [...parentPath, item.name];
      
      /** 仅收集可导航（存在 path）且未隐藏的菜单项。 */
      if (item.path && !item.hidden) {
        const name = item.name || '';
        const path = item.path || '';
        result.push({
          ...item,
          searchText: `${name} ${path}`.toLowerCase(),
          parentPath: parentPath.length > 0 ? parentPath : undefined,
        });
      }
      
      /** 递归处理子菜单。 */
      if (item.children?.length) {
        flatten(item.children, currentPath);
      }
    }
  };
  
  flatten(menus.value);
  return result;
});

/**
 * 根据关键字过滤得到的搜索结果列表。
 */
const searchResults = computed(() => {
  const query = keyword.value.trim().toLowerCase();
  if (!query) return [];

  const results: SearchMenuItem[] = [];
  for (const item of flatMenus.value) {
    if (item.searchText.includes(query)) {
      results.push(item);
      if (results.length >= SEARCH_MAX_RESULTS) break;
    }
  }
  return results;
});

/**
 * 虚拟列表单项高度。
 */
const itemHeight = ref<number>(SEARCH_RESULT_ITEM_HEIGHT);
/**
 * 结果列表尺寸监听器。
 */
const listResizeObserver = ref<ResizeObserver | null>(null);
/**
 * 搜索虚拟列表超出渲染数量
 * @description 在可视区上下额外渲染项数，降低滚动空白与闪烁。
 */
const RESULT_OVERSCAN = LAYOUT_UI_TOKENS.RESULT_OVERSCAN;
/**
 * 结果列表总高度。
 */
const totalHeight = computed(() => searchResults.value.length * itemHeight.value);
/**
 * 结果列表视口高度。
 */
const viewportHeight = computed(() =>
  totalHeight.value === 0 ? SEARCH_RESULT_MAX_HEIGHT : Math.min(totalHeight.value, SEARCH_RESULT_MAX_HEIGHT)
);
/**
 * 虚拟列表起始索引。
 */
const startIndex = computed(() =>
  Math.max(0, Math.floor(scrollTop.value / itemHeight.value) - RESULT_OVERSCAN)
);
/**
 * 虚拟列表结束索引。
 */
const endIndex = computed(() =>
  Math.min(
    searchResults.value.length,
    Math.ceil((scrollTop.value + viewportHeight.value) / itemHeight.value) + RESULT_OVERSCAN
  )
);
/**
 * 当前视口内可见结果集合。
 */
const visibleResults = computed(() =>
  searchResults.value.slice(startIndex.value, endIndex.value)
);

watch(
  [isOpen, totalHeight, viewportHeight, scrollTop],
  ([open, total, viewHeight, currentTop]) => {
    if (!open) return;
    const maxScrollTop = Math.max(0, total - viewHeight);
    if (currentTop <= maxScrollTop) return;
    const nextTop = Math.max(0, maxScrollTop);
    if (resultListRef.value) {
      resultListRef.value.scrollTop = nextTop;
    }
    if (scrollTop.value !== nextTop) {
      scrollTop.value = nextTop;
    }
  }
);

/**
 * 打开全局搜索弹层并重置输入与选中态。
 */
const openSearch = () => {
  isOpen.value = true;
  keyword.value = '';
  selectedIndex.value = 0;
  nextTick(() => {
    inputRef.value?.focus();
  });
};

/**
 * 关闭全局搜索弹层并清理搜索状态。
 */
const closeSearch = () => {
  isOpen.value = false;
  keyword.value = '';
  selectedIndex.value = 0;
};

/**
 * 选择搜索结果项并执行导航。
 *
 * @param item 选中的菜单项。
 */
const selectItem = (item: MenuItem) => {
  const query = keyword.value.trim();
  context.events.onGlobalSearch?.(query);

  if (item.path) {
    /** 存在路由能力时执行导航。 */
    if (context.props.router?.navigate) {
      context.props.router.navigate(item.path);
    }
  }
  closeSearch();
};

/**
 * 处理搜索结果点击事件。
 *
 * @param e 鼠标事件。
 */
const handleResultClick = (e: MouseEvent) => {
  const index = Number((e.currentTarget as HTMLElement | null)?.dataset?.index);
  if (Number.isNaN(index)) return;
  const item = searchResults.value[index];
  if (item) selectItem(item);
};

/**
 * 处理搜索结果悬停事件，同步选中索引。
 *
 * @param e 鼠标事件。
 */
const handleResultMouseEnter = (e: MouseEvent) => {
  const index = Number((e.currentTarget as HTMLElement | null)?.dataset?.index);
  if (Number.isNaN(index)) return;
  selectedIndex.value = index;
};

/**
 * 处理搜索面板键盘导航。
 *
 * @param e 键盘事件。
 */
const handleKeydown = (e: KeyboardEvent) => {
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      if (selectedIndex.value < searchResults.value.length - 1) {
        selectedIndex.value++;
        scrollToSelected();
      }
      break;
    case 'ArrowUp':
      e.preventDefault();
      if (selectedIndex.value > 0) {
        selectedIndex.value--;
        scrollToSelected();
      }
      break;
    case 'Enter':
      e.preventDefault();
      if (searchResults.value[selectedIndex.value]) {
        selectItem(searchResults.value[selectedIndex.value]);
      }
      break;
    case 'Escape':
      e.preventDefault();
      closeSearch();
      break;
  }
};

/**
 * 确保指定索引项在可视区域内。
 *
 * @param index 目标结果索引。
 */
const ensureIndexVisible = (index: number) => {
  const list = resultListRef.value;
  if (!list) return;
  const itemTop = index * itemHeight.value;
  const itemBottom = itemTop + itemHeight.value;
  const viewTop = list.scrollTop;
  const viewBottom = viewTop + list.clientHeight;

  if (itemTop < viewTop) {
    list.scrollTop = itemTop;
    if (scrollTop.value !== itemTop) {
      scrollTop.value = itemTop;
    }
    return;
  }
  if (itemBottom > viewBottom) {
    const nextTop = Math.max(0, itemBottom - list.clientHeight);
    list.scrollTop = nextTop;
    if (scrollTop.value !== nextTop) {
      scrollTop.value = nextTop;
    }
  }
};

/**
 * 在下一个渲染周期滚动到当前选中项。
 */
const scrollToSelected = () => {
  nextTick(() => {
    ensureIndexVisible(selectedIndex.value);
  });
};

/**
 * 处理全局快捷键（`Ctrl/Cmd + K`）切换搜索面板。
 *
 * @param e 键盘事件。
 */
const handleGlobalKeydown = (e: KeyboardEvent) => {
  /** `Ctrl/Cmd + K` 切换搜索弹层开关。 */
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    if (isOpen.value) {
      closeSearch();
    } else {
      openSearch();
    }
  }
};

/**
 * 监听关键字变化并重置选中索引与滚动位置。
 */
watch(keyword, () => {
  if (selectedIndex.value !== 0) {
    selectedIndex.value = 0;
  }
  if (resultListRef.value) {
    resultListRef.value.scrollTop = 0;
  }
  if (scrollTop.value !== 0) {
    scrollTop.value = 0;
  }
});

watch(isOpen, (open) => {
  if (open) return;
  if (resultListRef.value) {
    resultListRef.value.scrollTop = 0;
  }
  if (scrollTop.value !== 0) {
    scrollTop.value = 0;
  }
});

watch([isOpen, () => searchResults.value.length], ([open]) => {
  if (!open) return;
  nextTick(() => {
    const list = resultListRef.value;
    if (!list) return;
    const firstItem = list.querySelector('.layout-list-item') as HTMLElement | null;
    if (!firstItem) return;
    const height = firstItem.getBoundingClientRect().height;
    if (height > 0 && height !== itemHeight.value) {
      itemHeight.value = height;
    }
    if (typeof ResizeObserver !== 'undefined') {
      listResizeObserver.value?.disconnect();
      listResizeObserver.value = new ResizeObserver(() => {
        const currentItem = list.querySelector('.layout-list-item') as HTMLElement | null;
        if (!currentItem) return;
        const nextHeight = currentItem.getBoundingClientRect().height;
        if (nextHeight > 0 && nextHeight !== itemHeight.value) {
          itemHeight.value = nextHeight;
        }
      });
      listResizeObserver.value.observe(firstItem);
    }
  });
});

watch(isOpen, (open) => {
  if (open) return;
  if (listResizeObserver.value) {
    listResizeObserver.value.disconnect();
    listResizeObserver.value = null;
  }
});

/**
 * 同步结果列表滚动位置。
 *
 * @param e 滚动事件。
 */
const handleScroll = (e: Event) => {
  const target = e.target as HTMLElement | null;
  if (!target) return;
  const nextTop = target.scrollTop;
  if (scrollTop.value !== nextTop) {
    scrollTop.value = nextTop;
  }
};

/**
 * 接管滚轮滚动，避免外层页面滚动穿透。
 *
 * @param e 滚轮事件。
 */
const handleWheel = (e: WheelEvent) => {
  if (e.ctrlKey) return;
  e.preventDefault();
  const target = e.currentTarget as HTMLElement | null;
  if (!target) return;
  target.scrollTop += e.deltaY;
  const nextTop = target.scrollTop;
  if (scrollTop.value !== nextTop) {
    scrollTop.value = nextTop;
  }
};

/**
 * 组件挂载时按配置启用快捷键监听。
 */
onMounted(() => {
  if (shortcutEnabled.value) {
    document.addEventListener('keydown', handleGlobalKeydown);
  }
});

watch(shortcutEnabled, (enabled) => {
  if (enabled) {
    document.addEventListener('keydown', handleGlobalKeydown);
  } else {
    document.removeEventListener('keydown', handleGlobalKeydown);
  }
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleGlobalKeydown);
  if (listResizeObserver.value) {
    listResizeObserver.value.disconnect();
    listResizeObserver.value = null;
  }
});

/**
 * 快捷键显示文本，自动适配 Mac 与非 Mac 平台。
 */
const shortcutText = computed(() => {
  const platform = typeof navigator === 'undefined' ? '' : navigator.platform;
  const isMac = platform.toLowerCase().includes('mac');
  return isMac ? '⌘K' : 'Ctrl K';
});
</script>

<template>
  <!-- 搜索按钮 -->
  <button
    type="button"
    class="header-search-btn"
    :data-state="isOpen ? 'open' : 'closed'"
    @click="openSearch"
  >
    <LayoutIcon name="search" size="sm" />
    <span class="hidden md:inline">{{ context.t('layout.header.search') }}</span>
    <kbd class="hidden md:inline">
      {{ shortcutText }}
    </kbd>
  </button>

  <!-- 搜索弹窗 -->
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="header-search-overlay"
        data-state="open"
      >
        <!-- 遮罩 -->
        <div
          class="header-search-backdrop"
          @click="closeSearch"
        />
        
        <!-- 搜索面板 -->
        <div
          class="header-search-modal"
          role="dialog"
          aria-modal="true"
          @keydown="handleKeydown"
        >
          <!-- 搜索输入框 -->
          <div class="header-search-modal__input-wrapper">
            <LayoutIcon name="search" size="md" class-name="text-muted-foreground" />
            <input
              ref="inputRef"
              v-model="keyword"
              type="text"
              class="header-search-modal__input"
              :placeholder="context.t('layout.search.placeholder')"
            />
            <kbd class="header-search-modal__kbd">
              ESC
            </kbd>
          </div>
          
          <!-- 搜索结果 -->
          <div
            ref="resultListRef"
            class="header-search-modal__results layout-scroll-container"
            :style="{ height: `${viewportHeight}px`, position: 'relative' }"
            @scroll="handleScroll"
            @wheel="handleWheel"
          >
            <!-- 无结果 -->
            <div v-if="keyword && searchResults.length === 0" class="py-12 text-center text-muted-foreground">
              {{ context.t('layout.search.noResults') }}
            </div>
            
            <!-- 结果列表 -->
            <template v-else-if="searchResults.length > 0">
              <div :style="{ height: `${totalHeight}px`, pointerEvents: 'none' }" />
              <div
                v-for="(item, index) in visibleResults"
                :key="item.key"
                :data-index="startIndex + index"
                class="header-search-modal__item"
                :data-selected="startIndex + index === selectedIndex ? 'true' : undefined"
                :style="{
                  position: 'absolute',
                  top: `${(startIndex + index) * itemHeight}px`,
                  left: '0.5rem',
                  right: '0.5rem',
                  height: `${itemHeight}px`,
                }"
                @click="handleResultClick"
                @mouseenter="handleResultMouseEnter"
              >
                <!-- 图标 -->
                <div class="header-search-modal__item-icon">
                  <span v-if="item.icon">{{ item.icon }}</span>
                  <LayoutIcon v-else name="search-item" size="sm" class-name="opacity-60" />
                </div>
                
                <!-- 内容 -->
                <div class="header-search-modal__item-content">
                  <div class="header-search-modal__item-title">{{ item.name }}</div>
                  <div v-if="item.parentPath" class="header-search-modal__item-path">
                    {{ item.parentPath.join(' / ') }}
                  </div>
                </div>
                
                <!-- 回车提示 -->
                <span v-if="startIndex + index === selectedIndex" class="text-xs opacity-40">
                  ↵
                </span>
              </div>
            </template>
            
            <!-- 提示 -->
            <div v-else class="py-12 text-center text-muted-foreground">
              {{ context.t('layout.search.tips') }}
            </div>
          </div>
          
          <!-- 底部提示 -->
          <div class="header-search-modal__footer">
            <div class="header-search-modal__footer-item">
              <kbd class="header-search-modal__kbd">↑</kbd>
              <kbd class="header-search-modal__kbd">↓</kbd>
              <span>{{ context.t('layout.search.navigate') }}</span>
            </div>
            <div class="header-search-modal__footer-item">
              <kbd class="header-search-modal__kbd">↵</kbd>
              <span>{{ context.t('layout.search.select') }}</span>
            </div>
            <div class="header-search-modal__footer-item">
              <kbd class="header-search-modal__kbd">esc</kbd>
              <span>{{ context.t('layout.search.close') }}</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 200ms ease;
}

.modal-enter-active > div:last-child,
.modal-leave-active > div:last-child {
  transition: transform 200ms ease, opacity 200ms ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from > div:last-child,
.modal-leave-to > div:last-child {
  transform: scale(0.95);
  opacity: 0;
}
</style>
