# @admin-core/tabs-core

Framework-agnostic Tabs core package with normalized config, visibility strategy, and shared style tokens.

## Install

```bash
pnpm add @admin-core/tabs-core
```

## Exports

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

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `enabled` | `boolean` | `true` | Enable or disable tabs navigation |
| `hideWhenSingle` | `boolean` | `true` | Hide navigation when there is only one tab |
| `align` | `'left' \| 'center' \| 'right'` | `'left'` | Navigation alignment |
| `sticky` | `boolean` | `true` | Enable sticky tabs navigation |
| `stickyTop` | `number \| string` | `0` | Sticky `top` offset |
| `contentInsetTop` | `number \| string` | `0` | Explicit top margin for the tabs bar |

`contentInsetTop` is the single top-spacing control to keep Vue/React tabs aligned.

## Styles

```ts
import '@admin-core/tabs-core/styles/tabs.css';
```
