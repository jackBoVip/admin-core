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

    <div class="card max-w-[500px]">
      <h2 class="card-title">登录表单</h2>
      <form @submit.prevent class="flex flex-col gap-4">
        <div>
          <label class="block mb-1 font-medium">用户名</label>
          <input
            v-model="formData.username"
            type="text"
            placeholder="请输入用户名"
            class="w-full rounded-md border border-border px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
        </div>
        <div>
          <label class="block mb-1 font-medium">邮箱</label>
          <input
            v-model="formData.email"
            type="email"
            placeholder="请输入邮箱"
            class="w-full rounded-md border border-border px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
        </div>
        <div>
          <label class="block mb-1 font-medium">密码</label>
          <input
            v-model="formData.password"
            type="password"
            placeholder="请输入密码"
            class="w-full rounded-md border border-border px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
        </div>
        <div class="flex items-center gap-2">
          <input
            v-model="formData.remember"
            type="checkbox"
            id="remember"
            class="h-4 w-4"
          >
          <label for="remember">记住我</label>
        </div>
        <button type="submit" class="btn btn-primary w-full">登录</button>
      </form>
    </div>
  </div>
</template>
