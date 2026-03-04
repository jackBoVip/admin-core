/**
 * Form Vue 属性规范化工具。
 * @description 统一 attrs 键名与布尔属性值形态，降低模板/JSX 混用差异。
 */
/**
 * 将 kebab-case 属性名转换为 camelCase。
 *
 * @param key 原始属性名。
 * @returns 转换后的属性名。
 */
function toCamelCaseKey(key: string) {
  return key.replace(/-([a-zA-Z])/g, (_, token: string) => token.toUpperCase());
}

const BOOLEAN_ATTR_KEYS = new Set([
  'actionButtonsReverse',
  'collapsed',
  'collapseTriggerResize',
  'colon',
  'compact',
  'destroyOnClose',
  'disabled',
  'disabledOnChangeListener',
  'disabledOnInputListener',
  'hideLabel',
  'hideRequiredMark',
  'requiredMarkFollowTheme',
  'maskClosable',
  'open',
  'queryMode',
  'resetOnClose',
  'resetOnSubmit',
  'scrollToFirstError',
  'showCollapseButton',
  'showDefaultActions',
  'showStepHeader',
  'submitOnChange',
  'submitOnEnter',
]);

/**
 * 规范化 Vue attrs：
 * 1. 同时保留原始键与 camelCase 键；
 * 2. 将布尔空字符串属性归一化为 `true`。
 *
 * @param input 原始 attrs。
 * @returns 规范化后的 attrs 对象。
 */
export function normalizeVueAttrs(input: Record<string, any> | null | undefined) {
  const output: Record<string, any> = {};
  if (!input || typeof input !== 'object') {
    return output;
  }
  for (const [key, value] of Object.entries(input)) {
    const camelKey = toCamelCaseKey(key);
    const normalizedValue =
      value === '' && (BOOLEAN_ATTR_KEYS.has(key) || BOOLEAN_ATTR_KEYS.has(camelKey))
        ? true
        : value;
    output[key] = normalizedValue;
    if (!(camelKey in output)) {
      output[camelKey] = normalizedValue;
    }
  }
  return output;
}
