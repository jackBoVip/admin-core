# @admin-core/table-core

English | [简体中文](./README.md)

Framework-agnostic table engine that provides a unified Table API, proxy request enhancement, and renderer/formatter protocols.

## Public API

- `createTableApi`: create table instance with full Table API
- `setupAdminTableCore`: configure locale and log level
- `createTableRendererRegistry`: create renderer registry
- `createTableFormatterRegistry`: create formatter registry
- `registerTableFormatters`: register global formatters
- `extendProxyOptions`: proxy request enhancement (merge search-form values)
- Shared column-custom controller: `createColumnCustomSnapshot`, `resolveColumnCustomCancelSnapshot`, `resolveColumnCustomConfirmSnapshot`, `resolveColumnCustomResetSnapshot`, `applyColumnCustomDragMove`, `buildColumnCustomControls`
- Column custom persistence helpers: `resolveColumnCustomPersistenceConfig`, `readColumnCustomStateFromStorage`, `writeColumnCustomStateToStorage`
- Shared toolbar/separator helpers: `createTableLocaleText`, `buildBuiltinToolbarTools`, `shouldShowSeparator`, `getSeparatorStyle`, `isProxyEnabled`
- `@admin-core/table-core/styles` and `@admin-core/table-core/styles/table.css`

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

## Install

```bash
pnpm add @admin-core/table-core
```


### CDN (Production / Development)

```html
<!-- jsDelivr (recommended) -->
<script src="https://cdn.jsdelivr.net/npm/@admin-core/table-core/dist/index.global.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@admin-core/table-core/dist/index.global.dev.js"></script>

<!-- unpkg -->
<script src="https://unpkg.com/@admin-core/table-core/dist/index.global.js"></script>
<script src="https://unpkg.com/@admin-core/table-core/dist/index.global.dev.js"></script>
```
