/**
 * 设置区块组件
 */
import { memo } from 'react';
import type { ReactNode } from 'react';

export interface BlockProps {
  /** 区块标题 */
  title?: string;
  /** 子元素 */
  children: ReactNode;
}

/**
 * 区块组件 - 使用 memo 优化重渲染
 */
export const Block = memo<BlockProps>(function Block({ title, children }) {
  return (
    <div className="preferences-block">
      {title && <h3 className="preferences-block-title">{title}</h3>}
      <div className="preferences-block-content">{children}</div>
    </div>
  );
});

export default Block;
