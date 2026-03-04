/**
 * Form Core 分步表单工具。
 * @description 提供步骤结构构建、步骤切换、校验与状态同步能力。
 */
import { isFunction } from './guards';
import { getByPath } from './path';
import type {
  AdminFormApi,
  AdminFormSchema,
  BuildSteppedFormSchemaOptions,
  BuildSteppedFormSchemaResult,
  FormDependencyContext,
  ResolvedAdminFormSectionSchema,
  ResolvedAdminFormStepSchema,
  ValidateFormFieldsResult,
  ValidateSteppedFormResult,
} from '../types';

/** 默认步骤索引字段名。 */
const DEFAULT_STEP_FIELD_NAME = '__admin_form_step_index__';
/** 默认分组标题组件键。 */
const DEFAULT_SECTION_COMPONENT = 'section-title';
/** 网格列数上限。 */
const MAX_GRID_COLUMNS = 6;
/** 网格列数下限。 */
const MIN_GRID_COLUMNS = 1;

/**
 * 步骤/分组可见性断言类型。
 */
type VisibilityPredicate =
  | boolean
  | ((
      values: Record<string, any>,
      api: AdminFormApi,
      context?: FormDependencyContext
    ) => boolean | Promise<boolean>)
  | undefined;

/**
 * 原始步骤分组定义。
 */
type RawStepSection = {
  /** 列配置集合。 */
  columns?: number;
  /** 分组描述。 */
  description?: string;
  /** 键名。 */
  key?: string;
  /** 分组内字段 schema。 */
  schema?: AdminFormSchema[];
  /** 标题文案。 */
  title?: string;
};

/**
 * 原始步骤定义。
 */
type RawStep = {
  /** 列配置集合。 */
  columns?: number;
  /** 步骤描述。 */
  description?: string;
  /** 键名。 */
  key?: string;
  /** 步骤级 schema（未分组场景）。 */
  schema?: AdminFormSchema[];
  /** 步骤分组列表。 */
  sections?: RawStepSection[];
  /** 标题文案。 */
  title?: string;
};

/**
 * 规范化列数，限制在允许范围内。
 * @param columns 待解析列数。
 * @param fallback 回退列数。
 * @returns 规范化后的列数。
 */
function ensureColumns(columns: number | undefined, fallback: number): number {
  const target = Number(columns ?? fallback);
  if (!Number.isFinite(target)) {
    return fallback;
  }
  return Math.min(MAX_GRID_COLUMNS, Math.max(MIN_GRID_COLUMNS, Math.trunc(target)));
}

/**
 * 从步骤定义中收集全部字段名。
 * @param steps 已解析步骤列表。
 * @returns 字段名集合。
 */
function createFieldNameSet(steps: ResolvedAdminFormStepSchema[]) {
  const fieldNames = new Set<string>();
  for (const step of steps) {
    for (const section of step.sections) {
      for (const schema of section.schema) {
        if (schema.fieldName) {
          fieldNames.add(schema.fieldName);
        }
      }
    }
  }
  return fieldNames;
}

/**
 * 生成不冲突的字段名。
 * @param base 字段名前缀。
 * @param used 已占用字段名集合。
 * @returns 唯一字段名。
 */
function ensureUniqueFieldName(base: string, used: Set<string>) {
  if (!used.has(base)) {
    used.add(base);
    return base;
  }
  let index = 1;
  let candidate = `${base}_${index}`;
  while (used.has(candidate)) {
    index += 1;
    candidate = `${base}_${index}`;
  }
  used.add(candidate);
  return candidate;
}

/**
 * 统一解析布尔断言，兼容静态值和异步函数。
 * @param predicate 可见性断言。
 * @param defaultValue 默认值。
 * @param values 当前表单值。
 * @param api 表单 API。
 * @param context 依赖计算上下文。
 * @returns 断言结果。
 */
async function resolvePredicate(
  predicate: VisibilityPredicate,
  defaultValue: boolean,
  values: Record<string, any>,
  api: AdminFormApi,
  context?: FormDependencyContext
) {
  if (predicate === undefined) {
    return defaultValue;
  }
  if (typeof predicate === 'boolean') {
    return predicate;
  }
  return !!(await predicate(values, api, context));
}

/**
 * 创建步骤可见性断言，确保仅在目标步骤激活时返回可见。
 * @param stepIndex 目标步骤索引。
 * @param stepFieldName 步骤字段名。
 * @param predicate 原始可见性断言。
 * @returns 包装后的可见性函数。
 */
function createStepVisibilityPredicate(
  stepIndex: number,
  stepFieldName: string,
  predicate: VisibilityPredicate
) {
  return async (
    values: Record<string, any>,
    api: AdminFormApi,
    context?: FormDependencyContext
  ) => {
    const currentStep = Number(getByPath(values, stepFieldName) ?? 0);
    if (currentStep !== stepIndex) {
      return false;
    }
    return resolvePredicate(predicate, true, values, api, context);
  };
}

/**
 * 为步骤字段注入分步可见性依赖。
 * @param field 原始字段 schema。
 * @param stepIndex 所属步骤索引。
 * @param stepFieldName 步骤控制字段名。
 * @returns 装饰后的字段 schema。
 */
function decorateStepField(
  field: AdminFormSchema,
  stepIndex: number,
  stepFieldName: string
) {
  const dependencies = field.dependencies;
  const triggerFields = new Set(dependencies?.triggerFields ?? []);
  triggerFields.add(stepFieldName);

  return {
    ...field,
    dependencies: {
      ...dependencies,
      if: createStepVisibilityPredicate(stepIndex, stepFieldName, dependencies?.if),
      show: createStepVisibilityPredicate(stepIndex, stepFieldName, dependencies?.show),
      triggerFields: [...triggerFields],
    },
  } as AdminFormSchema;
}

/**
 * 解析网格列数并应用边界修正。
 * @param columns 目标列数。
 * @param fallback 回退列数。
 * @returns 规范化列数。
 */
export function resolveGridColumns(columns: number | undefined, fallback = 1) {
  return ensureColumns(columns, ensureColumns(fallback, 1));
}

/**
 * 生成网格列数类名。
 * @param columns 目标列数。
 * @param fallback 回退列数。
 * @returns 栅格类名。
 */
export function resolveGridColumnsClass(columns: number | undefined, fallback = 1) {
  const resolved = resolveGridColumns(columns, fallback);
  return `admin-form__grid--${resolved}`;
}

/**
 * 生成网格列数样式变量。
 * @param columns 目标列数。
 * @param fallback 回退列数。
 * @returns 样式对象。
 */
export function resolveGridColumnsStyle(
  columns: number | undefined,
  fallback = 1
): Record<string, string> {
  const resolved = resolveGridColumns(columns, fallback);
  return {
    '--admin-form-grid-columns': String(resolved),
  };
}

/**
 * 规范化分步配置，统一补齐 key、列数和字段名集合。
 * @param steps 原始步骤配置。
 * @param rowColumns 默认列数。
 * @returns 规范化后的步骤列表。
 */
export function normalizeFormSteps(
  steps: ResolvedAdminFormStepSchema[] | BuildSteppedFormSchemaResult['steps'] | RawStep[],
  rowColumns = 1
): ResolvedAdminFormStepSchema[] {
  if (!Array.isArray(steps)) {
    return [];
  }
  const fallbackColumns = resolveGridColumns(rowColumns, 1);
  return (steps as RawStep[])
    .filter((item) => item && Array.isArray(item.sections || item.schema))
    .map((step, stepIndex) => {
      const sectionsSource = Array.isArray(step.sections) && step.sections.length > 0
        ? step.sections
        : [
            {
              description: step.description,
              key: step.key ? `${step.key}-default` : undefined,
              schema: Array.isArray(step.schema) ? step.schema : [],
              title: step.title,
            },
          ];

      const sections: ResolvedAdminFormSectionSchema[] = sectionsSource.map(
        (section: RawStepSection, sectionIndex: number) => {
          const schema = Array.isArray(section.schema) ? section.schema : [];
          const fieldNames = schema
            .map((item: AdminFormSchema) => item.fieldName)
            .filter((fieldName): fieldName is string => typeof fieldName === 'string');
          return {
            ...section,
            columns: resolveGridColumns(section.columns, step.columns ?? fallbackColumns),
            fieldNames: [...new Set(fieldNames)],
            key: section.key || `${step.key || `step-${stepIndex + 1}`}-section-${sectionIndex + 1}`,
            schema,
            stepIndex,
          };
        }
      );

      const stepFieldNames = [...new Set(sections.flatMap((item) => item.fieldNames))];
      return {
        ...step,
        columns: resolveGridColumns(step.columns, fallbackColumns),
        fieldNames: stepFieldNames,
        key: step.key || `step-${stepIndex + 1}`,
        sections,
      } as ResolvedAdminFormStepSchema;
    });
}

/**
 * 约束步骤索引范围。
 * @param step 目标索引。
 * @param total 步骤总数。
 * @returns 合法步骤索引。
 */
export function clampStepIndex(step: number, total: number) {
  if (!Number.isFinite(step) || total <= 0) {
    return 0;
  }
  return Math.min(total - 1, Math.max(0, Math.trunc(step)));
}

/**
 * 计算步骤切换方向。
 * @param previousStep 变更前步骤。
 * @param nextStep 变更后步骤。
 * @returns 切换方向。
 */
export function resolveStepDirection(previousStep: number, nextStep: number) {
  if (nextStep > previousStep) {
    return 'forward' as const;
  }
  if (nextStep < previousStep) {
    return 'backward' as const;
  }
  return 'none' as const;
}

/**
 * 生成分组标题分隔字段。
 * @param section 分组定义。
 * @param stepIndex 步骤索引。
 * @param sectionIndex 分组索引。
 * @param sectionComponent 分组组件键。
 * @param stepFieldName 步骤字段名。
 * @param usedFieldNames 已使用字段名集合。
 * @returns 分组分隔字段 schema。
 */
function createSectionDividerField(
  section: ResolvedAdminFormSectionSchema,
  stepIndex: number,
  sectionIndex: number,
  sectionComponent: string,
  stepFieldName: string,
  usedFieldNames: Set<string>
): AdminFormSchema {
  const fieldName = ensureUniqueFieldName(
    `__admin_form_section_${stepIndex + 1}_${sectionIndex + 1}`,
    usedFieldNames
  );
  return {
    component: sectionComponent,
    componentProps: {
      description: section.description,
      title: section.title,
    },
    dependencies: {
      show: createStepVisibilityPredicate(stepIndex, stepFieldName, true),
      triggerFields: [stepFieldName],
    },
    fieldName,
    formItemClass: 'admin-form__section-item',
    hideLabel: true,
    rules: null,
  };
}

/**
 * 根据步骤定义构建可渲染表单 schema。
 * @param steps 原始步骤配置。
 * @param options 构建选项。
 * @returns 构建后的 schema、步骤字段名和步骤列表。
 */
export function buildSteppedFormSchema(
  steps: ResolvedAdminFormStepSchema[] | any[],
  options: BuildSteppedFormSchemaOptions = {}
): BuildSteppedFormSchemaResult {
  const resolvedSteps = normalizeFormSteps(steps, options.rowColumns ?? 1);
  const stepFieldName = options.stepFieldName || DEFAULT_STEP_FIELD_NAME;
  const sectionComponent = options.sectionComponent || DEFAULT_SECTION_COMPONENT;
  const includeSectionDivider = options.includeSectionDivider !== false;
  const initialStep = clampStepIndex(options.initialStep ?? 0, resolvedSteps.length || 1);
  const usedFieldNames = createFieldNameSet(resolvedSteps);
  const schema: AdminFormSchema[] = [
    {
      component: 'input',
      defaultValue: initialStep,
      fieldName: stepFieldName,
      hide: true,
      rules: null,
    },
  ];

  for (let stepIndex = 0; stepIndex < resolvedSteps.length; stepIndex += 1) {
    const step = resolvedSteps[stepIndex];
    for (let sectionIndex = 0; sectionIndex < step.sections.length; sectionIndex += 1) {
      const section = step.sections[sectionIndex];
      if (includeSectionDivider && (section.title || section.description)) {
        schema.push(
          createSectionDividerField(
            section,
            stepIndex,
            sectionIndex,
            sectionComponent,
            stepFieldName,
            usedFieldNames
          )
        );
      }
      for (const field of section.schema) {
        schema.push(decorateStepField(field, stepIndex, stepFieldName));
      }
    }
  }

  return {
    schema,
    stepFieldName,
    steps: resolvedSteps,
  };
}

/**
 * 校验指定字段列表。
 * @param api 表单 API。
 * @param fieldNames 待校验字段名列表。
 * @returns 字段校验结果。
 */
export async function validateFormFields(
  api: AdminFormApi,
  fieldNames: string[]
): Promise<ValidateFormFieldsResult> {
  const uniqueFields = [...new Set(fieldNames)].filter((item) => !!item);
  const errors: Record<string, string> = {};

  for (const fieldName of uniqueFields) {
    const result = await api.validateField(fieldName);
    if (!result.valid && result.error) {
      errors[fieldName] = result.error;
    }
  }

  return {
    errors,
    valid: Object.keys(errors).length === 0,
  };
}

/**
 * 校验整个分步表单，并定位首个非法步骤。
 * @param api 表单 API。
 * @param steps 步骤列表。
 * @param stepFieldName 步骤字段名。
 * @param currentStep 当前步骤索引。
 * @returns 分步校验结果。
 */
export async function validateSteppedForm(
  api: AdminFormApi,
  steps: ResolvedAdminFormStepSchema[],
  stepFieldName: string,
  currentStep: number
): Promise<ValidateSteppedFormResult> {
  const safeCurrentStep = clampStepIndex(currentStep, steps.length || 1);
  let firstInvalidStep = -1;
  const mergedErrors: Record<string, string> = {};

  for (let stepIndex = 0; stepIndex < steps.length; stepIndex += 1) {
    /* shouldValidate=true guarantees dependency runtime has completed before field validation. */
    await api.setFieldValue(stepFieldName, stepIndex, true);
    const result = await validateFormFields(api, steps[stepIndex]?.fieldNames ?? []);
    if (!result.valid && firstInvalidStep < 0) {
      firstInvalidStep = stepIndex;
    }
    Object.assign(mergedErrors, result.errors);
  }

  if (firstInvalidStep < 0) {
    await api.setFieldValue(stepFieldName, safeCurrentStep, true);
  } else {
    await api.setFieldValue(stepFieldName, firstInvalidStep, true);
  }

  return {
    errors: mergedErrors,
    firstInvalidStep,
    valid: firstInvalidStep < 0,
  };
}

/**
 * 清理分步控制字段，输出可提交值。
 * @param values 原始表单值。
 * @param stepFieldName 步骤字段名。
 * @returns 去除步骤字段后的值对象。
 */
export function sanitizeSteppedFormValues(
  values: Record<string, any>,
  stepFieldName: string
) {
  if (!values || typeof values !== 'object') {
    return {};
  }
  const next = { ...values };
  if (Object.prototype.hasOwnProperty.call(next, stepFieldName)) {
    delete next[stepFieldName];
  }
  return next;
}

/**
 * 判断分步表单是否需要渲染。
 * @param open 提交页是否打开。
 * @param destroyOnClose 关闭时是否销毁。
 * @returns 是否渲染分步表单。
 */
export function shouldRenderSteppedForm(open: boolean, destroyOnClose?: boolean) {
  if (open) {
    return true;
  }
  return !destroyOnClose;
}

/**
 * 构建步骤切换事件负载。
 * @param steps 步骤列表。
 * @param previousStep 上一步索引。
 * @param nextStep 下一步索引。
 * @returns 步骤变化事件负载。
 */
export function resolveStepChangePayload(
  steps: ResolvedAdminFormStepSchema[],
  previousStep: number,
  nextStep: number
) {
  const safeNextStep = clampStepIndex(nextStep, steps.length || 1);
  return {
    direction: resolveStepDirection(previousStep, safeNextStep),
    nextStep: safeNextStep,
    previousStep,
    step: steps[safeNextStep],
  };
}

/**
 * 确保返回可调用函数；若入参非函数则回退到默认实现。
 * @param fn 待检测函数。
 * @param fallback 默认函数。
 * @returns 可调用函数。
 */
export function withNoopFunction<T extends (...args: any[]) => any>(
  fn: T | undefined,
  fallback: T
) {
  if (isFunction(fn)) {
    return fn;
  }
  return fallback;
}
