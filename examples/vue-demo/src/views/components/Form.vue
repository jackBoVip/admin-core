<script setup lang="ts">
import { ref } from 'vue';

const formData = ref({
  username: '',
  email: '',
  password: '',
  remember: false,
});
</script>

<template>
  <div class="page-container">
    <h1 class="page-title">表单</h1>
    <p class="page-description">表单组件示例</p>

    <div class="card" style="max-width: 500px;">
      <h2 class="card-title">登录表单</h2>
      <form @submit.prevent style="display: flex; flex-direction: column; gap: 16px;">
        <div>
          <label style="display: block; margin-bottom: 4px; font-weight: 500;">用户名</label>
          <input
            v-model="formData.username"
            type="text"
            placeholder="请输入用户名"
            style="width: 100%; padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 6px;"
          >
        </div>
        <div>
          <label style="display: block; margin-bottom: 4px; font-weight: 500;">邮箱</label>
          <input
            v-model="formData.email"
            type="email"
            placeholder="请输入邮箱"
            style="width: 100%; padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 6px;"
          >
        </div>
        <div>
          <label style="display: block; margin-bottom: 4px; font-weight: 500;">密码</label>
          <input
            v-model="formData.password"
            type="password"
            placeholder="请输入密码"
            style="width: 100%; padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 6px;"
          >
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <input
            v-model="formData.remember"
            type="checkbox"
            id="remember"
            style="width: 16px; height: 16px;"
          >
          <label for="remember">记住我</label>
        </div>
        <button type="submit" class="btn btn-primary" style="width: 100%;">登录</button>
      </form>
    </div>
  </div>
</template>
