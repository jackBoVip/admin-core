import { act, create } from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';

import { setupAdminTableReact, getAdminTableReactSetupState } from '../setup';
import { useAdminTable } from '../hooks/use-admin-table';

describe('table react adapter', () => {
  it('setup should apply runtime options', () => {
    const permissionChecker = vi.fn(() => true);
    const defaultGridOptions = {
      border: true,
    };

    setupAdminTableReact({
      bindPreferences: false,
      defaultGridOptions,
      locale: 'en-US',
      permissionChecker,
    });

    const state = getAdminTableReactSetupState();
    expect(state.locale).toBe('en-US');
    expect(state.defaultGridOptions).toMatchObject(defaultGridOptions);
    expect(state.permissionChecker).toBe(permissionChecker);
  });

  it('useAdminTable should return component and api', async () => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    let captured:
      | null
      | ReturnType<typeof useAdminTable<Record<string, any>, Record<string, any>>> = null;

    function Probe() {
      captured = useAdminTable({
        tableTitle: '基础列表',
      });
      return null;
    }

    let renderer: null | ReturnType<typeof create> = null;
    await act(async () => {
      renderer = create(<Probe />);
    });

    if (!captured) {
      throw new Error('useAdminTable result not captured');
    }

    const [TableComponent, tableApi] = captured;
    expect(typeof TableComponent).toBe('function');
    expect(tableApi.getState().tableTitle).toBe('基础列表');

    await act(async () => {
      renderer?.unmount();
    });
  });
});
