import type { AdminFormApi, AdminFormProps } from '../types';

/**
 * 表单契约测试通用 schema。
 * @description 包含一个静态必填字段和一个依赖动态必填字段。
 */
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

/**
 * 运行表单契约测试流程。
 * @param createApi 表单 API 创建函数。
 * @returns 无返回值；断言失败时抛出错误。
 */
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
