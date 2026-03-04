<script setup lang="ts">
/**
 * 用户下拉菜单组件
 * @description 显示用户信息和操作菜单
 */
import { computed, ref } from 'vue';
import { useLayoutContext } from '../../composables';
import LayoutIcon from '../common/LayoutIcon.vue';

/**
 * 布局上下文
 * @description 提供用户信息、国际化文案与用户动作回调。
 */
const context = useLayoutContext();

/**
 * 用户下拉菜单开关状态。
 */
const isOpen = ref(false);

/**
 * 当前用户信息。
 */
const userInfo = computed(() => context.props.userInfo);

/**
 * 默认头像地址，用户未配置头像时回退使用。
 */
const defaultAvatar = computed(() => 
  context.props.defaultAvatar || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM5OTkiIHN0cm9rZS13aWR0aD0iMiI+PGNpcmNsZSBjeD0iMTIiIGN5PSI4IiByPSI1Ii8+PHBhdGggZD0iTTIwIDIxYTggOCAwIDEgMC0xNiAwIi8+PC9zdmc+'
);

/**
 * 当前展示用户名。
 * @description 优先使用展示名，其次用户名，均为空时回退空字符串。
 */
const displayName = computed(
  () => userInfo.value?.displayName || userInfo.value?.username || ''
);

/**
 * 切换用户下拉菜单显示状态。
 */
const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
};

/**
 * 关闭用户下拉菜单。
 */
const closeDropdown = () => {
  isOpen.value = false;
};

/**
 * 处理用户菜单动作，派发事件并执行内置动作分支。
 *
 * @param key 菜单动作键。
 */
const handleMenuSelect = (key: string) => {
  context.events.onUserMenuSelect?.(key);
  isOpen.value = false;
  
  /** 特殊内置行为处理。 */
  if (key === 'logout') {
    context.events.onLogout?.();
  } else if (key === 'lock') {
    context.events.onLockScreen?.();
  }
};

/**
 * 处理菜单按钮点击，并从数据属性中提取动作键。
 *
 * @param e 鼠标事件对象。
 */
const handleMenuClick = (e: MouseEvent) => {
  const key = (e.currentTarget as HTMLElement | null)?.dataset?.value;
  if (key) {
    handleMenuSelect(key);
  }
};
</script>

<template>
  <div class="header-widget-dropdown relative" :data-state="isOpen ? 'open' : 'closed'" @mouseleave="closeDropdown">
    <button
      type="button"
      class="header-widget-user flex items-center gap-2 rounded-full p-1 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
      :data-state="isOpen ? 'open' : 'closed'"
      @click="toggleDropdown"
    >
      <img
        :src="userInfo?.avatar || defaultAvatar"
        :alt="userInfo?.displayName || userInfo?.username || 'User'"
        class="h-8 w-8 rounded-full object-cover"
      />
      <span class="hidden max-w-24 truncate text-sm font-medium sm:inline">
        {{ displayName }}
      </span>
      <LayoutIcon
        name="menu-arrow-down"
        size="sm"
        :className="['hidden h-4 w-4 transition-transform sm:block', isOpen ? 'rotate-180' : ''].join(' ')"
      />
    </button>

    <!-- 下拉菜单 -->
    <Transition name="dropdown">
      <div
        v-if="isOpen"
        class="header-widget-dropdown__menu absolute right-0 top-full z-50 mt-1 w-56"
        data-state="open"
      >
        <!-- 用户信息 -->
        <div class="border-b px-4 py-3 dark:border-gray-700">
          <div class="flex items-center gap-3">
            <img
              :src="userInfo?.avatar || defaultAvatar"
              :alt="userInfo?.displayName || userInfo?.username || 'User'"
              class="h-10 w-10 rounded-full object-cover"
            />
            <div class="flex-1 overflow-hidden">
              <div class="truncate font-medium">
                {{ displayName || context.t('layout.user.guest') }}
              </div>
              <div v-if="userInfo?.roles?.length" class="truncate text-xs text-gray-500">
                {{ userInfo.roles.join(', ') }}
              </div>
            </div>
          </div>
        </div>

        <slot name="menu">
          <!-- 菜单项 -->
          <div class="py-1">
            <button
              type="button"
              class="header-widget-dropdown__item group"
              data-value="profile"
              @click="handleMenuClick"
            >
              <LayoutIcon name="user" size="sm" className="opacity-60 transition-opacity group-hover:opacity-100" />
              <span>{{ context.t('layout.user.profile') }}</span>
            </button>

            <button
              type="button"
              class="header-widget-dropdown__item group"
              data-value="settings"
              @click="handleMenuClick"
            >
              <LayoutIcon name="settings" size="sm" className="opacity-60 transition-opacity group-hover:opacity-100" />
              <span>{{ context.t('layout.user.settings') }}</span>
            </button>

            <button
              type="button"
              class="header-widget-dropdown__item group"
              data-value="lock"
              @click="handleMenuClick"
            >
              <LayoutIcon name="lock" size="sm" className="opacity-60 transition-opacity group-hover:opacity-100" />
              <span>{{ context.t('layout.user.lockScreen') }}</span>
            </button>
          </div>

          <!-- 登出 -->
          <div class="border-t py-1 dark:border-gray-700">
            <button
              type="button"
              class="header-widget-dropdown__item group text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
              data-value="logout"
              @click="handleMenuClick"
            >
              <LayoutIcon name="logout" size="sm" className="opacity-60 transition-opacity group-hover:opacity-100" />
              <span>{{ context.t('layout.user.logout') }}</span>
            </button>
          </div>
        </slot>
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
  transform: translateY(-4px);
}
</style>
