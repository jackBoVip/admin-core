import { describe, expect, it } from 'vitest';
import { createFormApi } from '../form-api';
import {
  buildSteppedFormSchema,
  sanitizeSteppedFormValues,
  validateSteppedForm,
} from '../utils/stepped-form';

describe('stepped form helpers', () => {
  it('should build stepped schema with internal step field and section divider', () => {
    const result = buildSteppedFormSchema(
      [
        {
          title: 'step-a',
          sections: [
            {
              description: 'section-description',
              schema: [
                {
                  component: 'input',
                  fieldName: 'name',
                  label: 'Name',
                  rules: 'required',
                },
              ],
              title: 'section-title',
            },
          ],
        },
      ],
      {
        stepFieldName: '__step',
      }
    );

    expect(result.stepFieldName).toBe('__step');
    expect(result.schema[0]?.fieldName).toBe('__step');
    expect(result.schema[0]?.hide).toBe(true);
    expect(result.schema.some((item) => item.component === 'section-title')).toBe(true);
    expect(result.steps[0]?.fieldNames).toEqual(['name']);
  });

  it('should validate step by step and report first invalid step', async () => {
    const built = buildSteppedFormSchema(
      [
        {
          title: '基础信息',
          schema: [
            {
              component: 'input',
              fieldName: 'tenant',
              label: 'Tenant',
              rules: 'required',
            },
          ],
        },
        {
          title: '管理员',
          schema: [
            {
              component: 'input',
              fieldName: 'email',
              label: 'Email',
              rules: 'required',
            },
          ],
        },
      ],
      {
        stepFieldName: '__step',
      }
    );

    const api = createFormApi({
      schema: built.schema,
      showDefaultActions: false,
    });
    api.mount();
    await api.setValues(
      {
        __step: 0,
        tenant: 'demo',
      },
      true
    );

    const invalidResult = await validateSteppedForm(api, built.steps, built.stepFieldName, 0);
    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.firstInvalidStep).toBe(1);
    expect(invalidResult.errors.email).toBeTruthy();

    await api.setFieldValue('email', 'ops@example.com', false);
    const validResult = await validateSteppedForm(api, built.steps, built.stepFieldName, 0);
    expect(validResult.valid).toBe(true);
    expect(validResult.firstInvalidStep).toBe(-1);
    api.unmount();
  });

  it('should sanitize internal step field from submitted values', () => {
    const result = sanitizeSteppedFormValues(
      {
        __step: 2,
        name: 'demo',
      },
      '__step'
    );

    expect(result).toEqual({
      name: 'demo',
    });
  });
});
