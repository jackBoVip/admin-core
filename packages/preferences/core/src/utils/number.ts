/**
 * 数值处理工具集。
 * @description 提供范围裁剪、解析、格式化与区间判断能力。
 */

/**
 * 将数值限制在指定上下界之间。
 * @param value 待裁剪的原始数值。
 * @param min 可选下界，传入后会保证返回值不小于该值。
 * @param max 可选上界，传入后会保证返回值不大于该值。
 * @returns 裁剪后的安全数值。
 */
export function clamp(value: number, min?: number, max?: number): number {
  if (min !== undefined && value < min) {
    return min;
  }
  if (max !== undefined && value > max) {
    return max;
  }
  return value;
}

/**
 * 将字符串解析为浮点数。
 * @param value 待解析的字符串值。
 * @param fallback 解析失败、空字符串或无效输入时返回的兜底值。
 * @returns 解析成功时返回浮点数，否则返回 `fallback`。
 */
export function parseNumber(value: string, fallback: number): number {
  if (value === '' || value === null || value === undefined) {
    return fallback;
  }

  const parsed = Number.parseFloat(value);

  if (Number.isNaN(parsed)) {
    return fallback;
  }

  return parsed;
}

/**
 * 将数值格式化为固定小数位字符串。
 * @param value 待格式化的数值。
 * @param decimals 保留小数位数，默认 `2` 位。
 * @returns 形如 `12.30` 的固定精度字符串。
 */
export function formatNumber(value: number, decimals = 2): string {
  return value.toFixed(decimals);
}

/**
 * 判断数值是否位于指定区间内（含边界）。
 * @param value 待判断的数值。
 * @param min 可选下界，传入后会校验 `value >= min`。
 * @param max 可选上界，传入后会校验 `value <= max`。
 * @returns 位于区间内返回 `true`，否则返回 `false`。
 */
export function isInRange(value: number, min?: number, max?: number): boolean {
  if (min !== undefined && value < min) return false;
  if (max !== undefined && value > max) return false;
  return true;
}
