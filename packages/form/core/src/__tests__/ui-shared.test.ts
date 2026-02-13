import { describe, expect, it } from 'vitest';
import {
  buildFormActionButtonClass,
  buildFieldComponentBaseProps,
  buildComponentStateAttrs,
  buildControlStateAttrs,
  handleFormActionItemClick,
  isFieldHiddenByState,
  resolveFormActionRenderItems,
  resolveRenderedComponentContent,
  resolveFieldComponentBinding,
  resolveFieldRuntimeContext,
  resolveFormActionPlan,
  splitRenderedComponentContent,
} from '../utils/ui-shared';

describe('ui shared utils', () => {
  const messages = {
    collapse: 'Collapse',
    expand: 'Expand',
    reset: 'Reset',
    submit: 'Submit',
  };

  it('should return null when default actions are disabled', () => {
    expect(
      resolveFormActionPlan({
        messages,
        showDefaultActions: false,
      })
    ).toBeNull();
  });

  it('should resolve reset/submit order and collapse label', () => {
    const plan = resolveFormActionPlan({
      actionButtonsReverse: true,
      collapsed: true,
      messages,
      showCollapseButton: true,
    });
    expect(plan?.buttons.map((button) => button.key)).toEqual(['submit', 'reset']);
    expect(plan?.collapse?.label).toBe('Expand');
  });

  it('should skip hidden action buttons', () => {
    const plan = resolveFormActionPlan({
      messages,
      resetButtonOptions: {
        show: false,
      },
      submitButtonOptions: {
        content: 'Save',
      },
    });
    expect(plan?.buttons.map((button) => button.key)).toEqual(['submit']);
    expect(plan?.buttons[0]?.label).toBe('Save');
  });

  it('should resolve field runtime context with shared defaults', () => {
    const context = resolveFieldRuntimeContext({
      field: {
        component: 'input',
        fieldName: 'username',
        label: 'Username',
        rules: [{ required: true }],
        runtime: { isDisabled: false, isIf: true, isRequired: false, isShow: true },
      } as any,
      frameworkDefaultModelPropName: 'value',
      modelValue: undefined,
      resolvedModelPropName: 'value',
      runtimeProps: {
        commonConfig: {
          emptyStateValue: '',
          formFieldProps: { validateOnModelUpdate: true },
          labelAlign: 'right',
          labelWidth: 120,
        },
      },
    });
    expect(context.fieldModelPropName).toBe('value');
    expect(context.displayModelValue).toBe('');
    expect(context.validateOnChange).toBe(true);
    expect(context.validateOnInput).toBe(true);
    expect(context.labelAlign).toBe('right');
    expect(context.labelWidth).toBe(120);
  });

  it('should default label alignment to right', () => {
    const context = resolveFieldRuntimeContext({
      field: {
        component: 'input',
        fieldName: 'tenantCode',
        runtime: { isDisabled: false, isIf: true, isRequired: false, isShow: true },
      } as any,
      frameworkDefaultModelPropName: 'value',
      modelValue: '',
      resolvedModelPropName: 'value',
      runtimeProps: {},
    });
    expect(context.labelAlign).toBe('right');
  });

  it('should build control/component state attrs', () => {
    expect(buildControlStateAttrs('error')).toEqual({
      'data-admin-invalid': 'true',
      'data-admin-status': 'error',
    });
    expect(buildComponentStateAttrs('warning')).toEqual({
      'aria-invalid': false,
      'data-admin-invalid': undefined,
      'data-admin-status': 'warning',
    });
    expect(buildControlStateAttrs(undefined)).toEqual({});
    expect(buildComponentStateAttrs(undefined)).toEqual({});
  });

  it('should resolve field binding with cache', () => {
    const cache = new Map<string, any>();
    const registry = {
      getActiveLibrary: () => 'auto',
      resolveComponent: ({ key }: { key: string }) =>
        key === 'input' ? ({ component: 'input-comp', source: 'native' } as any) : null,
    };
    const first = resolveFieldComponentBinding({
      cache,
      field: { component: 'input', modelPropName: undefined } as any,
      globalModelPropName: 'modelValue',
      registry,
    });
    expect(first.key).toBe('input');
    expect(first.resolved?.component).toBe('input-comp');

    const second = resolveFieldComponentBinding({
      cache,
      field: { component: 'input', modelPropName: undefined } as any,
      globalModelPropName: 'modelValue',
      registry,
    });
    expect(second.resolved?.component).toBe('input-comp');
    expect(cache.size).toBe(1);
  });

  it('should resolve hidden state and base field component props', () => {
    expect(
      isFieldHiddenByState({
        hide: false,
        runtime: { isIf: true, isShow: true },
      } as any)
    ).toBe(false);
    expect(
      isFieldHiddenByState({
        hide: true,
        runtime: { isIf: true, isShow: true },
      } as any)
    ).toBe(true);

    const base = buildFieldComponentBaseProps({
      disabled: true,
      displayModelValue: 'admin',
      field: { commonComponentProps: { clearable: true }, fieldName: 'name' } as any,
      modelPropName: 'modelValue',
      rawFieldProps: { placeholder: 'Input' },
      resolvedStatus: 'error',
    });
    expect(base).toMatchObject({
      disabled: true,
      modelValue: 'admin',
      name: 'name',
      placeholder: 'Input',
      'aria-invalid': true,
      'data-admin-invalid': 'true',
      'data-admin-status': 'error',
      clearable: true,
    });
  });

  it('should resolve and split rendered component content', () => {
    const content = resolveRenderedComponentContent({
      api: {} as any,
      field: {
        renderComponentContent: (values: Record<string, any>) => ({
          default: () => `Hello ${values.name}`,
          suffix: 'world',
        }),
      } as any,
      values: { name: 'Admin' },
    });
    expect(content).toEqual({
      default: 'Hello Admin',
      suffix: 'world',
    });
    const split = splitRenderedComponentContent(content);
    expect(split.defaultContent).toBe('Hello Admin');
    expect(split.renderComponentProps).toEqual({
      suffix: 'world',
    });
  });

  it('should resolve action render items and handle clicks', async () => {
    const plan = resolveFormActionPlan({
      messages: {
        collapse: 'Collapse',
        expand: 'Expand',
        reset: 'Reset',
        submit: 'Submit',
      },
      showCollapseButton: true,
    });
    const items = resolveFormActionRenderItems(plan);
    expect(items.map((item) => item.actionKey)).toEqual([
      'reset',
      'submit',
      'collapse',
    ]);
    expect(buildFormActionButtonClass({ variant: 'default' })).toContain(
      'admin-form__button'
    );
    expect(buildFormActionButtonClass({ variant: 'collapse' })).toBe(
      'admin-form__collapse-trigger'
    );

    const called: string[] = [];
    await handleFormActionItemClick(
      items[0]!,
      {
        preventDefault: () => {
          called.push('prevent');
        },
      },
      {
        onCollapse: () => {
          called.push('collapse');
        },
        onReset: () => {
          called.push('reset');
        },
        onSubmit: () => {
          called.push('submit');
        },
      }
    );
    await handleFormActionItemClick(
      items[2]!,
      {
        preventDefault: () => {
          called.push('prevent-collapse');
        },
      },
      {
        onCollapse: () => {
          called.push('collapse');
        },
        onReset: () => {
          called.push('reset');
        },
        onSubmit: () => {
          called.push('submit');
        },
      }
    );
    expect(called).toEqual(['prevent', 'reset', 'prevent-collapse', 'collapse']);
  });
});
