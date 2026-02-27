# @admin-core/page-react

English | [简体中文](./README.md)

React adapter for `@admin-core/page-core`, with route pages and component pages.

## Install

```bash
pnpm add @admin-core/page-react
```

- `@admin-core/form-react` and `@admin-core/table-react` are internal dependencies of `@admin-core/page-react`; no extra install is required in app code.

### CDN (Production / Development)

```html
<script src="https://cdn.jsdelivr.net/npm/@admin-core/page-react/dist/index.global.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@admin-core/page-react/dist/index.global.dev.js"></script>
```

## Quick Start

```tsx
import { useAdminPage } from '@admin-core/page-react';

const [Page] = useAdminPage({
  pages: [
    { key: 'dashboard', type: 'component', title: 'Dashboard', component: DashboardPage },
    { key: 'user', type: 'route', path: '/system/user', title: 'Users' },
  ],
  scroll: true,
});
```

- `scroll` can be global or overridden per page via `page.scroll`.

## Setup

```tsx
import { setupAdminPageReact } from '@admin-core/page-react';

setupAdminPageReact({
  locale: 'en-US',
  logLevel: 'warn',
});
```

- By default, `setupAdminFormReact` and `setupAdminTableReact` are executed automatically.
- You can disable auto setup with `form: false` or `table: false`.

## Query Form + Table Page

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

- The combined page uses `AdminSearchForm` on top and `AdminTable` below by default.
- `api.formApi` and `api.tableApi` are both transparently exposed.
- By default, submit triggers `tableApi.query`, and reset triggers `tableApi.reload`.

## Query-Table Patterns

### 1) Uncontrolled Mode (recommended)

```tsx
const [PageQueryTable, pageApi] = useAdminPageQueryTable({
  formOptions,
  tableOptions,
});
```

### 2) Controlled Mode (external APIs)

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

### 3) Bridge Parameter Mapping

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

## API

### `useAdminPageQueryTable(options)`

Returns:

- `[PageQueryTableComponent, pageApi]`
- `pageApi.formApi`: proxied form API
- `pageApi.tableApi`: proxied table API
- `pageApi.query(params?)`: forwards to `tableApi.query`
- `pageApi.reload(params?)`: forwards to `tableApi.reload`

Key `options` fields:

- `formOptions?: AdminFormProps`
- `tableOptions?: AdminTableReactProps<TData, TFormValues>`
- `fixed?: boolean`: whether to lock to viewport (page static, table area scrolls). Default `true`.
- `formApi?: AdminFormApi` (optional controlled mode)
- `tableApi?: AdminTableApi<TData, TFormValues>` (optional controlled mode)
- `api?: AdminPageQueryTableApi<TData, TFormValues>` (optional fully controlled mode)
- `bridge?: boolean | PageFormTableBridgeOptions<TFormValues, AdminFormApi, AdminTableApi<...>>`
- `className?: string`
- `style?: React.CSSProperties`

Bridge defaults:

- `enabled: true`
- `queryOnSubmit: true`
- `reloadOnReset: true`

## Additional Export

- `createAdminPageQueryTableApi(formApi, tableApi)`: manually compose an `AdminPageQueryTableApi` for advanced controlled usage.
