import type { ProxyConfig } from '../types';


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

function isEventLike(value: unknown) {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, any>;
  return (
    typeof candidate.preventDefault === 'function' ||
    typeof candidate.stopPropagation === 'function'
  );
}

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
