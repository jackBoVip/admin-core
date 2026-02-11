import { describe, expect, it } from 'vitest';
import { createLayoutPanelStateController } from '../utils';

describe('layout-panel-runtime-state helpers', () => {
  it('should set panel collapsed state and emit event', () => {
    const state = {
      panelCollapsed: false,
    };
    const events: boolean[] = [];

    const controller = createLayoutPanelStateController({
      getState: () => state,
      setState: (patch) => Object.assign(state, patch),
      getPanelConfig: () => ({ position: 'left' }),
      onPanelCollapse: (value) => events.push(value),
    });

    expect(controller.getCollapsed()).toBe(false);
    expect(controller.getPosition()).toBe('left');

    expect(controller.setCollapsed(true)).toBe(true);
    expect(state.panelCollapsed).toBe(true);
    expect(events).toEqual([true]);

    expect(controller.setCollapsed(true)).toBe(false);
    expect(events).toEqual([true]);
  });

  it('should toggle panel collapsed state', () => {
    const state = {
      panelCollapsed: true,
    };

    const controller = createLayoutPanelStateController({
      getState: () => state,
      setState: (patch) => Object.assign(state, patch),
      getPanelConfig: () => undefined,
    });

    expect(controller.getPosition()).toBe('right');
    expect(controller.toggle()).toBe(true);
    expect(state.panelCollapsed).toBe(false);
  });
});
