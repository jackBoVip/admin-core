/**
 * Form Core 必填规则工具。
 * @description 统一解析字段是否必填及必填标识展示策略。
 */
import { isString } from './guards';
import { isZodSchema } from './zod';
import type { FormSchemaRuleType, RuntimeFieldState } from '../types';

/**
 * 判断规则是否表达“必填”语义。
 *
 * @param rule 字段规则定义。
 * @returns 命中必填规则时返回 `true`。
 */
function isRuleRequired(rule: FormSchemaRuleType | undefined) {
  if (!rule) return false;

  if (isString(rule)) {
    return rule === 'required' || rule === 'selectRequired';
  }

  if (isZodSchema(rule)) {
    try {
      return !rule.safeParse(undefined).success;
    } catch {
      return true;
    }
  }

  return false;
}

/**
 * 判断字段是否应显示必填标记。
 *
 * @param input 字段规则与运行时状态。
 * @returns 是否显示必填标记。
 */
export function isFieldRequiredMark(input: {
  /** 静态规则定义。 */
  rules?: FormSchemaRuleType;
  /** 运行时状态（含动态规则）。 */
  runtime?: RuntimeFieldState;
}) {
  if (input.runtime?.isRequired) {
    return true;
  }

  if (isRuleRequired(input.runtime?.dynamicRules)) {
    return true;
  }

  return isRuleRequired(input.rules);
}
