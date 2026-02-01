<script setup lang="ts">
// 角色管理
</script>

<template>
  <div class="page-container">
    <h1 class="page-title">角色管理</h1>
    <p class="page-description">管理系统角色与权限</p>

    <div class="card">
      <div style="display: flex; justify-content: flex-end; margin-bottom: 16px;">
        <button class="btn btn-primary">+ 新增角色</button>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th>角色名称</th>
            <th>角色标识</th>
            <th>描述</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>超级管理员</td>
            <td>admin</td>
            <td>拥有所有权限</td>
            <td><span style="color: #10b981;">启用</span></td>
            <td>
              <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 12px;">编辑</button>
            </td>
          </tr>
          <tr>
            <td>普通用户</td>
            <td>user</td>
            <td>基础权限</td>
            <td><span style="color: #10b981;">启用</span></td>
            <td>
              <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 12px;">编辑</button>
            </td>
          </tr>
          <tr>
            <td>访客</td>
            <td>guest</td>
            <td>只读权限</td>
            <td><span style="color: #10b981;">启用</span></td>
            <td>
              <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 12px;">编辑</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
