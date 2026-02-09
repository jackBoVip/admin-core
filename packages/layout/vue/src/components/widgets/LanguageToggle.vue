<script setup lang="ts">
/**
 * 语言切换组件
 * @description 切换应用语言
 */
import { computed, ref } from 'vue';
import { useLayoutContext } from '../../composables';
import LayoutIcon from '../common/LayoutIcon.vue';
import { getLocaleDisplayList, createI18n, type SupportedLocale } from '@admin-core/layout';

const context = useLayoutContext();

// 当前语言
const currentLocale = computed(() => (context.props.locale || 'zh-CN') as SupportedLocale);

// 下拉菜单状态
const isOpen = ref(false);

// 语言选项 - 使用 core 的 getLocaleDisplayList
const languageOptions = computed(() => {
  const i18n = createI18n(currentLocale.value);
  const displayList = getLocaleDisplayList(i18n);
  
  return displayList.map((item) => {
    let abbr: string;
    if (item.value === 'zh-CN') {
      abbr = 'ZH';
    } else if (item.value === 'en-US') {
      abbr = 'EN';
    } else {
      abbr = String(item.value).toUpperCase().slice(0, 2);
    }
    return {
      value: item.value,
      label: item.label,
      abbr,
    };
  });
});

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
      <LayoutIcon name="globe" size="sm" />
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
  transition: opacity var(--admin-duration-fast, 150ms) ease, transform var(--admin-duration-fast, 150ms) ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
}
</style>
