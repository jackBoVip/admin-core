<script setup lang="ts">
// 工作台
</script>

<template>
  <div class="page-container">
    <h1 class="page-title">工作台</h1>
    <p class="page-description">欢迎回来，Admin！</p>

    <div class="grid gap-6 grid-cols-[2fr_1fr]">
      <div class="card">
        <h2 class="card-title">待办事项</h2>
        <ul class="list-none p-0 m-0">
          <li class="flex items-center gap-3 py-3 border-b border-border last:border-b-0">
            <input type="checkbox" class="h-[18px] w-[18px]">
            <span>完成布局组件开发</span>
            <span class="ml-auto text-xs text-destructive">紧急</span>
          </li>
          <li class="flex items-center gap-3 py-3 border-b border-border last:border-b-0">
            <input type="checkbox" class="h-[18px] w-[18px]">
            <span>编写单元测试</span>
            <span class="ml-auto text-xs text-warning">重要</span>
          </li>
          <li class="flex items-center gap-3 py-3 border-b border-border last:border-b-0">
            <input type="checkbox" checked class="h-[18px] w-[18px]">
            <span class="line-through text-muted-foreground">更新文档</span>
            <span class="ml-auto text-xs text-success">已完成</span>
          </li>
          <li class="flex items-center gap-3 py-3 border-b border-border last:border-b-0">
            <input type="checkbox" class="h-[18px] w-[18px]">
            <span>代码审查</span>
            <span class="ml-auto text-xs text-primary">普通</span>
          </li>
        </ul>
      </div>

      <div class="card">
        <h2 class="card-title">快捷操作</h2>
        <div class="grid grid-cols-2 gap-3">
          <button class="btn btn-primary">新建项目</button>
          <button class="btn btn-secondary">上传文件</button>
          <button class="btn btn-secondary">导出数据</button>
          <button class="btn btn-secondary">系统设置</button>
        </div>
      </div>
    </div>
  </div>
</template>
