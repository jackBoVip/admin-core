import { applyStatePatchMutable, createLayoutPanelStateController } from '@admin-core/layout';
import { computed } from 'vue';
import { useLayoutComputed, useLayoutContext } from '../use-layout-context';

export function usePanelState() {
  const context = useLayoutContext();
  const layoutComputed = useLayoutComputed();
  const controller = createLayoutPanelStateController({
    getState: () => context.state,
    setState: (patch) => {
      applyStatePatchMutable(context.state, patch);
    },
    getPanelConfig: () => context.props.panel,
    onPanelCollapse: (value) => context.events.onPanelCollapse?.(value),
  });

  const collapsed = computed({
    get: () => controller.getCollapsed(),
    set: (value) => controller.setCollapsed(value),
  });

  const width = computed(() => layoutComputed.value.panelWidth);
  const visible = computed(() => layoutComputed.value.showPanel);
  const position = computed(() => controller.getPosition());

  const toggle = () => controller.toggle();

  return {
    collapsed,
    width,
    visible,
    position,
    toggle,
  };
}
