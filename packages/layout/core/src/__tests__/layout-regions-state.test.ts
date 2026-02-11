import { describe, expect, it } from 'vitest';
import {
  isHeaderAutoHideMode,
  isSidebarNonCollapsible,
  resolveHeaderMode,
  resolveHeaderMouseHidden,
  resolveHeaderScrollHidden,
  resolveNextPanelCollapsed,
  resolveNextSidebarCollapsed,
  resolveResponsiveBreakpoint,
  resolveResponsiveFlags,
  resolveSidebarMouseEnterEffects,
  resolveSidebarMouseLeaveEffects,
  resolveViewportWidthChange,
} from '../utils';

describe('layout-regions-state helpers', () => {
  it('should resolve sidebar collapse behavior', () => {
    expect(
      isSidebarNonCollapsible({ isSidebarMixedNav: true, isHeaderMixedNav: false })
    ).toBe(true);

    expect(
      resolveNextSidebarCollapsed({
        isNonCollapsible: true,
        currentCollapsed: true,
        requestedCollapsed: true,
      })
    ).toEqual({ nextCollapsed: false, changed: true });

    expect(
      resolveNextSidebarCollapsed({
        isNonCollapsible: false,
        currentCollapsed: false,
        requestedCollapsed: true,
      })
    ).toEqual({ nextCollapsed: true, changed: true });
  });

  it('should resolve sidebar hover effects', () => {
    expect(
      resolveSidebarMouseEnterEffects({
        expandOnHover: true,
        collapsed: true,
      })
    ).toEqual({ expandOnHovering: true });

    expect(
      resolveSidebarMouseLeaveEffects({
        expandOnHovering: true,
        expandOnHover: true,
      })
    ).toEqual({ expandOnHovering: false, extraVisible: false });
  });

  it('should resolve header mode and auto-hide decisions', () => {
    expect(resolveHeaderMode('auto')).toBe('auto');
    expect(resolveHeaderMode('unknown')).toBe('fixed');
    expect(isHeaderAutoHideMode('auto-scroll')).toBe(true);

    expect(
      resolveHeaderMouseHidden({
        mouseY: 120,
        currentHidden: false,
      })
    ).toBe(true);

    expect(
      resolveHeaderScrollHidden({
        mode: 'auto-scroll',
        currentHidden: false,
        currentScrollY: 300,
        lastScrollY: 100,
        headerHeight: 64,
        mouseY: 0,
      })
    ).toEqual({ hidden: true, lastScrollY: 300 });
  });

  it('should resolve panel collapse transitions', () => {
    expect(resolveNextPanelCollapsed(false, true)).toEqual({
      nextCollapsed: true,
      changed: true,
    });
    expect(resolveNextPanelCollapsed(true, true)).toEqual({
      nextCollapsed: true,
      changed: false,
    });
  });

  it('should resolve responsive flags and breakpoint', () => {
    expect(resolveResponsiveBreakpoint(500)).toBe('xs');
    expect(resolveResponsiveBreakpoint(900)).toBe('md');
    expect(resolveResponsiveFlags(900)).toEqual({
      isMobile: false,
      isTablet: true,
      isDesktop: false,
    });
  });

  it('should resolve viewport width change', () => {
    expect(resolveViewportWidthChange(1024, 1024)).toEqual({
      width: 1024,
      changed: false,
    });
    expect(resolveViewportWidthChange(1024, 1280)).toEqual({
      width: 1280,
      changed: true,
    });
  });
});
