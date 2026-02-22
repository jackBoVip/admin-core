# @admin-core/table-vue

English | [简体中文](./README.md)

Vue 3 adapter layer for `@admin-core/table-core`, powered by `vxe-table` and built-in search form integration via `@admin-core/form-vue`.

## Public API

- `setupAdminTableVue(options)`: initialize vxe components and global config
- `useAdminTable(options)`: returns `[Table, tableApi]`
- `AdminTable`: direct component usage
- Re-exports core types and helpers

## Legacy Migration Map

### API Mapping

| Legacy API | New API |
| --- | --- |
| `legacySetupVxeTable` | `setupAdminTableVue` |
| `legacyUseVxeGrid(options)` | `useAdminTable(options)` |
| `use-vxe-grid.vue` | `AdminTable` |

### Example Mapping (Vue)

| Legacy example | New demo file |
| --- | --- |
| `basic` | `/Users/zhouhongbo/Documents/workspace/admin-core/examples/vue-demo/src/views/components/table/Basic.vue` |
| `remote` | `/Users/zhouhongbo/Documents/workspace/admin-core/examples/vue-demo/src/views/components/table/Remote.vue` |
| `form` | `/Users/zhouhongbo/Documents/workspace/admin-core/examples/vue-demo/src/views/components/table/Form.vue` |
| `tree` | `/Users/zhouhongbo/Documents/workspace/admin-core/examples/vue-demo/src/views/components/table/Tree.vue` |
| `fixed` | `/Users/zhouhongbo/Documents/workspace/admin-core/examples/vue-demo/src/views/components/table/Fixed.vue` |
| `custom-cell` | `/Users/zhouhongbo/Documents/workspace/admin-core/examples/vue-demo/src/views/components/table/CustomCell.vue` |
| `edit-cell` | `/Users/zhouhongbo/Documents/workspace/admin-core/examples/vue-demo/src/views/components/table/EditCell.vue` |
| `edit-row` | `/Users/zhouhongbo/Documents/workspace/admin-core/examples/vue-demo/src/views/components/table/EditRow.vue` |
| `virtual` | `/Users/zhouhongbo/Documents/workspace/admin-core/examples/vue-demo/src/views/components/table/Virtual.vue` |

## Install

```bash
pnpm add @admin-core/table-vue vxe-table vxe-pc-ui
```

## Column Custom Persistence (Browser)

Enable built-in browser persistence with `gridOptions.columnCustomPersistence` (defaults to `localStorage`):

```ts
const [Table] = useAdminTable({
  gridEvents: {
    columnCustomChange: ({ action, snapshot }) => {
      if (action === 'confirm' || action === 'reset') {
        // Optional: sync to backend
        void saveColumnState(snapshot);
      }
    },
  },
  gridOptions: {
    columnCustomPersistence: {
      key: 'demo:table:basic',
      storage: 'local', // local | session
    },
    toolbarConfig: {
      custom: true,
    },
  },
});
```

## Preferences Integration

- `setupAdminTableVue` subscribes to the default `@admin-core/preferences` store by default (`bindPreferences: true`).
- Locale automatically follows `preferences.app.locale` (`zh-CN/en-US`).
- Theme automatically follows preferences and switches vxe theme (`light/dark`).
- If your app does not initialize preferences, disable this behavior explicitly: `setupAdminTableVue({ bindPreferences: false })`.
