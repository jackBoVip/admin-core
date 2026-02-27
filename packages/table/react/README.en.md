# @admin-core/table-react

English | [简体中文](./README.md)

React UI adapter for `@admin-core/table-core`, powered by `antd` Table, with built-in search panel integration via `@admin-core/form-react`.

## Install

```bash
pnpm add @admin-core/table-react antd @admin-core/form-react
```

Optional (recommended):

```bash
pnpm add @admin-core/preferences @admin-core/preferences-react
```


### CDN (Production / Development)

```html
<!-- jsDelivr (recommended) -->
<script src="https://cdn.jsdelivr.net/npm/@admin-core/table-react/dist/index.global.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@admin-core/table-react/dist/index.global.dev.js"></script>

<!-- unpkg -->
<script src="https://unpkg.com/@admin-core/table-react/dist/index.global.js"></script>
<script src="https://unpkg.com/@admin-core/table-react/dist/index.global.dev.js"></script>
```

## Public API

| API | Signature / Description |
| --- | --- |
| `AdminTable` | React component for direct usage. |
| `useAdminTable(options)` | Returns `[Table, tableApi]`. |
| `setupAdminTableReact(options?)` | Initializes locale, default options, and built-in renderers. |
| `syncAdminTableReactWithPreferences()` | Manually sync preferences to table. |
| `getAdminTableReactSetupState()` | Read setup state. |

### Renderer API

| API | Description |
| --- | --- |
| `registerReactTableRenderer(name, renderer)` | Register custom cell renderer. |
| `removeReactTableRenderer(name)` | Remove renderer. |
| `getReactTableRenderer(name)` | Resolve renderer by name. |
| `getReactTableRendererRegistry()` | Access renderer registry. |

Core APIs are also re-exported, including `createTableApi`, `extendProxyOptions`, `registerTableFormatters`, `setupAdminTableCore`, `getLocaleMessages`, and shared types.

## Quick Start

### 1) App setup

```ts
import { setupAdminTableReact } from '@admin-core/table-react';

setupAdminTableReact({
  bindPreferences: true,
  locale: 'en-US',
});
```

### 2) Unified style entry (recommended)

```css
@import "@admin-core/layout-react/style.css";
@import "@admin-core/form-react/style.css";
@import "@admin-core/table-react/style.css";
```

Notes:

- `@admin-core/table-react/style.css` already includes `antd/dist/reset.css` and `@admin-core/preferences/styles/antd`. Do not import them again.

### 3) Page usage

```tsx
import { useAdminTable } from '@admin-core/table-react';

export default function BasicPage() {
  const [Table] = useAdminTable({
    tableTitle: 'Basic Table',
    formOptions: {
      schema: [{ component: 'input', fieldName: 'name', label: 'Name' }],
    },
    gridOptions: {
      rowConfig: { keyField: 'id' },
      seqColumn: true,
      columns: [
        { dataIndex: 'name', title: 'Name' },
        { dataIndex: 'age', title: 'Age', sortable: true },
        { dataIndex: 'role', title: 'Role', filterable: true },
      ],
      data: [],
      toolbarConfig: {
        refresh: true,
        zoom: true,
        custom: true,
      },
    },
  });

  return <Table />;
}
```

## Toolbar (`gridOptions.toolbarConfig`)

| Field | Description |
| --- | --- |
| `search` | Toggle search panel button. |
| `refresh` | Refresh button. Calls `reload` when `proxyConfig` is enabled; otherwise runs local refresh interaction. |
| `zoom` | Fullscreen toggle button. |
| `custom` | Column custom panel button. |
| `hint` | Center hint area (text, alignment, color, size, overflow). |
| `tools` | Custom tools with permission/show/disabled/icon/text/type support. |
| `toolsPosition` | Position of generated tools around built-ins (`before/after/left/right`). |
| `toolsSlotPosition` | Relation between `toolbar-tools` slot and generated tools (`before/after/replace`). |

`ToolbarToolConfig.permission` supports:

- `permission: ['TABLE_EDIT', 'TABLE_DELETE']` (default `or`)
- `permission: { value: ['A', 'B'], mode: 'and', arg: 'code' }`
- `permission: { value: ['admin'], arg: 'role' }`

## Slots

Supported `slots` keys:

- `table-title`
- `toolbar-actions`
- `toolbar-center`
- `toolbar-tools`
- `form`
- `loading`
- `empty`
- Any custom slot name referenced by `column.slots.default`

Example:

```tsx
const [Table] = useAdminTable({
  slots: {
    'toolbar-tools': () => <button type="button">Slot Button</button>,
    status: ({ row }) => <span>{row.statusText}</span>,
  },
  gridOptions: {
    columns: [{ dataIndex: 'status', title: 'Status', slots: { default: 'status' } }],
  },
});
```

## Selection / Seq / Operation Column

### Built-in seq column

```ts
gridOptions: {
  seqColumn: true,
}
```

### Row selection

```ts
gridOptions: {
  rowSelection: {
    type: 'radio', // 'radio' | 'checkbox'
    trigger: 'row', // 'cell' | 'row'
    strict: true,
    selectedRowKeys: [1],
    onChange: (selectedRowKeys, selectedRows) => console.log(selectedRowKeys, selectedRows),
  },
}
```

### Built-in operation column

```ts
gridOptions: {
  operationColumn: {
    width: 220,
    tools: [
      { code: 'view', title: 'View', type: 'info-text' },
      { code: 'edit', title: 'Edit', permission: ['TABLE_EDIT'] },
      { code: 'delete', title: 'Delete', type: 'error-text', permission: ['TABLE_DELETE'] },
    ],
  },
}
```

The operation column is rendered only when at least one operation tool is visible.

## Column Custom Persistence + Events

```ts
gridOptions: {
  tableId: 'users-main-table', // Recommended when multiple tables share the same route
  columnCustomPersistence: {
    key: 'demo:table:basic',
    scope: 'users', // Optional: participates in default key generation when key is omitted
    storage: 'local', // local | session
  },
  toolbarConfig: { custom: true },
},
gridEvents: {
  columnCustomChange: ({ action, snapshot }) => {
    if (action === 'confirm' || action === 'reset') {
      void saveToServer(snapshot);
    }
  },
},
```

`columnCustomChange.action`: `open` / `cancel` / `confirm` / `reset`.

## Unified Pagination Events (Vue/React Consistent)

```ts
gridEvents: {
  onPageChange: ({ currentPage, pageSize, type, source }) => {
    console.log('page change', currentPage, pageSize, type, source);
  },
  onPageSizeChange: ({ pageSize }) => {
    console.log('size change', pageSize);
  },
  onPaginationChange: (payload) => {
    console.log('pagination change', payload);
  },
},
```

Notes:

- `onPageChange`: fires when pagination changes (current page or page size).
- `onPageSizeChange`: fires only when page size changes.
- `onPaginationChange`: unified pagination event (recommended for cross-framework code).
- `gridOptions.pagerConfig.resetToFirstOnPageSizeChange`: set to `true` to reset to page 1 when page size changes.
- `gridOptions.pagerConfig.exportConfig`: adds an export icon on the right side of pagination. `current/selected` use built-in Excel export, `all` requires a custom `exportAll` handler.
- React native `gridOptions.onChange` is still supported and can be used together.

```ts
gridOptions: {
  pagerConfig: {
    enabled: true,
    exportConfig: {
      options: ['current', 'selected', 'all'],
      exportAll: async (ctx) => {
        // call backend export API (required for "all")
        await requestExportAll(ctx);
      },
    },
  },
},
```

## Pagination Toolbar (Left/Center/Right)

- Default position is right: `gridOptions.pagerConfig.position` defaults to `right`.
- You can switch it to left: `gridOptions.pagerConfig.position = 'left'`.
- Pagination toolbar follows the same semantics as top toolbar (auto-built buttons/icon buttons/slot buttons):
  - Left: `pagerConfig.toolbar.leftTools` + `pager-left` slot
  - Center: `pagerConfig.toolbar.hint` or `pager-center` slot
  - Right: `pagerConfig.toolbar.rightTools` (or `tools`) + `pager-tools` slot

```tsx
gridOptions: {
  pagerConfig: {
    // optional: 'left' | 'right', default is right
    position: 'right',
    toolbar: {
      leftTools: [{ title: 'Left Tool', type: 'default', onClick: () => {} }],
      leftToolsPosition: 'before',
      leftToolsSlotPosition: 'after',
      hint: {
        content: 'Pager center hint',
        align: 'center',
        overflow: 'scroll',
      },
      tools: [{ icon: 'vxe-table-icon-repeat', onClick: () => {} }],
      toolsPosition: 'before',
      toolsSlotPosition: 'after',
    },
  },
}

<TableView
  slots={{
    'pager-left': () => <button>Pager Left Slot</button>,
    'pager-center': () => <span>Pager Center Slot</span>,
    'pager-tools': () => <button>Pager Right Slot</button>,
  }}
/>
```

Notes:

- `tools`/`toolsPosition`/`toolsSlotPosition` are shorthand for the right area (`rightTools*`).
- If `pager-tools` uses `replace`, the built-in export icon on the right is hidden.

## Strategy (Cell/Row)

```ts
gridOptions: {
  strategy: {
    columns: {
      score: {
        rules: [
          { when: { field: 'score', gte: 90 }, color: 'var(--primary)', fontWeight: 700, unit: 'pt' },
          { when: { field: 'name', regex: { pattern: '^A', flags: 'i' } }, textDecoration: 'underline' },
        ],
      },
    },
    rows: [{ when: { field: 'score', lt: 60 }, backgroundColor: 'var(--primary-100)' }],
  },
}
```

Regex forms:

- `regex: /pattern/flags`
- `regex: { pattern: '...', flags: 'i' }`
- `notRegex` is also supported.

## Preferences Integration (Theme / i18n)

- `setupAdminTableReact` enables preference binding by default (`bindPreferences: true`).
- Locale follows `preferences.app.locale` (`zh-CN/en-US`).
- Theme is driven by CSS variables and aligns with `@admin-core/preferences`.
- Disable binding when preferences is not initialized: `setupAdminTableReact({ bindPreferences: false })`.

## FAQ

### Why does this package require `antd`?

The React adapter uses `antd` as the table engine. `gridOptions` semantics are mapped to antd table capabilities (pagination, sorting, filtering, tree, fixed columns, virtual scroll, etc.).

### Why does it require `@admin-core/form-react`?

Because the built-in search panel (`formOptions`) reuses form-core capabilities: schema rendering, submit/reset flow, `submitOnChange`, and unified theme/i18n behavior.

### Can refresh work without `proxyConfig`?

Yes. Refresh UI and events still work. Remote fetching requires `proxyConfig`.

### How can I subscribe to internal table state?

`tableApi` returned by `useAdminTable` provides `useStore(selector)`.

## Demo Paths

- `examples/react-demo/src/pages/components/table/Basic.tsx`
- `examples/react-demo/src/pages/components/table/Remote.tsx`
- `examples/react-demo/src/pages/components/table/Form.tsx`
- `examples/react-demo/src/pages/components/table/Tree.tsx`
- `examples/react-demo/src/pages/components/table/Fixed.tsx`
- `examples/react-demo/src/pages/components/table/CustomCell.tsx`
- `examples/react-demo/src/pages/components/table/EditCell.tsx`
- `examples/react-demo/src/pages/components/table/EditRow.tsx`
- `examples/react-demo/src/pages/components/table/Virtual.tsx`
- `examples/react-demo/src/pages/components/table/Slot.tsx`
- `examples/react-demo/src/pages/components/table/AdapterThemePreview.tsx`
