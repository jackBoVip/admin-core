# @admin-core/tabs-core

框架无关的 Tabs 核心协议包，提供配置标准化、显示策略与统一样式变量。

## 安装

```bash
pnpm add @admin-core/tabs-core
```

## 导出

- `DEFAULT_ADMIN_TABS_OPTIONS`
- `createAdminTabsChangePayload`
- `createAdminTabsClosePayload`
- `getAdminTabsLocale`
- `getAdminTabsLocaleVersion`
- `normalizeAdminTabsOptions`
- `resolveAdminTabsActiveItem`
- `resolveAdminTabsActiveKey`
- `resolveAdminTabsCssLength`
- `resolveAdminTabsItemsSignature`
- `resolveAdminTabsOptionsWithDefaults`
- `resolveAdminTabsRootClassNames`
- `resolveAdminTabsSelectedActiveKey`
- `resolveAdminTabsShowClose`
- `resolveAdminTabsStyleVars`
- `resolveAdminTabsUncontrolledActiveKey`
- `resolveAdminTabsVisible`
- `setAdminTabsLocale`
- `setupAdminTabsCore`
- `subscribeAdminTabsLocale`
- `AdminTabsOptions`
- `NormalizedAdminTabsOptions`
- `AdminTabItem`
- `AdminTabsChangePayload`
- `AdminTabsClosePayload`

## `AdminTabsOptions`

| 字段 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `enabled` | `boolean` | `true` | 是否启用 tabs 导航 |
| `hideWhenSingle` | `boolean` | `true` | 仅 1 个页签时是否隐藏导航 |
| `align` | `'left' \| 'center' \| 'right'` | `'left'` | 导航对齐方式 |
| `sticky` | `boolean` | `true` | 导航是否吸顶 |
| `stickyTop` | `number \| string` | `0` | 吸顶时 `top` 偏移 |
| `contentInsetTop` | `number \| string` | `0` | tabs 顶部外边距（显式控制） |

`contentInsetTop` 是统一控制 Vue/React tabs 顶部距离的显式参数。

## 样式

```ts
import '@admin-core/tabs-core/styles/tabs.css';
```
