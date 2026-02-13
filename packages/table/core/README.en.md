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
- `@admin-core/table-core/styles` and `@admin-core/table-core/styles/table.css`

## vben Migration Map

| vben API | `@admin-core/table-*` API |
| --- | --- |
| `setupVbenVxeTable` | `setupAdminTableCore` (core) + `setupAdminTableVue` / `setupAdminTableReact` (adapters) |
| `useVbenVxeGrid(options)` | `useAdminTable(options)` |
| `VxeGridApi` | `AdminTableApi` |
| `extendsDefaultFormatter` | `registerTableFormatters` |
| `extendProxyOptions` | `extendProxyOptions` (same name) |

Notes:
- Renderer names stay compatible: `CellTag` / `CellSwitch` / `CellOperation`.
- Entry APIs are fully renamed to `admin-core` naming; no vben aliases are exported.

## Install

```bash
pnpm add @admin-core/table-core
```
