# @admin-core/table-core

简体中文 | [English](./README.en.md)

框架无关的表格核心引擎，提供统一 Table API、代理请求增强、渲染器与格式化器注册协议。

## 对外能力

- `createTableApi`：创建表格实例与完整 Table API
- `setupAdminTableCore`：设置语言与日志级别
- `createTableRendererRegistry`：创建渲染器注册中心
- `createTableFormatterRegistry`：创建格式化器注册中心
- `registerTableFormatters`：注册全局格式化器
- `extendProxyOptions`：代理请求参数增强（自动合并搜索表单值）
- 列设置共享控制器：`createColumnCustomSnapshot`、`resolveColumnCustomCancelSnapshot`、`resolveColumnCustomConfirmSnapshot`、`resolveColumnCustomResetSnapshot`、`applyColumnCustomDragMove`、`buildColumnCustomControls`
- 列设置持久化工具：`resolveColumnCustomPersistenceConfig`、`readColumnCustomStateFromStorage`、`writeColumnCustomStateToStorage`
- 工具栏/分隔条共享函数：`createTableLocaleText`、`buildBuiltinToolbarTools`、`shouldShowSeparator`、`getSeparatorStyle`、`isProxyEnabled`
- `@admin-core/table-core/styles` 与 `@admin-core/table-core/styles/table.css`

## 旧版迁移映射

| 旧版 API | `@admin-core/table-*` API |
| --- | --- |
| `legacySetupVxeTable` | `setupAdminTableCore`（核心）+ `setupAdminTableVue` / `setupAdminTableReact`（适配层） |
| `legacyUseVxeGrid(options)` | `useAdminTable(options)` |
| `VxeGridApi` | `AdminTableApi` |
| `extendsDefaultFormatter` | `registerTableFormatters` |
| `extendProxyOptions` | `extendProxyOptions`（同名迁移） |

说明：
- 渲染器名称兼容保留：`CellTag` / `CellSwitch` / `CellOperation`。
- 入口 API 已统一为 `admin-core` 命名，不保留旧版别名。

## 安装

```bash
pnpm add @admin-core/table-core
```


### CDN（生产/开发）

```html
<!-- jsDelivr（推荐） -->
<script src="https://cdn.jsdelivr.net/npm/@admin-core/table-core/dist/index.global.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@admin-core/table-core/dist/index.global.dev.js"></script>

<!-- unpkg -->
<script src="https://unpkg.com/@admin-core/table-core/dist/index.global.js"></script>
<script src="https://unpkg.com/@admin-core/table-core/dist/index.global.dev.js"></script>
```
