
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

const DEFAULT_STEP_FIELD_NAME = '__admin_form_step_index__';
const DEFAULT_SECTION_COMPONENT = 'section-title';
const MAX_GRID_COLUMNS = 6;
const MIN_GRID_COLUMNS = 1;

type VisibilityPredicate =
  | boolean
  | ((
      values: Record<string, any>,
      api: AdminFormApi,
      context?: FormDependencyContext
    ) => boolean | Promise<boolean>)
  | undefined;

type RawStepSection = {
  columns?: number;
  description?: string;
  key?: string;
  schema?: AdminFormSchema[];
  title?: string;
};

type RawStep = {
  columns?: number;
  description?: string;
  key?: string;
  schema?: AdminFormSchema[];
  sections?: RawStepSection[];
  title?: string;
};

function ensureColumns(columns: number | undefined, fallback: number): number {
  const target = Number(columns ?? fallback);
  if (!Number.isFinite(target)) {
    return fallback;
  }
  return Math.min(MAX_GRID_COLUMNS, Math.max(MIN_GRID_COLUMNS, Math.trunc(target)));
}

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

export function resolveGridColumns(columns: number | undefined, fallback = 1) {
  return ensureColumns(columns, ensureColumns(fallback, 1));
}

export function resolveGridColumnsClass(columns: number | undefined, fallback = 1) {
  const resolved = resolveGridColumns(columns, fallback);
  return `admin-form__grid--${resolved}`;
}

export function resolveGridColumnsStyle(
  columns: number | undefined,
  fallback = 1
): Record<string, string> {
  const resolved = resolveGridColumns(columns, fallback);
  return {
    '--admin-form-grid-columns': String(resolved),
  };
}

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

export function clampStepIndex(step: number, total: number) {
  if (!Number.isFinite(step) || total <= 0) {
    return 0;
  }
  return Math.min(total - 1, Math.max(0, Math.trunc(step)));
}

export function resolveStepDirection(previousStep: number, nextStep: number) {
  if (nextStep > previousStep) {
    return 'forward' as const;
  }
  if (nextStep < previousStep) {
    return 'backward' as const;
  }
  return 'none' as const;
}

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
    // shouldValidate=true guarantees dependency runtime has completed before field validation.
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

export function shouldRenderSteppedForm(open: boolean, destroyOnClose?: boolean) {
  if (open) {
    return true;
  }
  return !destroyOnClose;
}

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

export function withNoopFunction<T extends (...args: any[]) => any>(
  fn: T | undefined,
  fallback: T
) {
  if (isFunction(fn)) {
    return fn;
  }
  return fallback;
}
