import {
  applyStatePatchMutable,
  createLayoutSidebarStateController,
} from '@admin-core/layout';
import { computed } from 'vue';
import { useLayoutComputed, useLayoutContext } from '../use-layout-context';

export function useSidebarState() {
  const context = useLayoutContext();
  const layoutComputed = useLayoutComputed();

  const controller = createLayoutSidebarStateController({
    getState: () => context.state,
    getLayoutComputed: () => layoutComputed.value,
    setState: (patch) => {
      applyStatePatchMutable(context.state, patch);
    },
    onSidebarCollapse: (value) => context.events.onSidebarCollapse?.(value),
  });

  const snapshot = computed(() => controller.getSnapshot());

  const collapsed = computed({
    get: () => snapshot.value.collapsed,
    set: (value) => controller.setCollapsed(value),
  });

  const expandOnHovering = computed({
    get: () => snapshot.value.expandOnHovering,
    set: (value) => controller.setExpandOnHovering(value),
  });

  const extraVisible = computed({
    get: () => snapshot.value.extraVisible,
    set: (value) => controller.setExtraVisible(value),
  });

  const extraCollapsed = computed({
    get: () => snapshot.value.extraCollapsed,
    set: (value) => controller.setExtraCollapsed(value),
  });

  const expandOnHover = computed({
    get: () => snapshot.value.expandOnHover,
    set: (value) => controller.setExpandOnHover(value),
  });

  const width = computed(() => layoutComputed.value.sidebarWidth);
  const visible = computed(() => layoutComputed.value.showSidebar);

  const toggle = () => controller.toggle();
  const handleMouseEnter = () => controller.handleMouseEnter();
  const handleMouseLeave = () => controller.handleMouseLeave();

  return {
    collapsed,
    expandOnHovering,
    extraVisible,
    extraCollapsed,
    expandOnHover,
    width,
    visible,
    layoutComputed,
    toggle,
    handleMouseEnter,
    handleMouseLeave,
  };
}
