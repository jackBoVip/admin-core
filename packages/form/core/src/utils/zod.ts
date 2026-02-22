import { z, type ZodTypeAny } from 'zod';
import { formatLocaleMessage, getLocaleMessages } from '../locales';
import { isString } from './guards';
import type { ZodIssue } from 'zod';

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

const DEFAULT_ZOD_MESSAGE_PREFIX = [
  'invalid input',
  'too big',
  'too small',
  'unrecognized',
  'invalid format',
  'expected',
];

function isLikelyDefaultZodMessage(message: string) {
  const normalized = message.trim().toLowerCase();
  return DEFAULT_ZOD_MESSAGE_PREFIX.some((prefix) =>
    normalized.startsWith(prefix)
  );
}

export function resolveZodIssueMessage(input: {
  issue?: Pick<ZodIssue, 'message'>;
  label: string;
}) {
  const message = input.issue?.message?.trim();
  if (message && !isLikelyDefaultZodMessage(message)) {
    return message;
  }
  return formatLocaleMessage(getLocaleMessages().form.invalid, {
    label: input.label,
  });
}
