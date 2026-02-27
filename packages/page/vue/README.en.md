# @admin-core/page-vue

English | [简体中文](./README.md)

Vue adapter for `@admin-core/page-core`, with route pages and component pages.

## Install

```bash
pnpm add @admin-core/page-vue
```

- `@admin-core/form-vue` and `@admin-core/table-vue` are internal dependencies of `@admin-core/page-vue`; no extra install is required in app code.

### CDN (Production / Development)

```html
<script src="https://cdn.jsdelivr.net/npm/@admin-core/page-vue/dist/index.global.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@admin-core/page-vue/dist/index.global.dev.js"></script>
```

## Quick Start

```ts
import { useAdminPage } from '@admin-core/page-vue';

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

```ts
import { setupAdminPageVue } from '@admin-core/page-vue';

setupAdminPageVue({
  locale: 'en-US',
  logLevel: 'warn',
});
```

- By default, `setupAdminFormVue` and `setupAdminTableVue` are executed automatically.
- You can disable auto setup with `form: false` or `table: false`.

## Query Form + Table Page

```ts
import { useAdminPageQueryTable } from '@admin-core/page-vue';

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

```ts
const [PageQueryTable, pageApi] = useAdminPageQueryTable({
  formOptions,
  tableOptions,
});
```

### 2) Controlled Mode (external APIs)

```ts
import { createFormApi } from '@admin-core/form-vue';
import { createTableApi } from '@admin-core/table-vue';
import { useAdminPageQueryTable } from '@admin-core/page-vue';

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

```ts
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
- `tableOptions?: AdminTableVueProps<TData, TFormValues>`
- `fixed?: boolean`: whether to lock to viewport (page static, table area scrolls). Default `true`.
- `formApi?: AdminFormApi` (optional controlled mode)
- `tableApi?: AdminTableApi<TData, TFormValues>` (optional controlled mode)
- `api?: AdminPageQueryTableApi<TData, TFormValues>` (optional fully controlled mode)
- `bridge?: boolean | PageFormTableBridgeOptions<TFormValues, AdminFormApi, AdminTableApi<...>>`

Bridge defaults:

- `enabled: true`
- `queryOnSubmit: true`
- `reloadOnReset: true`

## Component Slots (`AdminPageQueryTable`)

- `form`: replace top query area, slot props `{ formApi, tableApi }`
- `table`: replace bottom table area, slot props `{ formApi, tableApi }`
- Any other slots are forwarded to the inner `AdminTable` (cell slots, etc.)
