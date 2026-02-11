import { describe, expect, it } from 'vitest';
import { createLayoutSidebarStateController } from '../utils';

describe('layout-sidebar-runtime-state helpers', () => {
  it('should control collapse state with non-collapsible layout guard', () => {
    const state = {
      sidebarCollapsed: true,
      sidebarExpandOnHovering: false,
      sidebarExtraVisible: true,
      sidebarExtraCollapsed: false,
      sidebarExpandOnHover: false,
    };
    const events: boolean[] = [];

    const controller = createLayoutSidebarStateController({
      getState: () => state,
      getLayoutComputed: () => ({
        isSidebarMixedNav: true,
        isHeaderMixedNav: false,
      }),
      setState: (patch) => Object.assign(state, patch),
      onSidebarCollapse: (value) => events.push(value),
    });

    const snapshot = controller.getSnapshot();
    expect(snapshot.isNonCollapsible).toBe(true);
    expect(snapshot.collapsed).toBe(false);

    const changed = controller.setCollapsed(true);
    expect(changed).toBe(true);
    expect(state.sidebarCollapsed).toBe(false);
    expect(events).toEqual([false]);
  });

  it('should toggle and update hover effects', () => {
    const state = {
      sidebarCollapsed: true,
      sidebarExpandOnHovering: false,
      sidebarExtraVisible: true,
      sidebarExtraCollapsed: false,
      sidebarExpandOnHover: true,
    };

    const controller = createLayoutSidebarStateController({
      getState: () => state,
      getLayoutComputed: () => ({
        isSidebarMixedNav: false,
        isHeaderMixedNav: false,
      }),
      setState: (patch) => Object.assign(state, patch),
    });

    controller.handleMouseEnter();
    expect(state.sidebarExpandOnHovering).toBe(true);

    controller.handleMouseLeave();
    expect(state.sidebarExpandOnHovering).toBe(false);
    expect(state.sidebarExtraVisible).toBe(false);

    const toggled = controller.toggle();
    expect(toggled).toBe(true);
    expect(state.sidebarCollapsed).toBe(false);
  });

  it('should expose direct setters with change checks', () => {
    const state = {
      sidebarCollapsed: false,
      sidebarExpandOnHovering: false,
      sidebarExtraVisible: false,
      sidebarExtraCollapsed: false,
      sidebarExpandOnHover: false,
    };

    const controller = createLayoutSidebarStateController({
      getState: () => state,
      getLayoutComputed: () => ({
        isSidebarMixedNav: false,
        isHeaderMixedNav: false,
      }),
      setState: (patch) => Object.assign(state, patch),
    });

    expect(controller.setExpandOnHovering(false)).toBe(false);
    expect(controller.setExpandOnHovering(true)).toBe(true);
    expect(controller.setExtraVisible(true)).toBe(true);
    expect(controller.setExtraCollapsed(true)).toBe(true);
    expect(controller.setExpandOnHover(true)).toBe(true);

    expect(state).toMatchObject({
      sidebarExpandOnHovering: true,
      sidebarExtraVisible: true,
      sidebarExtraCollapsed: true,
      sidebarExpandOnHover: true,
    });
  });
});
