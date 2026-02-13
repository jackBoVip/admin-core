import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { setupAdminFormCore } from '../config';
import { createFormApi, registerFormRules } from '../form-api';
import { createRangeRule } from '../utils/range-rule';

describe('form api', () => {
  it('should initialize and validate required field', async () => {
    setupAdminFormCore({ locale: 'en-US' });
    const api = createFormApi({
      schema: [
        {
          fieldName: 'username',
          component: 'input',
          label: 'Username',
          rules: 'required',
        },
      ],
    });

    const invalid = await api.validate();
    expect(invalid.valid).toBe(false);
    expect(invalid.errors.username).toContain('Username');

    await api.setFieldValue('username', 'admin');
    const valid = await api.validate();
    expect(valid.valid).toBe(true);
  });

  it('should support zod rule and infer default value', async () => {
    const api = createFormApi({
      schema: [
        {
          fieldName: 'name',
          component: 'input',
          rules: z.string().default('guest'),
        },
      ],
    });

    const values = await api.getValues();
    expect(values.name).toBe('guest');
  });

  it('should apply top-level common props as global field defaults', async () => {
    const api = createFormApi({
      disabled: true,
      hideLabel: true,
      labelAlign: 'left',
      labelWidth: 168,
      schema: [
        {
          component: 'input',
          fieldName: 'name',
          label: 'Name',
        },
      ],
    });
    const field = api.getRenderState().fields[0];
    expect(field?.disabled).toBe(true);
    expect(field?.hideLabel).toBe(true);
    expect(field?.labelAlign).toBe('left');
    expect(field?.labelWidth).toBe(168);
  });

  it('should only validate changed field on setFieldValue when shouldValidate is true', async () => {
    const api = createFormApi({
      schema: [
        {
          fieldName: 'name',
          component: 'input',
          label: 'Name',
          rules: 'required',
        },
        {
          fieldName: 'email',
          component: 'input',
          label: 'Email',
          rules: 'required',
        },
      ],
    });

    await api.setFieldValue('name', '', true);
    const errors = api.getSnapshot().errors;
    expect(errors.name).toContain('Name');
    expect(errors.email).toBeUndefined();
  });

  it('validate should batch error updates into one notification', async () => {
    const api = createFormApi({
      schema: [
        { fieldName: 'name', component: 'input', label: 'Name', rules: 'required' },
        { fieldName: 'email', component: 'input', label: 'Email', rules: 'required' },
      ],
    });
    let notifyCount = 0;
    const unsubscribe = api.store.subscribeSelector(
      (snapshot) => snapshot.errors,
      () => {
        notifyCount += 1;
      }
    );

    await api.validate();
    await Promise.resolve();
    unsubscribe();
    expect(notifyCount).toBe(1);
  });

  it('should trigger dependencies only for affected fields', async () => {
    const dependencySpy = vi.fn((values: Record<string, any>) => {
      return !!values.controller;
    });
    const api = createFormApi({
      schema: [
        {
          fieldName: 'controller',
          component: 'input',
        },
        {
          fieldName: 'target',
          component: 'input',
          dependencies: {
            triggerFields: ['controller'],
            required: dependencySpy,
          },
        },
      ],
    });

    dependencySpy.mockClear();
    await api.setFieldValue('controller', 'yes');
    expect(dependencySpy).toHaveBeenCalledTimes(1);
  });

  it('should keep only latest async dependency result', async () => {
    let resolveFirst: ((value: Record<string, any>) => void) | null = null;
    let resolveSecond: ((value: Record<string, any>) => void) | null = null;

    const api = createFormApi({
      schema: [
        { fieldName: 'controller', component: 'input' },
        {
          fieldName: 'target',
          component: 'input',
          dependencies: {
            triggerFields: ['controller'],
            componentProps: () =>
              new Promise((resolve) => {
                if (!resolveFirst) {
                  resolveFirst = resolve;
                } else {
                  resolveSecond = resolve;
                }
              }),
          },
        },
      ],
    });

    await api.setFieldValue('controller', 'a');
    await api.setFieldValue('controller', 'b');
    resolveFirst?.({ placeholder: 'stale' });
    resolveSecond?.({ placeholder: 'latest' });
    await Promise.resolve();
    await Promise.resolve();

    const render = api.getRenderState();
    const field = render.fields.find((item) => item.fieldName === 'target');
    expect((field?.componentProps as Record<string, any>).placeholder).toBe('latest');
  });

  it('should map array/string and time fields when reading values', async () => {
    const api = createFormApi({
      arrayToStringFields: ['tags', ';'],
      fieldMappingTime: [['range', ['start', 'end'], null]],
      schema: [
        { fieldName: 'tags', component: 'input' },
        { fieldName: 'range', component: 'date-range' },
      ],
    });

    await api.setValues({
      tags: ['a', 'b'],
      range: ['2025-01-01', '2025-01-02'],
    });

    const values = await api.getValues();
    expect(values.tags).toBe('a;b');
    expect(values.start).toBe('2025-01-01');
    expect(values.end).toBe('2025-01-02');
    expect(values.range).toBeUndefined();
  });

  it('should format fieldMappingTime with string or tuple formatter', async () => {
    const api = createFormApi({
      fieldMappingTime: [
        ['rangeA', ['startA', 'endA'], 'YYYY-MM-DD'],
        ['rangeB', ['startB', 'endB'], ['YYYY/MM/DD', 'HH:mm']],
      ],
      schema: [
        { fieldName: 'rangeA', component: 'date-range' },
        { fieldName: 'rangeB', component: 'date-range' },
      ],
    });

    await api.setValues({
      rangeA: [
        { format: (pattern: string) => `A1:${pattern}` },
        { format: (pattern: string) => `A2:${pattern}` },
      ],
      rangeB: [
        { format: (pattern: string) => `B1:${pattern}` },
        { format: (pattern: string) => `B2:${pattern}` },
      ],
    });

    const values = await api.getValues();
    expect(values.startA).toBe('A1:YYYY-MM-DD');
    expect(values.endA).toBe('A2:YYYY-MM-DD');
    expect(values.startB).toBe('B1:YYYY/MM/DD');
    expect(values.endB).toBe('B2:HH:mm');
  });

  it('should update schema and remove deleted fields', async () => {
    const api = createFormApi({
      schema: [
        { fieldName: 'a', component: 'input' },
        { fieldName: 'b', component: 'input' },
      ],
    });

    await api.setValues({ a: '1', b: '2' });
    await api.removeSchemaByFields(['b']);
    const values = await api.getValues();
    expect(values.a).toBe('1');
    expect(values.b).toBeUndefined();
  });

  it('should support custom rule registration', async () => {
    registerFormRules({
      mustBeAdmin: (value) => (value === 'admin' ? true : 'must be admin'),
    });
    const api = createFormApi({
      schema: [
        {
          fieldName: 'username',
          component: 'input',
          rules: 'mustBeAdmin',
        },
      ],
    });
    await api.setFieldValue('username', 'guest');
    const invalid = await api.validate();
    expect(invalid.errors.username).toBe('must be admin');
  });

  it('should support inline function rules and generic range component', async () => {
    const api = createFormApi({
      schema: [
        {
          component: 'range',
          fieldName: 'amountRange',
          label: '金额区间',
          rules: createRangeRule({
            message: '金额区间必须从小到大',
            normalize(value) {
              return Number(value);
            },
          }),
        },
      ],
    });

    const emptyResult = await api.validate();
    expect(emptyResult.valid).toBe(true);

    await api.setFieldValue('amountRange', ['99', '10']);
    const invalid = await api.validate();
    expect(invalid.valid).toBe(false);
    expect(invalid.errors.amountRange).toBe('金额区间必须从小到大');

    await api.setFieldValue('amountRange', ['10', '99']);
    const valid = await api.validate();
    expect(valid.valid).toBe(true);
  });

  it('should skip custom string rule when optional field is empty', async () => {
    registerFormRules({
      optionalSlug: (value) =>
        String(value || '').startsWith('slug-') ? true : 'slug 格式不正确',
    });
    const api = createFormApi({
      schema: [
        {
          fieldName: 'slug',
          component: 'input',
          rules: 'optionalSlug',
        },
      ],
    });

    const emptyResult = await api.validate();
    expect(emptyResult.valid).toBe(true);

    await api.setFieldValue('slug', 'abc');
    const invalid = await api.validate();
    expect(invalid.valid).toBe(false);
    expect(invalid.errors.slug).toBe('slug 格式不正确');
  });

  it('should skip static zod rule when field is optional and empty', async () => {
    const api = createFormApi({
      schema: [
        {
          component: 'input',
          fieldName: 'email',
          rules: z.string().email('邮箱格式不正确'),
        },
      ],
    });

    const emptyResult = await api.validate();
    expect(emptyResult.valid).toBe(true);
    expect(emptyResult.errors.email).toBeUndefined();

    await api.setFieldValue('email', 'invalid-email');
    const invalid = await api.validate();
    expect(invalid.valid).toBe(false);
    expect(invalid.errors.email).toBe('邮箱格式不正确');
  });

  it('should skip dynamic zod rule when field is optional and empty', async () => {
    const api = createFormApi({
      schema: [
        {
          component: 'input',
          fieldName: 'password',
        },
        {
          component: 'password',
          dependencies: {
            rules(values) {
              return z
                .string()
                .min(1, '请再次输入密码')
                .refine((val) => val === values.password, '两次密码不一致');
            },
            triggerFields: ['password'],
          },
          fieldName: 'confirmPassword',
        },
      ],
    });

    await api.setFieldValue('password', 'Abc123!@#');
    const emptyResult = await api.validate();
    expect(emptyResult.valid).toBe(true);
    expect(emptyResult.errors.confirmPassword).toBeUndefined();

    await api.setFieldValue('confirmPassword', 'wrong');
    const invalid = await api.validate();
    expect(invalid.valid).toBe(false);
    expect(invalid.errors.confirmPassword).toBe('两次密码不一致');
  });

  it('should keep latest async field componentProps result', async () => {
    vi.useFakeTimers();
    try {
      const api = createFormApi({
        schema: [
          { fieldName: 'controller', component: 'input' },
          {
            fieldName: 'target',
            component: 'input',
            componentProps: async (values, _formApi, context) => {
              const current = values.controller;
              await new Promise((resolve) => {
                setTimeout(resolve, current === 'a' ? 30 : 10);
              });
              if (context?.signal.aborted) {
                return {};
              }
              return {
                placeholder: current ? String(current) : '',
              };
            },
          },
        ],
      });

      await Promise.all([
        api.setFieldValue('controller', 'a'),
        api.setFieldValue('controller', 'b'),
      ]);

      await vi.runAllTimersAsync();
      await Promise.resolve();

      const render = api.getRenderState();
      const field = render.fields.find((item) => item.fieldName === 'target');
      expect((field?.componentProps as Record<string, any>).placeholder).toBe('b');
    } finally {
      vi.useRealTimers();
    }
  });

  it('should ignore stale submit result from earlier attempt', async () => {
    let resolveFirst: ((value: void) => void) | null = null;
    let resolveSecond: ((value: void) => void) | null = null;
    const submitSpy = vi.fn((_values, ctx?: { version?: number }) => {
      return new Promise<void>((resolve) => {
        if (ctx?.version === 1) {
          resolveFirst = resolve;
          return;
        }
        resolveSecond = resolve;
      });
    });

    const api = createFormApi({
      handleSubmit: submitSpy,
      schema: [{ fieldName: 'name', component: 'input' }],
    });

    await api.setFieldValue('name', 'first');
    const first = api.submitForm();

    await api.setFieldValue('name', 'second');
    const second = api.submitForm();

    await Promise.resolve();
    await Promise.resolve();

    expect(resolveFirst).toBeTypeOf('function');
    expect(resolveSecond).toBeTypeOf('function');

    resolveSecond?.();
    await second;
    resolveFirst?.();
    await first;

    const latest = api.getLatestSubmissionValues();
    expect(latest.name).toBe('second');
    expect(submitSpy).toHaveBeenCalledTimes(2);
  });

  it('validate should wait for pending async dependency evaluation', async () => {
    vi.useFakeTimers();
    try {
      const api = createFormApi({
        schema: [
          { fieldName: 'controller', component: 'input', defaultValue: 'x' },
          {
            fieldName: 'target',
            component: 'input',
            label: 'Target',
            dependencies: {
              triggerFields: ['controller'],
              required: async (values) => {
                await new Promise((resolve) => setTimeout(resolve, 60));
                return values.controller === 'x';
              },
            },
          },
        ],
      });

      const pending = api.validate();
      let settled = false;
      void pending.then(() => {
        settled = true;
      });

      await Promise.resolve();
      expect(settled).toBe(false);

      await vi.advanceTimersByTimeAsync(80);
      const result = await pending;
      expect(result.valid).toBe(false);
      expect(result.errors.target).toContain('Target');
    } finally {
      vi.useRealTimers();
    }
  });

  it('submitOnChange should run after dependency evaluation settles', async () => {
    vi.useFakeTimers();
    try {
      const submitSpy = vi.fn();
      const api = createFormApi({
        submitOnChange: true,
        handleSubmit: submitSpy,
        schema: [
          { fieldName: 'controller', component: 'input' },
          {
            fieldName: 'target',
            component: 'input',
            label: 'Target',
            dependencies: {
              triggerFields: ['controller'],
              required: async (values) => {
                await new Promise((resolve) => setTimeout(resolve, 200));
                return values.controller === 'x';
              },
            },
          },
        ],
      });

      await api.setFieldValue('controller', 'x');
      await vi.advanceTimersByTimeAsync(350);
      expect(submitSpy).toHaveBeenCalledTimes(0);

      await vi.advanceTimersByTimeAsync(300);
      expect(submitSpy).toHaveBeenCalledTimes(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('scrollToFirstError should fallback to registered field component ref', async () => {
    const originalDocument = (globalThis as any).document;
    const originalHTMLElement = (globalThis as any).HTMLElement;
    const querySelector = vi.fn(() => null);
    const scrollIntoView = vi.fn();

    class FakeElement {
      scrollIntoView = scrollIntoView;
    }

    (globalThis as any).HTMLElement = FakeElement;
    (globalThis as any).document = {
      querySelector,
    };

    try {
      const api = createFormApi({
        scrollToFirstError: true,
        schema: [{ fieldName: 'name', component: 'input', rules: 'required' }],
      });
      api.registerFieldComponentRef('name', new FakeElement() as unknown as HTMLElement);
      const result = await api.validate();
      expect(result.valid).toBe(false);
      expect(querySelector).toHaveBeenCalledWith('[name="name"]');
      expect(scrollIntoView).toHaveBeenCalledTimes(1);
    } finally {
      (globalThis as any).document = originalDocument;
      (globalThis as any).HTMLElement = originalHTMLElement;
    }
  });

  it('should dispatch resize event when collapsed changes and collapseTriggerResize is enabled', () => {
    const originalWindow = (globalThis as any).window;
    const originalEvent = (globalThis as any).Event;
    const dispatchEvent = vi.fn();

    class FakeEvent {
      type: string;
      constructor(type: string) {
        this.type = type;
      }
    }

    (globalThis as any).window = {
      dispatchEvent,
    };
    (globalThis as any).Event = FakeEvent;

    try {
      const api = createFormApi({
        collapseTriggerResize: true,
        schema: [{ fieldName: 'name', component: 'input' }],
      });
      api.setState({ collapsed: true });
      expect(dispatchEvent).toHaveBeenCalledTimes(1);
    } finally {
      (globalThis as any).window = originalWindow;
      (globalThis as any).Event = originalEvent;
    }
  });

  it('setState should not trigger dependency reevaluation for unrelated props', async () => {
    const dependencySpy = vi.fn((values: Record<string, any>) => !!values.controller);
    const api = createFormApi({
      schema: [
        { fieldName: 'controller', component: 'input' },
        {
          fieldName: 'target',
          component: 'input',
          dependencies: {
            triggerFields: ['controller'],
            required: dependencySpy,
          },
        },
      ],
    });

    await Promise.resolve();
    await Promise.resolve();
    dependencySpy.mockClear();

    api.setState({ collapsed: true });
    await Promise.resolve();
    await Promise.resolve();

    expect(dependencySpy).toHaveBeenCalledTimes(0);
  });

  it('should keep render fields cache when value change does not affect runtime graph', async () => {
    const api = createFormApi({
      schema: [{ fieldName: 'name', component: 'input' }],
    });
    await Promise.resolve();
    await Promise.resolve();
    const before = api.getRenderState().fields;
    expect(api.getRenderState().fields).toBe(before);
    await api.setFieldValue('name', 'alice');
    await Promise.resolve();
    const after = api.getRenderState().fields;
    expect(api.getRenderState().fields).toBe(after);
  });

  it('should rebuild render fields cache when value change affects dependencies', async () => {
    const api = createFormApi({
      schema: [
        { fieldName: 'controller', component: 'input' },
        {
          fieldName: 'target',
          component: 'input',
          dependencies: {
            triggerFields: ['controller'],
            required: (values) => !!values.controller,
          },
        },
      ],
    });
    await Promise.resolve();
    const before = api.getRenderState().fields;
    await api.setFieldValue('controller', 'x');
    await Promise.resolve();
    await Promise.resolve();
    const after = api.getRenderState().fields;
    expect(after).not.toBe(before);
  });

  it('should update runtime snapshot reference when dependency state changes', async () => {
    const api = createFormApi({
      schema: [
        { fieldName: 'controller', component: 'input' },
        {
          fieldName: 'target',
          component: 'input',
          dependencies: {
            triggerFields: ['controller'],
            show(values) {
              return values.controller === 'x';
            },
          },
        },
      ],
    });

    await api.setFieldValue('controller', '', true);
    const beforeRuntime = api.getSnapshot().runtime;
    expect(beforeRuntime.target?.isShow).toBe(false);

    await api.setFieldValue('controller', 'x', true);
    const afterRuntime = api.getSnapshot().runtime;

    expect(afterRuntime).not.toBe(beforeRuntime);
    expect(afterRuntime.target?.isShow).toBe(true);
  });

  it('handleValuesChange payload should keep unchanged branches stable', async () => {
    const payloads: Record<string, any>[] = [];
    const api = createFormApi({
      handleValuesChange(values) {
        payloads.push(values);
      },
      schema: [
        { fieldName: 'base.name', component: 'input' },
        { fieldName: 'base.code', component: 'input' },
      ],
    });

    await api.setValues({
      'base.name': 'n1',
      'base.code': 'c1',
    });
    await api.setFieldValue('base.name', 'n2');

    expect(payloads.length).toBe(2);
    expect(payloads[1].base.code).toBe('c1');
    expect(payloads[1].base).not.toBe(payloads[0].base);
  });

  it('componentProps without explicit triggerFields should track accessed dependencies', async () => {
    const componentPropsSpy = vi.fn((values: Record<string, any>) => ({
      placeholder: values.controller ? 'has-controller' : 'empty',
    }));
    const api = createFormApi({
      schema: [
        { fieldName: 'controller', component: 'input' },
        { fieldName: 'other', component: 'input' },
        {
          fieldName: 'target',
          component: 'input',
          componentProps: componentPropsSpy,
        },
      ],
    });

    await Promise.resolve();
    await Promise.resolve();
    componentPropsSpy.mockClear();

    await api.setFieldValue('other', 'x');
    await Promise.resolve();
    await Promise.resolve();
    expect(componentPropsSpy).toHaveBeenCalledTimes(0);

    await api.setFieldValue('controller', 'on');
    await Promise.resolve();
    await Promise.resolve();
    expect(componentPropsSpy).toHaveBeenCalledTimes(1);
  });
});
