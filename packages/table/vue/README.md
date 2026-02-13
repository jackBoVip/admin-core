# @admin-core/table-vue

简体中文 | [English](./README.en.md)

`@admin-core/table-core` 的 Vue 3 适配层，基于 `vxe-table`，并内置 `@admin-core/form-vue` 搜索表单联动。

## 对外能力

- `setupAdminTableVue(options)`：初始化 vxe 组件与全局配置
- `useAdminTable(options)`：返回 `[Table, tableApi]`
- `AdminTable`：直接使用组件
- 重导出 core 类型与工具

## vben 迁移映射

### API 映射

| vben API | 新 API |
| --- | --- |
| `setupVbenVxeTable` | `setupAdminTableVue` |
| `useVbenVxeGrid(options)` | `useAdminTable(options)` |
| `use-vxe-grid.vue` | `AdminTable` |

### 示例映射（Vue）

| vben 示例名 | 新示例文件 |
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

## 安装

```bash
pnpm add @admin-core/table-vue vxe-table vxe-pc-ui
```
