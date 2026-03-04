/**
 * Tabs Core 样式入口。
 * @description 负责加载标签组件基础样式，并导出样式加载标记。
 */
import './tabs.css';

/**
 * Tabs Core 样式加载标记。
 * @description 通过显式导出常量，确保打包器保留该入口并执行样式副作用导入。
 */
export const tabsCoreStyleLoaded = true;
