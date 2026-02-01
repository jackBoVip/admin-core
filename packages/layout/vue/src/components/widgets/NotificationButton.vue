<script setup lang="ts">
/**
 * 通知按钮组件
 * @description 显示通知列表
 */
import { computed, ref } from 'vue';
import { useLayoutContext } from '../../composables';
import type { NotificationItem } from '@admin-core/layout';

const context = useLayoutContext();

// 下拉菜单状态
const isOpen = ref(false);

// 通知列表
const notifications = computed<NotificationItem[]>(() => 
  context.props.notifications || []
);

// 未读数量
const unreadCount = computed(() => 
  context.props.unreadCount ?? notifications.value.filter(n => !n.read).length
);

// 是否有未读通知
const hasUnread = computed(() => unreadCount.value > 0);

// 切换下拉菜单
const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
};

// 关闭下拉菜单
const closeDropdown = () => {
  isOpen.value = false;
};

// 处理通知点击
const handleNotificationClick = (item: NotificationItem) => {
  context.events.onNotificationClick?.(item);
  item.onClick?.();
};

// 格式化时间
const formatTime = (time?: Date | string) => {
  if (!time) return '';
  const date = time instanceof Date ? time : new Date(time);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return context.t('layout.notification.justNow');
  if (minutes < 60) return `${minutes} ${context.t('layout.notification.minutesAgo')}`;
  if (hours < 24) return `${hours} ${context.t('layout.notification.hoursAgo')}`;
  if (days < 7) return `${days} ${context.t('layout.notification.daysAgo')}`;
  
  return date.toLocaleDateString();
};
</script>

<template>
  <div class="header-widget-dropdown relative" @mouseleave="closeDropdown">
    <button
      type="button"
      class="header-widget-btn relative"
      :title="context.t('layout.header.notifications')"
      @click="toggleDropdown"
    >
      <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
      <!-- 未读红点 -->
      <span
        v-if="hasUnread"
        class="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white"
      >
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
    </button>

    <!-- 下拉菜单 -->
    <Transition name="dropdown">
      <div
        v-if="isOpen"
        class="header-widget-dropdown__menu absolute right-0 top-full z-50 mt-1 w-80 rounded-lg border bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
      >
        <!-- 标题 -->
        <div class="flex items-center justify-between border-b px-4 py-3 dark:border-gray-700">
          <span class="font-medium">{{ context.t('layout.notification.title') }}</span>
          <span v-if="hasUnread" class="text-xs text-gray-500">
            {{ unreadCount }} {{ context.t('layout.notification.unread') }}
          </span>
        </div>
        
        <!-- 通知列表 -->
        <div class="max-h-80 overflow-y-auto">
          <div v-if="notifications.length === 0" class="py-8 text-center text-gray-400">
            {{ context.t('layout.notification.empty') }}
          </div>
          <template v-else>
            <div
              v-for="item in notifications"
              :key="item.id"
              class="flex cursor-pointer gap-3 border-b px-4 py-3 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50"
              :class="{ 'bg-blue-50/50 dark:bg-blue-900/10': !item.read }"
              @click="handleNotificationClick(item)"
            >
              <!-- 图标 -->
              <div
                class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                :class="{
                  'bg-blue-100 text-blue-500 dark:bg-blue-900/30': item.type === 'info' || !item.type,
                  'bg-green-100 text-green-500 dark:bg-green-900/30': item.type === 'success',
                  'bg-yellow-100 text-yellow-500 dark:bg-yellow-900/30': item.type === 'warning',
                  'bg-red-100 text-red-500 dark:bg-red-900/30': item.type === 'error',
                }"
              >
                <svg v-if="item.type === 'success'" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                <svg v-else-if="item.type === 'warning'" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                  <path d="M12 9v4" />
                  <path d="M12 17h.01" />
                </svg>
                <svg v-else-if="item.type === 'error'" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="m15 9-6 6" />
                  <path d="m9 9 6 6" />
                </svg>
                <svg v-else class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4" />
                  <path d="M12 8h.01" />
                </svg>
              </div>
              
              <!-- 内容 -->
              <div class="flex-1 overflow-hidden">
                <div class="flex items-start justify-between gap-2">
                  <span class="truncate font-medium" :class="{ 'text-gray-900 dark:text-gray-100': !item.read }">
                    {{ item.title }}
                  </span>
                  <span v-if="!item.read" class="h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                </div>
                <p v-if="item.description" class="mt-0.5 truncate text-sm text-gray-500">
                  {{ item.description }}
                </p>
                <span class="mt-1 text-xs text-gray-400">
                  {{ formatTime(item.time) }}
                </span>
              </div>
            </div>
          </template>
        </div>
        
        <!-- 底部操作 -->
        <div class="flex border-t dark:border-gray-700">
          <button
            type="button"
            class="flex-1 py-2.5 text-sm text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700 dark:hover:bg-gray-700/50"
          >
            {{ context.t('layout.notification.markAllRead') }}
          </button>
          <div class="w-px bg-gray-200 dark:bg-gray-700" />
          <button
            type="button"
            class="flex-1 py-2.5 text-sm text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700 dark:hover:bg-gray-700/50"
          >
            {{ context.t('layout.notification.viewAll') }}
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 150ms ease, transform 150ms ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
