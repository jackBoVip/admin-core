/**
 * Table Core 行列策略工具。
 * @description 提供行策略、单元格策略条件匹配与样式计算能力。
 */
import type {
  TableCellStrategy,
  TableCellStrategyContext,
  TableCellStrategyRule,
  TableRowStrategy,
  TableRowStrategyContext,
  TableStrategyCondition,
  TableStrategyConfig,
  TableStrategyContextBase,
  TableStrategyResolver,
  TableStrategyStyle,
  TableStrategyWhen,
} from '../types';
import type { TableColumnRecord } from './table-contracts';
import { getColumnValueByPath } from './table-columns';
import {
  isTableNonEmptyString,
  isTablePlainObject,
} from './table-permission';

/**
 * 单元格策略缓存条目。
 */
interface CachedCellStrategyEntry {
  /** 列上 `strategy` 引用。 */
  columnStrategyRef: unknown;
  /** 旧版策略引用。 */
  legacyStrategyRef: unknown;
  /** 全局策略配置引用。 */
  strategyConfigRef: unknown;
  /** 解析后的单元格策略。 */
  value: TableCellStrategy | undefined;
}

/** 按表格实例缓存的单元格策略解析结果。 */
const cachedCellStrategiesByGrid = new WeakMap<
  Record<string, any>,
  WeakMap<TableColumnRecord, Map<string, CachedCellStrategyEntry>>
>();
/** 无 `gridOptions` 场景下的单元格策略缓存。 */
const cachedCellStrategiesWithoutGrid = new WeakMap<
  TableColumnRecord,
  Map<string, CachedCellStrategyEntry>
>();
/** 按表格实例缓存的行策略解析结果。 */
const cachedRowStrategiesByGrid = new WeakMap<
  Record<string, any>,
  {
    /** 旧版行策略引用。 */
    legacyRowStrategyRef: unknown;
    /** 全局策略配置引用。 */
    strategyConfigRef: unknown;
    /** 解析后的行策略数组。 */
    value: TableRowStrategy[];
  }
>();
/** 策略正则缓存容量上限。 */
const STRATEGY_REGEX_CACHE_MAX_SIZE = 200;
/** 策略条件正则编译缓存。 */
const compiledStrategyRegExpCache = new Map<string, null | RegExp>();

const tableFormulaHelpers = {
  /**
   * 绝对值函数。
   * @param value 输入值。
   * @returns 绝对值结果。
   */
  ABS(value: unknown) {
    const next = parseNumberValue(value);
    return Number.isNaN(next) ? 0 : Math.abs(next);
  },
  /**
   * 平均值函数。
   * @param values 输入值列表。
   * @returns 平均值。
   */
  AVG(...values: unknown[]) {
    const list = values
      .map((item) => parseNumberValue(item))
      .filter((item) => !Number.isNaN(item));
    if (list.length <= 0) {
      return 0;
    }
    return list.reduce((sum, value) => sum + value, 0) / list.length;
  },
  /**
   * 条件分支函数。
   * @param condition 条件值。
   * @param onTrue 条件为真时返回值。
   * @param onFalse 条件为假时返回值。
   * @returns 分支结果。
   */
  IF(condition: unknown, onTrue: unknown, onFalse: unknown) {
    return condition ? onTrue : onFalse;
  },
  /**
   * 最大值函数。
   * @param values 输入值列表。
   * @returns 最大值。
   */
  MAX(...values: unknown[]) {
    const list = values
      .map((item) => parseNumberValue(item))
      .filter((item) => !Number.isNaN(item));
    if (list.length <= 0) {
      return 0;
    }
    return Math.max(...list);
  },
  /**
   * 最小值函数。
   * @param values 输入值列表。
   * @returns 最小值。
   */
  MIN(...values: unknown[]) {
    const list = values
      .map((item) => parseNumberValue(item))
      .filter((item) => !Number.isNaN(item));
    if (list.length <= 0) {
      return 0;
    }
    return Math.min(...list);
  },
  /**
   * 四舍五入函数。
   * @param value 输入值。
   * @param digits 小数位数。
   * @returns 四舍五入后的数值。
   */
  ROUND(value: unknown, digits = 0) {
    const numberValue = parseNumberValue(value);
    const digitsValue = parseNumberValue(digits);
    if (Number.isNaN(numberValue)) {
      return 0;
    }
    const precision = Number.isNaN(digitsValue)
      ? 0
      : Math.max(0, Math.min(12, Math.trunc(digitsValue)));
    return Number(numberValue.toFixed(precision));
  },
  /**
   * 求和函数。
   * @param values 输入值列表。
   * @returns 求和结果。
   */
  SUM(...values: unknown[]) {
    return values
      .map((item) => parseNumberValue(item))
      .filter((item) => !Number.isNaN(item))
      .reduce((sum, value) => sum + value, 0);
  },
} as const;

/**
 * 表达式分词类型。
 */
type TableFormulaTokenType =
  | 'colon'
  | 'comma'
  | 'eof'
  | 'identifier'
  | 'number'
  | 'operator'
  | 'paren'
  | 'question'
  | 'string';

/**
 * 表达式词法单元。
 */
interface TableFormulaToken {
  /** 词法类型。 */
  type: TableFormulaTokenType;
  /** 原始词面值。 */
  value: string;
}

/**
 * 表达式 AST 节点定义。
 */
type TableFormulaNode =
  | {
      /** 字面量值。 */
      value: string | number;
      /** 节点类型。 */
      type: 'literal';
    }
  | {
      /** 标识符名称。 */
      name: string;
      /** 节点类型。 */
      type: 'identifier';
    }
  | {
      /** 一元运算参数。 */
      argument: TableFormulaNode;
      /** 一元运算符。 */
      operator: '!' | '+' | '-';
      /** 节点类型。 */
      type: 'unary';
    }
  | {
      /** 左操作数。 */
      left: TableFormulaNode;
      /** 二元运算符。 */
      operator: '%' | '*' | '+' | '-' | '/' | '<' | '<=' | '==' | '===' | '>' | '>=' | '!=' | '!==';
      /** 右操作数。 */
      right: TableFormulaNode;
      /** 节点类型。 */
      type: 'binary';
    }
  | {
      /** 左操作数。 */
      left: TableFormulaNode;
      /** 逻辑运算符。 */
      operator: '&&' | '||';
      /** 右操作数。 */
      right: TableFormulaNode;
      /** 节点类型。 */
      type: 'logical';
    }
  | {
      /** 条件不成立分支。 */
      alternate: TableFormulaNode;
      /** 条件成立分支。 */
      consequent: TableFormulaNode;
      /** 条件表达式。 */
      test: TableFormulaNode;
      /** 节点类型。 */
      type: 'conditional';
    }
  | {
      /** 调用参数。 */
      args: TableFormulaNode[];
      /** 调用函数名。 */
      callee: string;
      /** 节点类型。 */
      type: 'call';
    };

/**
 * 表达式解析器状态。
 */
interface TableFormulaParserState {
  /** 当前读取索引。 */
  index: number;
  /** 分词结果。 */
  tokens: TableFormulaToken[];
}

/** 支持的公式运算符列表，按长操作符优先匹配。 */
const tableFormulaOperators = [
  '===',
  '!==',
  '>=',
  '<=',
  '&&',
  '||',
  '==',
  '!=',
  '+',
  '-',
  '*',
  '/',
  '%',
  '>',
  '<',
  '!',
] as const;

/** 字符串公式编译缓存。 */
const compiledFormulaCache = new Map<string, TableFormulaNode>();
/** 公式编译缓存容量上限。 */
const TABLE_FORMULA_CACHE_MAX_SIZE = 256;

/**
 * 单元格策略解析结果。
 */
export interface ResolvedTableCellStrategyResult {
  /** 样式类名。 */
  className: string;
  /** 是否可点击。 */
  clickable: boolean;
  /** 显示值（可能经过格式化）。 */
  displayValue: any;
  /** 是否覆盖了原始显示值。 */
  hasDisplayOverride: boolean;
  /** 单元格点击处理器。 */
  onClick?: (ctx: TableCellStrategyContext, event?: unknown) => any;
  /** 点击时是否阻止事件冒泡。 */
  stopPropagation: boolean;
  /** 样式配置。 */
  style?: Record<string, any>;
  /** 原始值。 */
  value: any;
}

/**
 * 行策略解析结果。
 */
export interface ResolvedTableRowStrategyResult {
  /** 样式类名。 */
  className: string;
  /** 是否可点击。 */
  clickable: boolean;
  /** 行点击处理器。 */
  onClick?: (ctx: TableRowStrategyContext, event?: unknown) => any;
  /** 点击时是否阻止事件冒泡。 */
  stopPropagation: boolean;
  /** 样式配置。 */
  style?: Record<string, any>;
}

/**
 * 策略点击触发结果。
 */
export interface TriggerTableStrategyClickResult {
  /** 是否因条件不满足而阻断。 */
  blocked: boolean;
  /** 是否已触发处理逻辑。 */
  handled: boolean;
}

/**
 * 将单值或空值规范为数组。
 * @template T 元素类型。
 * @param value 原始值。
 * @returns 数组化后的值。
 */
function toArrayValue<T>(value: null | T | T[] | undefined) {
  if (Array.isArray(value)) {
    return value;
  }
  if (value === undefined || value === null) {
    return [] as T[];
  }
  return [value];
}

/**
 * 合并 className 输入为单个字符串。
 * @param values class 片段列表。
 * @returns 合并后的 className。
 */
function joinClassNames(...values: unknown[]) {
  return values
    .flatMap((value) => String(value ?? '').split(' '))
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .join(' ');
}

/**
 * 规范化样式值。
 * 数值会自动补 `px`，空值返回 `undefined`。
 * @param value 原始样式值。
 * @returns 规范化后的样式值。
 */
function normalizeStyleValue(value: unknown) {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value === 'number') {
    return `${value}px`;
  }
  if (typeof value === 'string') {
    const next = value.trim();
    return next.length > 0 ? next : undefined;
  }
  return undefined;
}

/**
 * 合并策略样式对象。
 * @param base 基础样式。
 * @param patch 补丁样式。
 * @returns 合并后的样式对象。
 */
function mergeTableStrategyStyle(
  base: Record<string, any> | undefined,
  patch: Record<string, any> | undefined
) {
  if (!base && !patch) {
    return undefined;
  }
  return {
    ...(base ?? {}),
    ...(patch ?? {}),
  };
}

/**
 * 构建策略样式对象。
 * 会将快捷字段（如 `fontSize`/`lineHeight`）转换为可直接渲染的样式。
 * @param source 样式来源配置。
 * @returns 最终样式对象；无样式时返回 `undefined`。
 */
function buildTableStrategyStyle(
  source: null | TableStrategyStyle | undefined
) {
  const style = mergeTableStrategyStyle(undefined, source?.style);
  const nextStyle = {
    ...(style ?? {}),
  } as Record<string, any>;
  if (source?.backgroundColor) {
    nextStyle.backgroundColor = source.backgroundColor;
  }
  if (source?.color) {
    nextStyle.color = source.color;
  }
  if (source?.cursor) {
    nextStyle.cursor = source.cursor;
  }
  const fontSize = normalizeStyleValue(source?.fontSize);
  if (fontSize) {
    nextStyle.fontSize = fontSize;
  }
  if (source?.fontWeight !== undefined && source?.fontWeight !== null) {
    nextStyle.fontWeight = source.fontWeight;
  }
  const lineHeight = normalizeStyleValue(source?.lineHeight);
  if (lineHeight) {
    nextStyle.lineHeight = lineHeight;
  }
  if (source?.textDecoration) {
    nextStyle.textDecoration = source.textDecoration;
  }
  return Object.keys(nextStyle).length > 0 ? nextStyle : undefined;
}

/**
 * 将输入解析为数字。
 * @param value 原始值。
 * @returns 有效数字，无法解析时返回 `NaN`。
 */
function parseNumberValue(value: unknown) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : NaN;
  }
  if (typeof value === 'string') {
    const next = Number(value);
    return Number.isFinite(next) ? next : NaN;
  }
  return NaN;
}

/**
 * 获取或创建缓存的正则表达式实例。
 * 内部使用 LRU 风格淘汰策略限制缓存大小。
 * @param pattern 正则模式。
 * @param flags 正则标记。
 * @returns 匹配器实例；构建失败时返回 `null`。
 */
function getCachedStrategyRegExp(pattern: string, flags = ''): null | RegExp {
  const cacheKey = `${flags}\u0000${pattern}`;
  if (compiledStrategyRegExpCache.has(cacheKey)) {
    const cached = compiledStrategyRegExpCache.get(cacheKey) ?? null;
    compiledStrategyRegExpCache.delete(cacheKey);
    compiledStrategyRegExpCache.set(cacheKey, cached);
    return cached;
  }
  let resolved: null | RegExp = null;
  try {
    resolved = new RegExp(pattern, flags);
  } catch {
    resolved = null;
  }
  if (compiledStrategyRegExpCache.size >= STRATEGY_REGEX_CACHE_MAX_SIZE) {
    const firstKey = compiledStrategyRegExpCache.keys().next().value as
      | string
      | undefined;
    if (firstKey) {
      compiledStrategyRegExpCache.delete(firstKey);
    }
  }
  compiledStrategyRegExpCache.set(cacheKey, resolved);
  return resolved;
}

/**
 * 解析策略配置中的正则匹配器。
 * 支持 `RegExp`、`/pattern/flags` 字符串和 `{ pattern, flags }` 对象。
 * @param source 原始匹配配置。
 * @returns 解析后的正则实例；无效时返回 `null`。
 */
function resolveStrategyRegExp(source: unknown): null | RegExp {
  if (source instanceof RegExp) {
    return getCachedStrategyRegExp(source.source, source.flags);
  }
  if (typeof source === 'string') {
    const input = source.trim();
    if (!input) {
      return null;
    }
    const match = input.match(/^\/(.+)\/([a-z]*)$/i);
    if (match) {
      return getCachedStrategyRegExp(match[1] ?? '', match[2] ?? '');
    }
    return getCachedStrategyRegExp(input);
  }
  if (isTablePlainObject(source)) {
    const pattern = (source as Record<string, any>).pattern;
    const flags = (source as Record<string, any>).flags;
    if (typeof pattern !== 'string' || pattern.trim() === '') {
      return null;
    }
    if (flags !== undefined && typeof flags !== 'string') {
      return null;
    }
    return getCachedStrategyRegExp(
      pattern,
      typeof flags === 'string' ? flags : ''
    );
  }
  return null;
}

/**
 * 使用策略正则匹配输入值。
 * @param value 待匹配值。
 * @param matcher 匹配器来源。
 * @returns 匹配结果。
 */
function testStrategyRegExp(value: unknown, matcher: unknown) {
  const regex = resolveStrategyRegExp(matcher);
  if (!regex) {
    return false;
  }
  regex.lastIndex = 0;
  return regex.test(String(value ?? ''));
}

/**
 * 按指定操作符比较策略条件值。
 * @param left 左值。
 * @param right 右值。
 * @param op 比较操作符。
 * @returns 比较结果。
 */
function compareStrategyValues(
  left: unknown,
  right: unknown,
  op: string
): boolean {
  if (op === 'eq') {
    return left === right;
  }
  if (op === 'neq') {
    return left !== right;
  }
  if (op === 'empty') {
    return (
      left === undefined ||
      left === null ||
      (typeof left === 'string' && left.trim() === '') ||
      (Array.isArray(left) && left.length <= 0)
    );
  }
  if (op === 'notEmpty') {
    return !compareStrategyValues(left, undefined, 'empty');
  }
  if (op === 'truthy') {
    return !!left;
  }
  if (op === 'falsy') {
    return !left;
  }
  if (op === 'in') {
    return Array.isArray(right) && right.includes(left);
  }
  if (op === 'notIn') {
    return Array.isArray(right) && !right.includes(left);
  }
  if (op === 'includes' || op === 'contains') {
    if (Array.isArray(left)) {
      return left.includes(right);
    }
    return String(left ?? '').includes(String(right ?? ''));
  }
  if (op === 'startsWith') {
    return String(left ?? '').startsWith(String(right ?? ''));
  }
  if (op === 'endsWith') {
    return String(left ?? '').endsWith(String(right ?? ''));
  }
  if (op === 'regex') {
    return testStrategyRegExp(left, right);
  }
  if (op === 'notRegex') {
    return !testStrategyRegExp(left, right);
  }
  if (op === 'between') {
    const [min, max] = Array.isArray(right)
      ? right
      : [undefined, undefined];
    const leftNumber = parseNumberValue(left);
    const minNumber = parseNumberValue(min);
    const maxNumber = parseNumberValue(max);
    if (
      Number.isNaN(leftNumber) ||
      Number.isNaN(minNumber) ||
      Number.isNaN(maxNumber)
    ) {
      return false;
    }
    return leftNumber >= minNumber && leftNumber <= maxNumber;
  }
  const leftNumber = parseNumberValue(left);
  const rightNumber = parseNumberValue(right);
  if (!Number.isNaN(leftNumber) && !Number.isNaN(rightNumber)) {
    if (op === 'gt') {
      return leftNumber > rightNumber;
    }
    if (op === 'gte') {
      return leftNumber >= rightNumber;
    }
    if (op === 'lt') {
      return leftNumber < rightNumber;
    }
    if (op === 'lte') {
      return leftNumber <= rightNumber;
    }
  }
  const leftText = String(left ?? '');
  const rightText = String(right ?? '');
  if (op === 'gt') {
    return leftText > rightText;
  }
  if (op === 'gte') {
    return leftText >= rightText;
  }
  if (op === 'lt') {
    return leftText < rightText;
  }
  if (op === 'lte') {
    return leftText <= rightText;
  }
  return false;
}

/**
 * 解析策略上下文值。
 * 支持静态值与函数值，函数执行异常时返回 `undefined`。
 * @template TContext 上下文类型。
 * @param source 策略值来源。
 * @param ctx 运行时上下文。
 * @returns 解析后的值。
 */
function resolveStrategyContextValue<TContext>(
  source: TableStrategyResolver<TContext> | undefined,
  ctx: TContext
) {
  if (typeof source === 'function') {
    try {
      return source(ctx);
    } catch {
      return undefined;
    }
  }
  return source;
}

/**
 * 执行对象形式策略条件判断。
 * @template TContext 上下文类型。
 * @param condition 条件对象。
 * @param ctx 运行时上下文。
 * @returns 条件命中结果。
 */
function evaluateStrategyConditionObject<TContext extends TableStrategyContextBase>(
  condition: TableStrategyCondition,
  ctx: TContext
): boolean {
  if (!isTablePlainObject(condition)) {
    return false;
  }
  const andList = toArrayValue(condition.and);
  if (andList.length > 0) {
    return andList.every((item) =>
      evaluateStrategyCondition(item as TableStrategyCondition, ctx)
    );
  }

  const orList = toArrayValue(condition.or);
  if (orList.length > 0) {
    return orList.some((item) =>
      evaluateStrategyCondition(item as TableStrategyCondition, ctx)
    );
  }

  if (condition.not) {
    return !evaluateStrategyCondition(condition.not, ctx);
  }

  const leftValue = isTableNonEmptyString(condition.field)
    ? ctx.getValue(condition.field.trim())
    : ctx.value;

  if (Object.prototype.hasOwnProperty.call(condition, 'between')) {
    return compareStrategyValues(leftValue, condition.between, 'between');
  }
  if (Object.prototype.hasOwnProperty.call(condition, 'in')) {
    return compareStrategyValues(leftValue, condition.in, 'in');
  }
  if (Object.prototype.hasOwnProperty.call(condition, 'notIn')) {
    return compareStrategyValues(leftValue, condition.notIn, 'notIn');
  }
  if (Object.prototype.hasOwnProperty.call(condition, 'gt')) {
    return compareStrategyValues(leftValue, condition.gt, 'gt');
  }
  if (Object.prototype.hasOwnProperty.call(condition, 'gte')) {
    return compareStrategyValues(leftValue, condition.gte, 'gte');
  }
  if (Object.prototype.hasOwnProperty.call(condition, 'lt')) {
    return compareStrategyValues(leftValue, condition.lt, 'lt');
  }
  if (Object.prototype.hasOwnProperty.call(condition, 'lte')) {
    return compareStrategyValues(leftValue, condition.lte, 'lte');
  }
  if (Object.prototype.hasOwnProperty.call(condition, 'eq')) {
    return compareStrategyValues(leftValue, condition.eq, 'eq');
  }
  if (Object.prototype.hasOwnProperty.call(condition, 'neq')) {
    return compareStrategyValues(leftValue, condition.neq, 'neq');
  }
  if (Object.prototype.hasOwnProperty.call(condition, 'includes')) {
    return compareStrategyValues(leftValue, condition.includes, 'includes');
  }
  if (Object.prototype.hasOwnProperty.call(condition, 'startsWith')) {
    return compareStrategyValues(leftValue, condition.startsWith, 'startsWith');
  }
  if (Object.prototype.hasOwnProperty.call(condition, 'regex')) {
    return compareStrategyValues(leftValue, condition.regex, 'regex');
  }
  if (Object.prototype.hasOwnProperty.call(condition, 'notRegex')) {
    return compareStrategyValues(leftValue, condition.notRegex, 'notRegex');
  }
  if (Object.prototype.hasOwnProperty.call(condition, 'empty')) {
    return condition.empty === true
      ? compareStrategyValues(leftValue, undefined, 'empty')
      : compareStrategyValues(leftValue, undefined, 'notEmpty');
  }
  if (Object.prototype.hasOwnProperty.call(condition, 'notEmpty')) {
    return condition.notEmpty === true
      ? compareStrategyValues(leftValue, undefined, 'notEmpty')
      : compareStrategyValues(leftValue, undefined, 'empty');
  }
  if (Object.prototype.hasOwnProperty.call(condition, 'truthy')) {
    return condition.truthy === true
      ? compareStrategyValues(leftValue, undefined, 'truthy')
      : compareStrategyValues(leftValue, undefined, 'falsy');
  }
  if (Object.prototype.hasOwnProperty.call(condition, 'falsy')) {
    return condition.falsy === true
      ? compareStrategyValues(leftValue, undefined, 'falsy')
      : compareStrategyValues(leftValue, undefined, 'truthy');
  }

  const op = typeof condition.op === 'string'
    ? condition.op.trim()
    : '';
  if (op) {
    const compareTarget = Object.prototype.hasOwnProperty.call(condition, 'target')
      ? condition.target
      : condition.value;
    return compareStrategyValues(leftValue, compareTarget, op);
  }

  if (Object.prototype.hasOwnProperty.call(condition, 'value')) {
    return compareStrategyValues(leftValue, condition.value, 'eq');
  }

  return !!leftValue;
}

/**
 * 统一判断策略条件。
 * 支持布尔值、函数与对象条件表达式。
 * @template TContext 上下文类型。
 * @param when 条件配置。
 * @param ctx 运行时上下文。
 * @returns 条件命中结果。
 */
function evaluateStrategyCondition<TContext extends TableStrategyContextBase>(
  when: null | TableStrategyWhen<TContext> | undefined,
  ctx: TContext
): boolean {
  if (typeof when === 'boolean') {
    return when;
  }
  if (typeof when === 'function') {
    try {
      return !!when(ctx);
    } catch {
      return false;
    }
  }
  if (isTablePlainObject(when)) {
    return evaluateStrategyConditionObject(when as TableStrategyCondition, ctx);
  }
  return true;
}

/**
 * 读取单元格策略缓存条目。
 * @param column 列配置对象。
 * @param field 列字段名。
 * @param gridOptions 表格配置对象。
 * @returns 缓存条目；不存在时返回 `undefined`。
 */
function getCachedCellStrategyEntry(
  column: TableColumnRecord,
  field: string,
  gridOptions?: Record<string, any>
) {
  if (gridOptions) {
    let cacheByColumn = cachedCellStrategiesByGrid.get(gridOptions);
    if (!cacheByColumn) {
      cacheByColumn = new WeakMap<TableColumnRecord, Map<string, CachedCellStrategyEntry>>();
      cachedCellStrategiesByGrid.set(gridOptions, cacheByColumn);
    }
    let cacheByField = cacheByColumn.get(column);
    if (!cacheByField) {
      cacheByField = new Map<string, CachedCellStrategyEntry>();
      cacheByColumn.set(column, cacheByField);
    }
    return cacheByField.get(field);
  }

  let cacheByField = cachedCellStrategiesWithoutGrid.get(column);
  if (!cacheByField) {
    cacheByField = new Map<string, CachedCellStrategyEntry>();
    cachedCellStrategiesWithoutGrid.set(column, cacheByField);
  }
  return cacheByField.get(field);
}

/**
 * 写入单元格策略缓存条目。
 * @param column 列配置对象。
 * @param field 列字段名。
 * @param entry 缓存条目。
 * @param gridOptions 表格配置对象。
 */
function setCachedCellStrategyEntry(
  column: TableColumnRecord,
  field: string,
  entry: CachedCellStrategyEntry,
  gridOptions?: Record<string, any>
) {
  if (gridOptions) {
    let cacheByColumn = cachedCellStrategiesByGrid.get(gridOptions);
    if (!cacheByColumn) {
      cacheByColumn = new WeakMap<TableColumnRecord, Map<string, CachedCellStrategyEntry>>();
      cachedCellStrategiesByGrid.set(gridOptions, cacheByColumn);
    }
    let cacheByField = cacheByColumn.get(column);
    if (!cacheByField) {
      cacheByField = new Map<string, CachedCellStrategyEntry>();
      cacheByColumn.set(column, cacheByField);
    }
    cacheByField.set(field, entry);
    return;
  }

  let cacheByField = cachedCellStrategiesWithoutGrid.get(column);
  if (!cacheByField) {
    cacheByField = new Map<string, CachedCellStrategyEntry>();
    cachedCellStrategiesWithoutGrid.set(column, cacheByField);
  }
  cacheByField.set(field, entry);
}

/**
 * 判断字符是否可作为标识符起始字符。
 * @param char 待判断字符。
 * @returns 是否为合法起始字符。
 */
function isTableFormulaIdentifierStart(char: string) {
  return /[A-Za-z_$]/.test(char);
}

/**
 * 判断字符是否可作为标识符组成字符。
 * @param char 待判断字符。
 * @returns 是否为合法组成字符。
 */
function isTableFormulaIdentifierPart(char: string) {
  return /[A-Za-z0-9_$]/.test(char);
}

/**
 * 表达式分词结果（单次读取）。
 */
type TableFormulaTokenReadResult = {
  /** 下一次读取起始索引。 */
  nextIndex: number;
  /** 读取到的 token。读取失败时为空。 */
  token?: TableFormulaToken;
};

/**
 * 从表达式中读取字符串 token。
 * @param expression 原始表达式。
 * @param startIndex 起始索引。
 * @returns 字符串 token 读取结果。
 */
function readTableFormulaStringToken(
  expression: string,
  startIndex: number
): TableFormulaTokenReadResult {
  const quote = expression[startIndex];
  let currentIndex = startIndex + 1;
  let value = '';
  let escaped = false;

  while (currentIndex < expression.length) {
    const char = expression[currentIndex];
    if (escaped) {
      value += char;
      escaped = false;
      currentIndex += 1;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      currentIndex += 1;
      continue;
    }
    if (char === quote) {
      return {
        nextIndex: currentIndex + 1,
        token: {
          type: 'string',
          value,
        },
      };
    }
    value += char;
    currentIndex += 1;
  }

  return {
    nextIndex: expression.length,
  };
}

/**
 * 从表达式中读取数字 token。
 * @param expression 原始表达式。
 * @param startIndex 起始索引。
 * @returns 数字 token 读取结果。
 */
function readTableFormulaNumberToken(
  expression: string,
  startIndex: number
): TableFormulaTokenReadResult {
  let currentIndex = startIndex;
  let hasDot = false;

  while (currentIndex < expression.length) {
    const char = expression[currentIndex];
    if (char === '.') {
      if (hasDot) {
        break;
      }
      hasDot = true;
      currentIndex += 1;
      continue;
    }
    if (!/[0-9]/.test(char)) {
      break;
    }
    currentIndex += 1;
  }

  const raw = expression.slice(startIndex, currentIndex);
  if (!raw) {
    return {
      nextIndex: startIndex,
    };
  }
  return {
    nextIndex: currentIndex,
    token: {
      type: 'number',
      value: raw,
    },
  };
}

/**
 * 从表达式中读取标识符 token。
 * @param expression 原始表达式。
 * @param startIndex 起始索引。
 * @returns 标识符 token 读取结果。
 */
function readTableFormulaIdentifierToken(
  expression: string,
  startIndex: number
): TableFormulaTokenReadResult {
  if (!isTableFormulaIdentifierStart(expression[startIndex] ?? '')) {
    return {
      nextIndex: startIndex,
    };
  }

  let currentIndex = startIndex + 1;
  while (currentIndex < expression.length) {
    const char = expression[currentIndex];
    if (isTableFormulaIdentifierPart(char)) {
      currentIndex += 1;
      continue;
    }
    if (
      char === '.' &&
      isTableFormulaIdentifierStart(expression[currentIndex + 1] ?? '')
    ) {
      currentIndex += 1;
      continue;
    }
    break;
  }

  return {
    nextIndex: currentIndex,
    token: {
      type: 'identifier',
      value: expression.slice(startIndex, currentIndex),
    },
  };
}

/**
 * 将公式表达式拆分为 token 列表。
 * @param expression 原始表达式。
 * @returns token 列表；分词失败时返回 `undefined`。
 */
function tokenizeTableFormula(
  expression: string
): TableFormulaToken[] | undefined {
  const tokens: TableFormulaToken[] = [];
  let currentIndex = 0;

  while (currentIndex < expression.length) {
    const char = expression[currentIndex];
    if (/\s/.test(char)) {
      currentIndex += 1;
      continue;
    }

    if (char === '"' || char === '\'') {
      const result = readTableFormulaStringToken(expression, currentIndex);
      if (!result.token) {
        return undefined;
      }
      tokens.push(result.token);
      currentIndex = result.nextIndex;
      continue;
    }

    const nextChar = expression[currentIndex + 1] ?? '';
    if (/[0-9]/.test(char) || (char === '.' && /[0-9]/.test(nextChar))) {
      const result = readTableFormulaNumberToken(expression, currentIndex);
      if (!result.token) {
        return undefined;
      }
      tokens.push(result.token);
      currentIndex = result.nextIndex;
      continue;
    }

    if (isTableFormulaIdentifierStart(char)) {
      const result = readTableFormulaIdentifierToken(expression, currentIndex);
      if (!result.token) {
        return undefined;
      }
      tokens.push(result.token);
      currentIndex = result.nextIndex;
      continue;
    }

    const operator = tableFormulaOperators.find((item) =>
      expression.startsWith(item, currentIndex)
    );
    if (operator) {
      tokens.push({
        type: 'operator',
        value: operator,
      });
      currentIndex += operator.length;
      continue;
    }

    if (char === '(' || char === ')') {
      tokens.push({
        type: 'paren',
        value: char,
      });
      currentIndex += 1;
      continue;
    }
    if (char === ',') {
      tokens.push({
        type: 'comma',
        value: char,
      });
      currentIndex += 1;
      continue;
    }
    if (char === '?') {
      tokens.push({
        type: 'question',
        value: char,
      });
      currentIndex += 1;
      continue;
    }
    if (char === ':') {
      tokens.push({
        type: 'colon',
        value: char,
      });
      currentIndex += 1;
      continue;
    }

    return undefined;
  }

  tokens.push({
    type: 'eof',
    value: '',
  });
  return tokens;
}

/**
 * 获取当前解析 token。
 * @param state 解析器状态。
 * @returns 当前 token；越界时返回 eof token。
 */
function getTableFormulaCurrentToken(state: TableFormulaParserState) {
  return state.tokens[state.index] ?? { type: 'eof', value: '' };
}

/**
 * 尝试匹配并消费一个 token。
 * @param state 解析器状态。
 * @param type 目标 token 类型。
 * @param value 可选目标 token 值。
 * @returns 是否匹配成功。
 */
function matchTableFormulaToken(
  state: TableFormulaParserState,
  type: TableFormulaTokenType,
  value?: string
) {
  const current = getTableFormulaCurrentToken(state);
  if (current.type !== type) {
    return false;
  }
  if (value !== undefined && current.value !== value) {
    return false;
  }
  state.index += 1;
  return true;
}

/**
 * 断言并消费一个 token。
 * @param state 解析器状态。
 * @param type 目标 token 类型。
 * @param value 可选目标 token 值。
 * @returns 当前 token。
 */
function expectTableFormulaToken(
  state: TableFormulaParserState,
  type: TableFormulaTokenType,
  value?: string
) {
  const current = getTableFormulaCurrentToken(state);
  if (current.type !== type) {
    throw new Error('Unexpected token type');
  }
  if (value !== undefined && current.value !== value) {
    throw new Error('Unexpected token value');
  }
  state.index += 1;
  return current;
}

/**
 * 解析主表达式节点。
 * @param state 解析器状态。
 * @returns AST 节点。
 */
function parseTableFormulaPrimary(state: TableFormulaParserState): TableFormulaNode {
  const current = getTableFormulaCurrentToken(state);
  if (current.type === 'number') {
    state.index += 1;
    return {
      type: 'literal',
      value: Number(current.value),
    };
  }
  if (current.type === 'string') {
    state.index += 1;
    return {
      type: 'literal',
      value: current.value,
    };
  }
  if (current.type === 'identifier') {
    state.index += 1;
    const identifier = current.value;
    if (matchTableFormulaToken(state, 'paren', '(')) {
      const args: TableFormulaNode[] = [];
      if (!matchTableFormulaToken(state, 'paren', ')')) {
        do {
          args.push(parseTableFormulaConditional(state));
        } while (matchTableFormulaToken(state, 'comma'));
        expectTableFormulaToken(state, 'paren', ')');
      }
      return {
        args,
        callee: identifier,
        type: 'call',
      };
    }
    return {
      name: identifier,
      type: 'identifier',
    };
  }
  if (matchTableFormulaToken(state, 'paren', '(')) {
    const node = parseTableFormulaConditional(state);
    expectTableFormulaToken(state, 'paren', ')');
    return node;
  }
  throw new Error('Invalid formula primary expression');
}

/**
 * 解析一元表达式节点。
 * @param state 解析器状态。
 * @returns AST 节点。
 */
function parseTableFormulaUnary(state: TableFormulaParserState): TableFormulaNode {
  const current = getTableFormulaCurrentToken(state);
  if (
    current.type === 'operator' &&
    (current.value === '!' || current.value === '+' || current.value === '-')
  ) {
    state.index += 1;
    return {
      argument: parseTableFormulaUnary(state),
      operator: current.value,
      type: 'unary',
    };
  }
  return parseTableFormulaPrimary(state);
}

/**
 * 解析乘除模表达式节点。
 * @param state 解析器状态。
 * @returns AST 节点。
 */
function parseTableFormulaMultiplicative(
  state: TableFormulaParserState
): TableFormulaNode {
  let node = parseTableFormulaUnary(state);
  while (true) {
    const current = getTableFormulaCurrentToken(state);
    if (
      current.type !== 'operator' ||
      (current.value !== '*' &&
        current.value !== '/' &&
        current.value !== '%')
    ) {
      break;
    }
    state.index += 1;
    node = {
      left: node,
      operator: current.value,
      right: parseTableFormulaUnary(state),
      type: 'binary',
    };
  }
  return node;
}

/**
 * 解析加减表达式节点。
 * @param state 解析器状态。
 * @returns AST 节点。
 */
function parseTableFormulaAdditive(state: TableFormulaParserState): TableFormulaNode {
  let node = parseTableFormulaMultiplicative(state);
  while (true) {
    const current = getTableFormulaCurrentToken(state);
    if (
      current.type !== 'operator' ||
      (current.value !== '+' && current.value !== '-')
    ) {
      break;
    }
    state.index += 1;
    node = {
      left: node,
      operator: current.value,
      right: parseTableFormulaMultiplicative(state),
      type: 'binary',
    };
  }
  return node;
}

/**
 * 解析比较表达式节点（`< <= > >=`）。
 * @param state 解析器状态。
 * @returns AST 节点。
 */
function parseTableFormulaComparison(
  state: TableFormulaParserState
): TableFormulaNode {
  let node = parseTableFormulaAdditive(state);
  while (true) {
    const current = getTableFormulaCurrentToken(state);
    if (
      current.type !== 'operator' ||
      !['<', '<=', '>', '>='].includes(current.value)
    ) {
      break;
    }
    state.index += 1;
    node = {
      left: node,
      operator: current.value as '<' | '<=' | '>' | '>=',
      right: parseTableFormulaAdditive(state),
      type: 'binary',
    };
  }
  return node;
}

/**
 * 解析相等表达式节点（`== === != !==`）。
 * @param state 解析器状态。
 * @returns AST 节点。
 */
function parseTableFormulaEquality(state: TableFormulaParserState): TableFormulaNode {
  let node = parseTableFormulaComparison(state);
  while (true) {
    const current = getTableFormulaCurrentToken(state);
    if (
      current.type !== 'operator' ||
      !['==', '===', '!=', '!=='].includes(current.value)
    ) {
      break;
    }
    state.index += 1;
    node = {
      left: node,
      operator: current.value as '!=' | '!==' | '==' | '===',
      right: parseTableFormulaComparison(state),
      type: 'binary',
    };
  }
  return node;
}

/**
 * 解析逻辑与表达式节点。
 * @param state 解析器状态。
 * @returns AST 节点。
 */
function parseTableFormulaLogicalAnd(
  state: TableFormulaParserState
): TableFormulaNode {
  let node = parseTableFormulaEquality(state);
  while (matchTableFormulaToken(state, 'operator', '&&')) {
    node = {
      left: node,
      operator: '&&',
      right: parseTableFormulaEquality(state),
      type: 'logical',
    };
  }
  return node;
}

/**
 * 解析逻辑或表达式节点。
 * @param state 解析器状态。
 * @returns AST 节点。
 */
function parseTableFormulaLogicalOr(state: TableFormulaParserState): TableFormulaNode {
  let node = parseTableFormulaLogicalAnd(state);
  while (matchTableFormulaToken(state, 'operator', '||')) {
    node = {
      left: node,
      operator: '||',
      right: parseTableFormulaLogicalAnd(state),
      type: 'logical',
    };
  }
  return node;
}

/**
 * 解析三元条件表达式节点。
 * @param state 解析器状态。
 * @returns AST 节点。
 */
function parseTableFormulaConditional(
  state: TableFormulaParserState
): TableFormulaNode {
  const node = parseTableFormulaLogicalOr(state);
  if (!matchTableFormulaToken(state, 'question')) {
    return node;
  }
  const consequent = parseTableFormulaConditional(state);
  expectTableFormulaToken(state, 'colon');
  const alternate = parseTableFormulaConditional(state);
  return {
    alternate,
    consequent,
    test: node,
    type: 'conditional',
  };
}

/**
 * 递归执行公式 AST 节点。
 * @param node AST 节点。
 * @param row 当前行数据。
 * @param helpers 内置函数集合。
 * @returns 节点计算结果。
 */
function evaluateTableFormulaNode(
  node: TableFormulaNode,
  row: Record<string, any>,
  helpers: typeof tableFormulaHelpers
): any {
  switch (node.type) {
    case 'literal': {
      return node.value;
    }
    case 'identifier': {
      const lowerCaseName = node.name.toLowerCase();
      if (lowerCaseName === 'true') {
        return true;
      }
      if (lowerCaseName === 'false') {
        return false;
      }
      if (lowerCaseName === 'null') {
        return null;
      }
      if (lowerCaseName === 'undefined') {
        return undefined;
      }
      return getColumnValueByPath(row, node.name);
    }
    case 'unary': {
      const value = evaluateTableFormulaNode(node.argument, row, helpers);
      if (node.operator === '!') {
        return !value;
      }
      if (node.operator === '+') {
        return +value;
      }
      return -value;
    }
    case 'binary': {
      const left = evaluateTableFormulaNode(node.left, row, helpers);
      const right = evaluateTableFormulaNode(node.right, row, helpers);
      switch (node.operator) {
        case '*':
          return left * right;
        case '/':
          return left / right;
        case '%':
          return left % right;
        case '+':
          return left + right;
        case '-':
          return left - right;
        case '>':
          return left > right;
        case '>=':
          return left >= right;
        case '<':
          return left < right;
        case '<=':
          return left <= right;
        case '==':
        case '===':
          return left === right;
        case '!=':
        case '!==':
          return left !== right;
      }
      return undefined;
    }
    case 'logical': {
      if (node.operator === '&&') {
        const left = evaluateTableFormulaNode(node.left, row, helpers);
        return left
          ? evaluateTableFormulaNode(node.right, row, helpers)
          : left;
      }
      const left = evaluateTableFormulaNode(node.left, row, helpers);
      return left ? left : evaluateTableFormulaNode(node.right, row, helpers);
    }
    case 'conditional': {
      const test = evaluateTableFormulaNode(node.test, row, helpers);
      return test
        ? evaluateTableFormulaNode(node.consequent, row, helpers)
        : evaluateTableFormulaNode(node.alternate, row, helpers);
    }
    case 'call': {
      const helperName = node.callee.trim().toUpperCase();
      const helper = (helpers as Record<string, (...args: any[]) => any>)[helperName];
      if (typeof helper !== 'function') {
        return undefined;
      }
      const args = node.args.map((arg) => evaluateTableFormulaNode(arg, row, helpers));
      return helper(...args);
    }
  }
}

/**
 * 编译公式字符串为 AST。
 * @param formula 公式字符串。
 * @returns 编译后的 AST；编译失败时返回 `undefined`。
 */
function compileTableFormula(formula: string) {
  if (compiledFormulaCache.has(formula)) {
    const cached = compiledFormulaCache.get(formula);
    if (cached) {
      compiledFormulaCache.delete(formula);
      compiledFormulaCache.set(formula, cached);
    }
    return cached;
  }
  const expression = formula.trim().replace(/^=/, '');
  if (!expression) {
    return undefined;
  }
  try {
    const tokens = tokenizeTableFormula(expression);
    if (!tokens) {
      return undefined;
    }
    const state: TableFormulaParserState = {
      index: 0,
      tokens,
    };
    const compiled = parseTableFormulaConditional(state);
    expectTableFormulaToken(state, 'eof');
    if (compiledFormulaCache.size >= TABLE_FORMULA_CACHE_MAX_SIZE) {
      const firstKey = compiledFormulaCache.keys().next().value as
        | string
        | undefined;
      if (firstKey) {
        compiledFormulaCache.delete(firstKey);
      }
    }
    compiledFormulaCache.set(formula, compiled);
    return compiled;
  } catch {
    return undefined;
  }
}

/**
 * 计算公式值。
 * 支持函数公式与字符串公式。
 * @param formula 公式定义。
 * @param ctx 单元格上下文。
 * @returns 公式计算结果。
 */
function resolveFormulaValue(
  formula: ((ctx: TableCellStrategyContext) => any) | string | undefined,
  ctx: TableCellStrategyContext
) {
  if (!formula) {
    return undefined;
  }
  if (typeof formula === 'function') {
    try {
      return formula(ctx);
    } catch {
      return undefined;
    }
  }
  if (typeof formula !== 'string') {
    return undefined;
  }
  const compiled = compileTableFormula(formula);
  if (!compiled) {
    return undefined;
  }
  try {
    return evaluateTableFormulaNode(compiled, ctx.row, tableFormulaHelpers);
  } catch {
    return undefined;
  }
}

/**
 * 对数值应用精度控制。
 * @param value 原始值。
 * @param precision 精度配置。
 * @returns 应用精度后的值。
 */
function applyNumericPrecision(value: unknown, precision: unknown) {
  if (precision === undefined || precision === null || precision === '') {
    return value;
  }
  const numberValue = parseNumberValue(value);
  if (Number.isNaN(numberValue)) {
    return value;
  }
  const precisionValue = parseNumberValue(precision);
  if (Number.isNaN(precisionValue)) {
    return value;
  }
  const digits = Math.max(0, Math.min(12, Math.trunc(precisionValue)));
  return Number(numberValue.toFixed(digits));
}

/**
 * 对单元格显示值应用装饰配置。
 * @param value 原始显示值。
 * @param config 装饰配置。
 * @param ctx 单元格上下文。
 * @returns 装饰后的显示值与覆盖状态。
 */
function applyCellDisplayDecorators(
  value: unknown,
  config: Pick<
    TableCellStrategy,
    'prefix' | 'suffix' | 'text' | 'unit' | 'unitSeparator'
  >,
  ctx: TableCellStrategyContext
) {
  const textValue = resolveStrategyContextValue(config.text, ctx);
  const prefixValue = resolveStrategyContextValue(config.prefix, ctx);
  const suffixValue = resolveStrategyContextValue(config.suffix, ctx);
  const unitValue = resolveStrategyContextValue(config.unit, ctx);
  const hasDecorator =
    textValue !== undefined ||
    prefixValue !== undefined ||
    suffixValue !== undefined ||
    unitValue !== undefined;
  if (!hasDecorator) {
    return {
      hasDisplayOverride: false,
      value,
    };
  }
  let next = textValue !== undefined ? textValue : value;
  const separator = isTableNonEmptyString(config.unitSeparator)
    ? config.unitSeparator
    : '';
  const prefixText = prefixValue === undefined || prefixValue === null
    ? ''
    : String(prefixValue);
  const suffixText = suffixValue === undefined || suffixValue === null
    ? ''
    : String(suffixValue);
  const unitText = unitValue === undefined || unitValue === null
    ? ''
    : String(unitValue);
  if (
    prefixText ||
    suffixText ||
    unitText
  ) {
    const baseText = next === undefined || next === null
      ? ''
      : String(next);
    next = `${prefixText}${baseText}${suffixText}${unitText ? `${separator}${unitText}` : ''}`;
  }
  return {
    hasDisplayOverride: true,
    value: next,
  };
}

/**
 * 规范化表格策略总配置。
 * @param value 原始配置值。
 * @returns 合法策略配置；无效时返回 `undefined`。
 */
function normalizeTableStrategyConfig(
  value: unknown
): TableStrategyConfig | undefined {
  return isTablePlainObject(value)
    ? (value as TableStrategyConfig)
    : undefined;
}

/**
 * 解析单元格策略映射来源。
 * 同时兼容新旧配置结构。
 * @param gridOptions 表格配置对象。
 * @returns 新旧策略映射集合。
 */
function resolveCellStrategyMap(
  gridOptions: Record<string, any> | undefined
) {
  const strategyConfig = normalizeTableStrategyConfig(gridOptions?.strategy);
  const strategyColumns = strategyConfig?.columns;
  const legacyColumns = isTablePlainObject(gridOptions?.cellStrategy)
    ? (gridOptions?.cellStrategy as Record<string, TableCellStrategy>)
    : undefined;
  return {
    strategyColumns: isTablePlainObject(strategyColumns)
      ? (strategyColumns as Record<string, TableCellStrategy>)
      : undefined,
    legacyColumns,
  };
}

/**
 * 按列相关键从策略映射中查找策略。
 * @param map 策略映射。
 * @param column 列配置对象。
 * @param field 字段名。
 * @returns 命中的单元格策略。
 */
function resolveStrategyByColumnKey(
  map: Record<string, TableCellStrategy> | undefined,
  column: TableColumnRecord,
  field: string
) {
  if (!map) {
    return undefined;
  }
  const candidates = [
    field,
    typeof column.field === 'string' ? column.field : undefined,
    typeof column.dataIndex === 'string' ? column.dataIndex : undefined,
    typeof column.key === 'string' ? column.key : undefined,
  ].filter((item): item is string => !!item && item.trim().length > 0);

  for (const key of candidates) {
    const item = map[key];
    if (isTablePlainObject(item)) {
      return item as TableCellStrategy;
    }
  }
  return undefined;
}

/**
 * 合并两个单元格策略配置。
 * 规则数组会按先后顺序拼接。
 * @param base 基础策略。
 * @param override 覆盖策略。
 * @returns 合并后的策略。
 */
function mergeCellStrategies(
  base: null | TableCellStrategy | undefined,
  override: null | TableCellStrategy | undefined
): TableCellStrategy | undefined {
  if (!base && !override) {
    return undefined;
  }
  const baseRules = Array.isArray(base?.rules) ? base.rules : [];
  const overrideRules = Array.isArray(override?.rules) ? override.rules : [];
  const className = joinClassNames(base?.className, override?.className);
  return {
    ...(base ?? {}),
    ...(override ?? {}),
    className: className || undefined,
    rules: [...baseRules, ...overrideRules],
    style: {
      ...(base?.style ?? {}),
      ...(override?.style ?? {}),
    },
  };
}

/**
 * 解析单元格最终策略。
 * 合并顺序：列内策略 > 新版配置映射 > 旧版配置映射。
 * @param column 列配置。
 * @param field 字段名。
 * @param gridOptions 表格配置。
 * @returns 单元格策略；无可用策略时返回 `undefined`。
 */
export function resolveTableCellStrategy(
  column: TableColumnRecord,
  field: string,
  gridOptions?: Record<string, any>
) {
  const normalizedField = isTableNonEmptyString(field) ? field.trim() : '';
  const cached = getCachedCellStrategyEntry(column, normalizedField, gridOptions);
  const currentEntryRefs = {
    columnStrategyRef: column?.strategy,
    legacyStrategyRef: gridOptions?.cellStrategy,
    strategyConfigRef: gridOptions?.strategy,
  };
  if (
    cached &&
    cached.columnStrategyRef === currentEntryRefs.columnStrategyRef &&
    cached.legacyStrategyRef === currentEntryRefs.legacyStrategyRef &&
    cached.strategyConfigRef === currentEntryRefs.strategyConfigRef
  ) {
    return cached.value;
  }

  const strategyFromColumn = isTablePlainObject(column?.strategy)
    ? (column.strategy as TableCellStrategy)
    : undefined;
  const { legacyColumns, strategyColumns } = resolveCellStrategyMap(gridOptions);
  const strategyFromStrategyMap = resolveStrategyByColumnKey(
    strategyColumns,
    column,
    field
  );
  const strategyFromLegacyMap = resolveStrategyByColumnKey(
    legacyColumns,
    column,
    field
  );
  const resolved = mergeCellStrategies(
    mergeCellStrategies(strategyFromLegacyMap, strategyFromStrategyMap),
    strategyFromColumn
  );
  setCachedCellStrategyEntry(
    column,
    normalizedField,
    {
      ...currentEntryRefs,
      value: resolved,
    },
    gridOptions
  );
  return resolved;
}

/**
 * 解析行策略列表。
 * 合并来源：`strategy.rows` 与 `rowStrategy`。
 * @param gridOptions 表格配置对象。
 * @returns 可用行策略数组。
 */
export function resolveTableRowStrategies(
  gridOptions?: Record<string, any>
) {
  if (gridOptions) {
    const cached = cachedRowStrategiesByGrid.get(gridOptions);
    if (
      cached &&
      cached.legacyRowStrategyRef === gridOptions.rowStrategy &&
      cached.strategyConfigRef === gridOptions.strategy
    ) {
      return cached.value;
    }
  }

  const strategyConfig = normalizeTableStrategyConfig(gridOptions?.strategy);
  const rowsFromStrategy = Array.isArray(strategyConfig?.rows)
    ? strategyConfig.rows
    : [];
  const rowsFromLegacy = Array.isArray(gridOptions?.rowStrategy)
    ? (gridOptions?.rowStrategy as TableRowStrategy[])
    : [];
  const resolved = [...rowsFromStrategy, ...rowsFromLegacy].filter((item) =>
    isTablePlainObject(item)
  ) as TableRowStrategy[];
  if (gridOptions) {
    cachedRowStrategiesByGrid.set(gridOptions, {
      legacyRowStrategyRef: gridOptions.rowStrategy,
      strategyConfigRef: gridOptions.strategy,
      value: resolved,
    });
  }
  return resolved;
}

/**
 * 解析单元格基础值。
 * 优先级：`formula` > `compute` > `value` > 当前值。
 * @param strategy 单元格策略。
 * @param ctx 单元格上下文。
 * @returns 解析后的基础值。
 */
function resolveCellBaseValue(
  strategy: TableCellStrategy,
  ctx: TableCellStrategyContext
) {
  const formulaValue = resolveFormulaValue(strategy.formula, ctx);
  if (formulaValue !== undefined) {
    return formulaValue;
  }
  const computedValue = resolveStrategyContextValue(strategy.compute, ctx);
  if (computedValue !== undefined) {
    return computedValue;
  }
  const explicitValue = resolveStrategyContextValue(strategy.value, ctx);
  if (explicitValue !== undefined) {
    return explicitValue;
  }
  return ctx.value;
}

/**
 * 可变的单元格策略视觉状态。
 * 用于在规则命中时累积样式与交互信息。
 */
interface MutableCellStrategyVisual {
  /** 样式类名。 */
  className: string;
  /** 是否可点击。 */
  clickable: boolean;
  /** 单元格点击处理器。 */
  onClick?: (ctx: TableCellStrategyContext, event?: unknown) => any;
  /** 点击时是否阻止冒泡。 */
  stopPropagation: boolean;
  /** 样式配置。 */
  style?: Record<string, any>;
}

/**
 * 将策略规则应用到单元格视觉状态。
 * @param target 目标视觉状态。
 * @param rule 策略规则。
 * @returns 无返回值。
 */
function applyCellStyleRule(
  target: MutableCellStrategyVisual,
  rule: TableCellStrategy | TableCellStrategyRule
) {
  target.className = joinClassNames(target.className, rule.className);
  target.style = mergeTableStrategyStyle(
    target.style,
    buildTableStrategyStyle(rule)
  );
  if (rule.clickable === true) {
    target.clickable = true;
  }
  if (typeof rule.onClick === 'function') {
    target.onClick = rule.onClick as (
      ctx: TableCellStrategyContext,
      event?: unknown
    ) => any;
  }
  if (typeof rule.stopPropagation === 'boolean') {
    target.stopPropagation = rule.stopPropagation;
  }
}

/**
 * 解析规则命中后的值。
 * 优先级：`formula` > `compute` > `value` > 当前值。
 * @param rule 策略规则。
 * @param ctx 单元格上下文。
 * @returns 规则计算结果。
 */
function resolveCellRuleValue(
  rule: TableCellStrategyRule,
  ctx: TableCellStrategyContext
) {
  const formulaValue = resolveFormulaValue(rule.formula, ctx);
  if (formulaValue !== undefined) {
    return formulaValue;
  }
  const computedValue = resolveStrategyContextValue(rule.compute, ctx);
  if (computedValue !== undefined) {
    return computedValue;
  }
  const explicitValue = resolveStrategyContextValue(rule.value, ctx);
  if (explicitValue !== undefined) {
    return explicitValue;
  }
  return ctx.value;
}

/**
 * 计算单元格策略最终渲染结果。
 * @param options 计算参数。
 * @returns 单元格策略渲染结果；无策略时返回 `undefined`。
 */
export interface ResolveTableCellStrategyResultOptions {
  /** 列配置。 */
  column: TableColumnRecord;
  /** 字段名。 */
  field: string;
  /** 表格配置。 */
  gridOptions?: Record<string, any>;
  /** 行数据。 */
  row: Record<string, any>;
  /** 行索引。 */
  rowIndex: number;
  /** 原始值。 */
  value: any;
}

/**
 * 计算单元格策略最终渲染结果。
 * @param options 计算参数。
 * @returns 单元格策略渲染结果；无策略时返回 `undefined`。
 */
export function resolveTableCellStrategyResult(
  options: ResolveTableCellStrategyResultOptions
) {
  const strategy = resolveTableCellStrategy(
    options.column,
    options.field,
    options.gridOptions
  );
  if (!strategy) {
    return undefined;
  }

  const ctx: TableCellStrategyContext = {
    column: options.column,
    field: options.field,
    /**
     * 读取当前行指定字段值。
     * @param field 目标字段，未传时使用当前字段。
     * @returns 字段值。
     */
    getValue(field) {
      return getColumnValueByPath(options.row, field ?? options.field);
    },
    row: options.row,
    rowIndex: options.rowIndex,
    value: options.value,
  };

  const visual = {
    className: '',
    clickable: false,
    onClick: undefined as
      | ((ctx: TableCellStrategyContext, event?: unknown) => any)
      | undefined,
    stopPropagation: strategy.stopPropagation !== false,
    style: undefined as Record<string, any> | undefined,
  };

  let currentValue = resolveCellBaseValue(strategy, ctx);
  currentValue = applyNumericPrecision(currentValue, strategy.precision);
  ctx.value = currentValue;

  applyCellStyleRule(visual, strategy);

  let displayResult = applyCellDisplayDecorators(currentValue, strategy, ctx);

  const rules = Array.isArray(strategy.rules) ? strategy.rules : [];
  rules.forEach((rule) => {
    if (!evaluateStrategyCondition(rule.when, ctx)) {
      return;
    }
    applyCellStyleRule(visual, rule);
    let nextValue = resolveCellRuleValue(rule, ctx);
    nextValue = applyNumericPrecision(nextValue, rule.precision);
    ctx.value = nextValue;
    currentValue = nextValue;
    const nextDisplayResult = applyCellDisplayDecorators(
      currentValue,
      rule,
      ctx
    );
    if (nextDisplayResult.hasDisplayOverride) {
      displayResult = nextDisplayResult;
    }
  });

  if (visual.clickable || visual.onClick) {
    visual.className = joinClassNames(visual.className, 'admin-table__strategy-clickable');
  }

  return {
    className: visual.className,
    clickable: visual.clickable || !!visual.onClick,
    displayValue: displayResult.hasDisplayOverride
      ? displayResult.value
      : currentValue,
    hasDisplayOverride: displayResult.hasDisplayOverride,
    onClick: visual.onClick,
    stopPropagation: visual.stopPropagation,
    style: visual.style,
    value: currentValue,
  } satisfies ResolvedTableCellStrategyResult;
}

/**
 * 计算行策略最终渲染结果。
 * @param options 计算参数。
 * @returns 行策略渲染结果；无命中时返回 `undefined`。
 */
export interface ResolveTableRowStrategyResultOptions {
  /** 表格配置。 */
  gridOptions?: Record<string, any>;
  /** 行数据。 */
  row: Record<string, any>;
  /** 行索引。 */
  rowIndex: number;
}

/**
 * 计算行策略最终渲染结果。
 * @param options 计算参数。
 * @returns 行策略渲染结果；无命中时返回 `undefined`。
 */
export function resolveTableRowStrategyResult(
  options: ResolveTableRowStrategyResultOptions
) {
  const strategies = resolveTableRowStrategies(options.gridOptions);
  if (strategies.length <= 0) {
    return undefined;
  }
  const ctx: TableRowStrategyContext = {
    column: undefined,
    field: undefined,
    /**
     * 读取当前行指定字段值。
     * @param field 目标字段。
     * @returns 字段值。
     */
    getValue(field) {
      if (!field || !isTableNonEmptyString(field)) {
        return undefined;
      }
      return getColumnValueByPath(options.row, field.trim());
    },
    row: options.row,
    rowIndex: options.rowIndex,
    value: undefined,
  };
  const visual = {
    className: '',
    clickable: false,
    onClick: undefined as
      | ((ctx: TableRowStrategyContext, event?: unknown) => any)
      | undefined,
    stopPropagation: true,
    style: undefined as Record<string, any> | undefined,
  };

  strategies.forEach((item) => {
    if (!evaluateStrategyCondition(item.when, ctx)) {
      return;
    }
    visual.className = joinClassNames(visual.className, item.className);
    visual.style = mergeTableStrategyStyle(
      visual.style,
      buildTableStrategyStyle(item)
    );
    if (item.clickable === true) {
      visual.clickable = true;
    }
    if (typeof item.onClick === 'function') {
      visual.onClick = item.onClick;
    }
    if (typeof item.stopPropagation === 'boolean') {
      visual.stopPropagation = item.stopPropagation;
    }
  });

  if (!visual.className && !visual.style && !visual.clickable && !visual.onClick) {
    return undefined;
  }
  if (visual.clickable || visual.onClick) {
    visual.className = joinClassNames(
      visual.className,
      'admin-table__strategy-clickable'
    );
  }

  return {
    className: visual.className,
    clickable: visual.clickable || !!visual.onClick,
    onClick: visual.onClick,
    stopPropagation: visual.stopPropagation,
    style: visual.style,
  } satisfies ResolvedTableRowStrategyResult;
}

/**
 * 触发单元格策略点击。
 * @param options 触发参数。
 * @returns 触发状态结果。
 */
export interface TriggerTableCellStrategyClickOptions {
  /** 列配置。 */
  column: TableColumnRecord;
  /** 事件对象。 */
  event?: unknown;
  /** 字段名。 */
  field: string;
  /** 是否尊重 `defaultPrevented`。 */
  respectDefaultPrevented?: boolean;
  /** 行数据。 */
  row: Record<string, any>;
  /** 行索引。 */
  rowIndex: number;
  /** 单元格策略结果。 */
  strategyResult: ResolvedTableCellStrategyResult | undefined;
}

/**
 * 触发单元格策略点击。
 * @param options 触发参数。
 * @returns 触发状态结果。
 */
export function triggerTableCellStrategyClick(
  options: TriggerTableCellStrategyClickOptions
): TriggerTableStrategyClickResult {
  const strategyResult = options.strategyResult;
  if (!strategyResult?.onClick) {
    return {
      blocked: false,
      handled: false,
    };
  }
  const event = options.event as Record<string, any> | undefined;
  const shouldStop = strategyResult.stopPropagation !== false;
  if (shouldStop) {
    event?.stopPropagation?.();
  }
  strategyResult.onClick(
    {
      column: options.column,
      field: options.field,
      /**
       * 读取当前行指定字段值。
       * @param nextField 目标字段，未传时使用当前字段。
       * @returns 字段值。
       */
      getValue(nextField?: string) {
        return getColumnValueByPath(options.row, nextField ?? options.field);
      },
      row: options.row,
      rowIndex: options.rowIndex,
      value: strategyResult.value,
    },
    options.event
  );
  const respectDefaultPrevented = options.respectDefaultPrevented !== false;
  if (respectDefaultPrevented && event?.defaultPrevented) {
    return {
      blocked: true,
      handled: true,
    };
  }
  return {
    blocked: shouldStop,
    handled: true,
  };
}

/**
 * 触发行策略点击。
 * @param options 触发参数。
 * @returns 触发状态结果。
 */
export interface TriggerTableRowStrategyClickOptions {
  /** 事件对象。 */
  event?: unknown;
  /** 是否尊重 `defaultPrevented`。 */
  respectDefaultPrevented?: boolean;
  /** 行数据。 */
  row: Record<string, any>;
  /** 行索引。 */
  rowIndex: number;
  /** 行策略结果。 */
  strategyResult: ResolvedTableRowStrategyResult | undefined;
}

/**
 * 触发行策略点击。
 * @param options 触发参数。
 * @returns 触发状态结果。
 */
export function triggerTableRowStrategyClick(
  options: TriggerTableRowStrategyClickOptions
): TriggerTableStrategyClickResult {
  const strategyResult = options.strategyResult;
  if (!strategyResult?.onClick) {
    return {
      blocked: false,
      handled: false,
    };
  }
  const event = options.event as Record<string, any> | undefined;
  const shouldStop = strategyResult.stopPropagation !== false;
  if (shouldStop) {
    event?.stopPropagation?.();
  }
  strategyResult.onClick(
    {
      column: undefined,
      field: undefined,
      /**
       * 读取当前行指定字段值。
       * @param field 目标字段。
       * @returns 字段值。
       */
      getValue(field?: string) {
        return getColumnValueByPath(options.row, field);
      },
      row: options.row,
      rowIndex: options.rowIndex,
      value: undefined,
    },
    options.event
  );
  const respectDefaultPrevented = options.respectDefaultPrevented !== false;
  if (respectDefaultPrevented && event?.defaultPrevented) {
    return {
      blocked: true,
      handled: true,
    };
  }
  return {
    blocked: shouldStop,
    handled: true,
  };
}

/**
 * 判断值是否可用于写入 CSS 变量。
 * @param value 待判断值。
 * @returns 可用于样式变量时返回 `true`。
 */
function hasValueForStyleVar(value: unknown) {
  return value !== undefined && value !== null && value !== '';
}

/**
 * 判断行策略样式对象是否有效。
 * @param style 行样式对象。
 * @returns 是否存在有效样式键。
 */
export function hasTableRowStrategyStyle(
  style: null | Record<string, any> | undefined
) {
  return !!style && Object.keys(style).length > 0;
}

/**
 * 解析行策略内联样式并同步 CSS 变量。
 * @param style 行样式对象。
 * @returns 规范化后的行样式对象。
 */
export function resolveTableRowStrategyInlineStyle(
  style: null | Record<string, any> | undefined
) {
  if (!hasTableRowStrategyStyle(style)) {
    return undefined;
  }
  const source = { ...(style as Record<string, any>) };
  if (hasValueForStyleVar(source.backgroundColor)) {
    source['--admin-table-row-strategy-bg'] = String(source.backgroundColor);
    const hoverBackground =
      source['--admin-table-row-strategy-hover-bg'] ?? source.backgroundColor;
    if (hasValueForStyleVar(hoverBackground)) {
      source['--admin-table-row-strategy-hover-bg'] = String(hoverBackground);
    }
  }
  if (hasValueForStyleVar(source.color)) {
    source['--admin-table-row-strategy-color'] = String(source.color);
  }
  if (hasValueForStyleVar(source.fontWeight)) {
    source['--admin-table-row-strategy-font-weight'] = String(source.fontWeight);
  }
  return source;
}
