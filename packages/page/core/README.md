# @admin-core/page-core

简体中文 | [English](./README.en.md)

框架无关的内容页核心引擎，提供路由页、组件页、滚动行为，以及查询表单与表格联动桥接协议。

## 安装

```bash
pnpm add @admin-core/page-core
```

### CDN（生产/开发）

```html
<script src="https://cdn.jsdelivr.net/npm/@admin-core/page-core/dist/index.global.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@admin-core/page-core/dist/index.global.dev.js"></script>
```

## 核心导出

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

## 能力说明

- 支持 `route` 页与 `component` 页混合。
- `scroll` 可全局配置，也可在页面级 `page.scroll` 覆盖。
- 可为上层查询表单与下层表格定义统一桥接策略。

## 初始化

```ts
import { setupAdminPageCore } from '@admin-core/page-core';

setupAdminPageCore({
  locale: 'zh-CN',
  logLevel: 'warn',
});
```

`SetupAdminPageCoreOptions`：

- `locale?: 'zh-CN' | 'en-US'`
- `logLevel?: 'silent' | 'error' | 'warn' | 'info'`

## 表单-表格桥接 API

`PageFormTableBridgeOptions` 结构：

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

默认值：

- `enabled: true`
- `queryOnSubmit: true`
- `reloadOnReset: true`

归一化工具：

```ts
import { normalizePageFormTableBridgeOptions } from '@admin-core/page-core';

const bridge = normalizePageFormTableBridgeOptions({
  queryOnSubmit: true,
  reloadOnReset: false,
});
```

## createPageApi 简例

```ts
import { createPageApi } from '@admin-core/page-core';

const pageApi = createPageApi({
  pages: [{ key: 'user', type: 'route', path: '/system/user', title: '用户管理' }],
  scroll: true,
});

pageApi.setActiveKey('user');
```
