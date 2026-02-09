/**
 * 数值工具函数
 * @description 用于处理数值相关的逻辑
 */

/**
 * 限制数值在指定范围内
 * @param value - 要限制的数值
 * @param min - 最小值（可选）
 * @param max - 最大值（可选）
 * @returns 限制后的数值
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
 * 解析字符串为数值
 * @param value - 要解析的字符串
 * @param fallback - 解析失败时的默认值
 * @returns 解析后的数值
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
 * 格式化数值（保留指定小数位）
 * @param value - 要格式化的数值
 * @param decimals - 小数位数（默认 2）
 * @returns 格式化后的字符串
 */
export function formatNumber(value: number, decimals = 2): string {
  return value.toFixed(decimals);
}

/**
 * 判断数值是否在指定范围内
 * @param value - 要检查的数值
 * @param min - 最小值（可选）
 * @param max - 最大值（可选）
 * @returns 是否在范围内
 */
export function isInRange(value: number, min?: number, max?: number): boolean {
  if (min !== undefined && value < min) return false;
  if (max !== undefined && value > max) return false;
  return true;
}

