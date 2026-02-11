import {
  createLayoutThemeSystemRuntime,
  resolveThemeSnapshot,
  resolveThemeToggleTargetMode,
  type ThemeConfig,
} from '@admin-core/layout';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useLayoutContext } from '../use-layout-context';

export function useTheme() {
  const context = useLayoutContext();

  const config = computed<ThemeConfig>(() => context.props.theme || {});
  const mode = computed(() => config.value.mode || 'light');

  const systemDark = ref(
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches
  );

  const snapshot = computed(() => resolveThemeSnapshot(config.value, systemDark.value));
  const themeRuntime = createLayoutThemeSystemRuntime({
    getEnabled: () => snapshot.value.isAuto,
    setSystemDark: (value) => {
      systemDark.value = value;
    },
  });

  onMounted(() => {
    themeRuntime.start();
  });

  onUnmounted(() => {
    themeRuntime.destroy();
  });

  watch(
    () => snapshot.value.isAuto,
    () => {
      themeRuntime.sync();
    }
  );

  const toggleTheme = () => {
    context.events.onThemeToggle?.(resolveThemeToggleTargetMode(mode.value));
  };

  return {
    config,
    mode: computed(() => snapshot.value.mode),
    isDark: computed(() => snapshot.value.isDark),
    isAuto: computed(() => snapshot.value.isAuto),
    actualMode: computed(() => snapshot.value.actualMode),
    cssVariables: computed(() => snapshot.value.cssVariables),
    cssClasses: computed(() => snapshot.value.cssClasses),
    isGrayMode: computed(() => snapshot.value.isGrayMode),
    isWeakMode: computed(() => snapshot.value.isWeakMode),
    systemDark,
    toggleTheme,
  };
}
