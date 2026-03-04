/**
 * Table Core 默认配置常量。
 * @description 定义表格 API 初始化时的默认展示、代理与工具栏参数。
 */
import type { AdminTableOptions } from '../types';

/**
 * 创建表格默认配置。
 * @template TData 行数据类型。
 * @template TFormValues 查询表单值类型。
 * @returns 默认表格配置对象。
 */
export function createDefaultTableOptions<
  TData extends Record<string, any> = Record<string, any>,
  TFormValues extends Record<string, any> = Record<string, any>,
>(): AdminTableOptions<TData, TFormValues> {
  return {
    /** 根容器附加类名。 */
    class: '',
    /** 查询表单配置。 */
    formOptions: undefined,
    /** Grid 容器附加类名。 */
    gridClass: '',
    /** Grid 事件回调集合。 */
    gridEvents: {},
    gridOptions: {
      proxyConfig: {
        /** 初始化时不自动发起查询。 */
        autoLoad: false,
        /** 默认关闭远程代理。 */
        enabled: false,
      },
      toolbarConfig: {
        /** 默认关闭工具栏搜索输入。 */
        search: false,
        /** 默认不注入额外工具项。 */
        tools: [],
      },
    },
    /** 默认关闭查询区与表格区分隔条。 */
    separator: false,
    /** 默认展示查询表单。 */
    showSearchForm: true,
    /** 默认标题为空。 */
    tableTitle: '',
    /** 默认无标题提示。 */
    tableTitleHelp: '',
  };
}
