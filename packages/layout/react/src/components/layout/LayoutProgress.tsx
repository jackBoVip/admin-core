/**
 * 页面切换进度条。
 * @description 根据路由切换与刷新状态展示顶部进度反馈动画。
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePageTransition, useRouter, useLayoutState } from '../../hooks';

/**
 * 布局顶栏进度条组件。
 * @description 在路由切换或页面刷新时展示过渡进度反馈。
 */
export function LayoutProgress() {
  const { enabled, showProgress } = usePageTransition();
  const { currentPath } = useRouter();
  const [state] = useLayoutState();

  const shouldShow = enabled && showProgress;
  const [visible, setVisible] = useState(false);
  const [percent, setPercent] = useState(0);
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  /**
   * 清理所有进度条动画定时器。
   */
  const clearTimers = useCallback(() => {
    timers.current.forEach((timer) => clearTimeout(timer));
    timers.current = [];
  }, []);

  /**
   * 重置进度条状态并清理挂起任务。
   */
  const reset = useCallback(() => {
    clearTimers();
    setVisible(false);
    setPercent(0);
  }, [clearTimers]);

  /**
   * 启动一次进度条动画流程。
   */
  const start = useCallback(() => {
    if (!shouldShow) return;
    clearTimers();
    setVisible(true);
    setPercent(0);

    timers.current.push(setTimeout(() => {
      setPercent(28);
    }, 10));

    timers.current.push(setTimeout(() => {
      setPercent(62);
    }, 180));

    timers.current.push(setTimeout(() => {
      setPercent(85);
    }, 360));

    timers.current.push(setTimeout(() => {
      setPercent(100);
    }, 560));

    timers.current.push(setTimeout(() => {
      setVisible(false);
      setPercent(0);
    }, 760));
  }, [clearTimers, shouldShow]);

  useEffect(() => {
    if (!shouldShow) return;
    start();
  }, [currentPath, state.refreshKey, shouldShow, start]);

  useEffect(() => {
    if (!shouldShow) {
      reset();
    }
  }, [shouldShow, reset]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  if (!shouldShow) return null;

  return (
    <div
      className="layout-progress"
      data-visible={visible ? 'true' : undefined}
    >
      <div className="layout-progress__bar" style={{ width: `${percent}%` }} />
    </div>
  );
}
