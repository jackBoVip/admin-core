import { applyStatePatch, createLayoutPanelStateController } from '@admin-core/layout';
import { useMemo } from 'react';
import { useLayoutComputed, useLayoutContext, useLayoutState } from '../use-layout-context';

export function usePanelState() {
  const context = useLayoutContext();
  const computed = useLayoutComputed();
  const [state, setState] = useLayoutState();

  const controller = useMemo(
    () =>
      createLayoutPanelStateController({
        getState: () => state,
        setState: (patch) => {
          setState((prev) => applyStatePatch(prev, patch).nextState);
        },
        getPanelConfig: () => context.props.panel,
        onPanelCollapse: (value) => context.events.onPanelCollapse?.(value),
      }),
    [state, setState, context.props.panel, context.events]
  );

  const collapsed = controller.getCollapsed();
  const width = computed.panelWidth;
  const visible = computed.showPanel;
  const position = controller.getPosition();

  return {
    collapsed,
    width,
    visible,
    position,
    setCollapsed: controller.setCollapsed,
    toggle: controller.toggle,
  };
}
