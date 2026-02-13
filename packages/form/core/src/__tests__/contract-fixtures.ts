import type { AdminFormApi, AdminFormProps } from '../types';

export const contractSchema: AdminFormProps['schema'] = [
  {
    fieldName: 'name',
    component: 'input',
    rules: 'required',
  },
  {
    fieldName: 'status',
    component: 'input',
    dependencies: {
      triggerFields: ['name'],
      required: (values) => values.name === 'admin',
    },
  },
];

export async function runFormContract(createApi: (props: AdminFormProps) => AdminFormApi) {
  const api = createApi({
    schema: contractSchema,
  });

  let result = await api.validate();
  if (result.valid) {
    throw new Error('expected invalid result');
  }

  await api.setFieldValue('name', 'admin');
  result = await api.validate();
  if (!result.errors.status) {
    throw new Error('expected dynamic required error for status');
  }

  await api.setFieldValue('status', 'ok');
  result = await api.validate();
  if (!result.valid) {
    throw new Error('expected valid result');
  }
}
