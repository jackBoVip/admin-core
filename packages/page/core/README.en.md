# @admin-core/page-core

English | [简体中文](./README.md)

Framework-agnostic content-page core engine with a unified contract for route pages, component pages, scroll behavior, and query-form/table bridge semantics.

## Install

```bash
pnpm add @admin-core/page-core
```

### CDN (Production / Development)

```html
<script src="https://cdn.jsdelivr.net/npm/@admin-core/page-core/dist/index.global.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@admin-core/page-core/dist/index.global.dev.js"></script>
```

## Core Exports

- `createPageApi`
- `setupAdminPageCore`
- `getLocaleMessages`
- `normalizePageLocale`
- `normalizePageFormTableBridgeOptions`
- `registerPageLocaleMessages`
- `setLocale`
- `type AdminPageApi`
- `type AdminPageOptions`
- `type AdminPageItem`
- `type PageScrollOptions`
- `type PageFormTableBridgeOptions`
- `type PageFormTableBridgeContext`
- `type PageFormTableAction`
- `type NormalizedPageFormTableBridgeOptions`
- `type SetupAdminPageCoreOptions`

## Capabilities

- Mixed `route` and `component` pages.
- Global `scroll` config with per-page override (`page.scroll`).
- Unified bridge strategy between top query form and bottom table.

## Setup

```ts
import { setupAdminPageCore } from '@admin-core/page-core';

setupAdminPageCore({
  locale: 'en-US',
  logLevel: 'warn',
});
```

`SetupAdminPageCoreOptions`:

- `locale?: 'zh-CN' | 'en-US'`
- `logLevel?: 'silent' | 'error' | 'warn' | 'info'`

## Form-Table Bridge API

`PageFormTableBridgeOptions` shape:

```ts
interface PageFormTableBridgeOptions<
  TFormValues extends Record<string, any> = Record<string, any>,
  TFormApi = unknown,
  TTableApi = unknown,
> {
  enabled?: boolean;
  queryOnSubmit?: boolean;
  reloadOnReset?: boolean;
  mapParams?: (
    values: TFormValues,
    context: {
      action: 'submit' | 'reset';
      formApi: TFormApi;
      tableApi: TTableApi;
    }
  ) => Record<string, any> | Promise<Record<string, any>>;
}
```

Defaults:

- `enabled: true`
- `queryOnSubmit: true`
- `reloadOnReset: true`

Normalizer:

```ts
import { normalizePageFormTableBridgeOptions } from '@admin-core/page-core';

const bridge = normalizePageFormTableBridgeOptions({
  queryOnSubmit: true,
  reloadOnReset: false,
});
```

## createPageApi Example

```ts
import { createPageApi } from '@admin-core/page-core';

const pageApi = createPageApi({
  pages: [{ key: 'user', type: 'route', path: '/system/user', title: 'Users' }],
  scroll: true,
});

pageApi.setActiveKey('user');
```
