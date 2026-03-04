/**
 * Form Core 规则注册与执行工具。
 * @description 管理全局规则注册表，并提供字段规则标准化与校验执行能力。
 */
import { formatLocaleMessage, getLocaleMessages } from '../locales';
import type { RegisterFormRulesOptions } from '../types';

/** 全局规则注册表。 */
const ruleMap = new Map<string, RegisterFormRulesOptions[string]>();

/**
 * 提取字段显示名称。
 *
 * @param ctx 校验上下文。
 * @returns 优先返回标签文案，否则返回字段名。
 */
function getLabel(ctx: {
  /** 字段名。 */
  fieldName: string;
  /** 显示标签。 */
  label?: string;
}) {
  return ctx.label || ctx.fieldName;
}

/**
 * 注册一组表单校验规则。
 *
 * @param rules 规则名称到校验器的映射。
 * @returns 无返回值。
 */
export function registerFormRules(rules: RegisterFormRulesOptions) {
  for (const [key, validator] of Object.entries(rules)) {
    ruleMap.set(key, validator);
  }
}

/**
 * 获取已注册的校验器。
 *
 * @param name 规则名称。
 * @returns 命中的校验器；不存在时返回 `undefined`。
 */
export function getRuleValidator(name: string) {
  return ruleMap.get(name);
}

/**
 * 确保内置规则已注册。
 * 当前包含 `required` 与 `selectRequired`。
 * @returns 无返回值。
 */
export function ensureBuiltinRules() {
  if (!ruleMap.has('required')) {
    registerFormRules({
      required: (value, _params, ctx) => {
        const empty =
          value === undefined ||
          value === null ||
          (typeof value === 'string' && value.trim() === '') ||
          (Array.isArray(value) && value.length === 0);
        if (!empty) return true;
        const message = getLocaleMessages().form.required;
        return formatLocaleMessage(message, { label: getLabel(ctx) });
      },
    });
  }

  if (!ruleMap.has('selectRequired')) {
    registerFormRules({
      selectRequired: (value, _params, ctx) => {
        if (value !== undefined && value !== null && value !== '') return true;
        const message = getLocaleMessages().form.selectRequired;
        return formatLocaleMessage(message, { label: getLabel(ctx) });
      },
    });
  }
}
