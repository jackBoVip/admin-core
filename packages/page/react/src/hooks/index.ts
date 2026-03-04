/**
 * page-react Hooks 导出入口。
 * @description 汇总页面控制、Query+Table 组合、语言订阅与状态选择 Hook。
 */
export { useAdminPage, type UseAdminPage } from './use-admin-page';
export {
  useAdminPageQueryTable,
  type UseAdminPageQueryTable,
} from './use-admin-page-query-table';
export { useLocaleVersion } from './useLocaleVersion';
export { usePageSelector } from './use-page-selector';
