/**
 * Tabs Core 初始化配置类型。
 * @description 定义 Tabs 核心 setup 阶段使用的国际化与初始化参数结构。
 */
/**
 * Tabs 组件国际化文案定义。
 * @description 供核心层与各框架适配层统一读取的文案模型。
 */
export interface AdminTabsLocale {
  /** “关闭页签”操作文案。 */
  close: string;
}

/**
 * Tabs Core 初始化参数。
 * @description 用于在应用启动时覆盖默认语言文案等核心配置。
 */
export interface SetupAdminTabsCoreOptions {
  /** 国际化文案覆盖项，会与当前文案进行浅合并。 */
  locale?: Partial<AdminTabsLocale>;
}
