<script setup lang="ts">
// 分析页
</script>

<template>
  <div class="page-container">
    <h1 class="page-title">分析页</h1>
    <p class="page-description">数据分析与统计</p>

    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-card-title">页面浏览量</div>
        <div class="stat-card-value">12,345</div>
        <div class="stat-card-trend up">↑ 20.5%</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-title">独立访客</div>
        <div class="stat-card-value">3,456</div>
        <div class="stat-card-trend up">↑ 15.2%</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-title">跳出率</div>
        <div class="stat-card-value">32.5%</div>
        <div class="stat-card-trend down">↓ 5.1%</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-title">平均停留时长</div>
        <div class="stat-card-value">4m 32s</div>
        <div class="stat-card-trend up">↑ 8.3%</div>
      </div>
    </div>

    <div class="card">
      <h2 class="card-title">图表区域</h2>
      <div class="h-[300px] flex items-center justify-center rounded bg-muted">
        <span class="text-muted-foreground">图表占位符</span>
      </div>
    </div>
  </div>
</template>
