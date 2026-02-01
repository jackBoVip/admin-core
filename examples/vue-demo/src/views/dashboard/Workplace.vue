<script setup lang="ts">
// 工作台
</script>

<template>
  <div class="page-container">
    <h1 class="page-title">工作台</h1>
    <p class="page-description">欢迎回来，Admin！</p>

    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 24px;">
      <div class="card">
        <h2 class="card-title">待办事项</h2>
        <ul style="list-style: none; padding: 0; margin: 0;">
          <li style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 12px;">
            <input type="checkbox" style="width: 18px; height: 18px;">
            <span>完成布局组件开发</span>
            <span style="margin-left: auto; color: #ef4444; font-size: 12px;">紧急</span>
          </li>
          <li style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 12px;">
            <input type="checkbox" style="width: 18px; height: 18px;">
            <span>编写单元测试</span>
            <span style="margin-left: auto; color: #f59e0b; font-size: 12px;">重要</span>
          </li>
          <li style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 12px;">
            <input type="checkbox" checked style="width: 18px; height: 18px;">
            <span style="text-decoration: line-through; color: #9ca3af;">更新文档</span>
            <span style="margin-left: auto; color: #10b981; font-size: 12px;">已完成</span>
          </li>
          <li style="padding: 12px 0; display: flex; align-items: center; gap: 12px;">
            <input type="checkbox" style="width: 18px; height: 18px;">
            <span>代码审查</span>
            <span style="margin-left: auto; color: #3b82f6; font-size: 12px;">普通</span>
          </li>
        </ul>
      </div>

      <div class="card">
        <h2 class="card-title">快捷操作</h2>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
          <button class="btn btn-primary">新建项目</button>
          <button class="btn btn-secondary">上传文件</button>
          <button class="btn btn-secondary">导出数据</button>
          <button class="btn btn-secondary">系统设置</button>
        </div>
      </div>
    </div>
  </div>
</template>
