import { createFormApi } from '@admin-core/form-core';
import { createElement } from 'react';
import { act, create } from 'react-test-renderer';
import { describe, expect, it } from 'vitest';
import { runFormContract } from '../../../core/src/__tests__/contract-fixtures';
import {
  getFormAdapterRegistry,
  getReactFormAdapterRegistry,
  setupAdminForm,
  setupAdminFormReact,
  useAdminForm,
  useAdminFormSubmitPage,
} from '../index';

describe('form-react adapter', () => {
  it('should register and resolve custom react library mapping', () => {
    setupAdminFormReact({
      library: 'my-ui',
      libraries: {
        'my-ui': {
          components: {
            input: () => null,
          },
          capabilities: {
            customModelProp: true,
          },
          modelPropNameMap: {
            input: 'value',
          },
        },
      },
    });

    const registry = getReactFormAdapterRegistry();
    const resolved = registry.resolveComponent({ key: 'input' });
    expect(resolved?.source).toBe('library');
    expect(resolved?.modelPropName).toBe('value');
  });

  it('should default react model prop to value', () => {
    setupAdminFormReact({
      library: 'value-default',
      libraries: {
        'value-default': {
          components: {
            input: () => null,
          },
          capabilities: {},
        },
      },
    });

    const registry = getReactFormAdapterRegistry();
    const resolved = registry.resolveComponent({ key: 'input' });
    expect(resolved?.modelPropName).toBe('value');
  });

  it('should expose unified setup and registry aliases', () => {
    setupAdminForm({
      library: 'alias-ui',
      libraries: {
        'alias-ui': {
          components: {
            input: () => null,
          },
          capabilities: {},
        },
      },
    });
    const registry = getFormAdapterRegistry();
    const resolved = registry.resolveComponent({ key: 'input' });
    expect(resolved?.library).toBe('alias-ui');
  });

  it('should provide API from useAdminForm', async () => {
    let capturedApi: ReturnType<typeof createFormApi> | null = null;
    function HookHarness() {
      const [, api] = useAdminForm({
        schema: [{ fieldName: 'name', component: 'input' }],
      });
      capturedApi = api;
      return null;
    }

    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    await act(async () => {
      create(createElement(HookHarness));
    });

    expect(capturedApi).toBeTruthy();
    const createApi = (props: any) => createFormApi(props);
    await runFormContract(createApi);
  });

  it('should provide API from useAdminFormSubmitPage', async () => {
    let capturedApi: ReturnType<typeof createFormApi> | null = null;
    let controller: any = null;
    function HookHarness() {
      const [, api, submitController] = useAdminFormSubmitPage({
        open: false,
        steps: [
          {
            schema: [{ component: 'input', fieldName: 'name' }],
            title: 'Step 1',
          },
        ],
      });
      capturedApi = api;
      controller = submitController;
      return null;
    }

    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    await act(async () => {
      create(createElement(HookHarness));
    });

    expect(capturedApi).toBeTruthy();
    if (!capturedApi) {
      throw new Error('expected form api from useAdminFormSubmitPage');
    }
    const result = await capturedApi.validate();
    expect(result.valid).toBe(true);
    expect(controller.getOpen()).toBe(false);
    await act(async () => {
      controller.open();
    });
    expect(controller.getOpen()).toBe(true);
    await act(async () => {
      controller.close();
    });
    expect(controller.getOpen()).toBe(false);
  });

  it('should support step controls from submitController', async () => {
    let controller: any = null;
    function HookHarness() {
      const [, , submitController] = useAdminFormSubmitPage({
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
      controller = submitController;
      return null;
    }

    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    await act(async () => {
      create(createElement(HookHarness));
    });

    expect(controller.getTotalSteps()).toBe(2);
    await act(async () => {
      await controller.getFormApi().setFieldValue('name', 'admin');
    });
    let nextResult: any = null;
    await act(async () => {
      nextResult = await controller.next();
    });
    expect(nextResult.status).toBe('moved');
    expect(controller.getStep()).toBe(1);

    let prevResult = false;
    await act(async () => {
      prevResult = await controller.prev();
    });
    expect(prevResult).toBe(true);
    expect(controller.getStep()).toBe(0);

    await act(async () => {
      await controller.goToStep(1);
    });
    expect(controller.getStep()).toBe(1);
  });

  it('should reset to first step after submit via submitController', async () => {
    let controller: any = null;
    function HookHarness() {
      const [, , submitController] = useAdminFormSubmitPage({
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
      controller = submitController;
      return null;
    }

    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    await act(async () => {
      create(createElement(HookHarness));
    });

    await act(async () => {
      await controller.getFormApi().setFieldValue('name', 'admin');
      await controller.next();
    });
    expect(controller.getStep()).toBe(1);
    await act(async () => {
      await controller.next();
    });
    expect(controller.getStep()).toBe(0);
  });

  it('should keep step and open state when submit callback returns false', async () => {
    let controller: any = null;
    function HookHarness() {
      const [, , submitController] = useAdminFormSubmitPage({
        onSubmit: async () => false,
        open: true,
        steps: [
          {
            schema: [{ component: 'input', fieldName: 'name', rules: 'required' }],
            title: 'Step 1',
          },
        ],
      });
      controller = submitController;
      return null;
    }

    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    await act(async () => {
      create(createElement(HookHarness));
    });

    await act(async () => {
      await controller.getFormApi().setFieldValue('name', 'admin');
    });
    let result: any = null;
    await act(async () => {
      result = await controller.next();
    });
    expect(result.status).toBe('blocked');
    expect(controller.getStep()).toBe(0);
    expect(controller.getOpen()).toBe(true);
  });

  it('should validate simple schema', async () => {
    const api = createFormApi({
      schema: [{ fieldName: 'name', component: 'input', rules: 'required' }],
    });

    await api.setFieldValue('name', 'admin');
    const result = await api.validate();
    expect(result.valid).toBe(true);
  });
});
