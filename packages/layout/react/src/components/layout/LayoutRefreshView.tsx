/**
 * 内容刷新容器
 * @description 仅刷新路由视图内容，不影响内容区外层布局
 */

import { Fragment, memo, type ReactNode } from 'react';
import { useLayoutState } from '../../hooks';

export interface LayoutRefreshViewProps {
  children?: ReactNode;
}

export const LayoutRefreshView = memo(function LayoutRefreshView({
  children,
}: LayoutRefreshViewProps) {
  const [state] = useLayoutState();

  return <Fragment key={state.refreshKey}>{children}</Fragment>;
});
