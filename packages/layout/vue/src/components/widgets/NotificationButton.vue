<script setup lang="ts">
/**
 * 通知按钮组件
 * @description 显示通知列表
 */
import { computed, ref, watch, onUnmounted, nextTick } from 'vue';
import { useLayoutContext } from '../../composables';
import LayoutIcon from '../common/LayoutIcon.vue';
import { LAYOUT_UI_TOKENS, type NotificationItem } from '@admin-core/layout';

/**
 * 布局上下文
 * @description 提供通知数据、未读数及通知点击事件回调。
 */
const context = useLayoutContext();

/**
 * 通知下拉菜单开关状态。
 */
const isOpen = ref(false);

/**
 * 通知数据列表。
 */
const notifications = computed<NotificationItem[]>(() => 
  context.props.notifications || []
);

/**
 * 未读通知数量，优先使用外部显式传值。
 */
const unreadCount = computed(() => {
  if (context.props.unreadCount !== undefined) return context.props.unreadCount;
  let count = 0;
  for (const item of notifications.value) {
    if (!item.read) count += 1;
  }
  return count;
});

/**
 * 是否存在未读通知。
 */
const hasUnread = computed(() => unreadCount.value > 0);

/**
 * 切换通知下拉菜单显示状态。
 */
const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
};

/**
 * 关闭通知下拉菜单。
 */
const closeDropdown = () => {
  isOpen.value = false;
};

/**
 * 将通知时间格式化为相对时间文案。
 *
 * @param time 通知时间。
 * @returns 格式化后的时间文本。
 */
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

/**
 * 通知 ID 到通知实体的映射索引。
 */
const notificationMap = computed(() => {
  if (!isOpen.value) return new Map<string, NotificationItem>();
  const map = new Map<string, NotificationItem>();
  notifications.value.forEach((item) => {
    map.set(String(item.id), item);
  });
  return map;
});

/**
 * 通知渲染数据，补充格式化时间字段。
 */
const formattedNotifications = computed(() => {
  if (!isOpen.value) return [];
  return notifications.value.map((item) => ({
    ...item,
    timeLabel: formatTime(item.time),
  }));
});

/**
 * 通知列表容器引用
 * @description 用于读取滚动位置并计算虚拟列表可见范围。
 */
const listRef = ref<HTMLElement | null>(null);
/**
 * 通知列表滚动位置
 * @description 驱动虚拟列表起止索引计算。
 */
const scrollTop = ref(0);

/**
 * 通知列表 UI 令牌
 * @description 提供列表最大高度与单项高度默认值。
 */
const {
  NOTIFICATION_MAX_HEIGHT,
  NOTIFICATION_ITEM_HEIGHT,
} = LAYOUT_UI_TOKENS;

/**
 * 通知虚拟列表单项高度。
 */
const itemHeight = ref<number>(NOTIFICATION_ITEM_HEIGHT);
/**
 * 通知列表尺寸监听器。
 */
const listResizeObserver = ref<ResizeObserver | null>(null);
/**
 * 通知虚拟列表超出渲染数量
 * @description 在可视区上下额外渲染项数，降低滚动抖动。
 */
const OVERSCAN = LAYOUT_UI_TOKENS.RESULT_OVERSCAN;
/**
 * 通知列表总高度。
 */
const totalHeight = computed(() => formattedNotifications.value.length * itemHeight.value);
/**
 * 通知列表可视区域高度。
 */
const viewportHeight = computed(() =>
  totalHeight.value === 0 ? NOTIFICATION_MAX_HEIGHT : Math.min(totalHeight.value, NOTIFICATION_MAX_HEIGHT)
);
/**
 * 虚拟列表起始索引。
 */
const startIndex = computed(() =>
  Math.max(0, Math.floor(scrollTop.value / itemHeight.value) - OVERSCAN)
);
/**
 * 虚拟列表结束索引。
 */
const endIndex = computed(() =>
  Math.min(
    formattedNotifications.value.length,
    Math.ceil((scrollTop.value + viewportHeight.value) / itemHeight.value) + OVERSCAN
  )
);
/**
 * 当前视口范围内的通知项集合。
 */
const visibleNotifications = computed(() =>
  formattedNotifications.value.slice(startIndex.value, endIndex.value)
);

watch(
  [isOpen, totalHeight, viewportHeight, scrollTop],
  ([open, total, viewHeight, currentTop]) => {
    if (!open) return;
    const maxScrollTop = Math.max(0, total - viewHeight);
    if (currentTop <= maxScrollTop) return;
    const nextTop = Math.max(0, maxScrollTop);
    if (listRef.value) {
      listRef.value.scrollTop = nextTop;
    }
    if (scrollTop.value !== nextTop) {
      scrollTop.value = nextTop;
    }
  }
);

/**
 * 同步通知列表滚动位置。
 *
 * @param e 滚动事件对象。
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
 * 处理滚轮事件，接管默认滚动以稳定虚拟列表滚动。
 *
 * @param e 滚轮事件对象。
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

watch(isOpen, (open) => {
  /**
   * 收起面板时重置滚动状态。
   * @description 避免下次打开面板时保留上一次滚动位置。
   */
  if (open) return;
  if (listRef.value) {
    listRef.value.scrollTop = 0;
  }
  if (scrollTop.value !== 0) {
    scrollTop.value = 0;
  }
});

onUnmounted(() => {
  /**
   * 组件卸载时销毁尺寸观察器。
   */
  if (listResizeObserver.value) {
    listResizeObserver.value.disconnect();
    listResizeObserver.value = null;
  }
});

watch([isOpen, () => formattedNotifications.value.length], ([open]) => {
  if (!open) return;
  /**
   * 打开面板后测量首项高度并建立尺寸观察。
   * @description 保障虚拟列表行高与真实渲染高度一致。
   */
  nextTick(() => {
    const list = listRef.value;
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
  /**
   * 面板关闭时停止尺寸观察，减少无效监听开销。
   */
  if (listResizeObserver.value) {
    listResizeObserver.value.disconnect();
    listResizeObserver.value = null;
  }
});

/**
 * 处理通知项点击并触发外部通知回调。
 *
 * @param e 鼠标事件对象。
 */
const handleNotificationClick = (e: MouseEvent) => {
  const id = (e.currentTarget as HTMLElement | null)?.dataset?.id;
  if (!id) return;
  const item = notificationMap.value.get(id);
  if (!item) return;
  context.events.onNotificationClick?.(item);
  item.onClick?.();
};
</script>

<template>
  <div class="header-widget-dropdown relative" :data-state="isOpen ? 'open' : 'closed'" @mouseleave="closeDropdown">
    <button
      type="button"
      class="header-widget-btn relative"
      :data-unread="hasUnread ? 'true' : undefined"
      :data-state="isOpen ? 'open' : 'closed'"
      @click="toggleDropdown"
    >
      <LayoutIcon name="notification" size="sm" />
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
        class="header-widget-dropdown__menu header-widget-dropdown__menu--notification absolute right-0 top-full mt-1"
        data-state="open"
      >
        <!-- 标题 -->
        <div class="header-notification__header">
          <span class="font-medium">{{ context.t('layout.notification.title') }}</span>
          <span v-if="hasUnread" class="header-notification__meta">
            {{ unreadCount }} {{ context.t('layout.notification.unread') }}
          </span>
        </div>
        
        <!-- 通知列表 -->
        <div
          ref="listRef"
          class="header-notification__list layout-scroll-container"
          :style="{ height: `${viewportHeight}px`, position: 'relative' }"
          @scroll="handleScroll"
          @wheel="handleWheel"
        >
          <div v-if="formattedNotifications.length === 0" class="header-notification__empty">
            {{ context.t('layout.notification.empty') }}
          </div>
          <template v-else>
            <div :style="{ height: `${totalHeight}px`, pointerEvents: 'none' }" />
            <div
              v-for="(item, index) in visibleNotifications"
              :key="item.id"
              :data-id="String(item.id)"
              class="header-notification__item layout-list-item"
              :data-read="item.read ? 'true' : 'false'"
              :style="{
                position: 'absolute',
                top: `${(startIndex + index) * itemHeight}px`,
                left: 0,
                right: 0,
                height: `${itemHeight}px`,
              }"
              @click="handleNotificationClick"
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
                <LayoutIcon v-if="item.type === 'success'" name="status-success" size="sm" />
                <LayoutIcon v-else-if="item.type === 'warning'" name="status-warning" size="sm" />
                <LayoutIcon v-else-if="item.type === 'error'" name="status-error" size="sm" />
                <LayoutIcon v-else name="status-info" size="sm" />
              </div>
              
              <!-- 内容 -->
              <div class="flex-1 overflow-hidden">
                <div class="flex items-start justify-between gap-2">
                  <span class="truncate font-medium" :class="{ 'text-gray-900 dark:text-gray-100': !item.read }">
                    {{ item.title }}
                  </span>
                  <span v-if="!item.read" class="header-notification__unread-dot shrink-0" />
                </div>
                <p v-if="item.description" class="header-notification__description truncate">
                  {{ item.description }}
                </p>
                <span class="header-notification__time">
                  {{ item.timeLabel }}
                </span>
              </div>
            </div>
          </template>
        </div>
        
        <!-- 底部操作 -->
        <div class="header-notification__footer">
          <button
            type="button"
            class="header-notification__footer-button"
          >
            {{ context.t('layout.notification.markAllRead') }}
          </button>
          <div class="header-notification__divider" />
          <button
            type="button"
            class="header-notification__footer-button"
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
  transition: opacity var(--admin-duration-fast, 150ms) ease, transform var(--admin-duration-fast, 150ms) ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
}
</style>
