<script setup lang="ts">
// 监控页
</script>

<template>
  <div class="page-container">
    <h1 class="page-title">监控页</h1>
    <p class="page-description">系统监控与状态</p>

    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-card-title">CPU 使用率</div>
        <div class="stat-card-value">45%</div>
        <div class="mt-2 h-2 rounded bg-border">
          <div class="h-full w-[45%] rounded bg-success"></div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card-title">内存使用率</div>
        <div class="stat-card-value">68%</div>
        <div class="mt-2 h-2 rounded bg-border">
          <div class="h-full w-[68%] rounded bg-warning"></div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card-title">磁盘使用率</div>
        <div class="stat-card-value">82%</div>
        <div class="mt-2 h-2 rounded bg-border">
          <div class="h-full w-[82%] rounded bg-destructive"></div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card-title">网络带宽</div>
        <div class="stat-card-value">256 Mbps</div>
        <div class="mt-2 h-2 rounded bg-border">
          <div class="h-full w-[25%] rounded bg-primary"></div>
        </div>
      </div>
    </div>

    <div class="card">
      <h2 class="card-title">服务状态</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>服务名称</th>
            <th>状态</th>
            <th>响应时间</th>
            <th>最后检查</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>API 服务</td>
            <td><span class="text-success">● 正常</span></td>
            <td>45ms</td>
            <td>刚刚</td>
          </tr>
          <tr>
            <td>数据库</td>
            <td><span class="text-success">● 正常</span></td>
            <td>12ms</td>
            <td>1分钟前</td>
          </tr>
          <tr>
            <td>缓存服务</td>
            <td><span class="text-success">● 正常</span></td>
            <td>3ms</td>
            <td>2分钟前</td>
          </tr>
          <tr>
            <td>消息队列</td>
            <td><span class="text-warning">● 警告</span></td>
            <td>156ms</td>
            <td>5分钟前</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
