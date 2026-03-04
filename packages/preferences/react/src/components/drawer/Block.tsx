/**
 * 设置区块组件。
 * @description 用于将同类配置项分组展示，提供统一标题与内容容器结构。
 */
import { memo } from 'react';
import type { ReactNode } from 'react';

/**
 * 设置分组区块参数。
 */
export interface BlockProps {
  /** 区块标题 */
  title?: string;
  /** 子元素 */
  children: ReactNode;
}

/**
 * 区块组件。
 * @description 使用 `memo` 避免在父组件重复渲染时产生无效重绘。
 * @param props 区块参数。
 * @returns 区块容器节点。
 */
export const Block = memo<BlockProps>(function Block({ title, children }) {
  return (
    <div className="preferences-block">
      {title && <h3 className="preferences-block-title">{title}</h3>}
      <div className="preferences-block-content">{children}</div>
    </div>
  );
});

/**
 * 默认导出设置区块容器组件。
 */
export default Block;
