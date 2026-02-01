<script setup lang="ts">
const tableData = [
  { id: 1, name: '商品A', price: 99.00, stock: 100, status: '上架' },
  { id: 2, name: '商品B', price: 199.00, stock: 50, status: '上架' },
  { id: 3, name: '商品C', price: 299.00, stock: 0, status: '下架' },
  { id: 4, name: '商品D', price: 399.00, stock: 25, status: '上架' },
  { id: 5, name: '商品E', price: 499.00, stock: 10, status: '上架' },
];
</script>

<template>
  <div class="page-container">
    <h1 class="page-title">表格</h1>
    <p class="page-description">表格组件示例</p>

    <div class="card">
      <h2 class="card-title">商品列表</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>商品名称</th>
            <th>价格</th>
            <th>库存</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in tableData" :key="item.id">
            <td>{{ item.id }}</td>
            <td>{{ item.name }}</td>
            <td>¥{{ item.price.toFixed(2) }}</td>
            <td>{{ item.stock }}</td>
            <td>
              <span :style="{ color: item.status === '上架' ? '#10b981' : '#ef4444' }">
                {{ item.status }}
              </span>
            </td>
            <td>
              <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 12px; margin-right: 8px;">编辑</button>
              <button class="btn" style="padding: 4px 8px; font-size: 12px; background: #ef4444; color: white;">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
