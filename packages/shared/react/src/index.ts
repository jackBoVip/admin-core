/**
 * shared-react Hook 导出入口。
 * @description 汇总 React 侧跨包复用的通用状态与订阅 Hook。
 */
/**
 * 列表与虚拟滚动相关 Hook。
 * @description 用于通知列表、搜索结果等高频滚动场景。
 */
export * from './use-list-item-height';
export * from './use-virtual-list-scroll';
/**
 * 语言/订阅版本相关 Hook。
 * @description 统一封装基于 `useSyncExternalStore` 的版本订阅模式。
 */
export * from './use-locale-version';
export * from './use-subscribed-version';
/**
 * 通用开关状态 Hook。
 * @description 提供 `isOpen` 场景的一致状态管理接口。
 */
export * from './use-open-state';
