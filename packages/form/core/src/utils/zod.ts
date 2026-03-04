/**
 * Form Core Zod 规则适配工具。
 * @description 提供 Zod schema 判定与错误消息格式化能力。
 */
import { z, type ZodTypeAny } from 'zod';
import { formatLocaleMessage, getLocaleMessages } from '../locales';
import { isString } from './guards';
import type { ZodIssue } from 'zod';

/**
 * 判断规则对象是否为 Zod schema。
 *
 * @param rule 待判断规则。
 * @returns 是 Zod schema 时返回 `true`。
 */
export function isZodSchema(rule: unknown): rule is ZodTypeAny {
  if (!rule || isString(rule)) return false;
  return typeof (rule as ZodTypeAny).safeParse === 'function';
}

/**
 * 从 Zod schema 推导默认值。
 * 优先尝试 `safeParse(undefined)`，失败时按基础类型给出兜底值。
 *
 * @param rule Zod schema。
 * @returns 推导得到的默认值。
 */
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

/**
 * 判断错误消息是否像 Zod 默认英文文案。
 *
 * @param message 错误消息。
 * @returns 命中默认文案前缀时返回 `true`。
 */
function isLikelyDefaultZodMessage(message: string) {
  const normalized = message.trim().toLowerCase();
  return DEFAULT_ZOD_MESSAGE_PREFIX.some((prefix) =>
    normalized.startsWith(prefix)
  );
}

/**
 * 解析 Zod issue 的最终展示文案。
 * 当 issue 消息为默认英文文案时，回退到本地化模板消息。
 *
 * @param input 消息解析上下文。
 * @returns 最终提示文案。
 */
export function resolveZodIssueMessage(input: {
  /** 校验问题对象（仅使用 message 字段）。 */
  issue?: Pick<ZodIssue, 'message'>;
  /** 显示标签。 */
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
