# @admin-core/form-react

English | [简体中文](./README.md)

React UI adapter for `@admin-core/form-core`. This package only handles rendering and React-specific event wiring. All business logic stays in core.

## Install

```bash
pnpm add @admin-core/form-react
```

## Full Exported API

## Components and Hooks

| API | Signature / Description |
| --- | --- |
| `AdminForm` | React component for standard forms. |
| `AdminSearchForm` | React search form component (`queryMode=true` preset). |
| `AdminFormSubmitPage` | React component for drawer/modal stepped submit page. |
| `useAdminForm(options)` | `options: AdminFormProps`, returns `[Form, formApi]`. |
| `useAdminFormSubmitPage(options)` | `options: UseAdminFormSubmitPageOptions`, returns `[FormSubmitPage, formApi, submitController]`. |

`UseAdminFormSubmitPageOptions` is effectively:

- `AdminFormSubmitPageReactProps` without `formApi` and `open`
- plus `open?: boolean`

## Adapter API

| API | Description |
| --- | --- |
| `setupAdminForm(options)` | Cross-framework unified setup entry (recommended). |
| `setupAdminFormReact(options)` | React-specific setup with `library` / `libraries`. |
| `registerFormComponents(components, options?)` | Quick semantic component mapping registration. |
| `getFormAdapterRegistry()` | Unified registry entry. |
| `getReactFormAdapterRegistry()` | React named registry entry. |

## Re-exported Core API

You can import these directly from `@admin-core/form-react`:

- `createFormApi`
- `createRangeRule`
- `setupAdminFormCore`
- `registerFormRules`
- `z`
- core key types: `AdminFormApi`, `AdminFormProps`, `AdminFormSchema`, `AdminFormCommonConfig`, `FormAdapterV1`, `AdapterCapabilities`, etc.

## `AdminForm` Props (Key)

`AdminForm` extends `AdminFormProps` with:

- `formApi?: AdminFormApi`
- `values?: Record<string, any>`
- `onValuesChange?: (values) => void`
- `visibleFieldNames?: string[]`

Common `AdminFormProps` fields:

- `schema?: AdminFormSchema[]`
- `commonConfig?: AdminFormCommonConfig`
- `layout?: 'horizontal' | 'inline' | 'vertical'`
- `queryMode?: boolean` (query layout mode)
- `gridColumns?: number`
- `showDefaultActions?: boolean`
- `showCollapseButton?: boolean`
- `submitOnChange?: boolean`
- `handleSubmit?` / `handleReset?` / `handleValuesChange?`

Common `AdminFormCommonConfig` fields:

- `labelAlign?: 'left' | 'right'` (default: `right`)
- `labelWidth?: number`
- `hideLabel?: boolean`
- `hideRequiredMark?: boolean`

## `AdminSearchForm` (Search Preset)

Default injected props:

- `queryMode: true`
- `gridColumns: 3`
- `collapsedRows: 1`
- `collapsed: true`
- `showDefaultActions: true`
- `showCollapseButton: true` (collapse toggle only appears when overflow exists)
- `submitButtonOptions.content`: follows active locale (`zh-CN`: `查询`, `en-US`: `Search`, overridable)

## `AdminFormSubmitPage` Props (Key)

On top of form props:

- `open: boolean`
- `steps: AdminFormStepSchema[]`
- `mode?: 'modal' | 'drawer'`
- `drawerPlacement?: 'left' | 'right'`
- `rowColumns?: number`
- `animation?: 'fade' | 'slide'`
- `stepDurationMs?: number`
- `destroyOnClose?: boolean`
- `resetOnClose?: boolean` (default: `true`)
- `resetOnSubmit?: boolean` (default: `true`)
- `onOpenChange?: (open: boolean) => void`
- `onStepChange?: (payload) => void`
- `onSubmit?: (values, context) => MaybeAsync<void>`

## `submitController` API

- `open()` / `close()` / `toggle(open?)` / `setOpen(open)`
- `getOpen()`
- `getFormApi()`
- `getStep()` / `getTotalSteps()` / `goToStep(step)`
- `next()` / `prev()`

## Built-in UI and 3rd-party mapping

- Native components and styles are included.
- You can render semantic components (`input/select/switch`) out of the box.
- For 3rd-party UI libraries, map components with `setupAdminFormReact`.
- Resolution order: `explicit field component -> active library -> native fallback`.

## Theme Integration (3rd-party UI)

- If you use Ant Design, import the preferences adapter stylesheet so colors/radius/typography follow `@admin-core/preferences` theme variables.

```css
@import "@admin-core/preferences/styles/antd";
```

## Combine with Layout/Table (Avoid Duplicate Styles)

If you also use `@admin-core/layout-react` and `@admin-core/table-react`, import styles once at app entry:

```css
@import "@admin-core/preferences/styles/antd";
@import "@admin-core/layout-react/style.css";
@import "@admin-core/form-react/style.css";
@import "@admin-core/table-react/style.css";
```

- Do not import `@import "tailwindcss"` twice (`layout-react/style.css` already includes it).
- Do not import `antd/dist/reset.css` twice (`table-react/style.css` already includes it).

## Out of the box (Data First)

```tsx
import { useState } from 'react';
import { AdminForm } from '@admin-core/form-react';

function Demo() {
  const [values, setValues] = useState({ name: '' });
  return (
    <AdminForm
      values={values}
      onValuesChange={setValues}
      schema={[{ component: 'input', fieldName: 'name', label: 'Name' }]}
    />
  );
}
```

## Edit Scenario (Prefill)

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
