# @admin-core/table-react

English | [简体中文](./README.md)

React adapter layer for `@admin-core/table-core`, powered by `antd` Table and built-in search-form integration via `@admin-core/form-react`.

## Public API

- `setupAdminTableReact(options)`: initialize global config and built-in renderers
- `useAdminTable(options)`: returns `[Table, tableApi]`
- `AdminTable`: direct component usage
- Re-exports core types and helpers

## vben Migration Map

### API Mapping

| vben API | New API |
| --- | --- |
| `setupVbenVxeTable` | `setupAdminTableReact` |
| `useVbenVxeGrid(options)` | `useAdminTable(options)` |
| `use-vxe-grid.vue` | `AdminTable` (React semantic-equivalent implementation) |

### Example Mapping (React)

| vben example | New demo file |
| --- | --- |
| `basic` | `/Users/zhouhongbo/Documents/workspace/admin-core/examples/react-demo/src/pages/components/table/Basic.tsx` |
| `remote` | `/Users/zhouhongbo/Documents/workspace/admin-core/examples/react-demo/src/pages/components/table/Remote.tsx` |
| `form` | `/Users/zhouhongbo/Documents/workspace/admin-core/examples/react-demo/src/pages/components/table/Form.tsx` |
| `tree` | `/Users/zhouhongbo/Documents/workspace/admin-core/examples/react-demo/src/pages/components/table/Tree.tsx` |
| `fixed` | `/Users/zhouhongbo/Documents/workspace/admin-core/examples/react-demo/src/pages/components/table/Fixed.tsx` |
| `custom-cell` | `/Users/zhouhongbo/Documents/workspace/admin-core/examples/react-demo/src/pages/components/table/CustomCell.tsx` |
| `edit-cell` | `/Users/zhouhongbo/Documents/workspace/admin-core/examples/react-demo/src/pages/components/table/EditCell.tsx` |
| `edit-row` | `/Users/zhouhongbo/Documents/workspace/admin-core/examples/react-demo/src/pages/components/table/EditRow.tsx` |
| `virtual` | `/Users/zhouhongbo/Documents/workspace/admin-core/examples/react-demo/src/pages/components/table/Virtual.tsx` |

## Install

```bash
pnpm add @admin-core/table-react antd
```
