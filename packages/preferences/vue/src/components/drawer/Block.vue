<script setup lang="ts">
/**
 * 设置区块组件。
 * @description 用于将同类设置项分组展示，提供统一标题与内容容器结构。
 */
/**
 * 区块组件入参。
 * @description 配置分组标题，用于在偏好抽屉中展示设置模块名称。
 */
export interface BlockProps {
  /** 区块标题。 */
  title?: string;
}

const props = defineProps<BlockProps>();
</script>

<template>
  <div class="preferences-block">
    <h3 v-if="props.title" class="preferences-block-title">{{ props.title }}</h3>
    <div class="preferences-block-content">
      <slot />
    </div>
  </div>
</template>
