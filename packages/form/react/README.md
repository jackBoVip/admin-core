# @admin-core/form-react

简体中文 | [English](./README.en.md)

`@admin-core/form-core` 的 React UI 适配层。React 包只负责渲染与事件适配，业务逻辑全部复用 core。

## 安装

```bash
pnpm add @admin-core/form-react
```

## 导出 API（完整）

## 组件与 Hooks

| API | 签名 / 说明 |
| --- | --- |
| `AdminForm` | React 组件，渲染普通表单。 |
| `AdminSearchForm` | React 查询表单组件（内置 `queryMode=true`）。 |
| `AdminFormSubmitPage` | React 组件，渲染抽屉/弹窗分步提交页。 |
| `useAdminForm(options)` | `options: AdminFormProps`，返回 `[Form, formApi]`。 |
| `useAdminFormSubmitPage(options)` | `options: UseAdminFormSubmitPageOptions`，返回 `[FormSubmitPage, formApi, submitController]`。 |

`UseAdminFormSubmitPageOptions` 本质上等于：

- `AdminFormSubmitPageReactProps` 去掉 `formApi`、`open`
- 再加上 `open?: boolean`

## 适配器 API

| API | 说明 |
| --- | --- |
| `setupAdminForm(options)` | 跨框架统一入口（推荐）。 |
| `setupAdminFormReact(options)` | React 入口，设置 `library` / `libraries`。 |
| `registerFormComponents(components, options?)` | 快速注册语义组件映射。 |
| `getFormAdapterRegistry()` | 统一 registry 入口。 |
| `getReactFormAdapterRegistry()` | React 命名入口。 |

## Core 重导出 API

可直接从 `@admin-core/form-react` 使用：

- `createFormApi`
- `createRangeRule`
- `setupAdminFormCore`
- `registerFormRules`
- `z`
- core 关键类型：`AdminFormApi`、`AdminFormProps`、`AdminFormSchema`、`AdminFormCommonConfig`、`FormAdapterV1`、`AdapterCapabilities` 等

## `AdminForm` Props（核心）

`AdminForm` 在 `AdminFormProps` 基础上扩展：

- `formApi?: AdminFormApi`
- `values?: Record<string, any>`
- `onValuesChange?: (values) => void`
- `visibleFieldNames?: string[]`

常用 `AdminFormProps` 字段：

- `schema?: AdminFormSchema[]`
- `commonConfig?: AdminFormCommonConfig`
- `layout?: 'horizontal' | 'inline' | 'vertical'`
- `queryMode?: boolean`（查询布局模式）
- `gridColumns?: number`
- `showDefaultActions?: boolean`
- `showCollapseButton?: boolean`
- `submitOnChange?: boolean`
- `handleSubmit?` / `handleReset?` / `handleValuesChange?`

常用 `AdminFormCommonConfig` 字段：

- `labelAlign?: 'left' | 'right'`（默认 `right`）
- `labelWidth?: number`
- `hideLabel?: boolean`
- `hideRequiredMark?: boolean`

## `AdminSearchForm`（查询模式快捷组件）

默认注入：

- `queryMode: true`
- `gridColumns: 3`
- `collapsedRows: 1`
- `collapsed: true`
- `showDefaultActions: true`
- `showCollapseButton: true`（仅有溢出项时才显示“展开/收起”）
- `submitButtonOptions.content: '查询'`（可覆盖）

## `AdminFormSubmitPage` Props（核心）

在表单 props 基础上，新增分步页字段：

- `open: boolean`
- `steps: AdminFormStepSchema[]`
- `mode?: 'modal' | 'drawer'`
- `drawerPlacement?: 'left' | 'right'`
- `rowColumns?: number`
- `animation?: 'fade' | 'slide'`
- `stepDurationMs?: number`
- `destroyOnClose?: boolean`
- `resetOnClose?: boolean`（默认 `true`）
- `resetOnSubmit?: boolean`（默认 `true`）
- `onOpenChange?: (open: boolean) => void`
- `onStepChange?: (payload) => void`
- `onSubmit?: (values, context) => MaybeAsync<void>`

## `submitController` API

- `open()` / `close()` / `toggle(open?)` / `setOpen(open)`
- `getOpen()`
- `getFormApi()`
- `getStep()` / `getTotalSteps()` / `goToStep(step)`
- `next()` / `prev()`

## 自带 UI 与第三方库映射

- 内置 native 组件与样式，安装后可直接用 `input/select/switch` 等语义组件。
- 需要接入第三方库时，通过 `setupAdminFormReact` 映射。
- 语义组件解析顺序：`字段显式组件 -> 当前激活库 -> native 回退`。

## 主题适配（第三方组件库）

- 如果使用 Ant Design，建议额外引入偏好设置主题适配样式，让组件颜色、圆角、字体跟随 `@admin-core/preferences` 主题变量。

```css
@import "@admin-core/preferences/styles/antd";
```

## 开箱即用（数据驱动）

```tsx
import { useState } from 'react';
import { AdminForm } from '@admin-core/form-react';

function Demo() {
  const [values, setValues] = useState({ name: '' });
  return (
    <AdminForm
      values={values}
      onValuesChange={setValues}
      schema={[{ component: 'input', fieldName: 'name', label: '名称' }]}
    />
  );
}
```

## 编辑场景（回填）

```tsx
const [SubmitPage, formApi, submitController] = useAdminFormSubmitPage({
  steps,
  mode: 'modal',
  resetOnClose: true,
  resetOnSubmit: true,
});

async function openEdit(row: any) {
  await formApi.resetForm({
    name: row.name,
    email: row.email,
  });
  await submitController.goToStep(0);
  submitController.open();
}
```
