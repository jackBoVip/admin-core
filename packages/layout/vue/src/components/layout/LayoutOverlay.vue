<script setup lang="ts">
/**
 * 遮罩层组件（移动端侧边栏展开时显示）
 */
import { computed } from 'vue';
import { useLayoutContext, useSidebarState } from '../../composables';

const context = useLayoutContext();
const { collapsed } = useSidebarState();

// 是否显示遮罩
const visible = computed(() => context.props.isMobile && !collapsed.value);

// 点击遮罩关闭侧边栏
const handleClick = () => {
  context.toggleSidebarCollapse();
};
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="visible"
        class="layout-overlay layout-overlay--visible"
        @click="handleClick"
      />
    </Transition>
  </Teleport>
</template>

<style>
/* 样式已在核心 CSS 中定义 */
</style>
