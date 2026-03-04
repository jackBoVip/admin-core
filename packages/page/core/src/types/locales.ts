/**
 * 内置支持的语言。
 * @description 目前由 page-core 内置维护的语言包集合。
 */
export type BuiltInSupportedLocale = 'en-US' | 'zh-CN';
/**
 * 支持的语言标识（内置 + 自定义字符串）。
 * @description 允许业务方通过扩展注册方式接入更多语言。
 */
export type SupportedLocale = BuiltInSupportedLocale | (string & {});

/**
 * 页面模块语言包结构。
 * @description 覆盖页面容器与查询表格场景下的默认文案。
 */
export interface PageLocaleMessages {
  /** 页面文案集合。 */
  page: {
    /** 空页面提示。 */
    empty: string;
    /** 路由未匹配提示。 */
    noMatchRoute: string;
    /** 查询表格切换到固定模式文案。 */
    queryTableSwitchToFixed: string;
    /** 查询表格切换到流式模式文案。 */
    queryTableSwitchToFlow: string;
    /** 未命名页面标题前缀。 */
    untitled: string;
  };
}

/**
 * 页面语言包增量输入。
 * @description 注册语言时可只传入需要覆盖的字段。
 */
export interface PageLocaleMessageInput {
  /** 页面文案增量。 */
  page?: Partial<PageLocaleMessages['page']>;
}
