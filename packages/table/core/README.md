# @admin-core/table-core

简体中文 | [English](./README.en.md)

框架无关的表格核心层，负责统一 Table 协议、实例 API、代理请求增强、列设置状态、策略执行和工具栏行为。  
Vue/React 只做 UI 适配，核心行为统一在本包维护。

## 安装

```bash
pnpm add @admin-core/table-core
```

## 稳定性承诺（对外）

- 语义化版本：`minor/patch` 不破坏已公开 API。
- 以下标识符视为稳定对外契约：
  - `createTableApi`
  - `setupAdminTableCore`
  - `createTableRendererRegistry`
  - `createTableFormatterRegistry`
  - `registerTableFormatters`
  - `extendProxyOptions`
  - `AdminTableApi` / `AdminTableProps` / `AdminTableOptions` / `ToolbarConfig` / `ProxyConfig` / `TableRenderer`
- 适配层（`@admin-core/table-vue`、`@admin-core/table-react`）通过重导出复用这些稳定类型。

## 导出 API 总览

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

## 1) Core 初始化 API

| API | 说明 |
| --- | --- |
| `setupAdminTableCore(options?)` | 初始化 core 级配置：`locale`、`logLevel`。 |
| `setLocale(locale)` | 切换语言（`zh-CN` / `en-US`）。 |
| `getLocaleMessages(locale?)` | 获取当前语言文案。 |

## 2) Table 实例 API（`createTableApi`）

`createTableApi(options?: AdminTableOptions): AdminTableApi`

`AdminTableApi` 方法清单：

| 方法 | 说明 |
| --- | --- |
| `mount(instance?, { executors, formApi }?)` | 绑定 UI 实例、请求执行器和表单 API。 |
| `unmount()` | 卸载并清理内部引用。 |
| `query(params?)` | 查询（语义：保留当前分页）。 |
| `reload(params?)` | 刷新（语义：可由适配层重置第一页）。 |
| `setGridOptions(patch)` | 增量更新 `gridOptions`。 |
| `setLoading(loading)` | 更新 loading。 |
| `setState(patchOrFn)` | 更新完整表格状态。 |
| `toggleSearchForm(show?)` | 切换/设置搜索区显隐。 |
| `getState()` / `getSnapshot()` | 读取状态快照。 |
| `setExecutors(executors)` | 动态替换 query/reload 执行器。 |
| `setFormApi(formApi)` | 动态替换表单 API。 |
| `store` | 支持 selector 订阅的 store。 |

## 3) 渲染器 / 格式化器

| API | 说明 |
| --- | --- |
| `createTableRendererRegistry()` | 渲染器注册中心。 |
| `createTableFormatterRegistry()` | 格式化器注册中心。 |
| `registerTableFormatters(formatters)` | 批量注册格式化器。 |
| `getGlobalTableFormatterRegistry()` | 获取全局格式化器 registry。 |

## 4) 代理增强与共享行为

| API | 说明 |
| --- | --- |
| `extendProxyOptions` | 统一合并查询参数、表单值、分页排序参数。 |
| `resolveVisibleToolbarActionTools` | 工具栏按钮可见性解析（含权限）。 |
| `resolveVisibleOperationActionTools` | 操作列按钮可见性解析（含权限）。 |
| `triggerToolbarActionTool` / `triggerOperationActionTool` | 统一按钮触发器。 |
| `resolveTableCellStrategyResult` / `resolveTableRowStrategyResult` | 单元格/行策略解析。 |
| `triggerTableCellStrategyClick` / `triggerTableRowStrategyClick` | 策略点击执行器。 |

## 5) 列设置（Column Custom）与持久化

| API | 说明 |
| --- | --- |
| `createColumnCustomSnapshot` | 构建列设置快照。 |
| `resolveColumnCustomOpenState` / `resolveColumnCustomConfirmState` / `resolveColumnCustomCancelState` / `resolveColumnCustomResetState` | 列设置状态机。 |
| `resolveColumnCustomPersistenceConfig` | 解析持久化配置。 |
| `readColumnCustomStateFromStorage` | 从浏览器存储读取列设置。 |
| `writeColumnCustomStateToStorage` | 写入浏览器存储。 |

## 6) 样式入口

- `@admin-core/table-core/styles`
- `@admin-core/table-core/styles/table.css`

说明：

- 一般由 `table-vue` / `table-react` 自动引入。
- 自定义渲染宿主时可手动引入 core 样式。

## 7) 最小示例（仅 core）

```ts
import { createTableApi } from '@admin-core/table-core';

const tableApi = createTableApi({
  showSearchForm: true,
  tableTitle: '用户列表',
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

## 旧版迁移映射

| 旧版 API | `@admin-core/table-*` API |
| --- | --- |
| `legacySetupVxeTable` | `setupAdminTableCore`（core）+ `setupAdminTableVue` / `setupAdminTableReact`（适配层） |
| `legacyUseVxeGrid(options)` | `useAdminTable(options)` |
| `VxeGridApi` | `AdminTableApi` |
| `extendsDefaultFormatter` | `registerTableFormatters` |
| `extendProxyOptions` | `extendProxyOptions`（同名迁移） |

说明：

- 渲染器名称兼容保留：`CellTag` / `CellSwitch` / `CellOperation`。
- 入口 API 已统一为 `admin-core` 命名，不保留旧别名。

## 相关包

- Vue 适配层：`@admin-core/table-vue`
- React 适配层：`@admin-core/table-react`
