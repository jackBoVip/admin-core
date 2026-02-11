import { computed } from 'vue';
import { useLayoutComputed } from '../use-layout-context';

export function useTabbarState() {
  const layoutComputed = useLayoutComputed();

  const height = computed(() => layoutComputed.value.tabbarHeight);
  const visible = computed(() => layoutComputed.value.showTabbar);

  return {
    height,
    visible,
  };
}
