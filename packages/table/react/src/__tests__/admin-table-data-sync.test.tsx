/** @vitest-environment jsdom */

import { createTableApi } from '@admin-core/table-core';
import { act, create } from 'react-test-renderer';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminTable } from '../components/AdminTable';
import { setupAdminTableReact } from '../setup';

const mockedState = vi.hoisted(() => ({
  latestTableProps: null as null | Record<string, any>,
}));

vi.mock('antd', async () => {
  const React = await import('react');
  return {
    ConfigProvider: ({ children }: Record<string, any>) =>
      React.createElement(React.Fragment, null, children),
    Input: (props: Record<string, any>) => React.createElement('input', props),
    Table: (props: Record<string, any>) => {
      mockedState.latestTableProps = props;
      return React.createElement('div', {
        'data-testid': 'mock-antd-table',
      });
    },
    theme: {
      darkAlgorithm: {},
      defaultAlgorithm: {},
    },
  };
});

vi.mock('antd/locale/en_US', () => ({
  default: {},
}));

vi.mock('antd/locale/zh_CN', () => ({
  default: {},
}));

vi.mock('@admin-core/form-react', async () => {
  const React = await import('react');
  return {
    useAdminForm: () => {
      const formApiRef = React.useRef<{
        getValues: () => Promise<Record<string, any>>;
        resetForm: () => Promise<void>;
        setLatestSubmissionValues: (values: Record<string, any>) => void;
        setState: (updater: any) => void;
        unmount: () => void;
      }>();
      if (!formApiRef.current) {
        formApiRef.current = {
          getValues: async () => ({}),
          resetForm: async () => {},
          setLatestSubmissionValues: () => {},
          setState: () => {},
          unmount: () => {},
        };
      }
      const MockForm = () => null;
      return [MockForm, formApiRef.current] as const;
    },
  };
});

describe('AdminTable data sync', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        addEventListener: vi.fn(),
        addListener: vi.fn(),
        dispatchEvent: vi.fn(),
        matches: false,
        media: '(max-width: 768px)',
        onchange: null,
        removeEventListener: vi.fn(),
        removeListener: vi.fn(),
      })),
    });
    mockedState.latestTableProps = null;
    setupAdminTableReact({
      bindPreferences: false,
      locale: 'en-US',
    });
  });

  it('should keep proxy-loaded rows after grid options update without data patch', async () => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    const initialRows = [
      {
        id: 1,
        name: 'Initial',
      },
    ];
    const remoteRows = [
      {
        id: 2,
        name: 'Remote',
      },
    ];
    const query = vi.fn(async () => ({
      items: remoteRows,
      total: remoteRows.length,
    }));
    const api = createTableApi({
      gridOptions: {
        columns: [
          {
            dataIndex: 'name',
            title: 'Name',
          },
        ],
        data: initialRows,
        pagerConfig: {
          currentPage: 1,
          enabled: true,
          pageSize: 20,
          total: initialRows.length,
        },
        proxyConfig: {
          ajax: {
            query,
          },
          autoLoad: false,
          enabled: true,
        },
      },
      tableTitle: 'Users',
    });

    let renderer: null | ReturnType<typeof create> = null;
    await act(async () => {
      renderer = create(<AdminTable api={api as any} />);
    });

    expect(mockedState.latestTableProps?.dataSource?.[0]?.name).toBe('Initial');

    await act(async () => {
      await api.query({});
    });

    expect(query).toHaveBeenCalledTimes(1);
    expect(mockedState.latestTableProps?.dataSource?.[0]?.name).toBe('Remote');

    await act(async () => {
      api.setGridOptions({
        columnCustomState: {
          order: ['name'],
        } as any,
      });
      await Promise.resolve();
    });

    expect(mockedState.latestTableProps?.dataSource?.[0]?.name).toBe('Remote');

    await act(async () => {
      renderer?.unmount();
    });
  });

  it('should recompute cell strategy when row value mutates under same row reference', async () => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    const rows = [
      {
        id: 1,
        score: 10,
      },
    ];
    const api = createTableApi({
      gridOptions: {
        columns: [
          {
            dataIndex: 'score',
            title: 'Score',
          },
        ],
        data: rows,
        strategy: {
          columns: {
            score: {
              formula: '=score * 2',
            },
          },
        },
      },
      tableTitle: 'Scores',
    });

    let renderer: null | ReturnType<typeof create> = null;
    await act(async () => {
      renderer = create(<AdminTable api={api as any} />);
    });

    const resolveScoreColumn = () =>
      (mockedState.latestTableProps?.columns ?? []).find(
        (column: Record<string, any>) => column.dataIndex === 'score'
      ) as
        | {
            render?: (value: any, record: Record<string, any>, rowIndex: number) => any;
          }
        | undefined;

    const initialColumn = resolveScoreColumn();
    expect(initialColumn?.render?.(rows[0].score, rows[0], 0)).toBe(20);

    rows[0].score = 20;
    await act(async () => {
      api.setGridOptions({
        loading: true,
      });
      await Promise.resolve();
    });

    const updatedColumn = resolveScoreColumn();
    expect(updatedColumn?.render?.(rows[0].score, rows[0], 0)).toBe(40);

    await act(async () => {
      renderer?.unmount();
    });
  });
});
