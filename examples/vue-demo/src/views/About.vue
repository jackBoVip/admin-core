<script setup lang="ts">
// About page
</script>

<template>
  <div>
    <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 24px; color: var(--foreground);">
      关于
    </h1>

    <div class="card" style="margin-bottom: 24px;">
      <h2 class="card-title">Admin Core Preferences</h2>
      <div class="card-content">
        <p style="margin-bottom: 16px;">
          这是一个与框架无关的偏好设置管理包，提供完整的主题、布局、国际化等配置功能。
        </p>

        <h3 style="font-weight: 600; margin-bottom: 8px; color: var(--foreground);">包结构</h3>
        <ul style="list-style: disc; padding-left: 20px; line-height: 2; margin-bottom: 16px;">
          <li><code>@admin-core/preferences</code> - 核心包（框架无关）</li>
          <li><code>@admin-core/preferences-vue</code> - Vue 3 集成</li>
          <li><code>@admin-core/preferences-react</code> - React 18 集成</li>
        </ul>

        <h3 style="font-weight: 600; margin-bottom: 8px; color: var(--foreground);">技术特点</h3>
        <ul style="list-style: disc; padding-left: 20px; line-height: 2; margin-bottom: 16px;">
          <li>基于 OKLCH 色彩空间的智能配色系统</li>
          <li>仅需配置主色，自动派生语义色</li>
          <li>支持 Tailwind CSS v4 预设</li>
          <li>适配多种 UI 库（Ant Design, Element Plus, Naive UI, shadcn/ui）</li>
          <li>完整的 TypeScript 类型定义</li>
          <li>自动持久化与系统主题监听</li>
        </ul>

        <h3 style="font-weight: 600; margin-bottom: 8px; color: var(--foreground);">使用方式</h3>
        <pre style="
          background: var(--muted);
          padding: 16px;
          border-radius: var(--radius);
          overflow: auto;
          font-size: 12px;
          line-height: 1.6;
        ">// Vue 3
import { initPreferences, usePreferences, PreferencesDrawer } from '@admin-core/preferences-vue';

// 初始化
initPreferences({ namespace: 'my-app' });

// 使用 Hook
const { preferences, setPreferences } = usePreferences();

// 使用抽屉组件
&lt;PreferencesDrawer v-model:open="open" /&gt;</pre>
      </div>
    </div>

    <div class="card">
      <h2 class="card-title">链接</h2>
      <div style="display: flex; gap: 16px;">
        <a
          href="https://github.com"
          target="_blank"
          class="btn btn-secondary"
        >
          GitHub
        </a>
        <a
          href="#"
          class="btn btn-secondary"
        >
          文档
        </a>
      </div>
    </div>
  </div>
</template>
