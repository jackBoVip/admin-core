<script setup lang="ts">
/**
 * 设置区块组件
 * @description 用于包装各个设置项分组
 */
defineProps<{
  /** 区块标题 */
  title?: string;
}>();
</script>

<template>
  <div class="preferences-block">
    <h3 v-if="title" class="preferences-block-title">{{ title }}</h3>
    <div class="preferences-block-content">
      <slot />
    </div>
  </div>
</template>
