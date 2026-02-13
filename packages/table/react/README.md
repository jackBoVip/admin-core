# @admin-core/table-react

简体中文 | [English](./README.en.md)

`@admin-core/table-core` 的 React 适配层，基于 `antd` Table，并内置 `@admin-core/form-react` 搜索表单联动。

## 对外能力

- `setupAdminTableReact(options)`：初始化全局配置和内置渲染器
- `useAdminTable(options)`：返回 `[Table, tableApi]`
- `AdminTable`：直接使用组件
- 重导出 core 类型与工具

## vben 迁移映射

### API 映射

| vben API | 新 API |
| --- | --- |
| `setupVbenVxeTable` | `setupAdminTableReact` |
| `useVbenVxeGrid(options)` | `useAdminTable(options)` |
| `use-vxe-grid.vue` | `AdminTable`（React 语义对齐实现） |

### 示例映射（React）

| vben 示例名 | 新示例文件 |
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

## 安装

```bash
pnpm add @admin-core/table-react antd
```
