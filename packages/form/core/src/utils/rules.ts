import { formatLocaleMessage, getLocaleMessages } from '../locales';
import type { RegisterFormRulesOptions } from '../types';


const ruleMap = new Map<string, RegisterFormRulesOptions[string]>();

function getLabel(ctx: { fieldName: string; label?: string }) {
  return ctx.label || ctx.fieldName;
}

export function registerFormRules(rules: RegisterFormRulesOptions) {
  for (const [key, validator] of Object.entries(rules)) {
    ruleMap.set(key, validator);
  }
}

export function getRuleValidator(name: string) {
  return ruleMap.get(name);
}

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
