# @admin-core/table-react

简体中文 | [English](./README.en.md)

`@admin-core/table-core` 的 React 适配层，基于 `antd` Table，并内置 `@admin-core/form-react` 搜索表单联动。

## 对外能力

- `setupAdminTableReact(options)`：初始化全局配置和内置渲染器
- `useAdminTable(options)`：返回 `[Table, tableApi]`
- `AdminTable`：直接使用组件
- 重导出 core 类型与工具

## 旧版迁移映射

### API 映射

| 旧版 API | 新 API |
| --- | --- |
| `legacySetupVxeTable` | `setupAdminTableReact` |
| `legacyUseVxeGrid(options)` | `useAdminTable(options)` |
| `use-vxe-grid.vue` | `AdminTable`（React 语义对齐实现） |

### 示例映射（React）

| 旧版示例名 | 新示例文件 |
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

- `setupAdminTableReact` 默认会订阅 `@admin-core/preferences` 的默认 store（`bindPreferences: true`）。
- 语言会跟随 `preferences.app.locale` 自动切换（`zh-CN/en-US`）。
- 主题由偏好系统的 CSS 变量驱动，建议同时引入 `@admin-core/preferences/styles/antd`。
- 如果你的应用未初始化偏好系统，可显式关闭：`setupAdminTableReact({ bindPreferences: false })`。

## 与 Form/Layout 组合（避免重复样式）

推荐在应用入口统一引入样式（单入口）：

```css
@import "@admin-core/preferences/styles/antd";
@import "@admin-core/layout-react/style.css";
@import "@admin-core/form-react/style.css";
@import "@admin-core/table-react/style.css";
```

- `@admin-core/table-react/style.css` 已内置 `antd/dist/reset.css`，请勿重复引入。
- `@admin-core/layout-react/style.css` 已内置 `tailwindcss`，请勿重复引入。
