# @admin-core/form-vue

English | [简体中文](./README.md)

Vue 3 UI adapter for `@admin-core/form-core`. This package only handles rendering and Vue-specific event/slot wiring. All business logic stays in core.

## Install

```bash
pnpm add @admin-core/form-vue
```


### CDN (Production / Development)

```html
<!-- jsDelivr (recommended) -->
<script src="https://cdn.jsdelivr.net/npm/@admin-core/form-vue/dist/index.global.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@admin-core/form-vue/dist/index.global.dev.js"></script>

<!-- unpkg -->
<script src="https://unpkg.com/@admin-core/form-vue/dist/index.global.js"></script>
<script src="https://unpkg.com/@admin-core/form-vue/dist/index.global.dev.js"></script>
```

## Full Exported API

## Components and Hooks

| API | Signature / Description |
| --- | --- |
| `AdminForm` | Vue component for standard forms. |
| `AdminSearchForm` | Vue search form component (`queryMode=true` preset). |
| `AdminFormSubmitPage` | Vue component for drawer/modal stepped submit page. |
| `useAdminForm(options)` | `options: AdminFormProps`, returns `[Form, formApi]`. |
| `useAdminFormSubmitPage(options)` | `options: UseAdminFormSubmitPageOptions`, returns `[FormSubmitPage, formApi, submitController]`. |

`UseAdminFormSubmitPageOptions` is effectively:

- `AdminFormSubmitPageVueProps` without `formApi` and `open`
- plus `open?: boolean`

## Adapter API

| API | Description |
| --- | --- |
| `setupAdminForm(options)` | Cross-framework unified setup entry (recommended). |
| `setupAdminFormVue(options)` | Vue-specific setup with `library` / `libraries`. |
| `registerFormComponents(components, options?)` | Quick semantic component mapping registration. |
| `getFormAdapterRegistry()` | Unified registry entry. |
| `getVueFormAdapterRegistry()` | Vue named registry entry. |

## Re-exported Core API

You can import these directly from `@admin-core/form-vue`:

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

Vue data-driven usage:

- `v-model:values`
- `@update:values`

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
- `requiredMarkFollowTheme?: boolean` (default `false`; when `true`, required `*`, required validation error text, and required-field error state colors all use theme danger color)

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
- For 3rd-party UI libraries, map components with `setupAdminFormVue`.
- Resolution order: `explicit field component -> active library -> native fallback`.

## Out of the box (Data First)

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { AdminForm } from '@admin-core/form-vue';

const values = ref({ name: '' });
</script>

<template>
  <AdminForm
    v-model:values="values"
    :schema="[{ component: 'input', fieldName: 'name', label: 'Name' }]"
  />
</template>
```

## Edit Scenario (Prefill)

```ts
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
