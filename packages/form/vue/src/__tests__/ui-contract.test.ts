// @vitest-environment jsdom
import { createFormApi, setLocale } from '@admin-core/form-core';
import { mount } from '@vue/test-utils';
import { defineComponent, h, markRaw } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminForm } from '../components/AdminForm';
import { AdminSearchForm } from '../components/AdminSearchForm';
import { setupAdminFormVue } from '../registry';

async function flushTasks() {
  await Promise.resolve();
  await Promise.resolve();
}

describe('vue ui contract', () => {
  beforeEach(() => {
    setLocale('zh-CN');
    setupAdminFormVue({
      library: 'native-test',
      libraries: {
        'native-test': {
          capabilities: {},
          components: {},
        },
      },
    });
  });

  it('input should sync value to api through input event', async () => {
    const schema = [{ fieldName: 'name', component: 'input' as const }];
    const api = createFormApi({ schema });
    const wrapper = mount(AdminForm as any, {
      props: {
        formApi: api,
        schema,
        showDefaultActions: false,
      },
    });

    const input = wrapper.findComponent({ name: 'AdminNativeInput' });
    await input.vm.$emit('update:modelValue', 'alice');
    await flushTasks();

    const values = await api.getValues();
    expect(values.name).toBe('alice');
  });

  it('switch should sync checked state to api', async () => {
    const schema = [{ fieldName: 'enabled', component: 'switch' as const }];
    const api = createFormApi({ schema });
    const wrapper = mount(AdminForm as any, {
      props: {
        formApi: api,
        schema,
        showDefaultActions: false,
      },
    });

    const switchInput = wrapper.findComponent({ name: 'AdminNativeSwitch' });
    await switchInput.vm.$emit('update:checked', true);
    await flushTasks();

    const values = await api.getValues();
    expect(values.enabled).toBe(true);
  });

  it('should support data-driven values and update:values', async () => {
    const schema = [{ fieldName: 'name', component: 'input' as const }];
    const wrapper = mount(AdminForm as any, {
      props: {
        schema,
        showDefaultActions: false,
        values: {
          name: 'init',
        },
      },
    });
    await flushTasks();

    const input = wrapper.findComponent({ name: 'AdminNativeInput' });
    expect(input.props('modelValue')).toBe('init');

    await input.vm.$emit('update:modelValue', 'alice');
    await flushTasks();

    const updateEvents = wrapper.emitted('update:values') ?? [];
    const latestPayload = updateEvents.at(-1)?.[0] as Record<string, any> | undefined;
    expect(latestPayload?.name).toBe('alice');

    await wrapper.setProps({
      values: {
        name: 'bob',
      },
    });
    await flushTasks();

    const updatedInput = wrapper.findComponent({ name: 'AdminNativeInput' });
    expect(updatedInput.props('modelValue')).toBe('bob');
  });

  it('should unwrap component event payload with value field', async () => {
    const schema = [{ fieldName: 'name', component: 'input' as const }];
    const api = createFormApi({ schema });
    const wrapper = mount(AdminForm as any, {
      props: {
        formApi: api,
        schema,
        showDefaultActions: false,
      },
    });

    const input = wrapper.findComponent({ name: 'AdminNativeInput' });
    await input.vm.$emit('input', {
      $event: { type: 'input' },
      value: 'alice',
    });
    await flushTasks();

    const values = await api.getValues();
    expect(values.name).toBe('alice');
  });

  it('should render required mark before label for required rules', async () => {
    const schema = [
      { fieldName: 'name', label: '名称', component: 'input' as const, rules: 'required' },
    ];
    const api = createFormApi({ schema });
    const wrapper = mount(AdminForm as any, {
      props: {
        formApi: api,
        schema,
        showDefaultActions: false,
      },
    });

    expect(wrapper.find('.admin-form__required').exists()).toBe(true);
  });

  it('should not render required mark for custom optional string rule', async () => {
    const schema = [
      { fieldName: 'name', label: '名称', component: 'input' as const, rules: 'reservedName' },
    ];
    const api = createFormApi({ schema });
    const wrapper = mount(AdminForm as any, {
      props: {
        formApi: api,
        schema,
        showDefaultActions: false,
      },
    });

    expect(wrapper.find('.admin-form__required').exists()).toBe(false);
  });

  it('should honor button show and reverse options', async () => {
    const schema = [{ fieldName: 'name', component: 'input' as const }];
    const api = createFormApi({
      actionButtonsReverse: true,
      resetButtonOptions: { show: false },
      submitButtonOptions: { content: '提交X' },
      schema,
    });
    const wrapper = mount(AdminForm as any, {
      props: {
        formApi: api,
        schema,
      },
    });
    await flushTasks();

    const buttons = wrapper.findAll('button');
    expect(buttons.length).toBe(1);
    expect(buttons[0]?.text()).toBe('提交X');
  });

  it('should support modelPropName override and renderComponentContent slots', async () => {
    const ProbeInput = defineComponent({
      name: 'ProbeInput',
      props: {
        modelValue: {
          type: String,
          default: '',
        },
      },
      setup(props, { slots }) {
        return () =>
          h('div', { class: 'probe-input' }, [
            h('span', { class: 'probe-model' }, props.modelValue),
            h('span', { class: 'probe-prefix' }, slots.prefix?.()),
            h('span', { class: 'probe-default' }, slots.default?.()),
          ]);
      },
    });

    setupAdminFormVue({
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

    const schema = [
      {
        component: 'input' as const,
        fieldName: 'name',
        modelPropName: 'modelValue',
        renderComponentContent: () => ({
          default: 'DEF',
          prefix: 'PFX',
        }),
      },
    ];
    const api = createFormApi({ schema });
    await api.setFieldValue('name', 'alice');

    const wrapper = mount(AdminForm as any, {
      props: {
        formApi: api,
        schema,
        showDefaultActions: false,
      },
    });
    await flushTasks();

    expect(wrapper.find('.probe-prefix').text()).toContain('PFX');
    expect(wrapper.find('.probe-default').text()).toContain('DEF');
    expect(wrapper.find('.probe-model').text()).toContain('alice');
  });

  it('should inject transfer=true for vxe popup components by default', async () => {
    let receivedProps: Record<string, any> | null = null;
    const ProbeVxeSelect = defineComponent({
      name: 'VxeSelect',
      setup(_, { attrs }) {
        receivedProps = attrs as Record<string, any>;
        return () => h('div');
      },
    });

    setupAdminFormVue({
      library: 'vxe',
      libraries: {
        vxe: {
          capabilities: {},
          components: {
            select: ProbeVxeSelect,
          },
        },
      },
    });

    const schema = [{ fieldName: 'region', component: 'select' as const }];
    const api = createFormApi({ schema });
    mount(AdminForm as any, {
      props: {
        formApi: api,
        schema,
        showDefaultActions: false,
      },
    });
    await flushTasks();

    expect(receivedProps).toBeTruthy();
    expect(receivedProps?.transfer).toBe(true);
  });

  it('should fallback to VxeNumberInput when vxe input type is number', async () => {
    const renderMarkers = {
      input: 0,
      number: 0,
    };
    const ProbeVxeInput = defineComponent({
      name: 'VxeInput',
      setup() {
        return () => {
          renderMarkers.input += 1;
          return h('div', { class: 'probe-vxe-input' });
        };
      },
    });
    const ProbeVxeNumberInput = defineComponent({
      name: 'VxeNumberInput',
      setup() {
        return () => {
          renderMarkers.number += 1;
          return h('div', { class: 'probe-vxe-number-input' });
        };
      },
    });

    setupAdminFormVue({
      library: 'vxe',
      libraries: {
        vxe: {
          capabilities: {},
          components: {
            input: ProbeVxeInput,
          },
        },
      },
    });

    const schema = [
      {
        component: 'input' as const,
        componentProps: {
          type: 'number',
        },
        fieldName: 'age',
      },
    ];
    const api = createFormApi({ schema });
    mount(AdminForm as any, {
      global: {
        components: {
          VxeNumberInput: ProbeVxeNumberInput,
        },
      },
      props: {
        formApi: api,
        schema,
        showDefaultActions: false,
      },
    });
    await flushTasks();

    expect(renderMarkers.number).toBeGreaterThan(0);
    expect(renderMarkers.input).toBe(0);
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
    const wrapper = mount(AdminForm as any, {
      props: {
        formApi: api,
        schema,
        showDefaultActions: false,
      },
    });

    await wrapper.find('input.admin-form__input').trigger('blur');
    await flushTasks();

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
    const wrapper = mount(AdminForm as any, {
      props: {
        formApi: api,
        schema,
      },
    });
    await flushTasks();

    const resetButton = wrapper
      .findAll('button')
      .find((button) => !button.classes().includes('admin-form__button--primary'));
    expect(resetButton).toBeTruthy();
    await resetButton?.trigger('click');
    await flushTasks();

    const values = await api.getValues();
    expect(values.name).toBe('init');
    await vi.waitFor(() => {
      expect(handleReset).toHaveBeenCalledTimes(1);
    });
  });

  it('should invoke user model update listener from componentProps', async () => {
    const onModelUpdate = vi.fn();
    const schema = [
      {
        component: 'input' as const,
        componentProps: {
          'onUpdate:modelValue': onModelUpdate,
        },
        fieldName: 'name',
      },
    ];
    const api = createFormApi({ schema });
    const wrapper = mount(AdminForm as any, {
      props: {
        formApi: api,
        schema,
        showDefaultActions: false,
      },
    });

    const input = wrapper.findComponent({ name: 'AdminNativeInput' });
    await input.vm.$emit('update:modelValue', 'alice');
    await flushTasks();

    expect(onModelUpdate).toHaveBeenCalledTimes(1);
    expect(onModelUpdate).toHaveBeenCalledWith('alice');
  });

  it('should skip redundant setState sync when incoming attrs are unchanged', async () => {
    const schema = [{ fieldName: 'name', component: 'input' as const }];
    const api = createFormApi({ schema });
    const setStateSpy = vi.spyOn(api, 'setState');
    const wrapper = mount(AdminForm as any, {
      props: {
        formApi: api,
        schema,
        showDefaultActions: false,
      },
    });
    await flushTasks();

    await wrapper.setProps({
      schema: [...schema],
    });
    await flushTasks();

    expect(setStateSpy).toHaveBeenCalledTimes(1);
  });

  it('should avoid rerendering unrelated field component on value change', async () => {
    let fieldBRenders = 0;
    const FieldA = defineComponent({
      name: 'FieldA',
      emits: ['update:modelValue'],
      props: {
        modelValue: {
          type: String,
          default: '',
        },
      },
      setup(props, { emit }) {
        return () =>
          h('input', {
            value: props.modelValue,
            onInput: (event: Event) =>
              emit('update:modelValue', (event.target as HTMLInputElement).value),
          });
      },
    });
    const FieldB = defineComponent({
      name: 'FieldB',
      emits: ['update:modelValue'],
      props: {
        modelValue: {
          type: String,
          default: '',
        },
      },
      setup(props) {
        return () => {
          fieldBRenders += 1;
          return h('input', { value: props.modelValue });
        };
      },
    });

    const schema = [
      { fieldName: 'a', component: markRaw(FieldA) },
      { fieldName: 'b', component: markRaw(FieldB) },
    ];
    const api = createFormApi({ schema });
    const wrapper = mount(AdminForm as any, {
      props: {
        formApi: api,
        schema,
        showDefaultActions: false,
      },
    });
    await flushTasks();
    const baselineRenders = fieldBRenders;

    const fieldA = wrapper.findComponent({ name: 'FieldA' });
    await fieldA.vm.$emit('update:modelValue', 'value-a');
    await flushTasks();

    expect(fieldBRenders).toBe(baselineRenders);
  });

  it('should render only listed fields when visibleFieldNames is provided', async () => {
    const schema = [
      { fieldName: 'a', component: 'input' as const },
      { fieldName: 'b', component: 'input' as const },
    ];
    const api = createFormApi({ schema });
    const wrapper = mount(AdminForm as any, {
      props: {
        formApi: api,
        schema,
        showDefaultActions: false,
        visibleFieldNames: ['a'],
      },
    });
    await flushTasks();

    expect(wrapper.findAllComponents({ name: 'AdminNativeInput' })).toHaveLength(1);

    await wrapper.setProps({
      visibleFieldNames: ['b'],
    });
    await flushTasks();

    expect(wrapper.findAllComponents({ name: 'AdminNativeInput' })).toHaveLength(1);
  });

  it('should react to runtime visibleFieldNames updates from formApi.setState', async () => {
    const schema = [
      { fieldName: 'a', component: 'input' as const, label: 'A' },
      { fieldName: 'b', component: 'input' as const, label: 'B' },
    ];
    const api = createFormApi({ schema });
    const wrapper = mount(AdminForm as any, {
      props: {
        formApi: api,
        schema,
        showDefaultActions: false,
      },
    });
    await flushTasks();

    expect(wrapper.findAll('input.admin-form__input')).toHaveLength(2);

    api.setState({ visibleFieldNames: ['a'] });
    await flushTasks();
    expect(wrapper.findAll('input.admin-form__input')).toHaveLength(1);
    expect(wrapper.find('input.admin-form__input').attributes('name')).toBe('a');

    api.setState({ visibleFieldNames: ['b'] });
    await flushTasks();
    expect(wrapper.findAll('input.admin-form__input')).toHaveLength(1);
    expect(wrapper.find('input.admin-form__input').attributes('name')).toBe('b');
  });

  it('query mode should collapse by rows and support expand/collapse', async () => {
    const schema = [
      { fieldName: 'a', component: 'input' as const },
      { fieldName: 'b', component: 'input' as const },
      { fieldName: 'c', component: 'input' as const },
      { fieldName: 'd', component: 'input' as const },
    ];
    const api = createFormApi({ schema });
    const wrapper = mount(AdminForm as any, {
      props: {
        formApi: api,
        schema,
        queryMode: true,
        gridColumns: 3,
        collapsedRows: 1,
        showCollapseButton: true,
      },
    });
    await flushTasks();

    expect(wrapper.findAll('input.admin-form__input')).toHaveLength(3);
    await wrapper.find('button.admin-form__collapse-trigger').trigger('click');
    await flushTasks();
    expect(wrapper.findAll('input.admin-form__input')).toHaveLength(4);
  });

  it('query mode actions should align to same row right when row is not full', async () => {
    const schema = [
      { fieldName: 'a', component: 'input' as const },
      { fieldName: 'b', component: 'input' as const },
    ];
    const api = createFormApi({ schema });
    const wrapper = mount(AdminForm as any, {
      props: {
        formApi: api,
        schema,
        queryMode: true,
        gridColumns: 3,
        collapsedRows: 1,
      },
    });
    await flushTasks();

    const actionItem = wrapper.find('.admin-form__actions-item');
    expect(actionItem.attributes('style')).toContain('grid-column: 3 / -1;');
    expect(actionItem.classes()).not.toContain('admin-form__actions-item--new-row');
  });

  it('query mode actions should move to new row when field row is full', async () => {
    const schema = [
      { fieldName: 'a', component: 'input' as const },
      { fieldName: 'b', component: 'input' as const },
      { fieldName: 'c', component: 'input' as const },
    ];
    const api = createFormApi({ schema });
    const wrapper = mount(AdminForm as any, {
      props: {
        formApi: api,
        schema,
        queryMode: true,
        gridColumns: 3,
        collapsedRows: 1,
      },
    });
    await flushTasks();

    const actionItem = wrapper.find('.admin-form__actions-item');
    expect(actionItem.attributes('style')).toContain('grid-column: 1 / -1;');
    expect(actionItem.classes()).toContain('admin-form__actions-item--new-row');
  });

  it('non-query mode should keep action block outside grid', async () => {
    const schema = [{ fieldName: 'name', component: 'input' as const }];
    const api = createFormApi({ schema });
    const wrapper = mount(AdminForm as any, {
      props: {
        formApi: api,
        schema,
      },
    });
    await flushTasks();

    expect(wrapper.find('.admin-form__actions-item').exists()).toBe(false);
    expect(wrapper.find('.admin-form__actions').exists()).toBe(true);
  });

  it('AdminSearchForm should apply query defaults and use 查询 as submit text', async () => {
    const schema = [{ fieldName: 'name', component: 'input' as const }];
    const wrapper = mount(AdminSearchForm as any, {
      props: {
        schema,
      },
    });
    await flushTasks();

    const primaryButton = wrapper
      .findAll('button')
      .find((button) => button.classes().includes('admin-form__button--primary'));
    expect(primaryButton?.text()).toBe('查询');
  });

  it('AdminSearchForm should update default submit text after locale switched at runtime', async () => {
    const schema = [{ fieldName: 'name', component: 'input' as const }];
    const wrapper = mount(AdminSearchForm as any, {
      props: {
        schema,
      },
    });
    await flushTasks();

    const findPrimaryButton = () =>
      wrapper
        .findAll('button')
        .find((button) => button.classes().includes('admin-form__button--primary'));
    expect(findPrimaryButton()?.text()).toBe('查询');

    setLocale('en-US');
    await flushTasks();
    expect(findPrimaryButton()?.text()).toBe('Search');
  });

  it('AdminSearchForm should not auto-collapse after expand when values are controlled', async () => {
    const schema = [
      { fieldName: 'a', component: 'input' as const },
      { fieldName: 'b', component: 'input' as const },
      { fieldName: 'c', component: 'input' as const },
      { fieldName: 'd', component: 'input' as const },
    ];
    const values = {
      a: '',
      b: '',
      c: '',
      d: '',
    };
    const Host = defineComponent({
      components: {
        AdminSearchForm,
      },
      data() {
        return {
          schema,
          values,
        };
      },
      template: `
        <AdminSearchForm
          v-model:values="values"
          :schema="schema"
        />
      `,
    });

    const wrapper = mount(Host as any);
    await flushTasks();
    expect(wrapper.findAll('input.admin-form__input')).toHaveLength(3);

    await wrapper.find('button.admin-form__collapse-trigger').trigger('click');
    await flushTasks();
    expect(wrapper.findAll('input.admin-form__input')).toHaveLength(4);

    const firstInput = wrapper.find('input.admin-form__input');
    await firstInput.setValue('updated');
    await flushTasks();
    expect(wrapper.findAll('input.admin-form__input')).toHaveLength(4);
  });

  it('should support kebab-case attrs for query mode props', async () => {
    const schema = [
      { fieldName: 'keyword', component: 'input' as const },
      { fieldName: 'status', component: 'input' as const },
    ];
    const Host = defineComponent({
      components: {
        AdminForm,
      },
      data() {
        return {
          schema,
          values: {
            keyword: '',
            status: '',
          },
        };
      },
      template: `
        <AdminForm
          v-model:values="values"
          query-mode
          :grid-columns="3"
          :collapsed-rows="1"
          :show-collapse-button="true"
          :submit-button-options="{ content: '查询' }"
          :schema="schema"
        />
      `,
    });

    const wrapper = mount(Host as any);
    await flushTasks();

    const actionItem = wrapper.find('.admin-form__actions-item');
    expect(actionItem.exists()).toBe(true);
    expect(actionItem.attributes('style')).toContain('grid-column: 3 / -1;');
    const primaryButton = wrapper
      .findAll('button')
      .find((button) => button.classes().includes('admin-form__button--primary'));
    expect(primaryButton?.text()).toBe('查询');
  });
});
