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
