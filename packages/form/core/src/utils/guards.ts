/**
 * 复用 shared-core 的基础类型守卫工具。
 */
import {
  isBoolean as sharedIsBoolean,
  isFunction as sharedIsFunction,
  isObject as sharedIsObject,
  isString as sharedIsString,
} from '@admin-core/shared-core';

/**
 * 判断值是否为布尔类型。
 * @param value 待判断值。
 * @returns 是布尔值时返回 `true`。
 */
export const isBoolean = sharedIsBoolean;

/**
 * 判断值是否为函数类型。
 * @param value 待判断值。
 * @returns 是函数时返回 `true`。
 */
export const isFunction = sharedIsFunction;

/**
 * 判断值是否为非空对象。
 * @param value 待判断值。
 * @returns 是对象且不为 `null` 时返回 `true`。
 */
export const isObject = sharedIsObject;

/**
 * 判断值是否为字符串类型。
 * @param value 待判断值。
 * @returns 是字符串时返回 `true`。
 */
export const isString = sharedIsString;
