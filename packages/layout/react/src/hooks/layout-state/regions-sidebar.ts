import {
  applyStatePatch,
  createLayoutSidebarStateController,
} from '@admin-core/layout';
import { useMemo } from 'react';
import { useLayoutComputed, useLayoutContext, useLayoutState } from '../use-layout-context';

export function useSidebarState() {
  const context = useLayoutContext();
  const computed = useLayoutComputed();
  const [state, setState] = useLayoutState();

  const controller = useMemo(
    () =>
      createLayoutSidebarStateController({
        getState: () => state,
        getLayoutComputed: () => computed,
        setState: (patch) => {
          setState((prev) => applyStatePatch(prev, patch).nextState);
        },
        onSidebarCollapse: (value) => context.events.onSidebarCollapse?.(value),
      }),
    [state, computed, setState, context.events]
  );

  const snapshot = controller.getSnapshot();
  const collapsed = snapshot.collapsed;
  const expandOnHovering = snapshot.expandOnHovering;
  const extraVisible = snapshot.extraVisible;
  const extraCollapsed = snapshot.extraCollapsed;
  const expandOnHover = snapshot.expandOnHover;
  const width = computed.sidebarWidth;
  const visible = computed.showSidebar;

  return {
    collapsed,
    expandOnHovering,
    extraVisible,
    extraCollapsed,
    expandOnHover,
    width,
    visible,
    layoutComputed: computed,
    setCollapsed: controller.setCollapsed,
    toggle: controller.toggle,
    setExpandOnHovering: controller.setExpandOnHovering,
    setExtraVisible: controller.setExtraVisible,
    setExtraCollapsed: controller.setExtraCollapsed,
    setExpandOnHover: controller.setExpandOnHover,
    handleMouseEnter: controller.handleMouseEnter,
    handleMouseLeave: controller.handleMouseLeave,
  };
}
