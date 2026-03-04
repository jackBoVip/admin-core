/**
 * Table Core 代理扩展工具。
 * @description 负责将查询表单值注入 VXE 代理配置并包装代理回调链。
 */
import type { ProxyConfig } from '../types';

/**
 * 需要注入表单值的代理 AJAX 生命周期键集合。
 * 这些键对应 VxeGrid 代理模式中的请求与回调处理函数。
 */
const PROXY_AJAX_KEYS = [
  'query',
  'querySuccess',
  'queryError',
  'queryAll',
  'queryAllSuccess',
  'queryAllError',
  'reload',
  'reloadSuccess',
  'reloadError',
] as const;

/**
 * 判断值是否为事件对象。
 * @param value 待判断值。
 * @returns 具备事件方法时返回 `true`。
 */
function isEventLike(value: unknown) {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, any>;
  return (
    typeof candidate.preventDefault === 'function' ||
    typeof candidate.stopPropagation === 'function'
  );
}

/**
 * 扩展代理请求参数合并逻辑。
 * 将表单值注入到代理请求的 `customValues` 中。
 * @template T 配置对象类型。
 * @param options 原始表格配置。
 * @param getFormValues 读取表单值函数。
 * @returns 扩展后的配置对象。
 */
export function extendProxyOptions<T extends Record<string, any> = Record<string, any>>(
  options: T,
  getFormValues: () => Record<string, any>
): T {
  const proxyConfig = options.proxyConfig as ProxyConfig | undefined;
  const ajax = proxyConfig?.ajax;
  if (!ajax || typeof ajax !== 'object') {
    return options;
  }

  const nextAjax = { ...ajax };

  for (const key of PROXY_AJAX_KEYS) {
    const original = ajax[key];
    if (typeof original !== 'function') continue;

    nextAjax[key] = async (
      params: Record<string, any>,
      customValues: Record<string, any>,
      ...args: any[]
    ) => {
      const formValues = getFormValues();
      const safeCustom = isEventLike(customValues) ? {} : customValues;

      return original(
        params,
        {
          ...(safeCustom ?? {}),
          ...(formValues ?? {}),
        },
        ...args
      );
    };
  }

  return {
    ...(options as Record<string, any>),
    proxyConfig: {
      ...(proxyConfig as Record<string, any>),
      ajax: nextAjax,
    },
  } as unknown as T;
}
