/**
 * 内容刷新容器。
 * @description 仅刷新路由视图内容，不影响内容区外层布局结构。
 */

import { Fragment, memo, type ReactNode } from 'react';
import { useLayoutState } from '../../hooks';

/**
 * 内容刷新容器参数。
 * @description 通过 `children` 透传需要参与刷新重建的内容。
 */
export interface LayoutRefreshViewProps {
  /** 子节点列表。 */
  children?: ReactNode;
}

/**
 * 内容刷新容器组件。
 * @description 使用 `refreshKey` 控制子树重建，以实现局部刷新。
 * @param props 容器参数。
 * @returns 绑定刷新 key 的内容容器节点。
 */
export const LayoutRefreshView = memo(function LayoutRefreshView({
  children,
}: LayoutRefreshViewProps) {
  const [state] = useLayoutState();

  return <Fragment key={state.refreshKey}>{children}</Fragment>;
});
