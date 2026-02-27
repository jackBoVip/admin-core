# @admin-core/tabs-react

React Tabs adapter package built on top of antd Tabs.

## Install

```bash
pnpm add @admin-core/tabs-react antd
```

## Usage

```ts
import { AdminTabs } from '@admin-core/tabs-react';
import '@admin-core/tabs-react/style.css';
```

```tsx
import { AdminTabs, type AdminTabReactItem } from '@admin-core/tabs-react';

const items: AdminTabReactItem[] = [
  { key: 'overview', title: 'Overview' },
  { key: 'detail', title: 'Detail' },
];

<AdminTabs
  defaultActiveKey="overview"
  items={items}
  tabs={{
    align: 'left',
    sticky: true,
    stickyTop: 0,
    contentInsetTop: 0,
  }}
/>;
```

## Key Props

| Field | Type | Description |
| --- | --- | --- |
| `items` | `AdminTabReactItem[]` | Tab items |
| `activeKey` | `string \| null` | Controlled active key |
| `defaultActiveKey` | `string \| null` | Uncontrolled default active key |
| `tabs` | `boolean \| AdminTabsOptions` | Tabs behavior config (includes `contentInsetTop`) |
| `onChange` | `(payload) => void` | Change callback |
| `onClose` | `(payload) => void` | Close callback |

Default `contentInsetTop = -10` is applied when users do not provide one.

## Core Re-exports

`@admin-core/tabs-react` re-exports the core APIs from `@admin-core/tabs-core` (for example `normalizeAdminTabsOptions`, `resolveAdminTabsStyleVars`, and `setAdminTabsLocale`) so React consumers can use one unified entry.
