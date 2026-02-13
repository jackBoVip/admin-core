export const ADMIN_STATE_ATTR_KEYS = [
  'aria-invalid',
  'data-admin-invalid',
  'data-admin-status',
] as const;

export type AdminStateAttrs = {
  'aria-invalid'?: boolean;
  'data-admin-invalid'?: string;
  'data-admin-status'?: string;
};

export function normalizeNativeInputValue(value: any) {
  return value === undefined || value === null ? '' : value;
}

export function resolveNativeModelValue(modelValue: any, value: any) {
  return modelValue === undefined ? value : modelValue;
}

export function isNativeEmptyValue(value: any) {
  return value === '' || value === null || value === undefined;
}

export function pickAdminStateAttrs(
  input: Record<string, any> | undefined
): AdminStateAttrs {
  const source = input ?? {};
  return {
    'aria-invalid': source['aria-invalid'],
    'data-admin-invalid': source['data-admin-invalid'],
    'data-admin-status': source['data-admin-status'],
  };
}

export function omitRecordKeys(
  input: Record<string, any> | undefined,
  keys: readonly string[]
) {
  const source = input ?? {};
  const output: Record<string, any> = {};
  for (const [key, value] of Object.entries(source)) {
    if (!keys.includes(key)) {
      output[key] = value;
    }
  }
  return output;
}

export function mergeClassValue(base: string, className?: string | null) {
  return className ? `${base} ${className}` : base;
}

export function toggleCollectionValue(
  current: any[] | undefined,
  value: any,
  checked: boolean
) {
  const nextSet = new Set(current ?? []);
  if (checked) {
    nextSet.add(value);
  } else {
    nextSet.delete(value);
  }
  return [...nextSet];
}

export function ensureDateRangeValue(value: any): [string, string] {
  if (!Array.isArray(value)) {
    return ['', ''];
  }
  return [normalizeNativeInputValue(value[0]), normalizeNativeInputValue(value[1])];
}

export function updateDateRangeValue(
  value: [string, string],
  index: 0 | 1,
  nextValue: string
): [string, string] {
  return index === 0 ? [nextValue, value[1]] : [value[0], nextValue];
}
