import { z, type ZodTypeAny } from 'zod';
import { isString } from './guards';

export function isZodSchema(rule: unknown): rule is ZodTypeAny {
  if (!rule || isString(rule)) return false;
  return typeof (rule as ZodTypeAny).safeParse === 'function';
}

export function inferDefaultValueFromZod(rule: ZodTypeAny): any {
  const parsed = rule.safeParse(undefined);
  if (parsed.success) return parsed.data;

  const typeName = (rule as any)?._def?.type;

  if (rule instanceof z.ZodString || typeName === 'string') {
    return '';
  }

  if (rule instanceof z.ZodNumber || typeName === 'number') {
    return null;
  }

  if (rule instanceof z.ZodBoolean || typeName === 'boolean') {
    return false;
  }

  if (rule instanceof z.ZodArray || typeName === 'array') {
    return [];
  }

  if (rule instanceof z.ZodObject || typeName === 'object') {
    const shape = (rule as z.ZodObject<any>).shape;
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(shape)) {
      result[key] = inferDefaultValueFromZod(value as ZodTypeAny);
    }
    return result;
  }

  return undefined;
}
