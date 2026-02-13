import { formatLocaleMessage, getLocaleMessages } from '../locales';
import type { FormRuleContext, FormRuleValidator, MaybeAsync } from '../types';

function isEmptyRangeValue(value: any) {
  return value === undefined || value === null || value === '';
}

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

export interface CreateRangeRuleOptions {
  allowEqual?: boolean;
  compare?: (start: any, end: any, context: FormRuleContext) => number;
  message?: string;
  normalize?: (value: any, index: 0 | 1, context: FormRuleContext) => any;
  validate?: (
    start: any,
    end: any,
    context: FormRuleContext
  ) => MaybeAsync<boolean | string>;
}

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
