<script setup lang="ts">
/**
 * 遮罩层组件（移动端侧边栏展开时显示）
 */
import { computed } from 'vue';
import { useLayoutContext, useSidebarState } from '../../composables';

/**
 * 布局上下文
 * @description 提供移动端状态与侧栏折叠切换能力。
 */
const context = useLayoutContext();
/**
 * 侧栏折叠状态
 * @description 与移动端标识共同决定遮罩显隐。
 */
const { collapsed } = useSidebarState();

/**
 * 遮罩是否显示
 * @description 仅在移动端且侧栏处于展开态时展示。
 */
const visible = computed(() => context.props.isMobile && !collapsed.value);

/**
 * 处理遮罩点击，触发侧边栏收起。
 */
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
        data-state="visible"
        @click="handleClick"
      />
    </Transition>
  </Teleport>
</template>

<style>
/* 样式已在核心 CSS 中定义 */
</style>
