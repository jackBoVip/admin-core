<script setup lang="ts">
// 按钮组件示例
</script>

<template>
  <div class="page-container">
    <h1 class="page-title">按钮</h1>
    <p class="page-description">按钮组件示例</p>

    <div class="card">
      <h2 class="card-title">基础按钮</h2>
      <div style="display: flex; gap: 12px; flex-wrap: wrap;">
        <button class="btn btn-primary">Primary</button>
        <button class="btn btn-secondary">Secondary</button>
        <button class="btn" style="background: #10b981; color: white;">Success</button>
        <button class="btn" style="background: #ef4444; color: white;">Danger</button>
        <button class="btn" style="background: #f59e0b; color: white;">Warning</button>
      </div>
    </div>

    <div class="card" style="margin-top: 24px;">
      <h2 class="card-title">按钮尺寸</h2>
      <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
        <button class="btn btn-primary" style="padding: 4px 8px; font-size: 12px;">Small</button>
        <button class="btn btn-primary">Default</button>
        <button class="btn btn-primary" style="padding: 12px 24px; font-size: 16px;">Large</button>
      </div>
    </div>

    <div class="card" style="margin-top: 24px;">
      <h2 class="card-title">禁用状态</h2>
      <div style="display: flex; gap: 12px; flex-wrap: wrap;">
        <button class="btn btn-primary" disabled style="opacity: 0.5; cursor: not-allowed;">Disabled</button>
        <button class="btn btn-secondary" disabled style="opacity: 0.5; cursor: not-allowed;">Disabled</button>
      </div>
    </div>
  </div>
</template>
