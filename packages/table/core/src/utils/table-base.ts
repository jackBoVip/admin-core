import type { SeparatorOptions } from '../types';
import { isTableNonEmptyString } from './table-permission';

export function shallowEqualObjectRecord(
  previous: null | Record<string, any> | undefined,
  next: null | Record<string, any> | undefined
) {
  if (previous === next) {
    return true;
  }
  if (!previous || !next) {
    return false;
  }
  const previousKeys = Object.keys(previous);
  const nextKeys = Object.keys(next);
  if (previousKeys.length !== nextKeys.length) {
    return false;
  }
  for (const key of previousKeys) {
    if (!Object.prototype.hasOwnProperty.call(next, key)) {
      return false;
    }
    if (!Object.is(previous[key], next[key])) {
      return false;
    }
  }
  return true;
}

export function isProxyEnabled(proxyConfig?: Record<string, any> | null) {
  return !!proxyConfig?.enabled && !!proxyConfig?.ajax;
}

export function shouldShowSeparator(options: {
  hasFormOptions?: boolean;
  separator?: boolean | SeparatorOptions;
  showSearchForm?: boolean;
}) {
  const { hasFormOptions, separator, showSearchForm } = options;
  if (!hasFormOptions || showSearchForm === false || separator === false) {
    return false;
  }
  if (separator === undefined || separator === true) {
    return true;
  }
  return separator.show !== false;
}

export function getSeparatorStyle(separator?: boolean | SeparatorOptions) {
  if (!separator || typeof separator === 'boolean') {
    return undefined;
  }
  if (!isTableNonEmptyString(separator.backgroundColor)) {
    return undefined;
  }
  return {
    backgroundColor: separator.backgroundColor,
  };
}
