<script setup lang="ts">
/**
 * 语言切换组件
 * @description 切换应用语言
 */
import { computed, ref } from 'vue';
import { useLayoutContext } from '../../composables';

const context = useLayoutContext();

// 当前语言
const currentLocale = computed(() => context.props.locale || 'zh-CN');

// 下拉菜单状态
const isOpen = ref(false);

// 语言选项
const languageOptions = [
  { value: 'zh-CN', label: '简体中文', abbr: '中' },
  { value: 'en-US', label: 'English', abbr: 'EN' },
];

// 切换语言
const handleLocaleChange = (locale: string) => {
  context.events.onLocaleChange?.(locale);
  isOpen.value = false;
};

const handleLocaleOptionClick = (e: MouseEvent) => {
  const locale = (e.currentTarget as HTMLElement | null)?.dataset?.value;
  if (locale) {
    handleLocaleChange(locale);
  }
};

// 切换下拉菜单
const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
};

// 关闭下拉菜单
const closeDropdown = () => {
  isOpen.value = false;
};

</script>

<template>
  <div class="header-widget-dropdown relative" :data-state="isOpen ? 'open' : 'closed'">
    <button
      type="button"
      class="header-widget-btn"
      :data-state="isOpen ? 'open' : 'closed'"
      @click="toggleDropdown"
    >
      <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
        <path d="M2 12h20" />
      </svg>
    </button>

    <!-- 下拉菜单 -->
    <Transition name="dropdown">
      <div
        v-if="isOpen"
        class="header-widget-dropdown__menu header-widget-dropdown__menu--compact absolute right-0 top-full pt-1"
        data-state="open"
        @mouseleave="closeDropdown"
      >
        <!-- 内容区域 -->
        <div class="header-widget-dropdown__content">
          <button
            v-for="option in languageOptions"
            :key="option.value"
            type="button"
            class="header-widget-dropdown__item"
            :data-selected="currentLocale === option.value ? 'true' : undefined"
            :data-value="option.value"
            @click="handleLocaleOptionClick"
          >
            <span>{{ option.label }}</span>
          </button>
        </div>
      </div>
    </Transition>
  </div>

  <!-- 点击外部关闭 -->
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-40"
      @click="closeDropdown"
    />
  </Teleport>
</template>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 150ms ease, transform 150ms ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
}
</style>
