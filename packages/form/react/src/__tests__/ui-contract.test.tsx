
import { createFormApi, setLocale } from '@admin-core/form-core';
import { act, create } from 'react-test-renderer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminForm } from '../components/AdminForm';
import { AdminSearchForm } from '../components/AdminSearchForm';
import { setupAdminFormReact } from '../registry';
import type { ReactElement } from 'react';
import type { ReactTestRenderer } from 'react-test-renderer';
import { useState } from 'react';

const mountedRenderers = new Set<ReactTestRenderer>();

async function mountForm(element: ReactElement) {
  let renderer: ReactTestRenderer | null = null;
  await act(async () => {
    renderer = create(element);
  });
  if (!renderer) {
    throw new Error('renderer not created');
  }
  mountedRenderers.add(renderer);
  return renderer;
}

describe('react ui contract', () => {
  beforeEach(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    setLocale('zh-CN');
    setupAdminFormReact({
      library: 'native-test',
      libraries: {
        'native-test': {
          capabilities: {},
          components: {},
        },
      },
    });
  });

  afterEach(async () => {
    await act(async () => {
      mountedRenderers.forEach((renderer) => {
        renderer.unmount();
      });
    });
    mountedRenderers.clear();
  });

  it('input should sync value to api through change event', async () => {
    const schema = [{ fieldName: 'name', component: 'input' as const }];
    const api = createFormApi({ schema });
    const renderer = await mountForm(
      <AdminForm formApi={api} schema={schema} showDefaultActions={false} />
    );

    const input = renderer.root.findByType('input');
    await act(async () => {
      input.props.onChange({ target: { value: 'alice' } });
    });

    const values = await api.getValues();
    expect(values.name).toBe('alice');
  });

  it('switch should sync checked state to api', async () => {
    const schema = [{ fieldName: 'enabled', component: 'switch' as const }];
    const api = createFormApi({ schema });
    const renderer = await mountForm(
      <AdminForm formApi={api} schema={schema} showDefaultActions={false} />
    );

    const checkbox = renderer.root.findByProps({ type: 'checkbox' });
    await act(async () => {
      checkbox.props.onChange({ target: { checked: true } });
    });

    const values = await api.getValues();
    expect(values.enabled).toBe(true);
  });

  it('should support data-driven values and onValuesChange', async () => {
    const schema = [{ fieldName: 'name', component: 'input' as const }];
    const onValuesChange = vi.fn();
    const renderer = await mountForm(
      <AdminForm
        schema={schema}
        showDefaultActions={false}
        values={{ name: 'init' }}
        onValuesChange={onValuesChange}
      />
    );

    const input = renderer.root.findByType('input');
    expect(input.props.value).toBe('init');

    await act(async () => {
      input.props.onChange({ target: { value: 'alice' } });
    });

    expect(onValuesChange).toHaveBeenCalled();
    const latest = onValuesChange.mock.calls.at(-1)?.[0];
    expect(latest?.name).toBe('alice');

    await act(async () => {
      renderer.update(
        <AdminForm
          schema={schema}
          showDefaultActions={false}
          values={{ name: 'bob' }}
          onValuesChange={onValuesChange}
        />
      );
      await Promise.resolve();
    });

    const updatedInput = renderer.root.findByType('input');
    expect(updatedInput.props.value).toBe('bob');
  });

  it('should not pass vue update event props to react components', async () => {
    let receivedProps: Record<string, any> | null = null;
    const ProbeInput = (props: Record<string, any>) => {
      receivedProps = props;
      return <input value={props.value ?? ''} onChange={props.onChange} />;
    };

    setupAdminFormReact({
      library: 'probe',
      libraries: {
        probe: {
          capabilities: {},
          components: {
            input: ProbeInput,
          },
        },
      },
    });

    const schema = [{ fieldName: 'name', component: 'input' as const }];
    const api = createFormApi({ schema });
    await mountForm(<AdminForm formApi={api} schema={schema} showDefaultActions={false} />);

    expect(receivedProps).toBeTruthy();
    expect(receivedProps).toHaveProperty('value');
    expect(receivedProps?.modelValue).toBeUndefined();
    expect(receivedProps?.['onUpdate:value']).toBeUndefined();
    expect(receivedProps?.['onUpdate:modelValue']).toBeUndefined();
    expect(receivedProps?.['onUpdate:checked']).toBeUndefined();
  });

  it('should strip vue model props for switch components in react', async () => {
    let receivedProps: Record<string, any> | null = null;
    const ProbeSwitch = (props: Record<string, any>) => {
      receivedProps = props;
      return <input type="checkbox" checked={!!props.checked} onChange={props.onChange} />;
    };

    setupAdminFormReact({
      library: 'probe-switch',
      libraries: {
        'probe-switch': {
          capabilities: {},
          components: {
            switch: ProbeSwitch,
          },
        },
      },
    });

    const schema = [
      {
        fieldName: 'enabled',
        component: 'switch' as const,
        componentProps: {
          modelValue: true,
          'onUpdate:checked': vi.fn(),
          'onUpdate:modelValue': vi.fn(),
        },
      },
    ];
    const api = createFormApi({ schema });
    await mountForm(<AdminForm formApi={api} schema={schema} showDefaultActions={false} />);

    expect(receivedProps).toBeTruthy();
    expect(receivedProps?.modelValue).toBeUndefined();
    expect(receivedProps?.['onUpdate:checked']).toBeUndefined();
    expect(receivedProps?.['onUpdate:modelValue']).toBeUndefined();
  });

  it('should render required mark before label for required rules', async () => {
    const schema = [
      { fieldName: 'name', label: '名称', component: 'input' as const, rules: 'required' },
    ];
    const api = createFormApi({ schema });
    const renderer = await mountForm(
      <AdminForm formApi={api} schema={schema} showDefaultActions={false} />
    );

    const requiredMarks = renderer.root.findAll((node) =>
      node.props?.className === 'admin-form__required'
    );
    expect(requiredMarks.length).toBe(1);
  });

  it('should not render required mark for custom optional string rule', async () => {
    const schema = [
      { fieldName: 'name', label: '名称', component: 'input' as const, rules: 'reservedName' },
    ];
    const api = createFormApi({ schema });
    const renderer = await mountForm(
      <AdminForm formApi={api} schema={schema} showDefaultActions={false} />
    );
    const requiredMarks = renderer.root.findAll((node) =>
      node.props?.className === 'admin-form__required'
    );
    expect(requiredMarks.length).toBe(0);
  });

  it('should honor button show and reverse options', async () => {
    const schema = [{ fieldName: 'name', component: 'input' as const }];
    const api = createFormApi({
      actionButtonsReverse: true,
      resetButtonOptions: { show: false },
      submitButtonOptions: { content: '提交X' },
      schema,
    });
    const renderer = await mountForm(<AdminForm formApi={api} schema={schema} />);

    const buttons = renderer.root.findAllByType('button');
    expect(buttons.length).toBe(1);
    expect(buttons[0]?.children?.join('')).toBe('提交X');
  });

  it('should support modelPropName override and renderComponentContent props', async () => {
    let receivedProps: Record<string, any> | null = null;
    const ProbeInput = (props: Record<string, any>) => {
      receivedProps = props;
      return <input value={props.modelValue ?? ''} onChange={props.onChange} />;
    };

    setupAdminFormReact({
      library: 'probe-model',
      libraries: {
        'probe-model': {
          capabilities: {},
          components: {
            input: ProbeInput,
          },
        },
      },
    });

    const schema = [
      {
        component: 'input' as const,
        fieldName: 'name',
        modelPropName: 'modelValue' as const,
        renderComponentContent: () => ({
          prefix: 'PFX',
        }),
      },
    ];
    const api = createFormApi({ schema });
    await api.setFieldValue('name', 'alice');

    await mountForm(<AdminForm formApi={api} schema={schema} showDefaultActions={false} />);

    expect(receivedProps).toBeTruthy();
    expect(receivedProps?.modelValue).toBe('alice');
    expect(receivedProps?.value).toBeUndefined();
    expect(receivedProps?.prefix).toBe('PFX');
  });

  it('should inject popup container defaults for antd popup components', async () => {
    let receivedProps: Record<string, any> | null = null;
    const ProbeSelect = (props: Record<string, any>) => {
      receivedProps = props;
      return <div />;
    };

    setupAdminFormReact({
      library: 'antd',
      libraries: {
        antd: {
          capabilities: {},
          components: {
            select: ProbeSelect,
          },
        },
      },
    });

    const schema = [
      {
        component: 'select' as const,
        fieldName: 'region',
      },
    ];
    const api = createFormApi({ schema });
    await mountForm(<AdminForm formApi={api} schema={schema} showDefaultActions={false} />);

    expect(receivedProps).toBeTruthy();
    expect(typeof receivedProps?.getPopupContainer).toBe('function');
    expect(receivedProps?.popupClassName).toBeUndefined();
    expect(receivedProps?.dropdownClassName).toBeUndefined();
    expect(receivedProps?.classNames?.popup?.root).toBe('admin-form-popup');
    expect(receivedProps?.popupStyle).toBeUndefined();
    expect(receivedProps?.dropdownStyle).toBeUndefined();
    expect(receivedProps?.styles?.popup?.root?.zIndex).toBe(
      'var(--admin-form-page-popup-z-index, 2300)'
    );
  });

  it('should validate on blur when formFieldProps.validateOnBlur is enabled', async () => {
    const schema = [
      {
        component: 'input' as const,
        fieldName: 'name',
        formFieldProps: {
          validateOnBlur: true,
        },
        rules: 'required' as const,
      },
    ];
    const api = createFormApi({ schema });
    const renderer = await mountForm(
      <AdminForm formApi={api} schema={schema} showDefaultActions={false} />
    );

    const input = renderer.root.findByType('input');
    await act(async () => {
      input.props.onBlur?.({ target: { value: '' } });
    });

    expect(api.getSnapshot().errors.name).toBeTruthy();
  });

  it('reset button should reset values and invoke handleReset callback', async () => {
    const handleReset = vi.fn();
    const schema = [
      {
        component: 'input' as const,
        defaultValue: 'init',
        fieldName: 'name',
      },
    ];
    const api = createFormApi({
      handleReset,
      schema,
    });
    await api.setFieldValue('name', 'changed');
    const renderer = await mountForm(<AdminForm formApi={api} schema={schema} />);

    const resetButton = renderer.root
      .findAllByType('button')
      .find((node) => !(node.props.className ?? '').includes('admin-form__button--primary'));
    expect(resetButton).toBeTruthy();

    await act(async () => {
      resetButton?.props.onClick({
        defaultPrevented: false,
        preventDefault() {},
      });
    });

    const values = await api.getValues();
    expect(values.name).toBe('init');
    expect(handleReset).toHaveBeenCalledTimes(1);
  });

  it('should skip redundant setState sync when incoming props are unchanged', async () => {
    const schema = [{ fieldName: 'name', component: 'input' as const }];
    const api = createFormApi({ schema });
    const setStateSpy = vi.spyOn(api, 'setState');
    const renderer = await mountForm(
      <AdminForm formApi={api} schema={schema} showDefaultActions={false} />
    );
    const callsAfterMount = setStateSpy.mock.calls.length;

    await act(async () => {
      renderer.update(
        <AdminForm formApi={api} schema={[...schema]} showDefaultActions={false} />
      );
    });

    expect(setStateSpy).toHaveBeenCalledTimes(callsAfterMount);
  });

  it('should avoid rerendering unrelated field component on value change', async () => {
    let fieldBRenders = 0;
    const FieldA = (props: Record<string, any>) => (
      <input value={props.modelValue ?? props.value ?? ''} onChange={props.onChange} />
    );
    const FieldB = (props: Record<string, any>) => {
      fieldBRenders += 1;
      return <input value={props.modelValue ?? props.value ?? ''} onChange={props.onChange} />;
    };

    const schema = [
      { fieldName: 'a', component: FieldA },
      { fieldName: 'b', component: FieldB },
    ];
    const api = createFormApi({ schema });
    const renderer = await mountForm(
      <AdminForm formApi={api} schema={schema} showDefaultActions={false} />
    );
    const baselineRenders = fieldBRenders;

    const inputs = renderer.root.findAllByType('input');
    await act(async () => {
      inputs[0]?.props.onChange?.({ target: { value: 'value-a' } });
    });

    expect(fieldBRenders).toBe(baselineRenders);
  });

  it('should render only listed fields when visibleFieldNames is provided', async () => {
    const schema = [
      { fieldName: 'a', component: 'input' as const },
      { fieldName: 'b', component: 'input' as const },
    ];
    const api = createFormApi({ schema });
    const renderer = await mountForm(
      <AdminForm
        formApi={api}
        schema={schema}
        showDefaultActions={false}
        visibleFieldNames={['a']}
      />
    );

    const inputs = renderer.root.findAllByType('input');
    expect(inputs.length).toBe(1);
  });

  it('should react to runtime visibleFieldNames updates from formApi.setState', async () => {
    const schema = [
      { fieldName: 'a', component: 'input' as const },
      { fieldName: 'b', component: 'input' as const },
    ];
    const api = createFormApi({ schema });
    const renderer = await mountForm(
      <AdminForm formApi={api} schema={schema} showDefaultActions={false} />
    );

    expect(renderer.root.findAllByType('input')).toHaveLength(2);

    await act(async () => {
      api.setState({ visibleFieldNames: ['a'] });
      await Promise.resolve();
    });
    const narrowed = renderer.root.findAllByType('input');
    expect(narrowed).toHaveLength(1);
    expect(narrowed[0]?.props.name).toBe('a');

    await act(async () => {
      api.setState({ visibleFieldNames: ['b'] });
      await Promise.resolve();
    });
    const switched = renderer.root.findAllByType('input');
    expect(switched).toHaveLength(1);
    expect(switched[0]?.props.name).toBe('b');
  });

  it('query mode should collapse by rows and support expand/collapse', async () => {
    const schema = [
      { fieldName: 'a', component: 'input' as const },
      { fieldName: 'b', component: 'input' as const },
      { fieldName: 'c', component: 'input' as const },
      { fieldName: 'd', component: 'input' as const },
    ];
    const api = createFormApi({ schema });
    const renderer = await mountForm(
      <AdminForm
        formApi={api}
        schema={schema}
        queryMode
        gridColumns={3}
        collapsedRows={1}
        showCollapseButton
      />
    );

    expect(renderer.root.findAllByType('input')).toHaveLength(3);
    const collapseButton = renderer.root.findByProps({
      className: 'admin-form__collapse-trigger',
    });

    await act(async () => {
      collapseButton.props.onClick?.({
        defaultPrevented: false,
        preventDefault() {},
      });
    });
    expect(renderer.root.findAllByType('input')).toHaveLength(4);
  });

  it('query mode actions should align to same row right when row is not full', async () => {
    const schema = [
      { fieldName: 'a', component: 'input' as const },
      { fieldName: 'b', component: 'input' as const },
    ];
    const api = createFormApi({ schema });
    const renderer = await mountForm(
      <AdminForm formApi={api} schema={schema} queryMode gridColumns={3} collapsedRows={1} />
    );

    const actionItem = renderer.root.find((node) =>
      `${node.props?.className ?? ''}`.includes('admin-form__actions-item')
    );
    expect(actionItem.props.style?.gridColumn).toBe('3 / -1');
    expect(`${actionItem.props.className}`).not.toContain('admin-form__actions-item--new-row');
  });

  it('query mode actions should move to new row when field row is full', async () => {
    const schema = [
      { fieldName: 'a', component: 'input' as const },
      { fieldName: 'b', component: 'input' as const },
      { fieldName: 'c', component: 'input' as const },
    ];
    const api = createFormApi({ schema });
    const renderer = await mountForm(
      <AdminForm formApi={api} schema={schema} queryMode gridColumns={3} collapsedRows={1} />
    );

    const actionItem = renderer.root.find((node) =>
      `${node.props?.className ?? ''}`.includes('admin-form__actions-item')
    );
    expect(actionItem.props.style?.gridColumn).toBe('1 / -1');
    expect(`${actionItem.props.className}`).toContain('admin-form__actions-item--new-row');
  });

  it('non-query mode should keep action block outside grid', async () => {
    const schema = [{ fieldName: 'name', component: 'input' as const }];
    const api = createFormApi({ schema });
    const renderer = await mountForm(<AdminForm formApi={api} schema={schema} />);

    const queryActionItems = renderer.root.findAll((node) =>
      `${node.props?.className ?? ''}`.includes('admin-form__actions-item')
    );
    expect(queryActionItems).toHaveLength(0);
    const normalActions = renderer.root.findAll((node) =>
      `${node.props?.className ?? ''}`.includes('admin-form__actions')
    );
    expect(normalActions.length).toBeGreaterThan(0);
  });

  it('AdminSearchForm should apply query defaults and use 查询 as submit text', async () => {
    const schema = [{ fieldName: 'name', component: 'input' as const }];
    const renderer = await mountForm(<AdminSearchForm schema={schema} />);
    const primaryButton = renderer.root
      .findAllByType('button')
      .find((node) => `${node.props.className ?? ''}`.includes('admin-form__button--primary'));
    expect(primaryButton?.children?.join('')).toBe('查询');
  });

  it('AdminSearchForm should update default submit text after locale switched at runtime', async () => {
    const schema = [{ fieldName: 'name', component: 'input' as const }];
    const renderer = await mountForm(<AdminSearchForm schema={schema} />);
    const primaryButton = () =>
      renderer.root
        .findAllByType('button')
        .find((node) =>
          `${node.props.className ?? ''}`.includes('admin-form__button--primary')
        );
    expect(primaryButton()?.children?.join('')).toBe('查询');

    await act(async () => {
      setLocale('en-US');
      await Promise.resolve();
    });
    expect(primaryButton()?.children?.join('')).toBe('Search');
  });

  it('AdminSearchForm should not auto-collapse after expand when values are controlled', async () => {
    const schema = [
      { fieldName: 'a', component: 'input' as const },
      { fieldName: 'b', component: 'input' as const },
      { fieldName: 'c', component: 'input' as const },
      { fieldName: 'd', component: 'input' as const },
    ];
    function Host() {
      const [values, setValues] = useState<Record<string, any>>({
        a: '',
        b: '',
        c: '',
        d: '',
      });
      return <AdminSearchForm schema={schema} values={values} onValuesChange={setValues} />;
    }

    const renderer = await mountForm(<Host />);
    expect(renderer.root.findAllByType('input')).toHaveLength(3);

    const collapseButton = renderer.root.findByProps({
      className: 'admin-form__collapse-trigger',
    });
    await act(async () => {
      collapseButton.props.onClick?.({
        defaultPrevented: false,
        preventDefault() {},
      });
    });
    expect(renderer.root.findAllByType('input')).toHaveLength(4);

    const firstInput = renderer.root.findAllByType('input')[0];
    await act(async () => {
      firstInput?.props.onChange?.({ target: { value: 'updated' } });
    });
    expect(renderer.root.findAllByType('input')).toHaveLength(4);
  });
});
