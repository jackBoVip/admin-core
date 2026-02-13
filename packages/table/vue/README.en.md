# @admin-core/table-vue

English | [简体中文](./README.md)

Vue 3 adapter layer for `@admin-core/table-core`, powered by `vxe-table` and built-in search form integration via `@admin-core/form-vue`.

## Public API

- `setupAdminTableVue(options)`: initialize vxe components and global config
- `useAdminTable(options)`: returns `[Table, tableApi]`
- `AdminTable`: direct component usage
- Re-exports core types and helpers

## vben Migration Map

### API Mapping

| vben API | New API |
| --- | --- |
| `setupVbenVxeTable` | `setupAdminTableVue` |
| `useVbenVxeGrid(options)` | `useAdminTable(options)` |
| `use-vxe-grid.vue` | `AdminTable` |

### Example Mapping (Vue)

| vben example | New demo file |
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
