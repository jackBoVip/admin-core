<script setup lang="ts">
/**
 * 全局搜索组件
 * @description 全局菜单搜索导航，支持快捷键 Ctrl+K
 */
import { computed, ref, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useLayoutContext } from '../../composables';
import type { MenuItem } from '@admin-core/layout';

const context = useLayoutContext();

// 搜索框状态
const isOpen = ref(false);
const keyword = ref('');
const selectedIndex = ref(0);
const inputRef = ref<HTMLInputElement | null>(null);
const resultListRef = ref<HTMLDivElement | null>(null);

// 菜单数据
const menus = computed(() => context.props.menus || []);

// 扁平化菜单（用于搜索）
const flatMenus = computed(() => {
  const result: (MenuItem & { parentPath?: string[] })[] = [];
  
  const flatten = (items: MenuItem[], parentPath: string[] = []) => {
    for (const item of items) {
      const currentPath = [...parentPath, item.name];
      
      // 只添加有路径的菜单项
      if (item.path && !item.hidden) {
        result.push({
          ...item,
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
const searchResults = computed(() => {
  if (!keyword.value.trim()) return [];
  
  const query = keyword.value.toLowerCase();
  
  return flatMenus.value
    .filter(item => {
      const name = (item.name || '').toLowerCase();
      const path = (item.path || '').toLowerCase();
      return name.includes(query) || path.includes(query);
    })
    .slice(0, 10); // 限制结果数量
});

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
const scrollToSelected = () => {
  nextTick(() => {
    const list = resultListRef.value;
    const selected = list?.querySelector(`[data-index="${selectedIndex.value}"]`) as HTMLElement;
    if (selected && list) {
      const listRect = list.getBoundingClientRect();
      const selectedRect = selected.getBoundingClientRect();
      
      if (selectedRect.bottom > listRect.bottom) {
        list.scrollTop += selectedRect.bottom - listRect.bottom;
      } else if (selectedRect.top < listRect.top) {
        list.scrollTop -= listRect.top - selectedRect.top;
      }
    }
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
  selectedIndex.value = 0;
});

// 监听快捷键
onMounted(() => {
  document.addEventListener('keydown', handleGlobalKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleGlobalKeydown);
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
    class="header-search-btn flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-100/50 px-3 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800/50 dark:hover:bg-gray-800"
    :title="context.t('layout.header.search')"
    @click="openSearch"
  >
    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
    <span class="hidden md:inline">{{ context.t('layout.header.search') }}</span>
    <kbd class="hidden rounded border border-gray-300 bg-white px-1.5 py-0.5 text-xs font-medium text-gray-500 dark:border-gray-600 dark:bg-gray-700 md:inline">
      {{ shortcutText }}
    </kbd>
  </button>

  <!-- 搜索弹窗 -->
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-[9999] flex items-start justify-center px-4 pt-20"
      >
        <!-- 遮罩 -->
        <div class="fixed inset-0 bg-black/50" @click="closeSearch" />
        
        <!-- 搜索面板 -->
        <div
          class="relative w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-gray-800"
          @keydown="handleKeydown"
        >
          <!-- 搜索输入框 -->
          <div class="flex items-center border-b px-4 dark:border-gray-700">
            <svg class="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              ref="inputRef"
              v-model="keyword"
              type="text"
              class="flex-1 border-0 bg-transparent px-3 py-4 text-base outline-none placeholder:text-gray-400"
              :placeholder="context.t('layout.search.placeholder')"
            />
            <kbd class="rounded border border-gray-300 bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-500 dark:border-gray-600 dark:bg-gray-700">
              ESC
            </kbd>
          </div>
          
          <!-- 搜索结果 -->
          <div ref="resultListRef" class="max-h-80 overflow-y-auto">
            <!-- 无结果 -->
            <div v-if="keyword && searchResults.length === 0" class="py-12 text-center text-gray-400">
              {{ context.t('layout.search.noResults') }}
            </div>
            
            <!-- 结果列表 -->
            <template v-else-if="searchResults.length > 0">
              <div
                v-for="(item, index) in searchResults"
                :key="item.key"
                :data-index="index"
                class="flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors"
                :class="index === selectedIndex ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'"
                @click="selectItem(item)"
                @mouseenter="selectedIndex = index"
              >
                <!-- 图标 -->
                <div
                  class="flex h-8 w-8 items-center justify-center rounded-lg"
                  :class="index === selectedIndex ? 'bg-primary/20' : 'bg-gray-100 dark:bg-gray-700'"
                >
                  <span v-if="item.icon" class="text-lg">{{ item.icon }}</span>
                  <svg v-else class="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                    <path d="M9 18c-4.51 2-5-2-7-2" />
                  </svg>
                </div>
                
                <!-- 内容 -->
                <div class="flex-1 overflow-hidden">
                  <div class="truncate font-medium">{{ item.name }}</div>
                  <div v-if="item.parentPath" class="truncate text-xs text-gray-400">
                    {{ item.parentPath.join(' / ') }}
                  </div>
                </div>
                
                <!-- 回车提示 -->
                <span v-if="index === selectedIndex" class="text-xs text-gray-400">
                  ↵
                </span>
              </div>
            </template>
            
            <!-- 提示 -->
            <div v-else class="py-8 text-center text-gray-400">
              {{ context.t('layout.search.tips') }}
            </div>
          </div>
          
          <!-- 底部提示 -->
          <div class="flex items-center gap-4 border-t px-4 py-2 text-xs text-gray-400 dark:border-gray-700">
            <span class="flex items-center gap-1">
              <kbd class="rounded border border-gray-300 bg-gray-100 px-1 py-0.5 dark:border-gray-600 dark:bg-gray-700">↑</kbd>
              <kbd class="rounded border border-gray-300 bg-gray-100 px-1 py-0.5 dark:border-gray-600 dark:bg-gray-700">↓</kbd>
              {{ context.t('layout.search.navigate') }}
            </span>
            <span class="flex items-center gap-1">
              <kbd class="rounded border border-gray-300 bg-gray-100 px-1 py-0.5 dark:border-gray-600 dark:bg-gray-700">↵</kbd>
              {{ context.t('layout.search.select') }}
            </span>
            <span class="flex items-center gap-1">
              <kbd class="rounded border border-gray-300 bg-gray-100 px-1 py-0.5 dark:border-gray-600 dark:bg-gray-700">esc</kbd>
              {{ context.t('layout.search.close') }}
            </span>
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
