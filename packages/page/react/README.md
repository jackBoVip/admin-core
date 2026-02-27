# @admin-core/page-react

简体中文 | [English](./README.en.md)

`@admin-core/page-core` 的 React UI 适配层，提供路由页与组件页渲染。

## 安装

```bash
pnpm add @admin-core/page-react
```

- `@admin-core/form-react` 与 `@admin-core/table-react` 为 `@admin-core/page-react` 的内部依赖，业务侧无需额外安装。

### CDN（生产/开发）

```html
<script src="https://cdn.jsdelivr.net/npm/@admin-core/page-react/dist/index.global.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@admin-core/page-react/dist/index.global.dev.js"></script>
```

## 快速开始

```tsx
import { useAdminPage } from '@admin-core/page-react';

const [Page] = useAdminPage({
  pages: [
    { key: 'dashboard', type: 'component', title: '仪表盘', component: DashboardPage },
    { key: 'user', type: 'route', path: '/system/user', title: '用户管理' },
  ],
  scroll: true,
});
```

- `scroll` 可全局配置，也可在每个 page 上用 `page.scroll` 覆盖。

## 初始化

```tsx
import { setupAdminPageReact } from '@admin-core/page-react';

setupAdminPageReact({
  locale: 'zh-CN',
  logLevel: 'warn',
});
```

- 默认会自动执行 `setupAdminFormReact` 与 `setupAdminTableReact`。
- 可通过 `form: false` 或 `table: false` 关闭自动 setup。

## 查询表单 + 表格组合页

```tsx
import { useAdminPageQueryTable } from '@admin-core/page-react';

const [PageQueryTable, api] = useAdminPageQueryTable({
  formOptions: {
    schema: [{ fieldName: 'name', component: 'input', label: 'Name' }],
  },
  tableOptions: {
    gridOptions: {
      columns: [{ field: 'name', title: 'Name' }],
      data: [],
    },
  },
});
```

- 组合页默认使用 `AdminSearchForm` 作为上方查询区，`AdminTable` 作为下方表格区。
- `api.formApi`、`api.tableApi` 会透传暴露，支持直接调用。
- 默认会在 `submit` 时执行 `tableApi.query`，在 `reset` 时执行 `tableApi.reload`。

## 查询表格组合页用法

### 1) 非受控模式（推荐）

```tsx
const [PageQueryTable, pageApi] = useAdminPageQueryTable({
  formOptions,
  tableOptions,
});
```

### 2) 受控模式（外部 API 注入）

```tsx
import { createFormApi } from '@admin-core/form-react';
import { createTableApi } from '@admin-core/table-react';
import { useAdminPageQueryTable } from '@admin-core/page-react';

const formApi = createFormApi({});
const tableApi = createTableApi({});

const [PageQueryTable] = useAdminPageQueryTable({
  formApi,
  tableApi,
  formOptions,
  tableOptions,
});
```

### 3) bridge 参数映射

```tsx
const [PageQueryTable] = useAdminPageQueryTable({
  bridge: {
    mapParams: (values, { action }) => ({
      ...values,
      page: action === 'submit' ? 1 : undefined,
      timestamp: Date.now(),
    }),
    queryOnSubmit: true,
    reloadOnReset: true,
  },
  formOptions,
  tableOptions,
});
```

## API 说明

### `useAdminPageQueryTable(options)`

返回值：

- `[PageQueryTableComponent, pageApi]`
- `pageApi.formApi`：透传表单 API
- `pageApi.tableApi`：透传表格 API
- `pageApi.query(params?)`：透传到 `tableApi.query`
- `pageApi.reload(params?)`：透传到 `tableApi.reload`

`options` 关键字段：

- `formOptions?: AdminFormProps`
- `tableOptions?: AdminTableReactProps<TData, TFormValues>`
- `fixed?: boolean`：是否固定为“页面不滚动、表格区滚动”（默认 `true`）
- `formApi?: AdminFormApi`（可选，外部受控）
- `tableApi?: AdminTableApi<TData, TFormValues>`（可选，外部受控）
- `api?: AdminPageQueryTableApi<TData, TFormValues>`（可选，整体受控）
- `bridge?: boolean | PageFormTableBridgeOptions<TFormValues, AdminFormApi, AdminTableApi<...>>`
- `className?: string`
- `style?: React.CSSProperties`

bridge 默认值：

- `enabled: true`
- `queryOnSubmit: true`
- `reloadOnReset: true`

## 额外导出

- `createAdminPageQueryTableApi(formApi, tableApi)`：手动组合 `AdminPageQueryTableApi`，适用于更强受控场景。
