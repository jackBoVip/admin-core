# @admin-core/tabs-vue

Vue 3 Tabs 适配包。

## 安装

```bash
pnpm add @admin-core/tabs-vue
```

## 使用

```ts
import { AdminTabs } from '@admin-core/tabs-vue';
import '@admin-core/tabs-vue/style.css';
```

```vue
<script setup lang="ts">
import { AdminTabs, type AdminTabVueItem } from '@admin-core/tabs-vue';

const items: AdminTabVueItem[] = [
  { key: 'overview', title: '概览' },
  { key: 'detail', title: '详情' },
];
</script>

<template>
  <AdminTabs
    default-active-key="overview"
    :items="items"
    :tabs="{
      align: 'left',
      sticky: true,
      stickyTop: 0,
      contentInsetTop: 0
    }"
  />
</template>
```

## 主要 Props

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `items` | `AdminTabVueItem[]` | 页签数据 |
| `activeKey` | `string \| null` | 受控模式当前激活 key |
| `defaultActiveKey` | `string \| null` | 非受控默认激活 key |
| `tabs` | `boolean \| AdminTabsOptions` | tabs 行为配置（含 `contentInsetTop`） |
| `onChange` / `@change` | `(payload) => void` | 切换事件 |
| `onClose` / `@close` | `(payload) => void` | 关闭事件 |

默认 `contentInsetTop = -30`（当用户未配置时自动生效）。

## Core 能力复用

`@admin-core/tabs-vue` 已重导出 `@admin-core/tabs-core` 的核心 API（如 `normalizeAdminTabsOptions`、`resolveAdminTabsStyleVars`、`setAdminTabsLocale`），可在 Vue 侧直接统一调用。
