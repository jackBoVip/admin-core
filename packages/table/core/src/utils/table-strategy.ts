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

interface CachedCellStrategyEntry {
  columnStrategyRef: unknown;
  legacyStrategyRef: unknown;
  strategyConfigRef: unknown;
  value: TableCellStrategy | undefined;
}

const cachedCellStrategiesByGrid = new WeakMap<
  Record<string, any>,
  WeakMap<TableColumnRecord, Map<string, CachedCellStrategyEntry>>
>();
const cachedCellStrategiesWithoutGrid = new WeakMap<
  TableColumnRecord,
  Map<string, CachedCellStrategyEntry>
>();
const cachedRowStrategiesByGrid = new WeakMap<
  Record<string, any>,
  {
    legacyRowStrategyRef: unknown;
    strategyConfigRef: unknown;
    value: TableRowStrategy[];
  }
>();
const STRATEGY_REGEX_CACHE_MAX_SIZE = 200;
const compiledStrategyRegExpCache = new Map<string, null | RegExp>();

const tableFormulaHelpers = {
  ABS(value: unknown) {
    const next = parseNumberValue(value);
    return Number.isNaN(next) ? 0 : Math.abs(next);
  },
  AVG(...values: unknown[]) {
    const list = values
      .map((item) => parseNumberValue(item))
      .filter((item) => !Number.isNaN(item));
    if (list.length <= 0) {
      return 0;
    }
    return list.reduce((sum, value) => sum + value, 0) / list.length;
  },
  IF(condition: unknown, onTrue: unknown, onFalse: unknown) {
    return condition ? onTrue : onFalse;
  },
  MAX(...values: unknown[]) {
    const list = values
      .map((item) => parseNumberValue(item))
      .filter((item) => !Number.isNaN(item));
    if (list.length <= 0) {
      return 0;
    }
    return Math.max(...list);
  },
  MIN(...values: unknown[]) {
    const list = values
      .map((item) => parseNumberValue(item))
      .filter((item) => !Number.isNaN(item));
    if (list.length <= 0) {
      return 0;
    }
    return Math.min(...list);
  },
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
  SUM(...values: unknown[]) {
    return values
      .map((item) => parseNumberValue(item))
      .filter((item) => !Number.isNaN(item))
      .reduce((sum, value) => sum + value, 0);
  },
} as const;

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

interface TableFormulaToken {
  type: TableFormulaTokenType;
  value: string;
}

type TableFormulaNode =
  | {
      value: string | number;
      type: 'literal';
    }
  | {
      name: string;
      type: 'identifier';
    }
  | {
      argument: TableFormulaNode;
      operator: '!' | '+' | '-';
      type: 'unary';
    }
  | {
      left: TableFormulaNode;
      operator: '%' | '*' | '+' | '-' | '/' | '<' | '<=' | '==' | '===' | '>' | '>=' | '!=' | '!==';
      right: TableFormulaNode;
      type: 'binary';
    }
  | {
      left: TableFormulaNode;
      operator: '&&' | '||';
      right: TableFormulaNode;
      type: 'logical';
    }
  | {
      alternate: TableFormulaNode;
      consequent: TableFormulaNode;
      test: TableFormulaNode;
      type: 'conditional';
    }
  | {
      args: TableFormulaNode[];
      callee: string;
      type: 'call';
    };

interface TableFormulaParserState {
  index: number;
  tokens: TableFormulaToken[];
}

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

const compiledFormulaCache = new Map<string, TableFormulaNode>();
const TABLE_FORMULA_CACHE_MAX_SIZE = 256;

export interface ResolvedTableCellStrategyResult {
  className: string;
  clickable: boolean;
  displayValue: any;
  hasDisplayOverride: boolean;
  onClick?: (ctx: TableCellStrategyContext, event?: unknown) => any;
  stopPropagation: boolean;
  style?: Record<string, any>;
  value: any;
}

export interface ResolvedTableRowStrategyResult {
  className: string;
  clickable: boolean;
  onClick?: (ctx: TableRowStrategyContext, event?: unknown) => any;
  stopPropagation: boolean;
  style?: Record<string, any>;
}

export interface TriggerTableStrategyClickResult {
  blocked: boolean;
  handled: boolean;
}

function toArrayValue<T>(value: null | T | T[] | undefined) {
  if (Array.isArray(value)) {
    return value;
  }
  if (value === undefined || value === null) {
    return [] as T[];
  }
  return [value];
}

function joinClassNames(...values: unknown[]) {
  return values
    .flatMap((value) => String(value ?? '').split(' '))
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .join(' ');
}

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

function testStrategyRegExp(value: unknown, matcher: unknown) {
  const regex = resolveStrategyRegExp(matcher);
  if (!regex) {
    return false;
  }
  regex.lastIndex = 0;
  return regex.test(String(value ?? ''));
}

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

function isTableFormulaIdentifierStart(char: string) {
  return /[A-Za-z_$]/.test(char);
}

function isTableFormulaIdentifierPart(char: string) {
  return /[A-Za-z0-9_$]/.test(char);
}

function readTableFormulaStringToken(
  expression: string,
  startIndex: number
): {
  nextIndex: number;
  token?: TableFormulaToken;
} {
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

function readTableFormulaNumberToken(
  expression: string,
  startIndex: number
): {
  nextIndex: number;
  token?: TableFormulaToken;
} {
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

function readTableFormulaIdentifierToken(
  expression: string,
  startIndex: number
): {
  nextIndex: number;
  token?: TableFormulaToken;
} {
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

function getTableFormulaCurrentToken(state: TableFormulaParserState) {
  return state.tokens[state.index] ?? { type: 'eof', value: '' };
}

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

function normalizeTableStrategyConfig(
  value: unknown
): TableStrategyConfig | undefined {
  return isTablePlainObject(value)
    ? (value as TableStrategyConfig)
    : undefined;
}

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

function applyCellStyleRule(
  target: {
    className: string;
    clickable: boolean;
    onClick?: (ctx: TableCellStrategyContext, event?: unknown) => any;
    stopPropagation: boolean;
    style?: Record<string, any>;
  },
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

export function resolveTableCellStrategyResult(options: {
  column: TableColumnRecord;
  field: string;
  gridOptions?: Record<string, any>;
  row: Record<string, any>;
  rowIndex: number;
  value: any;
}) {
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

export function resolveTableRowStrategyResult(options: {
  gridOptions?: Record<string, any>;
  row: Record<string, any>;
  rowIndex: number;
}) {
  const strategies = resolveTableRowStrategies(options.gridOptions);
  if (strategies.length <= 0) {
    return undefined;
  }
  const ctx: TableRowStrategyContext = {
    column: undefined,
    field: undefined,
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

export function triggerTableCellStrategyClick(options: {
  column: TableColumnRecord;
  event?: unknown;
  field: string;
  respectDefaultPrevented?: boolean;
  row: Record<string, any>;
  rowIndex: number;
  strategyResult: ResolvedTableCellStrategyResult | undefined;
}): TriggerTableStrategyClickResult {
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

export function triggerTableRowStrategyClick(options: {
  event?: unknown;
  respectDefaultPrevented?: boolean;
  row: Record<string, any>;
  rowIndex: number;
  strategyResult: ResolvedTableRowStrategyResult | undefined;
}): TriggerTableStrategyClickResult {
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

function hasValueForStyleVar(value: unknown) {
  return value !== undefined && value !== null && value !== '';
}

export function hasTableRowStrategyStyle(
  style: null | Record<string, any> | undefined
) {
  return !!style && Object.keys(style).length > 0;
}

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
