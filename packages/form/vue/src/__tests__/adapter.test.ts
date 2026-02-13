import { describe, expect, it } from 'vitest';

import {
  getFormAdapterRegistry,
  getVueFormAdapterRegistry,
  registerFormComponents,
  setupAdminForm,
  setupAdminFormVue,
  useAdminForm,
  useAdminFormSubmitPage,
} from '../index';
import { runFormContract } from '../../../core/src/__tests__/contract-fixtures';

describe('form-vue adapter', () => {
  it('should register and resolve custom vue library mapping', () => {
    setupAdminFormVue({
      library: 'my-ui',
      libraries: {
        'my-ui': {
          capabilities: {
            customModelProp: true,
          },
          components: {
            input: { name: 'my-input' } as any,
          },
          modelPropNameMap: {
            input: 'value',
          },
        },
      },
    });

    const registry = getVueFormAdapterRegistry();
    const resolved = registry.resolveComponent({
      key: 'input',
    });

    expect(resolved?.source).toBe('library');
    expect(resolved?.modelPropName).toBe('value');
  });

  it('should provide API from useAdminForm', async () => {
    const createApi = (props: any) => {
      const [, api] = useAdminForm(props);
      return api;
    };
    await runFormContract(createApi);
  });

  it('should provide API from useAdminFormSubmitPage', async () => {
    const [, api, controller] = useAdminFormSubmitPage({
      open: false,
      steps: [
        {
          schema: [{ component: 'input', fieldName: 'name' }],
          title: 'Step 1',
        },
      ],
    });

    const result = await api.validate();
    expect(result.valid).toBe(true);
    expect(controller.getOpen()).toBe(false);
    controller.open();
    expect(controller.getOpen()).toBe(true);
    controller.close();
    expect(controller.getOpen()).toBe(false);
  });

  it('should support step controls from submitController', async () => {
    const [, , controller] = useAdminFormSubmitPage({
      open: false,
      steps: [
        {
          schema: [{ component: 'input', fieldName: 'name', rules: 'required' }],
          title: 'Step 1',
        },
        {
          schema: [{ component: 'input', fieldName: 'remark' }],
          title: 'Step 2',
        },
      ],
    });

    expect(controller.getTotalSteps()).toBe(2);
    await controller.getFormApi().setFieldValue('name', 'admin');
    const nextResult = await controller.next();
    expect(nextResult.status).toBe('moved');
    expect(controller.getStep()).toBe(1);

    const prevResult = await controller.prev();
    expect(prevResult).toBe(true);
    expect(controller.getStep()).toBe(0);

    await controller.goToStep(1);
    expect(controller.getStep()).toBe(1);
  });

  it('should reset to first step after submit via submitController', async () => {
    const [, , controller] = useAdminFormSubmitPage({
      open: true,
      steps: [
        {
          schema: [{ component: 'input', fieldName: 'name', rules: 'required' }],
          title: 'Step 1',
        },
        {
          schema: [{ component: 'input', fieldName: 'remark' }],
          title: 'Step 2',
        },
      ],
    });

    await controller.getFormApi().setFieldValue('name', 'admin');
    await controller.next();
    expect(controller.getStep()).toBe(1);
    await controller.next();
    expect(controller.getStep()).toBe(0);
  });

  it('should keep step and open state when submit callback returns false', async () => {
    const [, , controller] = useAdminFormSubmitPage({
      onSubmit: async () => false,
      open: true,
      steps: [
        {
          schema: [{ component: 'input', fieldName: 'name', rules: 'required' }],
          title: 'Step 1',
        },
      ],
    });

    await controller.getFormApi().setFieldValue('name', 'admin');
    const result = await controller.next();
    expect(result.status).toBe('blocked');
    expect(controller.getStep()).toBe(0);
    expect(controller.getOpen()).toBe(true);
  });

  it('registerFormComponents should support baseModelPropName', () => {
    registerFormComponents(
      {
        input: { name: 'reg-input' } as any,
      },
      {
        library: 'reg-ui',
        baseModelPropName: 'value',
      }
    );
    setupAdminFormVue({
      library: 'reg-ui',
    });

    const registry = getVueFormAdapterRegistry();
    const resolved = registry.resolveComponent({ key: 'input' });
    expect(resolved?.modelPropName).toBe('value');
  });

  it('should expose unified setup and registry aliases', () => {
    setupAdminForm({
      library: 'alias-ui',
      libraries: {
        'alias-ui': {
          components: {
            input: { name: 'alias-input' } as any,
          },
          capabilities: {},
        },
      },
    });
    const registry = getFormAdapterRegistry();
    const resolved = registry.resolveComponent({ key: 'input' });
    expect(resolved?.library).toBe('alias-ui');
  });

  it('should validate simple schema', async () => {
    const [, api] = useAdminForm({
      schema: [{ fieldName: 'name', component: 'input', rules: 'required' }],
    });

    await api.setFieldValue('name', 'admin');
    const result = await api.validate();
    expect(result.valid).toBe(true);
  });
});
