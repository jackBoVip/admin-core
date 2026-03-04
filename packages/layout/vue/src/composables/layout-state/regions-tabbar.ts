/**
 * 布局标签栏区域状态 Composable（Vue）。
 * @description 封装标签栏可见性与高度读取，供头部/内容区进行布局联动计算。
 */
import { computed, type ComputedRef } from 'vue';
import { useLayoutComputed } from '../use-layout-context';

/**
 * `useTabbarState` 返回值。
 */
export interface UseTabbarStateReturn {
  /** 标签栏高度（像素）。 */
  height: ComputedRef<number>;
  /** 标签栏是否显示。 */
  visible: ComputedRef<boolean>;
}

/**
 * 读取标签栏区域状态。
 * @description 从布局派生结果中提取标签栏高度与可见状态。
 * @returns 标签栏高度与可见性。
 */
export function useTabbarState(): UseTabbarStateReturn {
  const layoutComputed = useLayoutComputed();

  /**
   * 标签栏高度。
   */
  const height = computed(() => layoutComputed.value.tabbarHeight);
  /**
   * 标签栏是否可见。
   */
  const visible = computed(() => layoutComputed.value.showTabbar);

  return {
    height,
    visible,
  };
}
