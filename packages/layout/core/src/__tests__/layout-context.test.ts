import { describe, expect, it } from 'vitest';
import {
  applyStatePatch,
  applyStatePatchMutable,
  createLayoutContextActionsController,
  createLayoutPropsStateSyncController,
  getInitialLayoutState,
  getLayoutStatePatchFromProps,
  isSidebarMixedLayout,
  resolveLayoutType,
} from '../utils';

describe('layout-context helpers', () => {
  it('should resolve layout type and mixed-sidebar flag', () => {
    expect(resolveLayoutType({ layout: 'header-nav' })).toBe('header-nav');
    expect(resolveLayoutType({ layout: 'header-nav', isMobile: true })).toBe('sidebar-nav');
    expect(isSidebarMixedLayout({ layout: 'sidebar-mixed-nav' })).toBe(true);
  });

  it('should build initial layout state from props', () => {
    const state = getInitialLayoutState({
      layout: 'sidebar-nav',
      sidebar: {
        collapsed: true,
        expandOnHover: true,
      },
      panel: {
        collapsed: true,
      },
    });

    expect(state.sidebarCollapsed).toBe(true);
    expect(state.sidebarExpandOnHover).toBe(true);
    expect(state.panelCollapsed).toBe(true);
  });

  it('should create state patch from props', () => {
    const prev = getInitialLayoutState({
      layout: 'sidebar-nav',
      sidebar: { collapsed: false, expandOnHover: false },
      panel: { collapsed: false },
    });

    const patch = getLayoutStatePatchFromProps(prev, {
      layout: 'sidebar-nav',
      sidebar: { collapsed: true, expandOnHover: true },
      panel: { collapsed: true },
    });

    expect(patch.changed).toBe(true);
    expect(patch.patch).toMatchObject({
      sidebarCollapsed: true,
      sidebarExpandOnHover: true,
      panelCollapsed: true,
    });
    expect(patch.sidebarCollapseChanged).toBe(true);
  });

  it('should apply immutable patch with reference reuse', () => {
    const prev = {
      a: 1,
      b: true,
    };

    const noChange = applyStatePatch(prev, { b: true });
    expect(noChange.changed).toBe(false);
    expect(noChange.nextState).toBe(prev);

    const changed = applyStatePatch(prev, { a: 2 });
    expect(changed.changed).toBe(true);
    expect(changed.nextState).not.toBe(prev);
    expect(changed.nextState).toEqual({ a: 2, b: true });
  });

  it('should apply mutable patch only when value changes', () => {
    const state = {
      a: 1,
      b: true,
    };

    expect(applyStatePatchMutable(state, { b: true })).toBe(false);
    expect(applyStatePatchMutable(state, { a: 3 })).toBe(true);
    expect(state).toEqual({ a: 3, b: true });
  });

  it('should handle shared context actions', () => {
    const state = {
      sidebarCollapsed: false,
      panelCollapsed: false,
      openMenuKeys: ['dashboard'],
    };
    let props = { layout: 'sidebar-nav' as const };
    let sidebarCollapsedEvent: boolean | undefined;
    let panelCollapsedEvent: boolean | undefined;

    const controller = createLayoutContextActionsController({
      getProps: () => props,
      getState: () => state,
      setState: (patch) => {
        Object.assign(state, patch);
      },
      onSidebarCollapse: (collapsed) => {
        sidebarCollapsedEvent = collapsed;
      },
      onPanelCollapse: (collapsed) => {
        panelCollapsedEvent = collapsed;
      },
    });

    expect(controller.toggleSidebarCollapse()).toBe(true);
    expect(state.sidebarCollapsed).toBe(true);
    expect(sidebarCollapsedEvent).toBe(true);

    props = { layout: 'sidebar-mixed-nav' };
    expect(controller.toggleSidebarCollapse()).toBe(true);
    expect(state.sidebarCollapsed).toBe(false);
    expect(sidebarCollapsedEvent).toBe(false);
    expect(controller.toggleSidebarCollapse()).toBe(false);

    expect(controller.togglePanelCollapse()).toBe(true);
    expect(state.panelCollapsed).toBe(true);
    expect(panelCollapsedEvent).toBe(true);

    expect(controller.setOpenMenuKeys(['dashboard'])).toBe(false);
    expect(controller.setOpenMenuKeys(['system'])).toBe(true);
    expect(state.openMenuKeys).toEqual(['system']);
  });

  it('should sync layout state from props via shared controller', () => {
    const state = getInitialLayoutState({
      layout: 'sidebar-nav',
      sidebar: { collapsed: false, expandOnHover: false },
      panel: { collapsed: false },
    });
    let sidebarCollapsedEvent: boolean | undefined;

    const controller = createLayoutPropsStateSyncController({
      getState: () => state,
      setState: (patch) => {
        Object.assign(state, patch);
      },
      onSidebarCollapse: (collapsed) => {
        sidebarCollapsedEvent = collapsed;
      },
    });

    expect(
      controller.syncProps({
        layout: 'sidebar-nav',
        sidebar: { collapsed: true, expandOnHover: true },
        panel: { collapsed: true },
      })
    ).toBe(true);

    expect(state.sidebarCollapsed).toBe(true);
    expect(state.sidebarExpandOnHover).toBe(true);
    expect(state.panelCollapsed).toBe(true);
    expect(sidebarCollapsedEvent).toBe(true);
  });
});
