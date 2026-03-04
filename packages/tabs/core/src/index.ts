/**
 * @admin-core/tabs-core
 * 无框架依赖的 Tabs 核心协议层
 * @description 提供 Tabs 配置解析、状态计算、样式变量与事件载荷模型。
 */

/**
 * 导出 Tabs Core setup 与运行时配置能力。
 * @description 包含核心初始化与运行期配置解析逻辑。
 */
export * from './config';
/**
 * 导出 Tabs Core 默认配置常量。
 * @description 提供默认 Tabs 配置值与相关常量。
 */
export * from './constants/defaults';
export * from './styles';
/**
 * 导出 Tabs Core 类型定义。
 * @description 汇总 Tabs 配置与事件模型类型。
 */
export type * from './types';
/**
 * 导出 Tabs Core 工具函数集合。
 * @description 包含 activeKey 解析、样式类名计算等无状态工具。
 */
export * from './utils';
