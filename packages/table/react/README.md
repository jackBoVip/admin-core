# @admin-core/table-react

简体中文 | [English](./README.en.md)

`@admin-core/table-core` 的 React UI 适配层，基于 `antd` Table，并内置 `@admin-core/form-react` 搜索区联动。

## 安装

```bash
pnpm add @admin-core/table-react antd @admin-core/form-react
```

可选（推荐）：

```bash
pnpm add @admin-core/preferences @admin-core/preferences-react
```


### CDN（生产/开发）

```html
<!-- jsDelivr（推荐） -->
<script src="https://cdn.jsdelivr.net/npm/@admin-core/table-react/dist/index.global.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@admin-core/table-react/dist/index.global.dev.js"></script>

<!-- unpkg -->
<script src="https://unpkg.com/@admin-core/table-react/dist/index.global.js"></script>
<script src="https://unpkg.com/@admin-core/table-react/dist/index.global.dev.js"></script>
```

## 导出 API（完整）

## 组件与 Hooks

| API | 签名 / 说明 |
| --- | --- |
| `AdminTable` | React 组件，直接渲染表格。 |
| `useAdminTable(options)` | 返回 `[Table, tableApi]`。 |
| `setupAdminTableReact(options?)` | 初始化语言、默认配置和内置渲染器。 |
| `syncAdminTableReactWithPreferences()` | 手动同步偏好设置到表格。 |
| `getAdminTableReactSetupState()` | 获取 setup 状态。 |

## 渲染器 API

| API | 说明 |
| --- | --- |
| `registerReactTableRenderer(name, renderer)` | 注册自定义单元格渲染器。 |
| `removeReactTableRenderer(name)` | 移除渲染器。 |
| `getReactTableRenderer(name)` | 获取渲染器。 |
| `getReactTableRendererRegistry()` | 获取渲染器 registry。 |

## Core 重导出 API

可直接从 `@admin-core/table-react` 使用：

- `createTableApi`
- `extendProxyOptions`
- `registerTableFormatters`
- `setupAdminTableCore`
- `getLocaleMessages`
- `getGlobalTableFormatterRegistry`
- 关键类型：`AdminTableApi`、`AdminTableOptions`、`ToolbarConfig`、`ProxyConfig`、`ColumnCustomSnapshot` 等

## 快速开始

### 1) 入口初始化

```ts
import { setupAdminTableReact } from '@admin-core/table-react';

setupAdminTableReact({
  bindPreferences: true,
  locale: 'zh-CN',
});
```

### 2) 统一样式入口（推荐）

```css
@import "@admin-core/layout-react/style.css";
@import "@admin-core/form-react/style.css";
@import "@admin-core/table-react/style.css";
```

说明：

- `@admin-core/table-react/style.css` 已包含 `antd/dist/reset.css` 和 `@admin-core/preferences/styles/antd`，请勿重复引入。

### 3) 页面使用

```tsx
import { useAdminTable } from '@admin-core/table-react';

export default function BasicPage() {
  const [Table, tableApi] = useAdminTable({
    tableTitle: '基础列表',
    tableTitleHelp: '支持排序、筛选、列设置',
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

## `gridOptions.toolbarConfig` 能力

| 字段 | 说明 |
| --- | --- |
| `search` | 显示/隐藏搜索区切换按钮。 |
| `refresh` | 刷新按钮。配置 `proxyConfig` 时执行 `reload`；未配置时执行内置 loading 动画刷新。 |
| `zoom` | 全屏切换按钮。 |
| `custom` | 列设置按钮。 |
| `hint` | 顶栏中间提示区（文本、位置、颜色、字号、溢出策略）。 |
| `tools` | 自定义按钮列表（支持权限、显隐、禁用、图标/文字/类型）。 |
| `toolsPosition` | 自定义按钮在内置图标组前后位置（`before/after/left/right`）。 |
| `toolsSlotPosition` | `toolbar-tools` 插槽与自动按钮位置关系（`before/after/replace`）。 |

`ToolbarToolConfig.permission` 支持：

- `permission: ['TABLE_EDIT', 'TABLE_DELETE']`（默认 `or`）
- `permission: { value: ['A', 'B'], mode: 'and', arg: 'code' }`
- `permission: { value: ['admin'], arg: 'role' }`

## 插槽

`slots` 支持：

- `table-title`
- `toolbar-actions`
- `toolbar-center`
- `toolbar-tools`
- `form`
- `loading`
- `empty`
- 以及列级别 `column.slots.default` 对应的自定义 slot 名

示例：

```tsx
const [Table] = useAdminTable({
  slots: {
    'toolbar-tools': () => <button type="button">插槽按钮</button>,
    status: ({ row }) => <span>{row.statusText}</span>,
  },
  gridOptions: {
    columns: [{ dataIndex: 'status', title: '状态', slots: { default: 'status' } }],
  },
});
```

## 选择列、序号列、操作列

### 序号列（内置开关）

```ts
gridOptions: {
  seqColumn: true,
}
```

### 单选/多选

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

### 操作列（框架内置）

```ts
gridOptions: {
  operationColumn: {
    width: 220,
    tools: [
      { code: 'view', title: '查看', type: 'info-text' },
      { code: 'edit', title: '编辑', permission: ['TABLE_EDIT'] },
      { code: 'delete', title: '删除', type: 'error-text', permission: ['TABLE_DELETE'] },
    ],
  },
}
```

说明：

- 至少有一个操作按钮可见时，才渲染操作列。
- 点击会触发 `gridEvents.operationToolClick`，并执行按钮自身 `onClick`。

## 列设置持久化与事件

```ts
gridOptions: {
  tableId: 'users-main-table', // 建议：同一路由多个表格时用于隔离默认持久化 key
  columnCustomPersistence: {
    key: 'demo:table:basic',
    scope: 'users', // 可选：不传 key 时参与默认 key 生成
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

`columnCustomChange.action`：`open` / `cancel` / `confirm` / `reset`。

## 统一分页事件（Vue/React 一致）

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

说明：

- `onPageChange`：分页变化时触发（页码变化或每页条数变化）。
- `onPageSizeChange`：仅每页条数变化时触发。
- `onPaginationChange`：统一分页变化事件（跨端推荐使用）。
- `gridOptions.pagerConfig.resetToFirstOnPageSizeChange`：设为 `true` 时，切换每页条数会自动回到第一页。
- `gridOptions.pagerConfig.exportConfig`：在分页右侧显示导出图标。`current/selected` 内置导出 Excel，`all` 需要配置 `exportAll` 接口函数。
- React 仍可继续使用 `gridOptions.onChange`（antd 原生事件）；两者可同时使用。

```ts
gridOptions: {
  pagerConfig: {
    enabled: true,
    exportConfig: {
      options: ['current', 'selected', 'all'],
      exportAll: async (ctx) => {
        // 调用后端导出接口（all 必须自定义）
        await requestExportAll(ctx);
      },
    },
  },
},
```

## 分页工具栏（左/中/右）

- 默认在右侧：`gridOptions.pagerConfig.position` 默认值为 `right`。
- 可切换到左侧：`gridOptions.pagerConfig.position = 'left'`。
- 分页工具栏与顶部工具栏同语义（自动构建按钮/图标按钮/插槽按钮）：
  - 左侧：`pagerConfig.toolbar.leftTools` + `pager-left` 插槽
  - 中间：`pagerConfig.toolbar.hint` 或 `pager-center` 插槽
  - 右侧：`pagerConfig.toolbar.rightTools`（或 `tools`）+ `pager-tools` 插槽

```tsx
gridOptions: {
  pagerConfig: {
    // 可选: 'left' | 'right'，默认 right
    position: 'right',
    toolbar: {
      leftTools: [{ title: '左侧按钮', type: 'default', onClick: () => {} }],
      leftToolsPosition: 'before',
      leftToolsSlotPosition: 'after',
      hint: {
        content: '分页中间提示',
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
    'pager-left': () => <button>分页左插槽</button>,
    'pager-center': () => <span>分页中间插槽</span>,
    'pager-tools': () => <button>分页右插槽</button>,
  }}
/>
```

说明：

- `tools`/`toolsPosition`/`toolsSlotPosition` 是右侧区域的简写（等价于 `rightTools*`）。
- 当 `pager-tools` 设置为 `replace` 时，右侧内置导出图标会隐藏（由插槽完全接管）。

## 数据策略（单元格/行）

```ts
gridOptions: {
  strategy: {
    columns: {
      score: {
        rules: [
          { when: { field: 'score', gte: 90 }, color: 'var(--primary)', fontWeight: 700, unit: '分' },
          { when: { field: 'name', regex: { pattern: '^A', flags: 'i' } }, textDecoration: 'underline' },
        ],
      },
    },
    rows: [
      { when: { field: 'score', lt: 60 }, backgroundColor: 'var(--primary-100)' },
    ],
  },
}
```

正则支持：

- `regex: /pattern/flags`
- `regex: { pattern: '...', flags: 'i' }`
- `notRegex` 同步支持

## 偏好设置联动（主题 / 国际化）

- `setupAdminTableReact` 默认启用 `bindPreferences: true`。
- 语言跟随 `preferences.app.locale` 自动切换（`zh-CN/en-US`）。
- 主题通过 CSS 变量驱动，和 `@admin-core/preferences` 保持一致。
- 若应用未接入偏好系统，可关闭：`setupAdminTableReact({ bindPreferences: false })`。

## FAQ

### 为什么需要 `antd`？

React 适配层使用 `antd` 作为底层表格引擎，`gridOptions` 会映射到 `antd Table` 能力（分页/排序/筛选/树表/固定列/虚拟滚动等）。

### 为什么需要 `@admin-core/form-react`？

表格内置搜索区（`formOptions`）直接复用表单系统能力，包含 schema、提交/重置、`submitOnChange` 和一致的主题/国际化行为。

### 不配置 `proxyConfig`，刷新按钮还能用吗？

可以。内置刷新按钮仍会工作（触发刷新交互与事件），但不会发起远程请求；若需要真实请求，请配置 `proxyConfig`。

### 如何拿到内部状态做外部控制？

`useAdminTable` 返回的 `tableApi` 带 `useStore(selector)`，可订阅表格状态做外部联动。

## 示例路径

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
