/**
 * 表格单元格渲染上下文。
 * @template TRow 行数据类型。
 */
export interface TableRenderContext<
  TRow extends Record<string, any> = Record<string, any>,
> {
  /** 渲染透传属性。 */
  attrs?: Record<string, any>;
  /** 当前列配置。 */
  column: Record<string, any>;
  /** 渲染器配置项。 */
  options?: any[];
  /** 组件属性。 */
  props?: Record<string, any>;
  /** 当前行数据。 */
  row: TRow;
  /** 当前单元格值。 */
  value: any;
}

/**
 * 表格渲染器函数类型。
 * @template TNode 渲染结果类型（ReactNode/VNode/字符串等）。
 */
export type TableRenderer<TNode = unknown> = (
  context: TableRenderContext
) => TNode;

/**
 * 表格渲染器注册表接口。
 * @template TNode 渲染结果类型。
 */
export interface TableRendererRegistry<TNode = unknown> {
  /**
   * 按名称读取渲染器。
   * @param name 渲染器名称。
   * @returns 渲染器函数；未命中时返回 `undefined`。
   */
  get(name: string): TableRenderer<TNode> | undefined;
  /** 列出已注册渲染器名称。 */
  list(): string[];
  /**
   * 注册渲染器。
   * @param name 渲染器名称。
   * @param renderer 渲染函数。
   * @returns 无返回值。
   */
  register(name: string, renderer: TableRenderer<TNode>): void;
  /**
   * 删除渲染器。
   * @param name 渲染器名称。
   * @returns 无返回值。
   */
  remove(name: string): void;
  /**
   * 按名称解析渲染器，不存在时返回 `null`。
   * @param name 渲染器名称。
   * @returns 渲染器函数；未命中时返回 `null`。
   */
  resolve(name: string): TableRenderer<TNode> | null;
}

/**
 * 表格格式化器函数类型。
 * @description 用于将原始值格式化为最终展示值。
 */
export type TableFormatter = (
  value: any,
  context?: {
    /** 当前列配置。 */
    column?: Record<string, any>;
    /** 当前行数据。 */
    row?: Record<string, any>;
  }
) => any;

/**
 * 表格格式化器注册表接口。
 */
export interface TableFormatterRegistry {
  /**
   * 按名称读取格式化器。
   * @param name 格式化器名称。
   * @returns 格式化器函数；未命中时返回 `undefined`。
   */
  get(name: string): TableFormatter | undefined;
  /** 列出已注册格式化器名称。 */
  list(): string[];
  /**
   * 注册格式化器。
   * @param name 格式化器名称。
   * @param formatter 格式化函数。
   * @returns 无返回值。
   */
  register(name: string, formatter: TableFormatter): void;
  /**
   * 删除格式化器。
   * @param name 格式化器名称。
   * @returns 无返回值。
   */
  remove(name: string): void;
}
