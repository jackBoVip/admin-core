/**
 * 布局标签栏区域状态 Hook（React）。
 * @description 封装标签栏可见性与高度读取，供头部/内容区进行布局联动计算。
 */
import { useLayoutComputed } from '../use-layout-context';

/**
 * `useTabbarState` 返回值。
 */
export interface UseTabbarStateReturn {
  /** 标签栏高度（像素）。 */
  height: number;
  /** 标签栏是否显示。 */
  visible: boolean;
}

/**
 * 读取标签栏区域状态。
 * @description 从布局派生结果中提取标签栏高度与可见状态。
 * @returns 标签栏高度及可见性。
 */
export function useTabbarState(): UseTabbarStateReturn {
  const computed = useLayoutComputed();

  return {
    height: computed.tabbarHeight,
    visible: computed.showTabbar,
  };
}
