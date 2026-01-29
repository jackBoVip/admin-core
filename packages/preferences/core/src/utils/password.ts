/**
 * 密码工具
 * @description 提供密码哈希和验证功能
 * @security 注意：这是客户端锁屏密码，不是用于敏感数据保护
 */

/** 密码最小长度 */
export const PASSWORD_MIN_LENGTH = 6;

/** 哈希盐值前缀（增加破解难度） */
const HASH_SALT_PREFIX = 'admin-core-lock-v1:';

/**
 * 计算字符串的 SHA-256 哈希值
 * @param text - 要哈希的字符串
 * @returns 哈希值（十六进制字符串）
 */
export async function hashPassword(text: string): Promise<string> {
  // 参数验证
  if (typeof text !== 'string') {
    return hashPasswordSync('');
  }
  
  const saltedText = HASH_SALT_PREFIX + text;
  
  // 浏览器环境使用 Web Crypto API
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(saltedText);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // crypto.subtle.digest 失败时降级到同步版本
      return hashPasswordSync(text);
    }
  }

  // 降级方案：使用改进的同步哈希
  return hashPasswordSync(text);
}

/**
 * 同步版本的哈希（使用改进的 FNV-1a 算法）
 * @param text - 要哈希的字符串
 * @returns 哈希值（64位十六进制字符串）
 * @security FNV-1a 比 djb2 有更好的分布特性，但仍不是加密安全的
 */
export function hashPasswordSync(text: string): string {
  const saltedText = HASH_SALT_PREFIX + text;
  
  // FNV-1a 哈希参数（32位版本）
  const FNV_PRIME = 0x01000193;
  const FNV_OFFSET = 0x811c9dc5;
  
  // 双重哈希以增加输出长度和复杂度
  let hash1 = FNV_OFFSET;
  let hash2 = FNV_OFFSET ^ 0x5bd1e995;
  
  for (let i = 0; i < saltedText.length; i++) {
    const char = saltedText.charCodeAt(i);
    hash1 ^= char;
    hash1 = Math.imul(hash1, FNV_PRIME);
    hash2 ^= (char << 8) | (char >> 8);
    hash2 = Math.imul(hash2, FNV_PRIME);
  }
  
  // 组合两个哈希值为 64 位输出
  const hex1 = (hash1 >>> 0).toString(16).padStart(8, '0');
  const hex2 = (hash2 >>> 0).toString(16).padStart(8, '0');
  return hex1 + hex2;
}

/**
 * 验证密码是否匹配
 * @param password - 输入的密码
 * @param hashedPassword - 存储的哈希密码
 * @returns 是否匹配
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  const inputHash = await hashPassword(password);
  return timingSafeEqual(inputHash, hashedPassword);
}

/**
 * 同步验证密码是否匹配
 * @param password - 输入的密码
 * @param hashedPassword - 存储的哈希密码
 * @returns 是否匹配
 */
export function verifyPasswordSync(
  password: string,
  hashedPassword: string
): boolean {
  const inputHash = hashPasswordSync(password);
  return timingSafeEqual(inputHash, hashedPassword);
}

/**
 * 时间安全的字符串比较（防止时序攻击）
 * @description 使用固定时间比较，无论字符串长度或内容如何，比较时间恒定
 * @param a - 字符串 A
 * @param b - 字符串 B
 * @returns 是否相等
 */
function timingSafeEqual(a: string, b: string): boolean {
  // 参数验证
  if (typeof a !== 'string') a = '';
  if (typeof b !== 'string') b = '';
  
  // 固定比较长度（使用两者中较长的长度，最小 64）
  // 这样无论实际长度如何，比较时间都是恒定的
  const compareLength = Math.max(a.length, b.length, 64);
  
  // 长度差异也参与结果计算，但不影响比较时间
  let result = a.length ^ b.length;
  
  // 固定时间比较
  for (let i = 0; i < compareLength; i++) {
    // 使用模运算确保不会越界，同时保持恒定时间
    const charA = a.charCodeAt(i % (a.length || 1)) || 0;
    const charB = b.charCodeAt(i % (b.length || 1)) || 0;
    result |= charA ^ charB;
  }
  
  return result === 0;
}
