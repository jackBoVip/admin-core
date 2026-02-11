import { useLayoutComputed } from '../use-layout-context';

export function useTabbarState() {
  const computed = useLayoutComputed();

  return {
    height: computed.tabbarHeight,
    visible: computed.showTabbar,
  };
}
