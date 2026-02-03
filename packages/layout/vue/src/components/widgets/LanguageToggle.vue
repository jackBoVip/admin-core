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
  <div class="header-widget-dropdown relative" :data-state="isOpen ? 'open' : 'closed'" @mouseleave="closeDropdown">
    <button
      type="button"
      class="header-widget-btn"
      :title="context.t('layout.header.toggleLanguage')"
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
        class="header-widget-dropdown__menu absolute right-0 top-full z-50 mt-1 min-w-[140px] rounded-lg border bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800"
        data-state="open"
      >
        <button
          v-for="option in languageOptions"
          :key="option.value"
          type="button"
          class="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
          :class="{ 'text-primary bg-primary/10': currentLocale === option.value }"
          :data-selected="currentLocale === option.value ? 'true' : undefined"
          :data-value="option.value"
          @click="handleLocaleOptionClick"
        >
          <span>{{ option.label }}</span>
        </button>
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
