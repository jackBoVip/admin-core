/**
 * Form Core 英文语言包定义。
 * @description 提供表单动作、校验提示与提交页文案的默认英文文本。
 */
import type { AdminFormLocaleMessages } from './types';

/**
 * 表单模块英文语言包。
 */
export const enUS: AdminFormLocaleMessages = {
  form: {
    /** 收起文案。 */
    collapse: 'Collapse',
    /** 展开文案。 */
    expand: 'Expand',
    /** 输入无效提示。 */
    invalid: '{label} is invalid',
    /** 查询按钮文案。 */
    querySubmit: 'Search',
    /** 区间无效提示。 */
    rangeInvalid: '{label} range is invalid',
    /** 重置按钮文案。 */
    reset: 'Reset',
    /** 必填输入提示。 */
    required: 'Please input {label}',
    /** 必填选择提示。 */
    selectRequired: 'Please select {label}',
    /** 提交按钮文案。 */
    submit: 'Submit',
  },
  submitPage: {
    /** 取消按钮文案。 */
    cancel: 'Cancel',
    /** 关闭按钮文案。 */
    close: 'Close',
    /** 下一步按钮文案。 */
    next: 'Next',
    /** 上一步按钮文案。 */
    previous: 'Previous',
    /** 提交按钮文案。 */
    submit: 'Submit',
  },
} as const;
