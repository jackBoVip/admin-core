<script setup lang="ts">
/**
 * 全局搜索组件
 * @description 全局菜单搜索导航，支持快捷键 Ctrl+K
 */
import { computed, ref, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useLayoutContext } from '../../composables';
import LayoutIcon from '../common/LayoutIcon.vue';
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
const shortcutConfig = computed(() => context.props.shortcutKeys || {});
const shortcutEnabled = computed(
  () => shortcutConfig.value.enable !== false && shortcutConfig.value.globalSearch !== false
);

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
  const query = keyword.value.trim();
  context.events.onGlobalSearch?.(query);

  if (item.path) {
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
          :style="{ backgroundColor: 'rgba(0, 0, 0, 0.45)' }"
          @click="closeSearch"
        />
        
        <!-- 搜索面板 -->
        <div
          class="header-search-modal"
          role="dialog"
          aria-modal="true"
          @keydown="handleKeydown"
          :style="{
            backgroundColor: 'var(--header-search-modal-bg, var(--card, var(--background, #ffffff)))',
            border: '1px solid var(--header-search-modal-border, var(--border, #e2e8f0))',
            boxShadow:
              'var(--header-search-modal-shadow, 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1))',
          }"
        >
          <!-- 搜索输入框 -->
          <div class="header-search-modal__input-wrapper">
            <LayoutIcon name="search" size="md" className="text-muted-foreground" />
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
                  <LayoutIcon v-else name="search-item" size="sm" className="opacity-60" />
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
