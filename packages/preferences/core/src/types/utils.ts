/**
 * 工具类型定义。
 * @description 汇总偏好系统中通用的深度类型、存储契约与国际化适配接口。
 */

/**
 * 深度部分类型。
 * @description 递归将对象所有字段转为可选，并保持数组元素递归可选。
 * @template T 原始类型。
 */
export type DeepPartial<T> = T extends (infer U)[]
  ? DeepPartial<U>[]
  : T extends object
    ? { [P in keyof T]?: DeepPartial<T[P]> }
    : T;

/**
 * 深度只读类型。
 * @description 递归将对象所有字段转为只读，并保持数组元素只读。
 * @template T 原始类型。
 */
export type DeepReadonly<T> = T extends (infer U)[]
  ? readonly DeepReadonly<U>[]
  : T extends object
    ? { readonly [P in keyof T]: DeepReadonly<T[P]> }
    : T;

/**
 * 下拉选择项。
 * @description 统一通用选择器组件的选项数据结构。
 */
export interface SelectOption {
  /** 显示标签。 */
  label: string;
  /** 选项值。 */
  value: string;
  /** 是否禁用。 */
  disabled?: boolean;
}

/**
 * 平台类型。
 * @description 用于区分不同操作系统分支逻辑（快捷键、提示文案等）。
 */
export type PlatformType = 'linux' | 'macOs' | 'windows';

/**
 * 存储错误类型。
 * @description 描述偏好存储层可能出现的读写与解析异常类别。
 */
export type StorageErrorType = 'read' | 'write' | 'remove' | 'clear' | 'parse';

/**
 * 存储错误信息。
 * @description 统一封装存储异常上下文，便于日志记录与容错处理。
 */
export interface StorageError {
  /** 错误类型。 */
  type: StorageErrorType;
  /** 操作的键名。 */
  key?: string;
  /** 原始错误对象。 */
  error: Error;
}

/**
 * 存储适配器接口。
 * @description 可自定义存储实现（localStorage、sessionStorage、IndexedDB 等）。
 */
export interface StorageAdapter {
  /**
   * 读取值。
   * @template T 返回值类型。
   * @param key 存储键。
   * @returns 对应值，不存在时返回 `null`。
   */
  getItem<T>(key: string): T | null;
  /**
   * 写入值。
   * @template T 写入值类型。
   * @param key 存储键。
   * @param value 待写入值。
   * @returns 无返回值。
   */
  setItem<T>(key: string, value: T): void;
  /**
   * 移除单个键值。
   * @param key 存储键。
   * @returns 无返回值。
   */
  removeItem(key: string): void;
  /**
   * 清空全部数据。
   * @returns 无返回值。
   */
  clear(): void;
  /** 错误处理回调（可选）。 */
  onError?(error: StorageError): void;
}

/**
 * 国际化适配器接口。
 * @description 抽象语言读取、切换与翻译能力，支持接入外部 i18n 实现。
 */
export interface I18nAdapter {
  /**
   * 翻译函数。
   * @param key 文案键。
   * @param params 插值参数。
   * @returns 翻译后的文本。
   */
  t(key: string, params?: Record<string, unknown>): string;
  /** 当前语言。 */
  locale: string;
  /**
   * 设置当前语言。
   * @param locale 目标语言。
   * @returns 无返回值。
   */
  setLocale(locale: string): void;
}
