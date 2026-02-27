# @admin-core/tabs-react

React Tabs 适配包，基于 antd Tabs。

## 安装

```bash
pnpm add @admin-core/tabs-react antd
```

## 使用

```ts
import { AdminTabs } from '@admin-core/tabs-react';
import '@admin-core/tabs-react/style.css';
```

```tsx
import { AdminTabs, type AdminTabReactItem } from '@admin-core/tabs-react';

const items: AdminTabReactItem[] = [
  { key: 'overview', title: '概览' },
  { key: 'detail', title: '详情' },
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

## 主要 Props

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `items` | `AdminTabReactItem[]` | 页签数据 |
| `activeKey` | `string \| null` | 受控模式当前激活 key |
| `defaultActiveKey` | `string \| null` | 非受控默认激活 key |
| `tabs` | `boolean \| AdminTabsOptions` | tabs 行为配置（含 `contentInsetTop`） |
| `onChange` | `(payload) => void` | 切换事件 |
| `onClose` | `(payload) => void` | 关闭事件 |

默认 `contentInsetTop = -10`（当用户未配置时自动生效）。

## Core 能力复用

`@admin-core/tabs-react` 已重导出 `@admin-core/tabs-core` 的核心 API（如 `normalizeAdminTabsOptions`、`resolveAdminTabsStyleVars`、`setAdminTabsLocale`），可在 React 侧直接统一调用。
