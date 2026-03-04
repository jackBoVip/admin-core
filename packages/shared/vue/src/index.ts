/**
 * shared-vue Composable 导出入口。
 * @description 汇总 Vue 侧跨包复用的通用状态与订阅 Composable。
 */
/**
 * 语言与版本订阅相关 Composable。
 * @description 统一封装版本订阅模式，减少重复实现。
 */
export * from './use-locale-version';
export * from './use-subscribed-version';
/**
 * Store 切片选择器 Composable。
 * @description 提供基于 selector 的细粒度响应式订阅能力。
 */
export * from './use-store-selector';
