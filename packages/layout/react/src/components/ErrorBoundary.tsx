import { logger } from '@admin-core/layout';
import { Component, type ErrorInfo, type ReactNode } from 'react';

/**
 * 错误边界组件属性。
 * @description 定义错误边界的子树、兜底内容与错误上报回调。
 */
export interface ErrorBoundaryProps {
  /** 子节点列表。 */
  children: ReactNode;
  /** 发生错误时的兜底渲染内容。 */
  fallback?: ReactNode;
  /** 重置键，变化时会清除错误状态。 */
  resetKey?: string | number;
  /** 捕获错误后的上报回调。 */
  onError?: (error: Error, info: ErrorInfo) => void;
}

/**
 * 错误边界内部状态。
 * @description 仅维护是否进入错误态，便于切换兜底视图。
 */
interface ErrorBoundaryState {
  /** 当前是否处于错误态。 */
  hasError: boolean;
}

/**
 * ErrorBoundary 类定义。
 * @description 捕获 React 渲染异常并输出兜底内容，防止整页崩溃。
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  /**
   * React 错误边界派生状态钩子。
   * @returns 标记错误态的状态补丁。
   */
  static getDerivedStateFromError() {
    return { hasError: true };
  }

  /**
   * 捕获渲染错误并上报。
   * @param error 错误对象。
   * @param info 组件堆栈信息。
   * @returns 无返回值。
   */
  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info);
    if (!this.props.onError) {
      logger.error('ErrorBoundary caught an error.', error, info);
    }
  }

  /**
   * 监听 `resetKey` 变化并重置错误态。
   * @param prevProps 上一次属性。
   * @returns 无返回值。
   */
  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (this.state.hasError && this.props.resetKey !== prevProps.resetKey) {
      this.setState({ hasError: false });
    }
  }

  /**
   * 渲染错误边界内容。
   * @returns 子节点或兜底节点。
   */
  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="layout-error-boundary" role="alert">
            Content rendering failed. Please try again later.
          </div>
        )
      );
    }

    return this.props.children;
  }
}
