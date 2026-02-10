<script setup lang="ts">
// 首页
</script>

<template>
  <div class="page-container">
    <h1 class="page-title">首页</h1>
    <p class="page-description">欢迎使用 Vue Layout Demo！</p>

    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-card-title">总访问量</div>
        <div class="stat-card-value">8,846</div>
        <div class="stat-card-trend up">↑ 12.5% 较昨日</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-title">活跃用户</div>
        <div class="stat-card-value">1,234</div>
        <div class="stat-card-trend up">↑ 8.2% 较昨日</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-title">订单数量</div>
        <div class="stat-card-value">456</div>
        <div class="stat-card-trend down">↓ 3.1% 较昨日</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-title">成交金额</div>
        <div class="stat-card-value">¥28,456</div>
        <div class="stat-card-trend up">↑ 15.3% 较昨日</div>
      </div>
    </div>

    <div class="card">
      <h2 class="card-title">快速开始</h2>
      <p>这是一个基于 <code>@admin-core/layout-vue</code> 的布局演示项目。</p>
      <ul class="mt-4 pl-5 list-disc">
        <li>✅ 自动标签页管理</li>
        <li>✅ 自动面包屑导航</li>
        <li>✅ 内置路由处理</li>
        <li>✅ 响应式布局</li>
        <li>✅ 主题切换</li>
        <li>✅ 国际化支持</li>
      </ul>
    </div>
  </div>
</template>
