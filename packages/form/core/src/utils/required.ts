
import { isString } from './guards';
import { isZodSchema } from './zod';
import type { FormSchemaRuleType, RuntimeFieldState } from '../types';

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

export function isFieldRequiredMark(input: {
  rules?: FormSchemaRuleType;
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
