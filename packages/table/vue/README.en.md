# @admin-core/table-vue

English | [简体中文](./README.md)

Vue 3 adapter for `@admin-core/table-core`, powered by `vxe-table` with built-in search form integration via `@admin-core/form-vue`.

## Install

```bash
pnpm add @admin-core/table-vue vxe-table vxe-pc-ui @admin-core/form-vue
```

Optional (recommended):

```bash
pnpm add @admin-core/preferences @admin-core/preferences-vue
```

## Public API

| API | Signature / Description |
| --- | --- |
| `AdminTable` | Vue component for direct usage. |
| `useAdminTable(options)` | Returns `[Table, tableApi]`. |
| `setupAdminTableVue(options?)` | Initializes vxe components, locale/theme sync, and built-in renderers. |
| `syncAdminTableVueWithPreferences()` | Manually sync preferences to table. |
| `getAdminTableVueSetupState()` | Read current setup state. |

Core re-exports are also available, including `createTableApi`, `extendProxyOptions`, `registerTableFormatters`, `setupAdminTableCore`, `getLocaleMessages`, and shared types.

## Quick Start

### 1) App setup

```ts
import { setupAdminTableVue } from '@admin-core/table-vue';

setupAdminTableVue({
  bindPreferences: true,
  locale: 'en-US',
});
```

### 2) Page usage

```vue
<script setup lang="ts">
import { useAdminTable } from '@admin-core/table-vue';

const [Table] = useAdminTable({
  tableTitle: 'Basic Table',
  formOptions: {
    schema: [{ component: 'input', fieldName: 'name', label: 'Name' }],
  },
  gridOptions: {
    rowConfig: { keyField: 'id' },
    seqColumn: true,
    columns: [
      { field: 'name', title: 'Name' },
      { field: 'age', title: 'Age', sortable: true },
      { field: 'role', title: 'Role', filterable: true },
    ],
    data: [],
    toolbarConfig: {
      refresh: true,
      zoom: true,
      custom: true,
    },
  },
});
</script>

<template>
  <Table />
</template>
```

## Toolbar (`gridOptions.toolbarConfig`)

| Field | Description |
| --- | --- |
| `search` | Show search panel toggle button. |
| `refresh` | Refresh button. Uses `reload` when `proxyConfig` is enabled; otherwise runs built-in local refresh interaction. |
| `zoom` | Fullscreen toggle button. |
| `custom` | Column custom panel button. |
| `hint` | Center hint area (text, alignment, color, size, overflow mode). |
| `tools` | Custom action tools with permission/show/disabled/icon/text/type support. |
| `toolsPosition` | Position custom tools around built-in tools (`before/after/left/right`). |
| `toolsSlotPosition` | Relation between `toolbar-tools` slot and generated tools (`before/after/replace`). |

`ToolbarToolConfig.permission` supports:

- `permission: ['TABLE_EDIT', 'TABLE_DELETE']` (default `or`)
- `permission: { value: ['A', 'B'], mode: 'and', arg: 'code' }`
- `permission: { value: ['admin'], arg: 'role' }`

## Slots

| Slot | Description |
| --- | --- |
| `table-title` | Custom title block. |
| `toolbar-actions` | Left toolbar area (next to title). |
| `toolbar-center` | Center toolbar area (replaces `toolbarConfig.hint`). |
| `toolbar-tools` | Right toolbar tools slot. |
| `form` | Replace the whole search form block. |
| `loading` | Custom loading content. |
| `empty` | Custom empty content. |
| `form-*` | Forwarded to built-in `AdminSearchForm` field/action slots. |

Non-reserved slots are forwarded to `VxeGrid` column slots.

## Selection / Seq / Operation Column

### Built-in seq column

```ts
gridOptions: {
  seqColumn: true,
}
```

### Row selection

```ts
gridOptions: {
  rowSelection: {
    type: 'radio', // 'radio' | 'checkbox'
    trigger: 'row', // 'cell' | 'row'
    strict: true,
    selectedRowKeys: [1],
    onChange: (keys, rows) => console.log(keys, rows),
  },
}
```

### Built-in operation column

```ts
gridOptions: {
  operationColumn: {
    width: 220,
    tools: [
      { code: 'view', title: 'View', type: 'info-text' },
      { code: 'edit', title: 'Edit', permission: ['TABLE_EDIT'] },
      { code: 'delete', title: 'Delete', type: 'error-text', permission: ['TABLE_DELETE'] },
    ],
  },
}
```

The operation column is rendered only when at least one operation tool is visible.

## Column Custom Persistence + Events

```ts
gridOptions: {
  columnCustomPersistence: {
    key: 'demo:table:basic',
    storage: 'local', // local | session
  },
  toolbarConfig: { custom: true },
},
gridEvents: {
  columnCustomChange: ({ action, snapshot }) => {
    if (action === 'confirm' || action === 'reset') {
      void saveToServer(snapshot);
    }
  },
},
```

`columnCustomChange.action`: `open` / `cancel` / `confirm` / `reset`.

## Unified Pagination Events (Vue/React Consistent)

```ts
gridEvents: {
  onPageChange: ({ currentPage, pageSize, type, source }) => {
    console.log('page change', currentPage, pageSize, type, source);
  },
  onPageSizeChange: ({ pageSize }) => {
    console.log('size change', pageSize);
  },
  onPaginationChange: (payload) => {
    console.log('pagination change', payload);
  },
},
```

Notes:

- `onPageChange`: fires when pagination changes (current page or page size).
- `onPageSizeChange`: fires only when page size changes.
- `onPaginationChange`: unified pagination event (recommended for cross-framework code).
- `gridOptions.pagerConfig.resetToFirstOnPageSizeChange`: set to `true` to reset to page 1 when page size changes.
- `gridOptions.pagerConfig.exportConfig`: adds an export icon on the right side of pagination. `current/selected` use built-in Excel export, `all` requires a custom `exportAll` handler.
- Vue native `gridEvents.pageChange` is still supported and can be used together.

```ts
gridOptions: {
  pagerConfig: {
    enabled: true,
    exportConfig: {
      options: ['current', 'selected', 'all'],
      exportAll: async (ctx) => {
        // call backend export API (required for "all")
        await requestExportAll(ctx);
      },
    },
  },
},
```

## Pagination Toolbar (Left/Center/Right)

- Default position is right: `gridOptions.pagerConfig.position` defaults to `right`.
- You can switch it to left: `gridOptions.pagerConfig.position = 'left'`.
- Pagination toolbar follows the same semantics as top toolbar (auto-built buttons/icon buttons/slot buttons):
  - Left: `pagerConfig.toolbar.leftTools` + `pager-left` slot
  - Center: `pagerConfig.toolbar.hint` or `pager-center` slot
  - Right: `pagerConfig.toolbar.rightTools` (or `tools`) + `pager-tools` slot

```vue
<script setup lang="ts">
const gridOptions = {
  pagerConfig: {
    // optional: 'left' | 'right', default is right
    position: 'right',
    toolbar: {
      leftTools: [{ title: 'Left Tool', type: 'default', onClick: () => {} }],
      leftToolsPosition: 'before',
      leftToolsSlotPosition: 'after',
      hint: {
        content: 'Pager center hint',
        align: 'center',
        overflow: 'scroll',
      },
      tools: [{ icon: 'vxe-table-icon-repeat', onClick: () => {} }],
      toolsPosition: 'before',
      toolsSlotPosition: 'after',
    },
  },
};
</script>

<AdminTable :grid-options="gridOptions">
  <template #pager-left>Pager Left Slot</template>
  <template #pager-center>Pager Center Slot</template>
  <template #pager-tools>Pager Right Slot</template>
</AdminTable>
```

Notes:

- `tools`/`toolsPosition`/`toolsSlotPosition` are shorthand for the right area (`rightTools*`).
- If `pager-tools` uses `replace`, the built-in export icon on the right is hidden.

## Strategy (Cell/Row)

Supports computed cell value, style rules, click behavior, row policies, and regex conditions.

```ts
gridOptions: {
  strategy: {
    columns: {
      score: {
        rules: [
          { when: { field: 'score', gte: 90 }, color: 'var(--primary)', fontWeight: 700, unit: 'pt' },
          { when: { field: 'name', regex: { pattern: '^A', flags: 'i' } }, textDecoration: 'underline' },
        ],
      },
    },
    rows: [{ when: { field: 'score', lt: 60 }, backgroundColor: 'var(--primary-100)' }],
  },
}
```

Regex forms:

- `regex: /pattern/flags`
- `regex: { pattern: '...', flags: 'i' }`
- `notRegex` is also supported.

## Preferences Integration (Theme / i18n)

- `setupAdminTableVue` enables preference binding by default (`bindPreferences: true`).
- Locale follows `preferences.app.locale` (`zh-CN/en-US`).
- Theme follows preferences and switches vxe `light/dark`.
- Disable explicitly if preferences is not initialized: `setupAdminTableVue({ bindPreferences: false })`.

## FAQ

### Why does this package depend on `@admin-core/form-vue`?

Because table search panel (`formOptions`) reuses form-core capabilities: schema rendering, submit/reset flow, `submitOnChange`, and slot bridging.

### Can refresh work without `proxyConfig`?

Yes. Refresh UI and events still work. Remote fetching requires `proxyConfig`.

### How to observe internal table state externally?

`tableApi` from `useAdminTable` provides `useStore(selector)` for state subscription.

## Demo Paths

- `examples/vue-demo/src/views/components/table/Basic.vue`
- `examples/vue-demo/src/views/components/table/Remote.vue`
- `examples/vue-demo/src/views/components/table/Form.vue`
- `examples/vue-demo/src/views/components/table/Tree.vue`
- `examples/vue-demo/src/views/components/table/Fixed.vue`
- `examples/vue-demo/src/views/components/table/CustomCell.vue`
- `examples/vue-demo/src/views/components/table/EditCell.vue`
- `examples/vue-demo/src/views/components/table/EditRow.vue`
- `examples/vue-demo/src/views/components/table/Virtual.vue`
- `examples/vue-demo/src/views/components/table/Slot.vue`
- `examples/vue-demo/src/views/components/table/ElementPlusSlot.vue`
