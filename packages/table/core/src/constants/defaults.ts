import type { AdminTableOptions } from '../types';

export function createDefaultTableOptions<
  TData extends Record<string, any> = Record<string, any>,
  TFormValues extends Record<string, any> = Record<string, any>,
>(): AdminTableOptions<TData, TFormValues> {
  return {
    class: '',
    formOptions: undefined,
    gridClass: '',
    gridEvents: {},
    gridOptions: {
      proxyConfig: {
        autoLoad: false,
        enabled: false,
      },
      toolbarConfig: {
        search: false,
        tools: [],
      },
    },
    separator: true,
    showSearchForm: true,
    tableTitle: '',
    tableTitleHelp: '',
  };
}
