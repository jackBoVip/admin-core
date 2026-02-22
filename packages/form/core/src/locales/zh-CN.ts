import type { AdminFormLocaleMessages } from './types';

export const zhCN: AdminFormLocaleMessages = {
  form: {
    collapse: '收起',
    expand: '展开',
    invalid: '{label}输入无效',
    querySubmit: '查询',
    rangeInvalid: '{label}范围无效',
    reset: '重置',
    required: '请输入{label}',
    selectRequired: '请选择{label}',
    submit: '提交',
  },
  submitPage: {
    cancel: '取消',
    close: '关闭',
    next: '下一步',
    previous: '上一步',
    submit: '提交',
  },
} as const;
