/**
 * Form Core 字段映射工具。
 * @description 提供日期区间、字符串数组等字段值映射与反向映射能力。
 */
import { deleteByPath, getByPath, setByPath } from './path';
import type { ArrayToStringFields, FieldMappingTime } from '../types';


/**
 * 数字补零。
 * @param value 数值。
 * @param length 目标长度。
 * @returns 补零后的字符串。
 */
function pad(value: number, length = 2) {
  return String(value).padStart(length, '0');
}

/**
 * 将输入值尽可能转换为合法 `Date`。
 * @param value 原始值。
 * @returns `Date` 或 `null`。
 */
function asDate(value: any): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (value && typeof value === 'object') {
    if (typeof value.toDate === 'function') {
      const converted = value.toDate();
      if (converted instanceof Date && !Number.isNaN(converted.getTime())) {
        return converted;
      }
    }
    if (typeof value.valueOf === 'function') {
      const raw = value.valueOf();
      if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
        return raw;
      }
      if (typeof raw === 'number' || typeof raw === 'string') {
        const converted = new Date(raw);
        if (!Number.isNaN(converted.getTime())) {
          return converted;
        }
      }
    }
  }
  if (typeof value === 'number' || typeof value === 'string') {
    const converted = new Date(value);
    if (!Number.isNaN(converted.getTime())) {
      return converted;
    }
  }
  return null;
}

/**
 * 按给定模式格式化日期。
 * @param date 日期对象。
 * @param pattern 格式化模式。
 * @returns 格式化后的日期字符串。
 */
function formatDatePattern(date: Date, pattern: string) {
  const tokens: Record<string, string> = {
    YYYY: String(date.getFullYear()),
    YY: String(date.getFullYear()).slice(-2),
    MM: pad(date.getMonth() + 1),
    DD: pad(date.getDate()),
    HH: pad(date.getHours()),
    mm: pad(date.getMinutes()),
    ss: pad(date.getSeconds()),
  };

  return pattern.replace(/YYYY|YY|MM|DD|HH|mm|ss/g, (token) => tokens[token] ?? token);
}

/**
 * 格式化日期类值，支持 dayjs/moment 风格对象与原生日期值。
 * @param value 原始值。
 * @param format 日期格式。
 * @returns 格式化结果。
 */
function formatDateLike(value: any, format: string) {
  if (value === undefined || value === null || value === '') {
    return value;
  }

  if (value && typeof value === 'object' && typeof value.format === 'function') {
    try {
      return value.format(format);
    } catch {
      /* ignore and fallback */
    }
  }

  const date = asDate(value);
  if (!date) {
    return value;
  }

  return formatDatePattern(date, format);
}

/**
 * 将值转换为数组。
 * @param value 原始值。
 * @param separator 字符串分隔符。
 * @returns 数组值。
 */
function normalizeToArray(value: any, separator: string) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    if (value === '') return [];
    return value.split(separator);
  }
  return value;
}

/**
 * 将值转换为字符串。
 * @param value 原始值。
 * @param separator 数组拼接分隔符。
 * @returns 字符串值。
 */
function normalizeToString(value: any, separator: string) {
  if (Array.isArray(value)) return value.join(separator);
  return value;
}

/**
 * 按字段列表执行数组与字符串互转。
 * @param values 值对象。
 * @param fields 字段路径列表。
 * @param separator 分隔符。
 * @param mode 转换模式。
 */
function processFields(
  values: Record<string, any>,
  fields: string[],
  separator: string,
  mode: 'arrayToString' | 'stringToArray'
) {
  for (const field of fields) {
    const current = getByPath(values, field);
    if (current === undefined || current === null) continue;
    const next =
      mode === 'arrayToString'
        ? normalizeToString(current, separator)
        : normalizeToArray(current, separator);
    setByPath(values, field, next);
  }
}

/**
 * 根据 `arrayToStringFields` 配置执行字段值互转。
 * @param values 原始值对象。
 * @param config 互转配置。
 * @param mode 转换模式。
 * @returns 转换后的值对象。
 */
export function mapArrayStringFields(
  values: Record<string, any>,
  config: ArrayToStringFields | undefined,
  mode: 'arrayToString' | 'stringToArray'
) {
  if (!config || config.length === 0) return values;

  const mutable = { ...values };

  const everyString = config.every((item) => typeof item === 'string');
  if (everyString) {
    const raw = config as string[];
    const last = raw[raw.length - 1] || '';
    const useTailAsSeparator = last.length === 1;
    const fields = useTailAsSeparator ? raw.slice(0, -1) : raw;
    const separator = useTailAsSeparator ? last : ',';
    processFields(mutable, fields, separator, mode);
    return mutable;
  }

  for (const entry of config) {
    if (!Array.isArray(entry)) continue;
    const [fields, separator = ','] = entry as [string[], string?];
    if (!Array.isArray(fields)) continue;
    processFields(mutable, fields, separator, mode);
  }

  return mutable;
}

/**
 * 根据时间映射配置拆分时间区间字段。
 * @param values 原始值对象。
 * @param mapping 时间映射配置。
 * @returns 转换后的值对象。
 */
export function mapFieldMappingTime(
  values: Record<string, any>,
  mapping: FieldMappingTime | undefined
) {
  if (!mapping || mapping.length === 0) return values;

  const mutable = { ...values };

  for (const [field, [startField, endField], formatter = null] of mapping) {
    const sourceValue = getByPath(mutable, field);
    if (!sourceValue) {
      deleteByPath(mutable, field);
      continue;
    }
    const [startValue, endValue] = Array.isArray(sourceValue)
      ? sourceValue
      : [undefined, undefined];

    if (formatter === null) {
      setByPath(mutable, startField, startValue);
      setByPath(mutable, endField, endValue);
    } else if (typeof formatter === 'function') {
      setByPath(mutable, startField, formatter(startValue, startField));
      setByPath(mutable, endField, formatter(endValue, endField));
    } else {
      const [startFormat, endFormat] = Array.isArray(formatter)
        ? formatter
        : [formatter, formatter];
      setByPath(mutable, startField, formatDateLike(startValue, startFormat));
      setByPath(mutable, endField, formatDateLike(endValue, endFormat));
    }

    deleteByPath(mutable, field);
  }

  return mutable;
}
