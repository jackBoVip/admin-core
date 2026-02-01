<script setup lang="ts">
// 用户管理
</script>

<template>
  <div class="page-container">
    <h1 class="page-title">用户管理</h1>
    <p class="page-description">管理系统用户</p>

    <div class="card">
      <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
        <div style="display: flex; gap: 8px;">
          <input type="text" placeholder="搜索用户..." style="padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 6px; width: 240px;">
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
            <td><span style="color: #10b981;">启用</span></td>
            <td>
              <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 12px;">编辑</button>
            </td>
          </tr>
          <tr>
            <td>user1</td>
            <td>张三</td>
            <td>zhangsan@example.com</td>
            <td>普通用户</td>
            <td><span style="color: #10b981;">启用</span></td>
            <td>
              <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 12px;">编辑</button>
            </td>
          </tr>
          <tr>
            <td>user2</td>
            <td>李四</td>
            <td>lisi@example.com</td>
            <td>普通用户</td>
            <td><span style="color: #ef4444;">禁用</span></td>
            <td>
              <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 12px;">编辑</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
