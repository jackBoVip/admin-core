# @admin-core/tabs-vue

Vue 3 Tabs adapter package.

## Install

```bash
pnpm add @admin-core/tabs-vue
```

## Usage

```ts
import { AdminTabs } from '@admin-core/tabs-vue';
import '@admin-core/tabs-vue/style.css';
```

```vue
<script setup lang="ts">
import { AdminTabs, type AdminTabVueItem } from '@admin-core/tabs-vue';

const items: AdminTabVueItem[] = [
  { key: 'overview', title: 'Overview' },
  { key: 'detail', title: 'Detail' },
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

## Key Props

| Field | Type | Description |
| --- | --- | --- |
| `items` | `AdminTabVueItem[]` | Tab items |
| `activeKey` | `string \| null` | Controlled active key |
| `defaultActiveKey` | `string \| null` | Uncontrolled default active key |
| `tabs` | `boolean \| AdminTabsOptions` | Tabs behavior config (includes `contentInsetTop`) |
| `onChange` / `@change` | `(payload) => void` | Change callback |
| `onClose` / `@close` | `(payload) => void` | Close callback |

Default `contentInsetTop = -30` is applied when users do not provide one.

## Core Re-exports

`@admin-core/tabs-vue` re-exports the core APIs from `@admin-core/tabs-core` (for example `normalizeAdminTabsOptions`, `resolveAdminTabsStyleVars`, and `setAdminTabsLocale`) so Vue consumers can use one unified entry.
