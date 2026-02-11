import {
  buildLayoutPreferencesSnapshot,
  createLayoutPreferencesSyncRuntime,
  resolveAllLayoutCSSVariables,
  type BasicLayoutProps,
} from '@admin-core/layout';
import { getPreferencesManager } from '@admin-core/preferences-vue';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useLayoutContext } from '../use-layout-context';

export function useAllCSSVariables() {
  const context = useLayoutContext();

  const variables = computed(() => resolveAllLayoutCSSVariables(context.props, context.state));

  return variables;
}

export function useLayoutPreferences() {
  const context = useLayoutContext();
  const preferencesProps = ref<Partial<BasicLayoutProps>>({});
  const runtime = createLayoutPreferencesSyncRuntime({
    createManager: () => getPreferencesManager(),
    onChange: (nextProps) => {
      preferencesProps.value = nextProps;
    },
  });

  onMounted(() => {
    runtime.start();
  });

  const snapshot = computed(() =>
    buildLayoutPreferencesSnapshot(preferencesProps.value, context.props)
  );

  const mergedProps = computed(() => snapshot.value.mergedProps);
  const layoutType = computed(() => snapshot.value.layoutType);
  const themeMode = computed(() => snapshot.value.themeMode);
  const isDark = computed(() => snapshot.value.isDark);
  const sidebarConfig = computed(() => snapshot.value.sidebarConfig);
  const headerConfig = computed(() => snapshot.value.headerConfig);
  const tabbarConfig = computed(() => snapshot.value.tabbarConfig);
  const footerConfig = computed(() => snapshot.value.footerConfig);

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
