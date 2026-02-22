# @admin-core/table-vue

简体中文 | [English](./README.en.md)

`@admin-core/table-core` 的 Vue 3 适配层，基于 `vxe-table`，并内置 `@admin-core/form-vue` 搜索表单联动。

## 对外能力

- `setupAdminTableVue(options)`：初始化 vxe 组件与全局配置
- `useAdminTable(options)`：返回 `[Table, tableApi]`
- `AdminTable`：直接使用组件
- 重导出 core 类型与工具

## 旧版迁移映射

### API 映射

| 旧版 API | 新 API |
| --- | --- |
| `legacySetupVxeTable` | `setupAdminTableVue` |
| `legacyUseVxeGrid(options)` | `useAdminTable(options)` |
| `use-vxe-grid.vue` | `AdminTable` |

### 示例映射（Vue）

| 旧版示例名 | 新示例文件 |
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

## 列设置持久化（浏览器）

通过 `gridOptions.columnCustomPersistence` 开启内置浏览器持久化（默认 `localStorage`）：

```ts
const [Table] = useAdminTable({
  gridEvents: {
    columnCustomChange: ({ action, snapshot }) => {
      if (action === 'confirm' || action === 'reset') {
        // 可选：同步到后端
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

## 偏好设置联动

- `setupAdminTableVue` 默认会订阅 `@admin-core/preferences` 的默认 store（`bindPreferences: true`）。
- 语言会跟随 `preferences.app.locale` 自动切换（`zh-CN/en-US`）。
- 主题会跟随偏好设置自动调用 vxe 主题切换（`light/dark`）。
- 如果你的应用未初始化偏好系统，可显式关闭：`setupAdminTableVue({ bindPreferences: false })`。
