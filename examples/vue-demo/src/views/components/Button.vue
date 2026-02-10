<script setup lang="ts">
// 按钮组件示例
</script>

<template>
  <div class="page-container">
    <h1 class="page-title">按钮</h1>
    <p class="page-description">按钮组件示例</p>

    <div class="card">
      <h2 class="card-title">基础按钮</h2>
      <div class="flex flex-wrap gap-3">
        <button class="btn btn-primary">Primary</button>
        <button class="btn btn-secondary">Secondary</button>
        <button class="btn bg-success text-white hover:opacity-90">Success</button>
        <button class="btn bg-destructive text-white hover:opacity-90">Danger</button>
        <button class="btn bg-warning text-white hover:opacity-90">Warning</button>
      </div>
    </div>

    <div class="card mt-6">
      <h2 class="card-title">按钮尺寸</h2>
      <div class="flex flex-wrap items-center gap-3">
        <button class="btn btn-primary px-2 py-1 text-xs">Small</button>
        <button class="btn btn-primary">Default</button>
        <button class="btn btn-primary px-6 py-3 text-base">Large</button>
      </div>
    </div>

    <div class="card mt-6">
      <h2 class="card-title">禁用状态</h2>
      <div class="flex flex-wrap gap-3">
        <button class="btn btn-primary" disabled>Disabled</button>
        <button class="btn btn-secondary" disabled>Disabled</button>
      </div>
    </div>
  </div>
</template>
