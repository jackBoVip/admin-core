import type { AdminTableOptions } from '../types';

export function createDefaultTableOptions(): AdminTableOptions {
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
