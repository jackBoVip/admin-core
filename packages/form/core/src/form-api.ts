
import { compileSchema, type CompiledSchema } from './compiler';
import { ensureCoreSetup } from './config';
import {
  createDefaultFormProps,
  DEFAULT_RUNTIME_FIELD_STATE,
} from './constants';
import { getLocaleMessages } from './locales';
import { computeCollapseKeepIndex } from './utils/collapse';
import { createDebouncedTask } from './utils/debounce';
import { deepClone, deepEqual, mergeWithArrayOverride } from './utils/deep';
import { isBoolean, isFunction, isString } from './utils/guards';
import { logger } from './utils/logger';
import { mapArrayStringFields, mapFieldMappingTime } from './utils/mappers';
import {
  deleteByPathImmutable,
  getByPath,
  setByPath,
  setByPathImmutable,
} from './utils/path';
import {
  ensureBuiltinRules,
  getRuleValidator,
  registerFormRules as registerRules,
} from './utils/rules';
import {
  pathDependenciesIntersect,
  trackValueDependencies,
} from './utils/value-access';
import {
  inferDefaultValueFromZod,
  isZodSchema,
  resolveZodIssueMessage,
} from './utils/zod';
import { createStore } from '@admin-core/shared-core';
import type {
  AdminFormApi,
  AdminFormProps,
  AdminFormSchema,
  AdminFormSnapshot,
  FieldValidationResult,
  FormValidationResult,
  FormDependencyContext,
  FormRuleValidator,
  FormSubmitContext,
  RegisterFormRulesOptions,
  RenderFieldItem,
  RuntimeFieldState,
} from './types';

function isEmptyValue(value: any): boolean {
  return (
    value === undefined ||
    value === null ||
    (typeof value === 'string' && value.trim() === '') ||
    (Array.isArray(value) && value.length === 0)
  );
}

function resolveRequiredRuleMessage(label: string) {
  return getLocaleMessages().form.required.replace('{label}', label);
}

function resolveSelectRequiredRuleMessage(label: string) {
  return getLocaleMessages().form.selectRequired.replace('{label}', label);
}

function buildRuntimeMap(schema: AdminFormSchema[]): Record<string, RuntimeFieldState> {
  const runtime: Record<string, RuntimeFieldState> = {};
  for (const field of schema) {
    runtime[field.fieldName] = {
      ...DEFAULT_RUNTIME_FIELD_STATE,
    };
  }
  return runtime;
}

function buildInitialValues(schema: AdminFormSchema[]) {
  const values: Record<string, any> = {};
  for (const item of schema) {
    if (!item.fieldName) continue;
    if (Object.prototype.hasOwnProperty.call(item, 'defaultValue')) {
      setByPath(values, item.fieldName, item.defaultValue);
      continue;
    }
    if (item.rules && isZodSchema(item.rules)) {
      const inferred = inferDefaultValueFromZod(item.rules);
      if (inferred !== undefined) {
        setByPath(values, item.fieldName, inferred);
      }
    }
  }
  return values;
}

type DependencyEvalContext = {
  fieldName: string;
  signal: AbortSignal;
  version: number;
};

type FieldValidationContext = {
  mutateErrors?: boolean;
  signal?: AbortSignal;
  version?: number;
};

type ResolvedFieldValidationResult = {
  error?: string;
  hidden: boolean;
  valid: boolean;
};

function markComparedPair(
  patch: object,
  current: object,
  seen: WeakMap<object, WeakSet<object>>
) {
  let set = seen.get(patch);
  if (!set) {
    set = new WeakSet<object>();
    seen.set(patch, set);
  }
  if (set.has(current)) {
    return true;
  }
  set.add(current);
  return false;
}

function hasPatchChanges(
  patch: unknown,
  current: unknown,
  seen = new WeakMap<object, WeakSet<object>>()
): boolean {
  if (patch === undefined) return false;
  if (Array.isArray(patch)) {
    return !deepEqual(patch, current);
  }
  if (patch && typeof patch === 'object') {
    if (!current || typeof current !== 'object' || Array.isArray(current)) {
      return true;
    }
    const patchObject = patch as Record<string, unknown>;
    const currentObject = current as Record<string, unknown>;
    if (markComparedPair(patchObject, currentObject, seen)) {
      return false;
    }
    for (const [key, value] of Object.entries(patchObject)) {
      if (value === undefined) continue;
      if (hasPatchChanges(value, currentObject[key], seen)) {
        return true;
      }
    }
    return false;
  }
  return !Object.is(patch, current);
}

function pickDefined<T extends Record<string, unknown>>(input: T): Partial<T> {
  const output: Partial<T> = {};
  for (const [key, value] of Object.entries(input) as [keyof T, T[keyof T]][]) {
    if (value !== undefined) {
      output[key] = value;
    }
  }
  return output;
}

class AdminFormApiImpl implements AdminFormApi {
  form = {
    errors: {} as Record<string, string>,
    values: {} as Record<string, any>,
  };

  public store = createStore<AdminFormSnapshot>({
    errors: {},
    latestSubmissionValues: null,
    props: createDefaultFormProps(),
    runtime: {},
    values: {},
  });

  private componentRefMap = new Map<string, unknown>();
  private compiledSchema: CompiledSchema = compileSchema([]);
  private componentPropsAbortMap = new Map<string, AbortController>();
  private componentPropsDependencyMap = new Map<string, 'all' | Set<string>>();
  private componentPropsVersionMap = new Map<string, number>();
  private dependencyAbortMap = new Map<string, AbortController>();
  private dependencyVersionMap = new Map<string, number>();
  private inflightSubmitOnChange: Promise<void> | null = null;
  private latestSubmissionValues: null | Record<string, any> = null;
  private pendingSubmitOnChange = false;
  private pendingRuntimeEvaluation: Promise<void> = Promise.resolve();
  private props: AdminFormProps;
  private renderCache: RenderFieldItem[] = [];
  private valuesChangePayloadCache: Record<string, any> | null = null;
  private valuesChangePayloadSourceRef: Record<string, any> | null = null;
  private runtime: Record<string, RuntimeFieldState>;
  private schemaHash = '';
  private syncComponentPropsFields = new Set<string>();
  private submitAttemptVersion = 0;
  private submitController: AbortController | null = null;
  private submitOnChangeScheduleVersion = 0;
  private submitOnChangeTask = createDebouncedTask(() => {
    if (this.inflightSubmitOnChange) {
      this.pendingSubmitOnChange = true;
      return;
    }
    this.inflightSubmitOnChange = this.validateAndSubmitForm()
      .then(() => undefined)
      .finally(() => {
        this.inflightSubmitOnChange = null;
        if (this.pendingSubmitOnChange) {
          this.pendingSubmitOnChange = false;
          this.submitOnChangeTask.run();
        }
      });
  }, 300);
  private validateController: AbortController | null = null;
  private validateVersion = 0;

  private setRuntimeField(fieldName: string, nextRuntime: RuntimeFieldState) {
    const current = this.runtime[fieldName];
    if (current && deepEqual(current, nextRuntime)) {
      return;
    }
    this.runtime = {
      ...this.runtime,
      [fieldName]: nextRuntime,
    };
  }

  constructor(options: AdminFormProps = {}) {
    ensureCoreSetup();
    ensureBuiltinRules();

    this.props = mergeWithArrayOverride(options, createDefaultFormProps());
    this.runtime = buildRuntimeMap(this.props.schema ?? []);
    this.form.values = buildInitialValues(this.props.schema ?? []);
    this.form.errors = {};
    this.recompileSchema();
    this.updateSnapshot(true);
    const allFields = (this.props.schema ?? []).map((item) => item.fieldName);
    void this.runRuntimeEvaluations(allFields, [...this.syncComponentPropsFields]);
  }

  mount() {}

  unmount() {
    this.latestSubmissionValues = null;
    this.componentRefMap.clear();
    this.submitController?.abort();
    this.validateController?.abort();
    for (const controller of this.componentPropsAbortMap.values()) {
      controller.abort();
    }
    this.componentPropsAbortMap.clear();
    this.componentPropsVersionMap.clear();
    this.componentPropsDependencyMap.clear();
    for (const controller of this.dependencyAbortMap.values()) {
      controller.abort();
    }
    this.dependencyAbortMap.clear();
    this.valuesChangePayloadCache = null;
    this.valuesChangePayloadSourceRef = null;
    this.submitOnChangeTask.cancel();
  }

  registerFieldComponentRef(fieldName: string, ref: unknown) {
    this.componentRefMap.set(fieldName, ref);
  }

  removeFieldComponentRef(fieldName: string) {
    this.componentRefMap.delete(fieldName);
  }

  getFieldComponentRef<T = unknown>(fieldName: string): T | undefined {
    return this.componentRefMap.get(fieldName) as T | undefined;
  }

  getFocusedField() {
    if (typeof document === 'undefined') return undefined;
    for (const [fieldName, ref] of this.componentRefMap.entries()) {
      if (!ref || typeof ref !== 'object') continue;
      const element =
        ref instanceof HTMLElement
          ? ref
          : (ref as { $el?: HTMLElement }).$el;
      if (!element) continue;
      if (document.activeElement === element || element.contains(document.activeElement)) {
        return fieldName;
      }
    }
    return undefined;
  }

  getLatestSubmissionValues() {
    return this.latestSubmissionValues ? { ...this.latestSubmissionValues } : {};
  }

  setLatestSubmissionValues(values: null | Record<string, any>) {
    this.latestSubmissionValues = values ? deepClone(values) : null;
    this.updateSnapshot();
  }

  getState() {
    return this.props;
  }

  getSnapshot(): AdminFormSnapshot {
    return this.store.getState();
  }

  private updateSnapshot(force = false) {
    const nextSnapshot: AdminFormSnapshot = {
      props: this.props,
      values: this.form.values,
      errors: this.form.errors,
      runtime: this.runtime,
      latestSubmissionValues: this.latestSubmissionValues,
    };
    if (force) {
      this.store.setState(nextSnapshot);
      return;
    }
    this.store.setState((prev) => {
      if (
        prev.props === nextSnapshot.props &&
        prev.values === nextSnapshot.values &&
        prev.errors === nextSnapshot.errors &&
        prev.runtime === nextSnapshot.runtime &&
        prev.latestSubmissionValues === nextSnapshot.latestSubmissionValues
      ) {
        return prev;
      }
      return nextSnapshot;
    });
  }

  private recompileSchema() {
    const compiled = compileSchema(this.props.schema ?? [], this.props.commonConfig);
    this.compiledSchema = compiled;
    this.syncComponentPropsFields = new Set(
      compiled.fields
        .filter((item) => isFunction(item.componentProps))
        .map((item) => item.fieldName)
    );
    if (this.schemaHash === compiled.hash) return;
    this.schemaHash = compiled.hash;
    const currentFields = new Set(compiled.fields.map((item) => item.fieldName));
    for (const [fieldName, controller] of this.componentPropsAbortMap.entries()) {
      if (!currentFields.has(fieldName)) {
        controller.abort();
        this.componentPropsAbortMap.delete(fieldName);
        this.componentPropsVersionMap.delete(fieldName);
        this.componentPropsDependencyMap.delete(fieldName);
      }
    }
    for (const [fieldName, controller] of this.dependencyAbortMap.entries()) {
      if (!currentFields.has(fieldName)) {
        controller.abort();
        this.dependencyAbortMap.delete(fieldName);
        this.dependencyVersionMap.delete(fieldName);
      }
    }
    const baseRuntime = buildRuntimeMap(compiled.fields);
    for (const [fieldName, previousState] of Object.entries(this.runtime)) {
      if (!currentFields.has(fieldName)) continue;
      baseRuntime[fieldName] = {
        ...baseRuntime[fieldName],
        ...previousState,
      };
    }
    this.runtime = baseRuntime;
    this.renderCache = [];
  }

  private resolveCommonComponentProps(): Record<string, any> {
    const input = this.props.commonConfig?.componentProps;
    if (!input) return {};
    if (isFunction(input)) {
      const result = input(this.form.values, this);
      if (result && typeof (result as Promise<any>).then === 'function') {
        return {};
      }
      return result as Record<string, any>;
    }
    return input;
  }

  private buildValuesChangePayload(changedFields: string[]) {
    if (!this.valuesChangePayloadCache || !this.valuesChangePayloadSourceRef) {
      this.valuesChangePayloadSourceRef = this.form.values;
      this.valuesChangePayloadCache = deepClone(this.form.values);
      return this.valuesChangePayloadCache;
    }
    if (this.valuesChangePayloadSourceRef === this.form.values) {
      return this.valuesChangePayloadCache;
    }
    let nextPayload = this.valuesChangePayloadCache;
    for (const fieldName of new Set(changedFields)) {
      const nextValue = getByPath(this.form.values, fieldName);
      const result = setByPathImmutable(nextPayload, fieldName, nextValue);
      if (result.changed) {
        nextPayload = result.value;
      }
    }
    this.valuesChangePayloadSourceRef = this.form.values;
    this.valuesChangePayloadCache = nextPayload;
    return nextPayload;
  }

  private triggerValuesChange(changedFields: string[]) {
    if (!changedFields.length) return;
    if (!this.props.handleValuesChange) return;
    this.props.handleValuesChange(
      this.buildValuesChangePayload(changedFields),
      changedFields
    );
  }

  private scheduleSubmitOnChange() {
    if (!this.props.submitOnChange) return;
    this.submitOnChangeTask.run();
  }

  private trackRuntimeEvaluation(task: Promise<void>) {
    const safeTask = task.catch((error) => {
      logger.warn('Runtime evaluation failed', error);
    });
    this.pendingRuntimeEvaluation = Promise.allSettled([
      this.pendingRuntimeEvaluation,
      safeTask,
    ]).then(() => undefined);
    return safeTask;
  }

  private runRuntimeEvaluations(
    dependencyFields: string[],
    componentPropsFields: string[]
  ) {
    const tasks: Promise<void>[] = [];
    if (dependencyFields.length) {
      tasks.push(this.evaluateDependenciesForFields(dependencyFields));
    }
    if (componentPropsFields.length) {
      tasks.push(this.evaluateComponentPropsForFields(componentPropsFields));
    }
    if (!tasks.length) {
      return Promise.resolve();
    }
    return this.trackRuntimeEvaluation(
      Promise.all(tasks).then(() => undefined)
    );
  }

  private getDependencyTargets(changedFields: string[]) {
    const affected = new Set<string>();
    for (const changed of changedFields) {
      const direct = this.compiledSchema.dependencyGraph.get(changed) ?? [];
      for (const fieldName of direct) {
        affected.add(fieldName);
      }
    }
    return [...affected];
  }

  private async evaluateDependencyField(context: DependencyEvalContext) {
    const schema = this.getFieldSchema(context.fieldName);
    const previousRuntime = this.runtime[context.fieldName] ?? {
      ...DEFAULT_RUNTIME_FIELD_STATE,
    };
    if (!schema?.dependencies) {
      this.setRuntimeField(context.fieldName, {
        ...DEFAULT_RUNTIME_FIELD_STATE,
        dynamicFieldComponentProps: previousRuntime.dynamicFieldComponentProps,
      });
      return;
    }

    const dependencies = schema.dependencies;
    const formValues = this.form.values;
    const nextRuntime: RuntimeFieldState = {
      ...DEFAULT_RUNTIME_FIELD_STATE,
      dynamicFieldComponentProps: previousRuntime.dynamicFieldComponentProps,
      evaluating: true,
    };

    const dependencyContext: FormDependencyContext = {
      fieldName: context.fieldName,
      signal: context.signal,
      version: context.version,
    };

    const checkVersion = () =>
      !context.signal.aborted &&
      (this.dependencyVersionMap.get(context.fieldName) ?? 0) === context.version;

    const resolveCondition = async (
      input: boolean | ((values: Record<string, any>, api: AdminFormApi) => any) | undefined,
      fallback: boolean
    ) => {
      if (isBoolean(input)) return input;
      if (isFunction(input)) {
        return !!(await (input as any)(formValues, this, dependencyContext));
      }
      return fallback;
    };

    try {
      const shouldIf = await resolveCondition(dependencies.if, true);
      if (!checkVersion()) return;
      nextRuntime.isIf = shouldIf;

      if (!shouldIf) {
        nextRuntime.evaluating = false;
        this.setRuntimeField(context.fieldName, nextRuntime);
        return;
      }

      const shouldShow = await resolveCondition(dependencies.show, true);
      if (!checkVersion()) return;
      nextRuntime.isShow = shouldShow;
      if (!shouldShow) {
        nextRuntime.evaluating = false;
        this.setRuntimeField(context.fieldName, nextRuntime);
        return;
      }

      if (isFunction(dependencies.componentProps)) {
        nextRuntime.dynamicComponentProps =
          (await (dependencies.componentProps as any)(
            formValues,
            this,
            dependencyContext
          )) ?? {};
        if (!checkVersion()) return;
      }

      if (isFunction(dependencies.rules)) {
        nextRuntime.dynamicRules = await (dependencies.rules as any)(
          formValues,
          this,
          dependencyContext
        );
        if (!checkVersion()) return;
      }

      if (isFunction(dependencies.disabled)) {
        nextRuntime.isDisabled = !!(await (dependencies.disabled as any)(
          formValues,
          this,
          dependencyContext
        ));
        if (!checkVersion()) return;
      } else if (isBoolean(dependencies.disabled)) {
        nextRuntime.isDisabled = dependencies.disabled;
      }

      if (isFunction(dependencies.required)) {
        nextRuntime.isRequired = !!(await (dependencies.required as any)(
          formValues,
          this,
          dependencyContext
        ));
        if (!checkVersion()) return;
      }

      if (isFunction(dependencies.trigger)) {
        await (dependencies.trigger as any)(formValues, this, dependencyContext);
        if (!checkVersion()) return;
      }
    } catch (error) {
      if (checkVersion()) {
        logger.warn(`Dependency evaluation failed for field "${context.fieldName}"`, error);
      }
    } finally {
      if (!checkVersion()) return;
      nextRuntime.evaluating = false;
      this.setRuntimeField(context.fieldName, nextRuntime);
    }
  }

  private async evaluateDependenciesForFields(fieldNames: string[]) {
    if (!fieldNames.length) return;
    const uniqueFields = [...new Set(fieldNames)];
    await Promise.all(
      uniqueFields.map(async (fieldName) => {
        const version = (this.dependencyVersionMap.get(fieldName) ?? 0) + 1;
        this.dependencyVersionMap.set(fieldName, version);
        this.dependencyAbortMap.get(fieldName)?.abort();
        const controller = new AbortController();
        this.dependencyAbortMap.set(fieldName, controller);
        try {
          await this.evaluateDependencyField({
            fieldName,
            version,
            signal: controller.signal,
          });
        } finally {
          if (this.dependencyAbortMap.get(fieldName) === controller) {
            this.dependencyAbortMap.delete(fieldName);
          }
        }
      })
    );
    this.renderCache = [];
    this.updateSnapshot();
  }

  private getComponentPropsTargets(changedFields: string[]) {
    if (!this.syncComponentPropsFields.size) {
      return [] as string[];
    }
    if (!changedFields.length) {
      return [...this.syncComponentPropsFields];
    }
    const changedSet = new Set(changedFields);
    const result: string[] = [];
    for (const fieldName of this.syncComponentPropsFields) {
      const schema = this.getFieldSchema(fieldName);
      if (!schema) continue;
      const triggerFields = schema.dependencies?.triggerFields ?? [];
      if (!triggerFields.length) {
        const trackedDependencies = this.componentPropsDependencyMap.get(fieldName);
        if (pathDependenciesIntersect(changedFields, trackedDependencies)) {
          result.push(fieldName);
        }
        continue;
      }
      if (triggerFields.some((item) => changedSet.has(item))) {
        result.push(fieldName);
      }
    }
    return result;
  }

  private async evaluateComponentPropsField(
    fieldName: string,
    version: number,
    signal: AbortSignal
  ) {
    const schema = this.getFieldSchema(fieldName);
    if (!schema || !isFunction(schema.componentProps)) {
      this.componentPropsDependencyMap.delete(fieldName);
      return;
    }

    const context: FormDependencyContext = {
      fieldName,
      version,
      signal,
    };

    try {
      const hasExplicitTriggerFields =
        (schema.dependencies?.triggerFields?.length ?? 0) > 0;
      const tracker = hasExplicitTriggerFields
        ? null
        : trackValueDependencies(this.form.values);
      const result = await schema.componentProps(
        tracker ? tracker.values : this.form.values,
        this,
        context
      );
      if (signal.aborted) return;
      if ((this.componentPropsVersionMap.get(fieldName) ?? 0) !== version) return;
      if (tracker) {
        this.componentPropsDependencyMap.set(
          fieldName,
          tracker.getDependencies()
        );
      } else {
        this.componentPropsDependencyMap.delete(fieldName);
      }

      const nextComponentProps =
        result && typeof result === 'object'
          ? (result as Record<string, any>)
          : {};
      const runtime = this.runtime[fieldName] ?? { ...DEFAULT_RUNTIME_FIELD_STATE };
      if (deepEqual(runtime.dynamicFieldComponentProps, nextComponentProps)) {
        return;
      }
      this.setRuntimeField(fieldName, {
        ...runtime,
        dynamicFieldComponentProps: nextComponentProps,
      });
    } catch (error) {
      if (!signal.aborted) {
        logger.warn(`Async componentProps evaluation failed for field "${fieldName}"`, error);
      }
    }
  }

  private async evaluateComponentPropsForFields(fieldNames: string[]) {
    if (!fieldNames.length) return;
    const uniqueFields = [...new Set(fieldNames)];
    await Promise.all(
      uniqueFields.map(async (fieldName) => {
        this.componentPropsAbortMap.get(fieldName)?.abort();
        const controller = new AbortController();
        const version = (this.componentPropsVersionMap.get(fieldName) ?? 0) + 1;
        this.componentPropsAbortMap.set(fieldName, controller);
        this.componentPropsVersionMap.set(fieldName, version);
        try {
          await this.evaluateComponentPropsField(
            fieldName,
            version,
            controller.signal
          );
        } finally {
          if (this.componentPropsAbortMap.get(fieldName) === controller) {
            this.componentPropsAbortMap.delete(fieldName);
          }
        }
      })
    );
    this.renderCache = [];
    this.updateSnapshot();
  }

  private async afterValuesChanged(changedFields: string[], shouldValidate = false) {
    if (!changedFields.length) return;
    const targets = this.getDependencyTargets(changedFields);
    const componentPropsTargets = this.getComponentPropsTargets(changedFields);
    const runtimeTask = this.runRuntimeEvaluations(targets, componentPropsTargets);
    const scheduleVersion = ++this.submitOnChangeScheduleVersion;
    this.triggerValuesChange(changedFields);
    if (this.props.submitOnChange) {
      void runtimeTask.then(() => {
        if (scheduleVersion !== this.submitOnChangeScheduleVersion) return;
        this.scheduleSubmitOnChange();
      });
    }
    if (shouldValidate) {
      await runtimeTask;
      await this.validateChangedFields(changedFields);
    }
  }

  private async validateChangedFields(
    fieldNames: string[],
    context?: Omit<FieldValidationContext, 'mutateErrors'>
  ) {
    const uniqueFields = [...new Set(fieldNames)];
    if (!uniqueFields.length) return;
    let nextErrors: Record<string, string> | null = null;
    let changed = false;

    for (const fieldName of uniqueFields) {
      const result = await this.resolveFieldValidation(fieldName, context);
      if (context?.signal?.aborted) {
        return;
      }
      const previousError = (nextErrors ?? this.form.errors)[fieldName];
      const hasPreviousError = previousError !== undefined;
      if (result.hidden || !result.error) {
        if (hasPreviousError) {
          if (!nextErrors) {
            nextErrors = { ...this.form.errors };
          }
          delete nextErrors[fieldName];
          changed = true;
        }
        continue;
      }
      if (previousError !== result.error) {
        if (!nextErrors) {
          nextErrors = { ...this.form.errors };
        }
        nextErrors[fieldName] = result.error;
        changed = true;
      }
    }

    if (changed && nextErrors) {
      this.form.errors = nextErrors;
      this.updateSnapshot();
    }
  }

  async setFieldValue(field: string, value: any, shouldValidate = false) {
    const next = setByPathImmutable(this.form.values, field, value);
    if (!next.changed) return;
    this.form.values = next.value;
    this.updateSnapshot();
    await this.afterValuesChanged([field], shouldValidate);
  }

  async setValues(fields: Record<string, any>, filterFields = true, shouldValidate = false) {
    let nextValues = this.form.values;
    const changedFields: string[] = [];
    const availableFields = new Set((this.props.schema ?? []).map((item) => item.fieldName));

    for (const [fieldName, fieldValue] of Object.entries(fields || {})) {
      if (filterFields && !availableFields.has(fieldName)) continue;
      const result = setByPathImmutable(nextValues, fieldName, fieldValue);
      if (!result.changed) continue;
      nextValues = result.value;
      changedFields.push(fieldName);
    }

    if (!changedFields.length) return;
    this.form.values = nextValues;
    this.updateSnapshot();
    await this.afterValuesChanged(changedFields, shouldValidate);
  }

  async getValues<T = Record<string, any>>() {
    let values = deepClone(this.form.values);
    values = mapArrayStringFields(values, this.props.arrayToStringFields, 'arrayToString');
    values = mapFieldMappingTime(values, this.props.fieldMappingTime);
    return values as T;
  }

  private getRuntimeState(fieldName: string): RuntimeFieldState {
    return this.runtime[fieldName] ?? { ...DEFAULT_RUNTIME_FIELD_STATE };
  }

  private getFieldSchema(fieldName: string): AdminFormSchema | undefined {
    return this.compiledSchema.fieldMap.get(fieldName);
  }

  private isFieldVisible(fieldName: string) {
    const schema = this.getFieldSchema(fieldName);
    if (!schema || schema.hide) return false;
    const runtime = this.getRuntimeState(fieldName);
    return runtime.isIf && runtime.isShow;
  }

  private async validateWithStringRule(
    ruleName: string,
    fieldName: string,
    value: any,
    label: string,
    context?: {
      signal?: AbortSignal;
      version?: number;
    }
  ): Promise<string | undefined> {
    if (context?.signal?.aborted) return undefined;
    if (ruleName === 'required' && isEmptyValue(value)) {
      return resolveRequiredRuleMessage(label);
    }
    if (ruleName === 'selectRequired' && isEmptyValue(value)) {
      return resolveSelectRequiredRuleMessage(label);
    }

    const validator = getRuleValidator(ruleName);
    if (!validator) {
      logger.warn(`Rule "${ruleName}" has not been registered`);
      return undefined;
    }
    const result = await validator(value, undefined, {
      fieldName,
      label,
      signal: context?.signal,
      version: context?.version,
      values: this.form.values,
    });
    if (context?.signal?.aborted) return undefined;
    if (result === true) return undefined;
    if (typeof result === 'string') return result;
    return resolveRequiredRuleMessage(label);
  }

  private async validateWithFunctionRule(
    rule: FormRuleValidator,
    fieldName: string,
    value: any,
    label: string,
    context?: {
      signal?: AbortSignal;
      version?: number;
    }
  ): Promise<string | undefined> {
    if (context?.signal?.aborted) return undefined;
    const result = await rule(value, undefined, {
      fieldName,
      label,
      signal: context?.signal,
      version: context?.version,
      values: this.form.values,
    });
    if (context?.signal?.aborted) return undefined;
    if (result === true) return undefined;
    if (typeof result === 'string') return result;
    return resolveRequiredRuleMessage(label);
  }

  private async resolveFieldValidation(
    fieldName: string,
    context?: Omit<FieldValidationContext, 'mutateErrors'>
  ): Promise<ResolvedFieldValidationResult> {
    if (context?.signal?.aborted) {
      return { hidden: false, valid: false };
    }
    const schema = this.getFieldSchema(fieldName);
    if (!schema) {
      return { hidden: true, valid: true };
    }

    if (!this.isFieldVisible(fieldName)) {
      return { hidden: true, valid: true };
    }

    const runtime = this.getRuntimeState(fieldName);
    const label = (isString(schema.label) ? schema.label : schema.fieldName) || schema.fieldName;
    const value = getByPath(this.form.values, fieldName);
    const rule = runtime.dynamicRules ?? schema.rules ?? (runtime.isRequired ? 'required' : null);
    const isEmpty = isEmptyValue(value);

    let error: string | undefined;

    if (runtime.isRequired && isEmpty) {
      error = resolveRequiredRuleMessage(label);
    } else if (
      isEmpty &&
      (!isString(rule) || (rule !== 'required' && rule !== 'selectRequired'))
    ) {
      // 非必填字段为空时，统一跳过规则校验（必填请显式声明 required/selectRequired 或 dependencies.required）
      error = undefined;
    } else if (isString(rule)) {
      error = await this.validateWithStringRule(rule, fieldName, value, label, context);
    } else if (isFunction(rule)) {
      error = await this.validateWithFunctionRule(
        rule as FormRuleValidator,
        fieldName,
        value,
        label,
        context
      );
    } else if (rule && isZodSchema(rule)) {
      const parsed = await rule.safeParseAsync(value);
      if (context?.signal?.aborted) {
        return { hidden: false, valid: false };
      }
      if (!parsed.success) {
        error = resolveZodIssueMessage({
          issue: parsed.error.issues[0],
          label,
        });
      }
    }

    return {
      hidden: false,
      valid: !error,
      ...(error ? { error } : {}),
    };
  }

  async validateField(
    fieldName: string,
    context?: FieldValidationContext
  ): Promise<FieldValidationResult> {
    const result = await this.resolveFieldValidation(fieldName, context);
    if (context?.signal?.aborted) {
      return { valid: false };
    }

    if (context?.mutateErrors !== false) {
      const previousError = this.form.errors[fieldName];
      if (result.hidden || !result.error) {
        if (previousError !== undefined) {
          const nextErrors = { ...this.form.errors };
          delete nextErrors[fieldName];
          this.form.errors = nextErrors;
          this.updateSnapshot();
        }
      } else if (previousError !== result.error) {
        this.form.errors = {
          ...this.form.errors,
          [fieldName]: result.error,
        };
        this.updateSnapshot();
      }
    }

    return {
      valid: result.valid,
      ...(result.error ? { error: result.error } : {}),
    };
  }

  async validate(): Promise<FormValidationResult> {
    await this.pendingRuntimeEvaluation;
    this.validateVersion += 1;
    const currentVersion = this.validateVersion;
    this.validateController?.abort();
    const controller = new AbortController();
    this.validateController = controller;
    const errors: Record<string, string> = {};
    const schema = this.props.schema ?? [];

    const validationResults = await Promise.all(
      schema.map(async (field) => {
        const result = await this.validateField(field.fieldName, {
          mutateErrors: false,
          signal: controller.signal,
          version: currentVersion,
        });
        return {
          fieldName: field.fieldName,
          result,
        };
      })
    );

    if (controller.signal.aborted || currentVersion !== this.validateVersion) {
      if (this.validateController === controller) {
        this.validateController = null;
      }
      return {
        valid: false,
        errors: this.form.errors,
        values: await this.getValues(),
      };
    }

    for (const item of validationResults) {
      if (!item.result.valid && item.result.error) {
        errors[item.fieldName] = item.result.error;
      }
    }

    const errorsChanged = !deepEqual(this.form.errors, errors);
    if (errorsChanged) {
      this.form.errors = errors;
      this.updateSnapshot();
    }
    if (this.validateController === controller) {
      this.validateController = null;
    }

    const valid = Object.keys(errors).length === 0;
    if (!valid && this.props.scrollToFirstError) {
      this.scrollToFirstError(errors);
    }

    return {
      valid,
      errors,
      values: await this.getValues(),
    };
  }

  async isFieldValid(fieldName: string) {
    const result = await this.validateField(fieldName);
    return result.valid;
  }

  private scrollToFirstError(errors: Record<string, any> | string) {
    if (typeof document === 'undefined') return;
    const firstField = typeof errors === 'string' ? errors : Object.keys(errors)[0];
    if (!firstField) return;
    let target = document.querySelector(`[name="${firstField}"]`) as HTMLElement | null;
    if (!target) {
      const ref = this.getFieldComponentRef(firstField) as any;
      if (ref instanceof HTMLElement) {
        target = ref;
      } else if (ref?.$el instanceof HTMLElement) {
        target = ref.$el;
      }
    }
    if (!target) return;
    target.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest',
    });
  }

  private createSubmitContext(version?: number): FormSubmitContext {
    const nextVersion = version ?? this.submitAttemptVersion + 1;
    this.submitAttemptVersion = nextVersion;
    this.submitController?.abort();
    this.submitController = new AbortController();
    return {
      signal: this.submitController.signal,
      version: nextVersion,
    };
  }

  private isSubmitContextActive(context: FormSubmitContext) {
    return (
      !context.signal.aborted &&
      this.submitAttemptVersion === context.version &&
      this.submitController?.signal === context.signal
    );
  }

  private async runSubmit(
    values: Record<string, any>,
    context: FormSubmitContext
  ): Promise<Record<string, any>> {
    await this.props.handleSubmit?.(deepClone(values), context);
    if (!this.isSubmitContextActive(context)) {
      return values;
    }
    this.setLatestSubmissionValues(values);
    return values;
  }

  async submitForm(event?: Event) {
    event?.preventDefault();
    event?.stopPropagation();
    const values = await this.getValues();
    const context = this.createSubmitContext();
    return this.runSubmit(values, context);
  }

  async validateAndSubmitForm() {
    const context = this.createSubmitContext();
    const result = await this.validate();
    if (!result.valid) return undefined;
    if (!this.isSubmitContextActive(context)) {
      return undefined;
    }
    return this.runSubmit(result.values, context);
  }

  async resetValidate() {
    if (!Object.keys(this.form.errors).length) return;
    this.form.errors = {};
    this.updateSnapshot();
  }

  async resetForm(values?: Partial<Record<string, any>>) {
    const initialValues = buildInitialValues(this.props.schema ?? []);
    const merged = values
      ? mergeWithArrayOverride(values as Record<string, any>, initialValues)
      : initialValues;
    this.form.values = merged;
    this.valuesChangePayloadSourceRef = null;
    this.valuesChangePayloadCache = null;
    this.form.errors = {};
    this.updateSnapshot();
    const allFields = (this.props.schema ?? []).map((item) => item.fieldName);
    await this.runRuntimeEvaluations(allFields, [...this.syncComponentPropsFields]);
    if (this.props.handleReset) {
      const mapped = await this.getValues();
      await this.props.handleReset(mapped, {
        signal: new AbortController().signal,
        version: 0,
      });
    }
  }

  async removeSchemaByFields(fields: string[]) {
    const fieldSet = new Set(fields);
    const schema = (this.props.schema ?? []).filter((item) => !fieldSet.has(item.fieldName));
    this.setState({ schema });
  }

  updateSchema(schema: Partial<AdminFormSchema>[]) {
    const updates = [...schema];
    if (!updates.length) return;
    const hasField = updates.every((item) => item.fieldName && item.fieldName.trim() !== '');
    if (!hasField) {
      logger.error(
        'All items in the schema array must have a valid `fieldName` property to be updated'
      );
      return;
    }
    const current = [...(this.props.schema ?? [])];
    const updatedMap = new Map<string, Partial<AdminFormSchema>>();
    for (const item of updates) {
      if (item.fieldName) updatedMap.set(item.fieldName, item);
    }
    const nextSchema = current.map((item) => {
      const update = updatedMap.get(item.fieldName);
      if (!update) return item;
      return mergeWithArrayOverride(update, item);
    });
    this.setState({ schema: nextSchema });
  }

  setState(
    stateOrFn:
      | ((prev: AdminFormProps) => Partial<AdminFormProps>)
      | Partial<AdminFormProps>
  ) {
    const previousProps = this.props;
    const nextPatch = isFunction(stateOrFn) ? stateOrFn(previousProps) : stateOrFn;
    if (!hasPatchChanges(nextPatch, previousProps)) return;
    const nextProps = mergeWithArrayOverride(nextPatch, previousProps);

    const previousSchema = previousProps.schema ?? [];
    const nextSchema = nextProps.schema ?? [];
    const previousSchemaMap = new Map(
      previousSchema.map((item) => [item.fieldName, item] as const)
    );
    const schemaChanged = Object.prototype.hasOwnProperty.call(nextPatch, 'schema')
      ? !deepEqual(previousSchema, nextSchema)
      : false;
    const prevSchemaFields = new Set(previousSchema.map((item) => item.fieldName));
    const nextSchemaFields = new Set((nextProps.schema ?? []).map((item) => item.fieldName));
    const removedFields = [...prevSchemaFields].filter((field) => !nextSchemaFields.has(field));

    const collapsedChanged = previousProps.collapsed !== nextProps.collapsed;
    this.props = nextProps;
    this.recompileSchema();

    if (removedFields.length) {
      let nextValues = this.form.values;
      const nextErrors = { ...this.form.errors };
      for (const field of removedFields) {
        const result = deleteByPathImmutable(nextValues, field);
        if (result.changed) {
          nextValues = result.value;
        }
        delete nextErrors[field];
      }
      this.form.values = nextValues;
      this.form.errors = nextErrors;
      this.valuesChangePayloadSourceRef = null;
      this.valuesChangePayloadCache = null;
    }

    const defaults = buildInitialValues(nextSchema);
    const defaultChangedFields: string[] = [];
    let nextValues = this.form.values;
    for (const [fieldName, defaultValue] of Object.entries(defaults)) {
      const current = getByPath(nextValues, fieldName);
      if (current === undefined) {
        const result = setByPathImmutable(nextValues, fieldName, defaultValue);
        if (result.changed) {
          defaultChangedFields.push(fieldName);
          nextValues = result.value;
        }
      }
    }
    if (defaultChangedFields.length > 0) {
      this.form.values = nextValues;
      this.valuesChangePayloadSourceRef = null;
      this.valuesChangePayloadCache = null;
    }

    const dependencyTargets = new Set<string>();
    const componentPropsTargets = new Set<string>();
    if (schemaChanged) {
      for (const field of nextSchema) {
        const previous = previousSchemaMap.get(field.fieldName);
        if (!previous || !deepEqual(previous, field)) {
          dependencyTargets.add(field.fieldName);
          this.componentPropsDependencyMap.delete(field.fieldName);
          if (this.syncComponentPropsFields.has(field.fieldName)) {
            componentPropsTargets.add(field.fieldName);
          }
        }
      }
    }
    if (defaultChangedFields.length > 0) {
      for (const fieldName of this.getDependencyTargets(defaultChangedFields)) {
        dependencyTargets.add(fieldName);
      }
      for (const fieldName of this.getComponentPropsTargets(defaultChangedFields)) {
        componentPropsTargets.add(fieldName);
      }
    }

    this.renderCache = [];
    this.updateSnapshot();
    if (
      collapsedChanged &&
      this.props.collapseTriggerResize &&
      typeof window !== 'undefined' &&
      typeof window.dispatchEvent === 'function'
    ) {
      window.dispatchEvent(new Event('resize'));
    }
    if (collapsedChanged && this.props.handleCollapsedChange) {
      this.props.handleCollapsedChange(!!this.props.collapsed);
    }
    if (dependencyTargets.size || componentPropsTargets.size) {
      void this.runRuntimeEvaluations(
        [...dependencyTargets],
        [...componentPropsTargets]
      );
    }
  }

  private buildRenderFields() {
    if (this.renderCache.length > 0) {
      return this.renderCache;
    }
    const schema = this.props.schema ?? [];
    const commonConfig = {
      ...(this.props.commonConfig ?? {}),
      ...pickDefined({
        colon: this.props.colon,
        controlClass: this.props.controlClass,
        disabled: this.props.disabled,
        disabledOnChangeListener: this.props.disabledOnChangeListener,
        disabledOnInputListener: this.props.disabledOnInputListener,
        emptyStateValue: this.props.emptyStateValue,
        formFieldProps: this.props.formFieldProps,
        formItemClass: this.props.formItemClass,
        hideLabel: this.props.hideLabel,
        hideRequiredMark: this.props.hideRequiredMark,
        requiredMarkFollowTheme: this.props.requiredMarkFollowTheme,
        labelAlign: this.props.labelAlign,
        labelClass: this.props.labelClass,
        labelWidth: this.props.labelWidth,
        modelPropName: this.props.modelPropName,
        wrapperClass: this.props.wrapperClass,
      }),
    };
    const commonComponentProps = this.resolveCommonComponentProps();
    const keepIndex = computeCollapseKeepIndex(this.props);

    this.renderCache = schema.map((field, index) => {
      const runtime = this.getRuntimeState(field.fieldName);
      const fieldComponentProps = isFunction(field.componentProps)
        ? runtime.dynamicFieldComponentProps
        : (field.componentProps ?? {});

      return {
        ...commonConfig,
        ...field,
        rules: runtime.dynamicRules ?? field.rules,
        hiddenByCollapse:
          this.props.showCollapseButton && !!this.props.collapsed
            ? index > keepIndex
            : false,
        commonComponentProps,
        runtime,
        componentProps: {
          ...fieldComponentProps,
          ...runtime.dynamicComponentProps,
        },
      } as RenderFieldItem;
    });

    return this.renderCache;
  }

  getRenderState() {
    return {
      collapsed: !!this.props.collapsed,
      fields: this.buildRenderFields(),
    };
  }

  merge(formApi: AdminFormApi) {
    const chain: AdminFormApi[] = [this, formApi];
    const proxy = new Proxy(formApi as AdminFormApi & {
      merge(nextFormApi: AdminFormApi): any;
      submitAllForm(needMerge?: boolean): Promise<Record<string, any> | Record<string, any>[] | undefined>;
    }, {
      get: (target, prop) => {
        if (prop === 'merge') {
          return (nextFormApi: AdminFormApi) => {
            chain.push(nextFormApi);
            return proxy;
          };
        }
        if (prop === 'submitAllForm') {
          return async (needMerge = true) => {
            const results = await Promise.all(
              chain.map(async (api) => {
                const validation = await api.validate();
                if (!validation.valid) return undefined;
                return api.getValues();
              })
            );
            const filtered = results.filter(Boolean) as Record<string, any>[];
            if (needMerge) {
              return Object.assign({}, ...filtered);
            }
            return filtered;
          };
        }
        return (target as any)[prop];
      },
    });
    return proxy;
  }
}

export function createFormApi(options: AdminFormProps = {}): AdminFormApi {
  return new AdminFormApiImpl(options);
}

export function registerFormRules(rules: RegisterFormRulesOptions) {
  registerRules(rules);
}
