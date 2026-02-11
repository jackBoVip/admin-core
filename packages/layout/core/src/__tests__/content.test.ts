import { describe, expect, it } from 'vitest';
import {
  computeContentClassName,
  computeContentContainerStyle,
  computeContentWrapperStyle,
  computeFooterClassName,
  computeFooterStyle,
  computePanelClassName,
  computePanelStyle,
  generateCopyrightText,
} from '../utils/content';

describe('content utils', () => {
  it('computeContentClassName should include state classes', () => {
    const className = computeContentClassName(
      { compact: true },
      {
        sidebarCollapsed: true,
        showPanel: true,
        panelPosition: 'left',
        panelCollapsed: true,
        isMobile: true,
      }
    );
    expect(className).toContain('layout-content');
    expect(className).toContain('layout-content--compact');
    expect(className).toContain('layout-content--collapsed');
    expect(className).toContain('layout-content--with-panel');
    expect(className).toContain('layout-content--panel-left');
    expect(className).toContain('layout-content--panel-collapsed');
    expect(className).toContain('layout-content--mobile');
  });

  it('computeContentWrapperStyle should calculate margins and footer offset', () => {
    const style = computeContentWrapperStyle(
      {
        sidebarWidth: 80,
        headerHeight: 48,
        tabbarHeight: 40,
        footerHeight: 30,
        panelWidth: 200,
      },
      {
        sidebarCollapsed: false,
        showPanel: true,
        panelPosition: 'left',
        panelCollapsed: false,
        isMobile: false,
      }
    );
    expect(style.marginLeft).toBe('280px');
    expect(style.marginTop).toBe('88px');
    expect(style.marginBottom).toBe('30px');
  });

  it('computeContentContainerStyle should support compact width and per-side paddings', () => {
    const style = computeContentContainerStyle({
      compact: true,
      compactWidth: 960,
      padding: 12,
      paddingTop: 16,
      paddingBottom: 8,
    });
    expect(style.padding).toBe('16px 12px 8px 12px');
    expect(style.maxWidth).toBe('960px');
    expect(style.marginLeft).toBe('auto');
    expect(style.marginRight).toBe('auto');
  });

  it('panel/footer helpers should generate class and styles', () => {
    expect(computePanelClassName({ position: 'left' }, true)).toContain('layout-panel--left');
    expect(computePanelClassName({ position: 'left' }, true)).toContain('layout-panel--collapsed');
    expect(computePanelStyle({ width: 300, collapsedWidth: 80 }, false)).toEqual({ width: '300px' });
    expect(computePanelStyle({ width: 300, collapsedWidth: 80 }, true)).toEqual({ width: '0px' });

    const footerClass = computeFooterClassName({ fixed: true }, true, true);
    expect(footerClass).toContain('layout-footer--fixed');
    expect(footerClass).toContain('layout-footer--with-sidebar');
    expect(footerClass).toContain('layout-footer--collapsed');

    expect(computeFooterStyle({ fixed: true, height: 36 }, 64)).toEqual({
      height: '36px',
      marginLeft: '64px',
    });
  });

  it('generateCopyrightText should render year range and company', () => {
    const year = new Date().getFullYear();
    const text = generateCopyrightText({
      companyName: 'Admin Core',
      startYear: year - 1,
    });
    expect(text).toContain(`© ${year - 1}-${year}`);
    expect(text).toContain('Admin Core');
  });
});
