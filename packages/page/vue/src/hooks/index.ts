/**
 * page-vue Hooks 导出入口。
 * @description 汇总页面控制、Query+Table 组合与状态选择 Hook；语言订阅 Hook 由 composables 导出并在此透传。
 */
export { useAdminPage, type UseAdminPage } from './use-admin-page';
export {
  useAdminPageQueryTable,
  type UseAdminPageQueryTable,
} from './use-admin-page-query-table';
export { usePageStore } from './use-page-store';
export { useLocaleVersion } from '../composables/useLocaleVersion';
