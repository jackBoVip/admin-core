# @admin-core/table-core

English | [简体中文](./README.md)

Framework-agnostic table core that owns the shared table contract: API instance lifecycle, proxy extension, column-custom state, strategy execution, and toolbar behavior.  
Vue/React adapters focus on UI only.

## Install

```bash
pnpm add @admin-core/table-core
```

## Stability Contract (Public)

- Semver contract: no breaking changes in `minor/patch` for public APIs.
- The following are treated as stable public APIs:
  - `createTableApi`
  - `setupAdminTableCore`
  - `createTableRendererRegistry`
  - `createTableFormatterRegistry`
  - `registerTableFormatters`
  - `extendProxyOptions`
  - `AdminTableApi` / `AdminTableProps` / `AdminTableOptions` / `ToolbarConfig` / `ProxyConfig` / `TableRenderer`
- `@admin-core/table-vue` and `@admin-core/table-react` reuse these contracts via re-exports.

## Export Overview

```ts
import {
  createTableApi,
  setupAdminTableCore,
  createTableRendererRegistry,
  createTableFormatterRegistry,
  registerTableFormatters,
  extendProxyOptions,
  createTableLocaleText,
  buildBuiltinToolbarTools,
  resolveVisibleToolbarActionTools,
  resolveVisibleOperationActionTools,
  createColumnCustomSnapshot,
  resolveColumnCustomPersistenceConfig,
  readColumnCustomStateFromStorage,
  writeColumnCustomStateToStorage,
} from '@admin-core/table-core';
```

## 1) Core Setup API

| API | Description |
| --- | --- |
| `setupAdminTableCore(options?)` | Configure core-level options: `locale`, `logLevel`. |
| `setLocale(locale)` | Switch locale (`zh-CN` / `en-US`). |
| `getLocaleMessages(locale?)` | Read locale messages. |

## 2) Table Instance API (`createTableApi`)

`createTableApi(options?: AdminTableOptions): AdminTableApi`

`AdminTableApi` methods:

| Method | Description |
| --- | --- |
| `mount(instance?, { executors, formApi }?)` | Bind UI instance, request executors, and form API. |
| `unmount()` | Dispose and clear references. |
| `query(params?)` | Query action (semantic: keep current pagination). |
| `reload(params?)` | Reload action (adapter may reset to page 1). |
| `setGridOptions(patch)` | Patch `gridOptions`. |
| `setLoading(loading)` | Update loading state. |
| `setState(patchOrFn)` | Patch full table state. |
| `toggleSearchForm(show?)` | Toggle/set search panel visibility. |
| `getState()` / `getSnapshot()` | Read current state/snapshot. |
| `setExecutors(executors)` | Replace query/reload executors at runtime. |
| `setFormApi(formApi)` | Replace form API at runtime. |
| `store` | Selector-based store subscription API. |

## 3) Renderer / Formatter

| API | Description |
| --- | --- |
| `createTableRendererRegistry()` | Create renderer registry. |
| `createTableFormatterRegistry()` | Create formatter registry. |
| `registerTableFormatters(formatters)` | Register formatters in batch. |
| `getGlobalTableFormatterRegistry()` | Access global formatter registry. |

## 4) Proxy and Shared Behaviors

| API | Description |
| --- | --- |
| `extendProxyOptions` | Merge query params, form values, pagination/sort params consistently. |
| `resolveVisibleToolbarActionTools` | Resolve toolbar tool visibility (with permission). |
| `resolveVisibleOperationActionTools` | Resolve operation-column tool visibility (with permission). |
| `triggerToolbarActionTool` / `triggerOperationActionTool` | Shared action trigger executors. |
| `resolveTableCellStrategyResult` / `resolveTableRowStrategyResult` | Resolve cell/row strategy. |
| `triggerTableCellStrategyClick` / `triggerTableRowStrategyClick` | Shared strategy click handlers. |

## 5) Column Custom + Persistence

| API | Description |
| --- | --- |
| `createColumnCustomSnapshot` | Build column-custom snapshot. |
| `resolveColumnCustomOpenState` / `resolveColumnCustomConfirmState` / `resolveColumnCustomCancelState` / `resolveColumnCustomResetState` | Column-custom state machine. |
| `resolveColumnCustomPersistenceConfig` | Normalize persistence config. |
| `readColumnCustomStateFromStorage` | Read snapshot from browser storage. |
| `writeColumnCustomStateToStorage` | Write snapshot to browser storage. |

## 6) Style Entry

- `@admin-core/table-core/styles`
- `@admin-core/table-core/styles/table.css`

Notes:

- Usually imported by adapter packages automatically.
- Import core styles manually only when building a custom host renderer.

## 7) Minimal Core-Only Example

```ts
import { createTableApi } from '@admin-core/table-core';

const tableApi = createTableApi({
  showSearchForm: true,
  tableTitle: 'User List',
});

tableApi.mount(undefined, {
  executors: {
    async query({ params }) {
      return await fetch('/api/users', {
        method: 'POST',
        body: JSON.stringify(params),
      }).then((r) => r.json());
    },
  },
});

await tableApi.query({ page: 1 });
```

## Legacy Migration Map

| Legacy API | `@admin-core/table-*` API |
| --- | --- |
| `legacySetupVxeTable` | `setupAdminTableCore` (core) + `setupAdminTableVue` / `setupAdminTableReact` (adapters) |
| `legacyUseVxeGrid(options)` | `useAdminTable(options)` |
| `VxeGridApi` | `AdminTableApi` |
| `extendsDefaultFormatter` | `registerTableFormatters` |
| `extendProxyOptions` | `extendProxyOptions` (same name) |

Notes:

- Renderer names stay compatible: `CellTag` / `CellSwitch` / `CellOperation`.
- Entry APIs are fully renamed to `admin-core` naming; no legacy aliases are exported.

## Related Packages

- Vue adapter: `@admin-core/table-vue`
- React adapter: `@admin-core/table-react`
