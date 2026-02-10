<script setup lang="ts">
// 部门管理
</script>

<template>
  <div class="page-container">
    <h1 class="page-title">部门管理</h1>
    <p class="page-description">管理组织部门结构</p>

    <div class="card">
      <div class="flex justify-end mb-4">
        <button class="btn btn-primary">+ 新增部门</button>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th>部门名称</th>
            <th>负责人</th>
            <th>人数</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>总公司</td>
            <td>王总</td>
            <td>100</td>
            <td><span class="text-success">启用</span></td>
            <td>
              <button class="btn btn-secondary px-2 py-1 text-xs">编辑</button>
            </td>
          </tr>
          <tr>
            <td class="pl-6">├ 技术部</td>
            <td>张经理</td>
            <td>30</td>
            <td><span class="text-success">启用</span></td>
            <td>
              <button class="btn btn-secondary px-2 py-1 text-xs">编辑</button>
            </td>
          </tr>
          <tr>
            <td class="pl-6">├ 产品部</td>
            <td>李经理</td>
            <td>20</td>
            <td><span class="text-success">启用</span></td>
            <td>
              <button class="btn btn-secondary px-2 py-1 text-xs">编辑</button>
            </td>
          </tr>
          <tr>
            <td class="pl-6">└ 运营部</td>
            <td>赵经理</td>
            <td>15</td>
            <td><span class="text-success">启用</span></td>
            <td>
              <button class="btn btn-secondary px-2 py-1 text-xs">编辑</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
