<script setup lang="ts">
// 用户管理
</script>

<template>
  <div class="page-container">
    <h1 class="page-title">用户管理</h1>
    <p class="page-description">管理系统用户</p>

    <div class="card">
      <div class="flex justify-between mb-4">
        <div class="flex gap-2">
          <input
            type="text"
            placeholder="搜索用户..."
            class="w-60 rounded-md border border-border px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
          <button class="btn btn-primary">搜索</button>
        </div>
        <button class="btn btn-primary">+ 新增用户</button>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th>用户名</th>
            <th>姓名</th>
            <th>邮箱</th>
            <th>角色</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>admin</td>
            <td>管理员</td>
            <td>admin@example.com</td>
            <td>超级管理员</td>
            <td><span class="text-success">启用</span></td>
            <td>
              <button class="btn btn-secondary px-2 py-1 text-xs">编辑</button>
            </td>
          </tr>
          <tr>
            <td>user1</td>
            <td>张三</td>
            <td>zhangsan@example.com</td>
            <td>普通用户</td>
            <td><span class="text-success">启用</span></td>
            <td>
              <button class="btn btn-secondary px-2 py-1 text-xs">编辑</button>
            </td>
          </tr>
          <tr>
            <td>user2</td>
            <td>李四</td>
            <td>lisi@example.com</td>
            <td>普通用户</td>
            <td><span class="text-destructive">禁用</span></td>
            <td>
              <button class="btn btn-secondary px-2 py-1 text-xs">编辑</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
