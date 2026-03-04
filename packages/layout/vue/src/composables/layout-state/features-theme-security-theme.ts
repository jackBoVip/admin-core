import {
  createLayoutThemeSystemRuntime,
  resolveThemeSnapshot,
  resolveThemeToggleTargetMode,
  type ThemeConfig,
} from '@admin-core/layout';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useLayoutContext } from '../use-layout-context';

/**
 * 管理主题模式与系统深色联动。
 * @returns 主题快照、系统状态及主题切换函数。
 */
export function useTheme() {
  /**
   * 布局上下文
   * @description 提供主题配置与主题切换事件回调。
   */
  const context = useLayoutContext();

  /**
   * 主题配置对象。
   */
  const config = computed<ThemeConfig>(() => context.props.theme || {});
  /**
   * 当前主题模式（light/dark/auto）。
   */
  const mode = computed(() => config.value.mode || 'light');

  /**
   * 系统深色状态
   * @description 基于 `prefers-color-scheme` 的实时检测结果。
   */
  const systemDark = ref(
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches
  );

  /**
   * 主题派生快照。
   */
  const snapshot = computed(() => resolveThemeSnapshot(config.value, systemDark.value));
  /**
   * 系统主题联动运行时。
   */
  const themeRuntime = createLayoutThemeSystemRuntime({
    getEnabled: () => snapshot.value.isAuto,
    setSystemDark: (value) => {
      systemDark.value = value;
    },
  });

  /**
   * 组件挂载时启动系统主题监听。
   */
  onMounted(() => {
    themeRuntime.start();
  });

  /**
   * 组件卸载时销毁系统主题监听。
   */
  onUnmounted(() => {
    themeRuntime.destroy();
  });

  /**
   * 监听自动主题开关变化并同步运行时监听状态。
   */
  watch(
    () => snapshot.value.isAuto,
    () => {
      themeRuntime.sync();
    }
  );

  /**
   * 切换主题模式，并通过事件通知外部容器持久化设置。
   */
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
