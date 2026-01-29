/**
 * 工具类型定义
 */

/**
 * 深度部分类型
 * @description 递归地将对象所有属性变为可选，正确处理数组类型
 */
export type DeepPartial<T> = T extends (infer U)[]
  ? DeepPartial<U>[]
  : T extends object
    ? { [P in keyof T]?: DeepPartial<T[P]> }
    : T;

/**
 * 深度只读类型
 * @description 递归地将对象所有属性变为只读，正确处理数组类型
 */
export type DeepReadonly<T> = T extends (infer U)[]
  ? readonly DeepReadonly<U>[]
  : T extends object
    ? { readonly [P in keyof T]: DeepReadonly<T[P]> }
    : T;

/**
 * 选择项
 */
export interface SelectOption {
  /** 显示标签 */
  label: string;
  /** 值 */
  value: string;
  /** 是否禁用 */
  disabled?: boolean;
}

/**
 * 平台类型
 */
export type PlatformType = 'linux' | 'macOs' | 'windows';

/**
 * 存储错误类型
 */
export type StorageErrorType = 'read' | 'write' | 'remove' | 'clear' | 'parse';

/**
 * 存储错误信息
 */
export interface StorageError {
  /** 错误类型 */
  type: StorageErrorType;
  /** 操作的键名 */
  key?: string;
  /** 原始错误 */
  error: Error;
}

/**
 * 存储适配器接口
 * @description 可自定义存储实现（localStorage、sessionStorage、IndexedDB 等）
 */
export interface StorageAdapter {
  /** 获取值 */
  getItem<T>(key: string): T | null;
  /** 设置值 */
  setItem<T>(key: string, value: T): void;
  /** 移除值 */
  removeItem(key: string): void;
  /** 清空所有 */
  clear(): void;
  /** 错误处理回调（可选） */
  onError?(error: StorageError): void;
}

/**
 * 国际化适配器接口
 */
export interface I18nAdapter {
  /** 翻译函数 */
  t(key: string, params?: Record<string, unknown>): string;
  /** 当前语言 */
  locale: string;
  /** 设置语言 */
  setLocale(locale: string): void;
}
