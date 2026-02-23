# @admin-core/form-core

English | [简体中文](./README.md)

Framework-agnostic form engine. Handles schema compilation, state management, validation, dependency linkage, stepped forms, and adapter protocol.

## Install

```bash
pnpm add @admin-core/form-core zod
```


### CDN (Production / Development)

```html
<!-- jsDelivr (recommended) -->
<script src="https://cdn.jsdelivr.net/npm/@admin-core/form-core/dist/index.global.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@admin-core/form-core/dist/index.global.dev.js"></script>

<!-- unpkg -->
<script src="https://unpkg.com/@admin-core/form-core/dist/index.global.js"></script>
<script src="https://unpkg.com/@admin-core/form-core/dist/index.global.dev.js"></script>
```

## Exported API Overview

```ts
import {
  createFormApi,
  createRangeRule,
  setupAdminFormCore,
  registerFormRules,
  createFormAdapterRegistry,
  createFormAdapterBridge,
  createNativeAdapter,
  buildSteppedFormSchema,
  validateFormFields,
  validateSteppedForm,
  z,
} from '@admin-core/form-core';
```

## 1) Core Setup API

| API | Description |
| --- | --- |
| `setupAdminFormCore(options?)` | Configure core-level options: `locale`, `logLevel`, `rules`. |
| `registerFormRules(rules)` | Register string-based custom validators (for example `mustBeTrue`). |
| `z` | Re-exported Zod entry. |

`setupAdminFormCore` options:

- `locale?: string` (built-in `zh-CN` / `en-US`, custom locale keys are supported)
- `logLevel?: 'error' | 'info' | 'silent' | 'warn'`
- `rules?: RegisterFormRulesOptions`

I18n APIs:

- `setLocale(locale)`: switch active locale
- `registerLocaleMessages(locale, messages, options?)`: register/extend locale messages
- `getLocaleMessages(locale?)`: read locale message bundle

## 2) Form Instance API (`createFormApi`)

`createFormApi(props: AdminFormProps): AdminFormApi`

`AdminFormApi` methods:

| Method | Description |
| --- | --- |
| `mount()` / `unmount()` | Attach / dispose lifecycle. |
| `getState()` | Get current form props. |
| `setState(patchOrFn)` | Update form props (schema, layout, behavior, ...). |
| `getSnapshot()` | Full snapshot: `values/errors/runtime/props`. |
| `getRenderState()` | Render snapshot (`fields + collapsed`). |
| `getValues()` | Get current values (with mapping applied). |
| `setValues(fields, filterFields?, shouldValidate?)` | Batch set field values. |
| `setFieldValue(field, value, shouldValidate?)` | Set a single field value. |
| `validate()` | Full validation. |
| `validateField(fieldName)` | Single field validation. |
| `isFieldValid(fieldName)` | Check if one field is valid. |
| `submitForm(event?)` | Submit form (without automatic full validation). |
| `validateAndSubmitForm()` | Validate then submit. |
| `resetForm(values?)` | Reset form; optional override values (useful for edit prefilling). |
| `resetValidate()` | Clear validation errors only. |
| `updateSchema(schemaPatches)` | Patch schema by `fieldName`. |
| `removeSchemaByFields(fields)` | Remove schema items by field names. |
| `merge(formApi)` | Merge multiple forms and submit together. |
| `setLatestSubmissionValues(values)` / `getLatestSubmissionValues()` | Read/write latest submitted values. |
| `getFieldComponentRef(name)` / `registerFieldComponentRef(name, ref)` / `removeFieldComponentRef(name)` | Field component ref management. |
| `getFocusedField()` | Get current focused field name. |
| `store` | Selector-based subscriptions (field-level performance). |

## 3) Adapter API

| API | Description |
| --- | --- |
| `createFormAdapterRegistry(options?)` | Create adapter registry. |
| `createFormAdapterBridge(options)` | Create high-level bridge with `setup/register`. |
| `createNativeAdapter(components)` | Create native adapter definition. |

Core protocol types:

- `FormAdapterV1`
- `AdapterCapabilities`
- `ResolvedComponentBinding`
- Resolution chain: `explicit component -> active library -> native fallback`

## 4) Stepped Form API

| API | Description |
| --- | --- |
| `buildSteppedFormSchema(steps, options?)` | Expand step config into regular form schema. |
| `validateFormFields(api, fieldNames)` | Validate a specific field set. |
| `validateSteppedForm(api, steps, stepFieldName, currentStep)` | Validate stepped form and locate first invalid step. |
| `sanitizeSteppedFormValues(values, stepFieldName)` | Remove internal step field from values. |
| `clampStepIndex(step, total)` | Safe step index helper. |
| `resolveStepChangePayload(steps, prev, next)` | Step transition payload helper. |

## 5) Key Types (Most Used)

### `AdminFormProps`

Common fields:

- `schema?: AdminFormSchema[]`
- `commonConfig?: AdminFormCommonConfig`
- `layout?: 'horizontal' | 'inline' | 'vertical'`
- `queryMode?: boolean` (default `false`, enables query layout mode)
- `gridColumns?: number`
- `showDefaultActions?: boolean`
- `showCollapseButton?: boolean`
- `collapsedRows?: number`
- `collapsed?: boolean`
- `submitOnChange?: boolean`
- `visibleFieldNames?: string[]`
- `handleSubmit?: (values, context) => MaybeAsync<void>`
- `handleReset?: (values, context) => MaybeAsync<void>`
- `handleValuesChange?: (values, fieldsChanged) => void`

Query mode (`queryMode=true`) rules:

- `gridColumns` is used as max items per row.
- `collapsedRows` controls default visible row count.
- When `collapsed` is `true`, only `collapsedRows * gridColumns` fields are rendered.
- Action area (`reset/submit/collapse`) is placed by grid:
  - row not full: stays on the same row and right-aligned;
  - row full: moves to a new row and right-aligned.

### `AdminFormCommonConfig`

Common fields:

- `labelAlign?: 'left' | 'right'` (default: `right`)
- `labelWidth?: number`
- `hideLabel?: boolean`
- `hideRequiredMark?: boolean`
- `modelPropName?: string`
- `disabled?: boolean`
- `componentProps?: ComponentPropsInput`

### `AdminFormSchema`

Common fields:

- `fieldName: string`
- `component: SemanticFormComponentType | string | any` (includes built-in `range`)
- `label?: string | (() => string)`
- `rules?: 'required' | 'selectRequired' | ZodTypeAny | string | FormRuleValidator | null`
- `defaultValue?: any`
- `componentProps?: object | (values, api, context?) => MaybeAsync<object>`
- `dependencies?: AdminFormDependencies`
- `formFieldProps?: { validateOnBlur/validateOnChange/validateOnInput/validateOnModelUpdate }`

### `AdminFormSubmitPageBaseProps`

Stepped submit page fields:

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

### `AdminFormSubmitPageController`

- `open()` / `close()` / `toggle(open?)` / `setOpen(open)`
- `getOpen()` / `getFormApi()`
- `getStep()` / `getTotalSteps()` / `goToStep(step)`
- `next()` / `prev()`

## 6) Generic Range Component (`range`)

`range` is an out-of-box dual-value field with `[start, end]` value shape. By default it renders two inputs and supports `componentProps` for type/placeholder/separator:

```ts
import { createRangeRule } from '@admin-core/form-core';

const schema = [
  {
    fieldName: 'amountRange',
    label: 'Amount Range',
    component: 'range',
    componentProps: {
      type: 'number',
      startPlaceholder: 'Min',
      endPlaceholder: 'Max',
      separator: 'to',
    },
    rules: createRangeRule({
      message: 'Amount range must be ascending',
      normalize: (value) => Number(value),
    }),
  },
];
```

Custom validation options:

- pass a `FormRuleValidator` directly to `rules`
- or compose a reusable validator with `createRangeRule({ validate/compare/normalize/message })`

## 7) Style Entrypoints

- `@admin-core/form-core/styles`
- `@admin-core/form-core/styles/form.css`
