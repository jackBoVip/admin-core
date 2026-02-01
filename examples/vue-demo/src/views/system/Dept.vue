<script setup lang="ts">
// 部门管理
</script>

<template>
  <div class="page-container">
    <h1 class="page-title">部门管理</h1>
    <p class="page-description">管理组织部门结构</p>

    <div class="card">
      <div style="display: flex; justify-content: flex-end; margin-bottom: 16px;">
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
            <td><span style="color: #10b981;">启用</span></td>
            <td>
              <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 12px;">编辑</button>
            </td>
          </tr>
          <tr>
            <td style="padding-left: 24px;">├ 技术部</td>
            <td>张经理</td>
            <td>30</td>
            <td><span style="color: #10b981;">启用</span></td>
            <td>
              <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 12px;">编辑</button>
            </td>
          </tr>
          <tr>
            <td style="padding-left: 24px;">├ 产品部</td>
            <td>李经理</td>
            <td>20</td>
            <td><span style="color: #10b981;">启用</span></td>
            <td>
              <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 12px;">编辑</button>
            </td>
          </tr>
          <tr>
            <td style="padding-left: 24px;">└ 运营部</td>
            <td>赵经理</td>
            <td>15</td>
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
