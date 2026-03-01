# @admin-core/form-core

简体中文 | [English](./README.en.md)

框架无关的表单核心引擎。负责 schema 解析、状态管理、校验、依赖联动、分步表单与适配器协议。

## 安装

```bash
pnpm add @admin-core/form-core zod
```


### CDN（生产/开发）

```html
<!-- jsDelivr（推荐） -->
<script src="https://cdn.jsdelivr.net/npm/@admin-core/form-core/dist/index.global.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@admin-core/form-core/dist/index.global.dev.js"></script>

<!-- unpkg -->
<script src="https://unpkg.com/@admin-core/form-core/dist/index.global.js"></script>
<script src="https://unpkg.com/@admin-core/form-core/dist/index.global.dev.js"></script>
```

## 导出 API 总览

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

## 1) 核心初始化 API

| API | 说明 |
| --- | --- |
| `setupAdminFormCore(options?)` | 设置 core 级配置：`locale`、`logLevel`、`rules`。 |
| `registerFormRules(rules)` | 注册字符串规则校验器（例如 `mustBeTrue`）。 |
| `z` | Zod 重导出，统一版本来源。 |

`setupAdminFormCore` 的 `options`：

- `locale?: string`（内置 `zh-CN` / `en-US`，也支持自定义 locale key）
- `logLevel?: 'error' | 'info' | 'silent' | 'warn'`
- `rules?: RegisterFormRulesOptions`

国际化相关 API：

- `setLocale(locale)`：切换当前语言
- `registerLocaleMessages(locale, messages, options?)`：注册/扩展语言包
- `getLocaleMessages(locale?)`：读取语言文案

## 2) Form 实例 API（`createFormApi`）

`createFormApi(props: AdminFormProps): AdminFormApi`

`AdminFormApi` 方法清单：

| 方法 | 说明 |
| --- | --- |
| `mount()` / `unmount()` | 生命周期挂载/卸载。 |
| `getState()` | 获取当前表单 props。 |
| `setState(patchOrFn)` | 更新表单 props（schema、布局、行为等）。 |
| `getSnapshot()` | 获取完整快照：`values/errors/runtime/props`。 |
| `getRenderState()` | 获取渲染态（fields + collapsed）。 |
| `getValues()` | 获取当前值（含映射处理）。 |
| `setValues(fields, filterFields?, shouldValidate?)` | 批量赋值。 |
| `setFieldValue(field, value, shouldValidate?)` | 单字段赋值。 |
| `validate()` | 全量校验。 |
| `validateField(fieldName)` | 单字段校验。 |
| `isFieldValid(fieldName)` | 判断单字段是否通过校验。 |
| `submitForm(event?)` | 提交（不自动全量校验）。 |
| `validateAndSubmitForm()` | 先校验后提交。 |
| `resetForm(values?)` | 重置表单；可传覆盖值（常用于编辑回填）。 |
| `resetValidate()` | 清空错误状态。 |
| `updateSchema(schemaPatches)` | 按 `fieldName` 局部更新 schema。 |
| `removeSchemaByFields(fields)` | 删除指定字段 schema。 |
| `merge(formApi)` | 多表单合并提交控制。 |
| `setLatestSubmissionValues(values)` / `getLatestSubmissionValues()` | 读写最近一次提交值。 |
| `getFieldComponentRef(name)` / `registerFieldComponentRef(name, ref)` / `removeFieldComponentRef(name)` | 字段组件引用管理。 |
| `getFocusedField()` | 获取当前焦点字段。 |
| `store` | selector 订阅能力（高性能字段级订阅）。 |

## 3) 适配器 API

| API | 说明 |
| --- | --- |
| `createFormAdapterRegistry(options?)` | 创建适配器注册中心。 |
| `createFormAdapterBridge(options)` | 创建更高层桥接器（支持 `setup/register`）。 |
| `createNativeAdapter(components)` | 创建 native 适配器。 |

核心协议类型：

- `FormAdapterV1`
- `AdapterCapabilities`
- `ResolvedComponentBinding`
- 解析链路：`explicit component -> active library -> native fallback`

## 4) 分步表单 API

| API | 说明 |
| --- | --- |
| `buildSteppedFormSchema(steps, options?)` | 将步骤定义展开为普通 schema。 |
| `validateFormFields(api, fieldNames)` | 校验指定字段集合。 |
| `validateSteppedForm(api, steps, stepFieldName, currentStep)` | 校验步骤表单并定位首个失败步骤。 |
| `sanitizeSteppedFormValues(values, stepFieldName)` | 去除内部步骤字段。 |
| `clampStepIndex(step, total)` | 安全步骤索引。 |
| `resolveStepChangePayload(steps, prev, next)` | 步骤切换结果对象。 |

## 5) 关键类型（常用）

### `AdminFormProps`

核心字段：

- `schema?: AdminFormSchema[]`
- `commonConfig?: AdminFormCommonConfig`
- `layout?: 'horizontal' | 'inline' | 'vertical'`
- `queryMode?: boolean`（默认 `false`，启用查询布局）
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

查询模式（`queryMode=true`）规则：

- 使用 `gridColumns` 作为每行最大项数。
- 使用 `collapsedRows` 作为默认显示行数。
- 当 `collapsed` 为 `true` 时仅渲染 `collapsedRows * gridColumns` 个字段。
- 操作区（重置/提交/折叠）按网格落位：
  - 当前行未满：同行右侧补齐；
  - 当前行已满：换新行并右对齐。

### `AdminFormCommonConfig`

常用字段：

- `labelAlign?: 'left' | 'right'`（默认 `right`）
- `labelWidth?: number`
- `hideLabel?: boolean`
- `hideRequiredMark?: boolean`
- `requiredMarkFollowTheme?: boolean`（默认 `false`，`true` 时必填 `*`、必填校验错误文案与必填字段错误态颜色均跟随主题危险色）
- `modelPropName?: string`
- `disabled?: boolean`
- `componentProps?: ComponentPropsInput`

### `AdminFormSchema`

常用字段：

- `fieldName: string`
- `component: SemanticFormComponentType | string | any`（内置新增 `range` 通用区间组件）
- `label?: string | (() => string)`
- `rules?: 'required' | 'selectRequired' | ZodTypeAny | string | FormRuleValidator | null`
- `defaultValue?: any`
- `componentProps?: object | (values, api, context?) => MaybeAsync<object>`
- `dependencies?: AdminFormDependencies`
- `formFieldProps?: { validateOnBlur/validateOnChange/validateOnInput/validateOnModelUpdate }`

### `AdminFormSubmitPageBaseProps`

分步提交页核心字段：

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

### `AdminFormSubmitPageController`

- `open()` / `close()` / `toggle(open?)` / `setOpen(open)`
- `getOpen()` / `getFormApi()`
- `getStep()` / `getTotalSteps()` / `goToStep(step)`
- `next()` / `prev()`

## 6) 通用区间组件（`range`）

`range` 为开箱即用的双值区间组件，值结构为 `[start, end]`。默认渲染为两个输入框，可通过 `componentProps` 自定义类型和占位文案：

```ts
import { createRangeRule } from '@admin-core/form-core';

const schema = [
  {
    fieldName: 'amountRange',
    label: '金额区间',
    component: 'range',
    componentProps: {
      type: 'number',
      startPlaceholder: '最小值',
      endPlaceholder: '最大值',
      separator: '至',
    },
    rules: createRangeRule({
      message: '金额区间必须从小到大',
      normalize: (value) => Number(value),
    }),
  },
];
```

规则可自定义：

- 直接传 `FormRuleValidator` 到 `rules`
- 或使用 `createRangeRule({ validate/compare/normalize/message })` 组合规则

## 7) 样式入口

- `@admin-core/form-core/styles`
- `@admin-core/form-core/styles/form.css`
