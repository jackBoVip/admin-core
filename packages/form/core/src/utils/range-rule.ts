/**
 * Form Core 区间规则工具。
 * @description 提供区间字段（日期/数值）一致性校验规则构建能力。
 */
import { formatLocaleMessage, getLocaleMessages } from '../locales';
import type { FormRuleContext, FormRuleValidator, MaybeAsync } from '../types';

/**
 * 判断区间值端点是否为空。
 * @param value 区间端点值。
 * @returns 是否为空。
 */
function isEmptyRangeValue(value: any) {
  return value === undefined || value === null || value === '';
}

/**
 * 区间默认比较器。
 * @param start 起始值。
 * @param end 结束值。
 * @returns 比较结果，`<0` 表示起始小于结束。
 */
function defaultCompareRangeValue(start: any, end: any) {
  if (typeof start === 'number' && typeof end === 'number') {
    return start - end;
  }
  if (start instanceof Date && end instanceof Date) {
    return start.getTime() - end.getTime();
  }
  const startTime = Date.parse(start);
  const endTime = Date.parse(end);
  if (!Number.isNaN(startTime) && !Number.isNaN(endTime)) {
    return startTime - endTime;
  }
  return String(start).localeCompare(String(end));
}

/**
 * 区间规则创建选项。
 */
export interface CreateRangeRuleOptions {
  /** 是否允许起止相等。 */
  allowEqual?: boolean;
  /** 自定义比较器。 */
  compare?: (start: any, end: any, context: FormRuleContext) => number;
  /** 自定义错误文案。 */
  message?: string;
  /** 端点归一化函数。 */
  normalize?: (value: any, index: 0 | 1, context: FormRuleContext) => any;
  /** 自定义完整校验函数。 */
  validate?: (
    start: any,
    end: any,
    context: FormRuleContext
  ) => MaybeAsync<boolean | string>;
}

/**
 * 创建区间校验规则。
 * @param options 规则选项。
 * @returns 表单校验器函数。
 */
export function createRangeRule(
  options: CreateRangeRuleOptions = {}
): FormRuleValidator {
  return async (value, _params, context) => {
    if (!Array.isArray(value)) {
      return true;
    }
    const normalize = options.normalize;
    const startRaw = value[0];
    const endRaw = value[1];
    const start = normalize ? normalize(startRaw, 0, context) : startRaw;
    const end = normalize ? normalize(endRaw, 1, context) : endRaw;
    const startEmpty = isEmptyRangeValue(start);
    const endEmpty = isEmptyRangeValue(end);
    if (startEmpty && endEmpty) {
      return true;
    }
    if (startEmpty || endEmpty) {
      return true;
    }

    const messageTemplate = options.message ?? getLocaleMessages().form.rangeInvalid;
    const message = formatLocaleMessage(messageTemplate, {
      label: context.label,
    });

    if (options.validate) {
      const validated = await options.validate(start, end, context);
      if (validated === true) {
        return true;
      }
      if (typeof validated === 'string') {
        return validated;
      }
      return message;
    }

    const diff = options.compare
      ? options.compare(start, end, context)
      : defaultCompareRangeValue(start, end);
    if (diff < 0) {
      return true;
    }
    if (diff === 0 && options.allowEqual !== false) {
      return true;
    }
    return message;
  };
}
