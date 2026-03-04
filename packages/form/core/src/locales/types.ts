/**
 * 表单模块语言包。
 * @description 用于普通表单与查询表单场景的基础文案集合。
 */
export interface FormLocaleMessages {
  /** 折叠文案。 */
  collapse: string;
  /** 展开文案。 */
  expand: string;
  /** 通用非法输入提示。 */
  invalid: string;
  /** 查询模式提交文案。 */
  querySubmit: string;
  /** 区间值非法提示。 */
  rangeInvalid: string;
  /** 重置文案。 */
  reset: string;
  /** 是否必填。 */
  required: string;
  /** 选择类组件必填提示。 */
  selectRequired: string;
  /** 提交文案。 */
  submit: string;
}

/**
 * 提交页语言包。
 * @description 用于分步提交页弹层场景的动作文案集合。
 */
export interface SubmitPageLocaleMessages {
  /** 取消文案。 */
  cancel: string;
  /** 关闭文案。 */
  close: string;
  /** 下一步文案。 */
  next: string;
  /** 上一步文案。 */
  previous: string;
  /** 提交文案。 */
  submit: string;
}

/**
 * 表单完整语言包。
 * @description 聚合普通表单与提交页两个文案命名空间。
 */
export interface AdminFormLocaleMessages {
  /** 普通表单文案集合。 */
  form: FormLocaleMessages;
  /** 提交页文案集合。 */
  submitPage: SubmitPageLocaleMessages;
}

/**
 * 语言包注册输入（支持局部覆盖）。
 * @description 注册时只需传递需要覆盖的字段，其余字段沿用当前语言包。
 */
export interface LocaleMessageInput {
  /** 表单文案增量。 */
  form?: Partial<FormLocaleMessages>;
  /** 提交页文案增量。 */
  submitPage?: Partial<SubmitPageLocaleMessages>;
}
