<script setup lang="ts">
/**
 * 全局搜索组件
 * @description 全局菜单搜索导航，支持快捷键 Ctrl+K
 */
import { computed, ref, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useLayoutContext } from '../../composables';
import type { MenuItem } from '@admin-core/layout';

interface SearchMenuItem extends MenuItem {
  parentPath?: string[];
  searchText: string;
}

const context = useLayoutContext();

// 搜索框状态
const isOpen = ref(false);
const keyword = ref('');
const selectedIndex = ref(0);
const scrollTop = ref(0);
const inputRef = ref<HTMLInputElement | null>(null);
const resultListRef = ref<HTMLDivElement | null>(null);

// 菜单数据
const menus = computed(() => context.props.menus || []);

// 扁平化菜单（用于搜索）
const flatMenus = computed<SearchMenuItem[]>(() => {
  if (!isOpen.value) return [];
  const result: SearchMenuItem[] = [];
  
  const flatten = (items: MenuItem[], parentPath: string[] = []) => {
    for (const item of items) {
      const currentPath = [...parentPath, item.name];
      
      // 只添加有路径的菜单项
      if (item.path && !item.hidden) {
        const name = item.name || '';
        const path = item.path || '';
        result.push({
          ...item,
          searchText: `${name} ${path}`.toLowerCase(),
          parentPath: parentPath.length > 0 ? parentPath : undefined,
        });
      }
      
      // 递归处理子菜单
      if (item.children?.length) {
        flatten(item.children, currentPath);
      }
    }
  };
  
  flatten(menus.value);
  return result;
});

// 搜索结果
const MAX_RESULTS = 200;
const searchResults = computed(() => {
  const query = keyword.value.trim().toLowerCase();
  if (!query) return [];

  const results: SearchMenuItem[] = [];
  for (const item of flatMenus.value) {
    if (item.searchText.includes(query)) {
      results.push(item);
      if (results.length >= MAX_RESULTS) break;
    }
  }
  return results;
});

const itemHeight = ref(56);
const listResizeObserver = ref<ResizeObserver | null>(null);
const RESULT_MAX_HEIGHT = 320;
const RESULT_OVERSCAN = 4;
const totalHeight = computed(() => searchResults.value.length * itemHeight.value);
const viewportHeight = computed(() =>
  totalHeight.value === 0 ? RESULT_MAX_HEIGHT : Math.min(totalHeight.value, RESULT_MAX_HEIGHT)
);
const startIndex = computed(() =>
  Math.max(0, Math.floor(scrollTop.value / itemHeight.value) - RESULT_OVERSCAN)
);
const endIndex = computed(() =>
  Math.min(
    searchResults.value.length,
    Math.ceil((scrollTop.value + viewportHeight.value) / itemHeight.value) + RESULT_OVERSCAN
  )
);
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

// 打开搜索框
const openSearch = () => {
  isOpen.value = true;
  keyword.value = '';
  selectedIndex.value = 0;
  nextTick(() => {
    inputRef.value?.focus();
  });
};

// 关闭搜索框
const closeSearch = () => {
  isOpen.value = false;
  keyword.value = '';
  selectedIndex.value = 0;
};

// 选择菜单项
const selectItem = (item: MenuItem) => {
  if (item.path) {
    context.events.onGlobalSearch?.(item.path);
    
    // 如果有路由配置，进行导航
    if (context.props.router?.navigate) {
      context.props.router.navigate(item.path);
    }
  }
  closeSearch();
};

const handleResultClick = (e: MouseEvent) => {
  const index = Number((e.currentTarget as HTMLElement | null)?.dataset?.index);
  if (Number.isNaN(index)) return;
  const item = searchResults.value[index];
  if (item) selectItem(item);
};

const handleResultMouseEnter = (e: MouseEvent) => {
  const index = Number((e.currentTarget as HTMLElement | null)?.dataset?.index);
  if (Number.isNaN(index)) return;
  selectedIndex.value = index;
};

// 键盘导航
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

// 滚动到选中项
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

const scrollToSelected = () => {
  nextTick(() => {
    ensureIndexVisible(selectedIndex.value);
  });
};

// 全局快捷键监听
const handleGlobalKeydown = (e: KeyboardEvent) => {
  // Ctrl+K 或 Cmd+K 打开搜索
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    if (isOpen.value) {
      closeSearch();
    } else {
      openSearch();
    }
  }
};

// 监听关键字变化，重置选中索引
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

const handleScroll = (e: Event) => {
  const target = e.target as HTMLElement | null;
  if (!target) return;
  const nextTop = target.scrollTop;
  if (scrollTop.value !== nextTop) {
    scrollTop.value = nextTop;
  }
};

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

// 监听快捷键
onMounted(() => {
  document.addEventListener('keydown', handleGlobalKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleGlobalKeydown);
  if (listResizeObserver.value) {
    listResizeObserver.value.disconnect();
    listResizeObserver.value = null;
  }
});

// 获取快捷键显示文本
const shortcutText = computed(() => {
  const isMac = navigator.platform.toLowerCase().includes('mac');
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
    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
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
        class="fixed inset-0 z-9999 flex items-start justify-center px-4 pt-20"
        data-state="open"
      >
        <!-- 遮罩 -->
        <div class="fixed inset-0 bg-black/50" @click="closeSearch" />
        
        <!-- 搜索面板 -->
        <div
          class="header-search-modal"
          @keydown="handleKeydown"
        >
          <!-- 搜索输入框 -->
          <div class="header-search-modal__input-wrapper">
            <svg class="h-5 w-5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
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
                  <svg v-else class="h-4 w-4 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                    <path d="M9 18c-4.51 2-5-2-7-2" />
                  </svg>
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
