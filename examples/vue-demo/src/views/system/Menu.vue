<script setup lang="ts">
// 菜单管理
</script>

<template>
  <div class="page-container">
    <h1 class="page-title">菜单管理</h1>
    <p class="page-description">管理系统菜单配置</p>

    <div class="card">
      <div style="display: flex; justify-content: flex-end; margin-bottom: 16px;">
        <button class="btn btn-primary">+ 新增菜单</button>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th>菜单名称</th>
            <th>路径</th>
            <th>图标</th>
            <th>排序</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>首页</td>
            <td>/</td>
            <td>home</td>
            <td>1</td>
            <td><span style="color: #10b981;">显示</span></td>
            <td>
              <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 12px;">编辑</button>
            </td>
          </tr>
          <tr>
            <td style="padding-left: 24px;">├ 仪表盘</td>
            <td>/dashboard</td>
            <td>dashboard</td>
            <td>2</td>
            <td><span style="color: #10b981;">显示</span></td>
            <td>
              <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 12px;">编辑</button>
            </td>
          </tr>
          <tr>
            <td style="padding-left: 48px;">│ ├ 分析页</td>
            <td>/dashboard/analysis</td>
            <td>chart</td>
            <td>1</td>
            <td><span style="color: #10b981;">显示</span></td>
            <td>
              <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 12px;">编辑</button>
            </td>
          </tr>
          <tr>
            <td style="padding-left: 48px;">│ └ 监控页</td>
            <td>/dashboard/monitor</td>
            <td>monitor</td>
            <td>2</td>
            <td><span style="color: #10b981;">显示</span></td>
            <td>
              <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 12px;">编辑</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
