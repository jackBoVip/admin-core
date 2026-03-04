import {
  buildLayoutPreferencesSnapshot,
  createLayoutPreferencesSyncRuntime,
  resolveAllLayoutCSSVariables,
  type BasicLayoutProps,
} from '@admin-core/layout';
import { getPreferencesManager } from '@admin-core/preferences-vue';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useLayoutContext } from '../use-layout-context';

/**
 * 汇总当前布局对应的全部 CSS 变量。
 * @returns 可直接注入样式系统的 CSS 变量键值对。
 */
export function useAllCSSVariables() {
  /**
   * 布局上下文
   * @description 提供布局配置与状态，供 CSS 变量解析使用。
   */
  const context = useLayoutContext();

  /**
   * 当前布局完整 CSS 变量映射。
   */
  const variables = computed(() => resolveAllLayoutCSSVariables(context.props, context.state));

  return variables;
}

/**
 * 订阅偏好设置并生成布局配置快照。
 * @returns 偏好配置、合并后布局配置及派生区域配置。
 */
export function useLayoutPreferences() {
  /**
   * 布局上下文
   * @description 提供当前显式布局配置，参与偏好合并计算。
   */
  const context = useLayoutContext();
  /**
   * 偏好配置快照（来自偏好中心）。
   */
  const preferencesProps = ref<Partial<BasicLayoutProps>>({});
  /**
   * 偏好同步运行时，负责订阅偏好管理器并回写配置。
   */
  const runtime = createLayoutPreferencesSyncRuntime({
    createManager: () => getPreferencesManager(),
    onChange: (nextProps) => {
      preferencesProps.value = nextProps;
    },
  });

  /**
   * 组件挂载时启动偏好同步运行时。
   */
  onMounted(() => {
    runtime.start();
  });

  /**
   * 偏好快照
   * @description 将偏好配置与显式配置合并后得到统一快照。
   */
  const snapshot = computed(() =>
    buildLayoutPreferencesSnapshot(preferencesProps.value, context.props)
  );

  /**
   * 合并后的布局配置。
   */
  const mergedProps = computed(() => snapshot.value.mergedProps);
  /**
   * 布局类型。
   */
  const layoutType = computed(() => snapshot.value.layoutType);
  /**
   * 主题模式。
   */
  const themeMode = computed(() => snapshot.value.themeMode);
  /**
   * 是否暗色模式。
   */
  const isDark = computed(() => snapshot.value.isDark);
  /**
   * 侧边栏配置快照。
   */
  const sidebarConfig = computed(() => snapshot.value.sidebarConfig);
  /**
   * 顶栏配置快照。
   */
  const headerConfig = computed(() => snapshot.value.headerConfig);
  /**
   * 标签栏配置快照。
   */
  const tabbarConfig = computed(() => snapshot.value.tabbarConfig);
  /**
   * 底栏配置快照。
   */
  const footerConfig = computed(() => snapshot.value.footerConfig);

  /**
   * 组件卸载时销毁偏好同步运行时。
   */
  onUnmounted(() => {
    runtime.destroy();
  });

  return {
    preferencesProps,
    mergedProps,
    layoutType,
    themeMode,
    isDark,
    sidebarConfig,
    headerConfig,
    tabbarConfig,
    footerConfig,
  };
}
