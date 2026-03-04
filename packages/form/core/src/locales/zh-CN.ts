/**
 * Form Core 简体中文语言包定义。
 * @description 提供表单动作、校验提示与提交页文案的默认中文文本。
 */
import type { AdminFormLocaleMessages } from './types';

/**
 * 表单模块简体中文语言包。
 */
export const zhCN: AdminFormLocaleMessages = {
  form: {
    /** 收起文案。 */
    collapse: '收起',
    /** 展开文案。 */
    expand: '展开',
    /** 输入无效提示。 */
    invalid: '{label}输入无效',
    /** 查询按钮文案。 */
    querySubmit: '查询',
    /** 区间无效提示。 */
    rangeInvalid: '{label}范围无效',
    /** 重置按钮文案。 */
    reset: '重置',
    /** 必填输入提示。 */
    required: '请输入{label}',
    /** 必填选择提示。 */
    selectRequired: '请选择{label}',
    /** 提交按钮文案。 */
    submit: '提交',
  },
  submitPage: {
    /** 取消按钮文案。 */
    cancel: '取消',
    /** 关闭按钮文案。 */
    close: '关闭',
    /** 下一步按钮文案。 */
    next: '下一步',
    /** 上一步按钮文案。 */
    previous: '上一步',
    /** 提交按钮文案。 */
    submit: '提交',
  },
} as const;
