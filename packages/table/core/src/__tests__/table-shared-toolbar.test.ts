import { describe, expect, it, vi } from 'vitest';
import {
  buildBuiltinToolbarTools,
  createTableLocaleText,
  evaluateToolbarToolPermission,
  resolveColumnCustomState,
  resolveToolbarActionTools,
  resolveToolbarActionButtonClassState,
  resolveToolbarInlinePosition,
  resolveToolbarHintConfig,
  resolveToolbarActionPresentation,
  resolveToolbarActionButtonRenderState,
  resolveToolbarActionThemeClass,
  resolveToolbarActionTypeClass,
  resolveVisibleToolbarActionTools,
  resolveToolbarCustomConfig,
  resolveToolbarToolVisibility,
  resolveToolbarToolsSlotPosition,
  shouldRenderToolbarTool,
  isToolbarCustomEnabled,
  triggerToolbarActionTool,
} from '../utils';

describe('table shared toolbar utils', () => {
  it('should build builtin tools by toolbar config', () => {
    const localeText = createTableLocaleText();
    expect(
      buildBuiltinToolbarTools(
        { custom: true, refresh: true, zoom: true },
        localeText,
        {
          maximized: true,
        }
      )
    ).toEqual([
      { code: 'refresh', title: localeText.refresh },
      { code: 'zoom', title: localeText.zoomOut },
      { code: 'custom', title: localeText.custom },
    ]);

    expect(
      buildBuiltinToolbarTools(
        { custom: true, refresh: true, zoom: true },
        localeText,
        {
          hasToolbarToolsSlot: true,
        }
      )
    ).toEqual([]);

    expect(
      buildBuiltinToolbarTools(
        { custom: false, refresh: true, zoom: true },
        localeText
      )
    ).toEqual([
      { code: 'refresh', title: localeText.refresh },
      { code: 'zoom', title: localeText.zoomIn },
    ]);
  });

  it('should resolve toolbar tool positions', () => {
    expect(resolveToolbarInlinePosition('left')).toBe('before');
    expect(resolveToolbarInlinePosition('right')).toBe('after');
    expect(resolveToolbarInlinePosition('before')).toBe('before');
    expect(resolveToolbarInlinePosition('after')).toBe('after');
    expect(resolveToolbarInlinePosition(undefined)).toBe('after');

    expect(resolveToolbarToolsSlotPosition('before')).toBe('before');
    expect(resolveToolbarToolsSlotPosition('after')).toBe('after');
    expect(resolveToolbarToolsSlotPosition('left')).toBe('before');
    expect(resolveToolbarToolsSlotPosition('right')).toBe('after');
    expect(resolveToolbarToolsSlotPosition('replace')).toBe('replace');
    expect(resolveToolbarToolsSlotPosition(undefined)).toBe('after');
  });

  it('should resolve toolbar hint config', () => {
    expect(resolveToolbarHintConfig('  提示内容  ')).toEqual({
      align: 'center',
      overflow: 'wrap',
      speed: 14,
      text: '提示内容',
    });

    expect(
      resolveToolbarHintConfig({
        align: 'right',
        color: '#f43f5e',
        content: '滚动提示',
        fontSize: 15,
        overflow: 'scroll',
        speed: 9,
      })
    ).toEqual({
      align: 'right',
      color: '#f43f5e',
      fontSize: '15px',
      overflow: 'scroll',
      speed: 9,
      text: '滚动提示',
    });

    expect(
      resolveToolbarHintConfig({
        text: '无效配置',
        speed: -3,
      })
    ).toMatchObject({
      speed: 14,
    });
    expect(resolveToolbarHintConfig({ text: '' })).toBeUndefined();
    expect(resolveToolbarHintConfig(undefined)).toBeUndefined();
  });

  it('should resolve toolbar custom config and external custom state', () => {
    expect(resolveToolbarCustomConfig({ custom: true })).toEqual({
      enabled: true,
    });
    expect(resolveToolbarCustomConfig({ custom: false })).toEqual({
      enabled: false,
    });
    expect(isToolbarCustomEnabled({ custom: true })).toBe(true);
    expect(isToolbarCustomEnabled({ custom: false })).toBe(false);
    expect(isToolbarCustomEnabled()).toBe(false);

    expect(
      resolveColumnCustomState({
        columnCustomState: {
          visible: {
            name: false,
          },
        },
      })
    ).toEqual({
      visible: {
        name: false,
      },
    });
  });

  it('should trigger toolbar action tool callbacks', () => {
    const logs: string[] = [];
    const tool = {
      code: 'export',
      onClick(payload: { code?: string; index: number }) {
        logs.push(`tool:${payload.code}:${payload.index}`);
      },
    };

    triggerToolbarActionTool(tool, 2, {
      onToolbarToolClick(payload) {
        logs.push(`event:${payload.code}`);
      },
    });

    expect(logs).toEqual(['event:export', 'tool:export:2']);
  });

  it('should resolve toolbar action tools with rules and permissions', () => {
    const resolved = resolveToolbarActionTools(
      [
        {
          code: 'export',
          disabled: ({ maximized }) => !!maximized,
          permission: {
            arg: 'code',
            value: ['TABLE_EXPORT'],
          },
          title: '导出',
        },
        {
          code: 'print',
          show: false,
          title: '打印',
        },
        {
          code: 'hidden',
          permission: false,
          title: '隐藏',
        },
        {
          code: 'sync',
          label: '同步',
        },
      ],
      {
        maximized: true,
        showSearchForm: true,
      }
    );

    expect(resolved).toHaveLength(2);
    expect(resolved[0]).toMatchObject({
      code: 'export',
      disabled: true,
      index: 0,
      title: '导出',
      permission: {
        arg: 'code',
        name: 'access',
        value: ['TABLE_EXPORT'],
      },
    });
    expect(resolved[1]).toMatchObject({
      code: 'sync',
      disabled: false,
      index: 3,
      title: '同步',
    });
    expect(resolved.find((item) => item.code === 'hidden')).toBeUndefined();
  });

  it('should normalize toolbar permission shorthand with and/or modes', () => {
    const resolved = resolveToolbarActionTools([
      {
        code: 'array-or',
        permission: ['TABLE_A', 'TABLE_B'],
      },
      {
        code: 'object-or',
        permission: {
          or: ['TABLE_A', 'TABLE_B'],
        },
      },
      {
        code: 'object-and',
        permission: {
          and: ['TABLE_A', 'TABLE_B'],
        },
      },
    ]);

    expect(resolved[0]?.permission).toMatchObject({
      arg: 'code',
      mode: 'or',
      modifiers: {
        or: true,
      },
      value: ['TABLE_A', 'TABLE_B'],
    });
    expect(resolved[1]?.permission).toMatchObject({
      arg: 'code',
      mode: 'or',
      modifiers: {
        or: true,
      },
      value: ['TABLE_A', 'TABLE_B'],
    });
    expect(resolved[2]?.permission).toMatchObject({
      arg: 'code',
      mode: 'and',
      modifiers: {
        and: true,
      },
      value: ['TABLE_A', 'TABLE_B'],
    });
  });

  it('should evaluate toolbar permission and render rule', () => {
    expect(
      evaluateToolbarToolPermission(
        {
          arg: 'code',
          mode: 'or',
          value: ['TABLE_A'],
        },
        {
          accessCodes: ['TABLE_A', 'TABLE_B'],
        }
      )
    ).toBe(true);

    expect(
      evaluateToolbarToolPermission(
        {
          arg: 'role',
          mode: 'and',
          value: ['admin', 'manager'],
        },
        {
          accessRoles: ['admin', 'manager', 'viewer'],
        }
      )
    ).toBe(true);

    expect(
      shouldRenderToolbarTool(
        {
          code: 'export',
          permission: {
            arg: 'code',
            value: ['TABLE_EXPORT'],
          },
        },
        {
          accessCodes: ['TABLE_READ'],
        }
      )
    ).toBe(false);

    expect(
      shouldRenderToolbarTool(
        {
          code: 'export',
          permission: {
            arg: 'code',
            value: ['TABLE_EXPORT'],
          },
        },
        {
          defaultWhenNoAccess: true,
        }
      )
    ).toBe(true);
  });

  it('should resolve toolbar tool visibility with unified strategy', () => {
    const tool = {
      code: 'export',
      permission: {
        arg: 'code',
        value: ['TABLE_EXPORT'],
      },
    };

    expect(
      resolveToolbarToolVisibility(tool, {
        accessCodes: ['TABLE_EXPORT'],
      })
    ).toBe(true);
    expect(
      resolveToolbarToolVisibility(tool, {
        useDirectiveWhenNoAccess: true,
        directiveRenderer: () => true,
      })
    ).toBe(true);
    expect(
      resolveToolbarToolVisibility(tool, {
        useDirectiveWhenNoAccess: true,
        directiveRenderer: () => false,
      })
    ).toBe(false);
    expect(resolveToolbarToolVisibility(tool)).toBe(false);
  });

  it('should resolve visible toolbar tools with shared pipeline', () => {
    const tools = resolveVisibleToolbarActionTools({
      accessCodes: ['TABLE_EXPORT'],
      excludeCodes: ['search'],
      showSearchForm: true,
      tools: [
        {
          code: 'search',
          title: 'Search',
        },
        {
          code: 'export',
          permission: {
            arg: 'code',
            value: ['TABLE_EXPORT'],
          },
          title: 'Export',
        },
        {
          code: 'hidden',
          show: false,
          title: 'Hidden',
        },
      ],
    });

    expect(tools).toHaveLength(1);
    expect(tools[0]?.code).toBe('export');
    expect(tools[0]?.title).toBe('Export');
  });

  it('should resolve toolbar action type class', () => {
    expect(resolveToolbarActionTypeClass('clear')).toBe('is-clear');
    expect(resolveToolbarActionTypeClass('text')).toBe('is-clear');
    expect(resolveToolbarActionTypeClass('text-clear')).toBe('is-clear');
    expect(resolveToolbarActionTypeClass('primary')).toBe('is-primary');
    expect(resolveToolbarActionTypeClass(' warning ')).toBe('is-warning');
    expect(resolveToolbarActionTypeClass('error')).toBe('is-error');
    expect(resolveToolbarActionTypeClass('primary-outline')).toBe('is-primary-outline');
    expect(resolveToolbarActionTypeClass('primary-text')).toBe('is-primary-text');
    expect(resolveToolbarActionTypeClass('text-danger')).toBe('is-danger-text');
    expect(resolveToolbarActionTypeClass('warning-border')).toBe('is-warning-outline');
    expect(resolveToolbarActionTypeClass('outline-danger')).toBe('is-danger-outline');
    expect(resolveToolbarActionTypeClass('border-info')).toBe('is-info-outline');
    expect(resolveToolbarActionTypeClass('default')).toBe('');
    expect(resolveToolbarActionTypeClass('unknown')).toBe('');
  });

  it('should resolve toolbar action button class state', () => {
    const classState = resolveToolbarActionButtonClassState({
      attrs: {
        class: 'from-attrs',
        className: {
          'attrs-enabled': true,
          'attrs-disabled': false,
        },
      },
      class: ['from-tool', { 'tool-enabled': true }],
      icon: 'icon-test',
      text: 'Click',
      type: 'danger-outline',
    });

    expect(classState.presentation).toMatchObject({
      hasIcon: true,
      iconOnly: false,
      text: 'Click',
    });
    expect(classState.classList).toEqual(
      expect.arrayContaining([
        'admin-table__toolbar-action-btn',
        'admin-table__toolbar-slot-btn',
        'is-danger-outline',
        'is-static-color',
        'has-icon',
        'from-attrs',
        'attrs-enabled',
        'from-tool',
        'tool-enabled',
      ])
    );

    const iconOnlyState = resolveToolbarActionButtonClassState({
      icon: 'icon-only',
      text: '',
    });
    expect(iconOnlyState.classList).toEqual(['admin-table__toolbar-tool-btn']);
  });

  it('should resolve toolbar action button render state', () => {
    const renderState = resolveToolbarActionButtonRenderState({
      attrs: {
        class: 'custom-class',
        className: 'custom-name',
        disabled: false,
        'data-test': 'ok',
      },
      code: 'auto',
      disabled: true,
      icon: 'icon-auto',
      index: 2,
      text: 'Auto',
      title: 'Auto Build',
      type: 'primary',
    });

    expect(renderState.key).toBe('auto-2');
    expect(renderState.disabled).toBe(true);
    expect(renderState.title).toBe('Auto Build');
    expect(renderState.attrs).toEqual({
      'data-test': 'ok',
      disabled: false,
    });
    expect(renderState.classList).toEqual(
      expect.arrayContaining([
        'admin-table__toolbar-action-btn',
        'admin-table__toolbar-slot-btn',
        'is-primary',
        'has-icon',
      ])
    );
  });

  it('should resolve toolbar action theme class', () => {
    expect(
      resolveToolbarActionThemeClass({
        type: 'success',
      })
    ).toBe('is-static-color');
    expect(
      resolveToolbarActionThemeClass({
        followTheme: false,
        type: 'clear',
      })
    ).toBe('');
    expect(
      resolveToolbarActionThemeClass({
        followTheme: false,
        type: 'primary-text',
      })
    ).toBe('');
    expect(
      resolveToolbarActionThemeClass({
        followTheme: false,
        type: 'success',
      })
    ).toBe('is-static-color');
    expect(
      resolveToolbarActionThemeClass({
        followTheme: false,
        type: 'success-text',
      })
    ).toBe('is-static-color');
    expect(
      resolveToolbarActionThemeClass({
        followTheme: false,
        type: 'success-outline',
      })
    ).toBe('is-static-color');
    expect(
      resolveToolbarActionThemeClass({
        followTheme: false,
        type: 'primary',
      })
    ).toBe('');
    expect(
      resolveToolbarActionThemeClass({
        themeColor: false,
        type: 'warning',
      })
    ).toBe('is-static-color');
    expect(
      resolveToolbarActionThemeClass({
        followTheme: true,
        type: 'danger',
      })
    ).toBe('');
  });

  it('should resolve toolbar action presentation by icon and text config', () => {
    expect(
      resolveToolbarActionPresentation({
        icon: 'vxe-table-icon-refresh',
        text: '',
        title: 'refresh',
      })
    ).toEqual({
      hasIcon: true,
      iconClass: 'vxe-table-icon-refresh',
      iconOnly: true,
      text: '',
    });

    expect(
      resolveToolbarActionPresentation({
        icon: 'vxe-table-icon-refresh',
        text: '刷新',
        title: '刷新',
      })
    ).toEqual({
      hasIcon: true,
      iconClass: 'vxe-table-icon-refresh',
      iconOnly: false,
      text: '刷新',
    });

    expect(
      resolveToolbarActionPresentation({
        title: '导出',
      })
    ).toEqual({
      hasIcon: false,
      iconClass: undefined,
      iconOnly: false,
      text: '导出',
    });
  });
});
