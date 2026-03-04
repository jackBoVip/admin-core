/** 表单内部状态相关属性键集合。 */
export const ADMIN_STATE_ATTR_KEYS = [
  'aria-invalid',
  'data-admin-invalid',
  'data-admin-status',
] as const;

/**
 * 组件状态属性集合。
 */
export type AdminStateAttrs = {
  /** 无障碍错误态标记。 */
  'aria-invalid'?: boolean;
  /** 内部错误态标记。 */
  'data-admin-invalid'?: string;
  /** 内部状态值。 */
  'data-admin-status'?: string;
};

/**
 * 归一化原生输入值，将空值转换为空字符串。
 * @param value 原始输入值。
 * @returns 归一化后的值。
 */
export function normalizeNativeInputValue(value: any) {
  return value === undefined || value === null ? '' : value;
}

/**
 * 解析原生组件 model 值，model 未定义时回退到默认值。
 * @param modelValue 组件 model 值。
 * @param value 默认值。
 * @returns 最终值。
 */
export function resolveNativeModelValue(modelValue: any, value: any) {
  return modelValue === undefined ? value : modelValue;
}

/**
 * 判断原生输入值是否为空。
 * @param value 输入值。
 * @returns 是否为空值。
 */
export function isNativeEmptyValue(value: any) {
  return value === '' || value === null || value === undefined;
}

/**
 * 从属性对象中提取内部状态属性。
 * @param input 原始属性对象。
 * @returns 状态属性对象。
 */
export function pickAdminStateAttrs(
  input: Record<string, any> | undefined
): AdminStateAttrs {
  const source = input ?? {};
  return {
    'aria-invalid': source['aria-invalid'],
    'data-admin-invalid': source['data-admin-invalid'],
    'data-admin-status': source['data-admin-status'],
  };
}

/**
 * 返回移除指定键后的新对象。
 * @param input 原始对象。
 * @param keys 需要剔除的键列表。
 * @returns 过滤后的对象。
 */
export function omitRecordKeys(
  input: Record<string, any> | undefined,
  keys: readonly string[]
) {
  const source = input ?? {};
  const output: Record<string, any> = {};
  for (const [key, value] of Object.entries(source)) {
    if (!keys.includes(key)) {
      output[key] = value;
    }
  }
  return output;
}

/**
 * 合并基础类名与可选类名。
 * @param base 基础类名。
 * @param className 额外类名。
 * @returns 合并后的类名。
 */
export function mergeClassValue(base: string, className?: string | null) {
  return className ? `${base} ${className}` : base;
}

/**
 * 在集合值中切换目标项。
 * @param current 当前集合值。
 * @param value 目标值。
 * @param checked 是否选中目标值。
 * @returns 变更后的集合数组。
 */
export function toggleCollectionValue(
  current: any[] | undefined,
  value: any,
  checked: boolean
) {
  const nextSet = new Set(current ?? []);
  if (checked) {
    nextSet.add(value);
  } else {
    nextSet.delete(value);
  }
  return [...nextSet];
}

/**
 * 规范化日期区间值，确保始终返回长度为 2 的字符串元组。
 * @param value 原始区间值。
 * @returns 日期区间值。
 */
export function ensureDateRangeValue(value: any): [string, string] {
  if (!Array.isArray(value)) {
    return ['', ''];
  }
  return [normalizeNativeInputValue(value[0]), normalizeNativeInputValue(value[1])];
}

/**
 * 更新日期区间中的单端值。
 * @param value 当前区间值。
 * @param index 需要更新的位置。
 * @param nextValue 新值。
 * @returns 更新后的区间值。
 */
export function updateDateRangeValue(
  value: [string, string],
  index: 0 | 1,
  nextValue: string
): [string, string] {
  return index === 0 ? [nextValue, value[1]] : [value[0], nextValue];
}
