import {
  createLayoutCheckUpdatesRuntime,
  resolveCheckUpdatesEnabled,
} from '@admin-core/layout';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useLayoutContext } from '../use-layout-context';

/**
 * 管理“检查更新”功能状态。
 * @param checkFn 自定义检查更新函数，返回是否存在新版本。
 * @returns 检查更新配置、启用状态与最新检查结果。
 */
export function useCheckUpdates(checkFn?: () => Promise<boolean>) {
  /**
   * 布局上下文
   * @description 提供检查更新配置与事件桥接能力。
   */
  const context = useLayoutContext();

  /**
   * 检查更新配置。
   */
  const config = computed(() => context.props.checkUpdates || {});
  /**
   * 检查更新功能是否启用。
   */
  const enabled = computed(() => resolveCheckUpdatesEnabled(config.value));
  /**
   * 最近一次检查结果。
   */
  const hasUpdate = ref(false);
  /**
   * 检查更新运行时控制器。
   */
  const runtime = createLayoutCheckUpdatesRuntime({
    getConfig: () => config.value,
    getCheckFn: () => checkFn,
    onUpdate: (result) => {
      hasUpdate.value = result;
    },
  });

  /**
   * 组件挂载时启动检查更新运行时。
   */
  onMounted(() => {
    runtime.start();
  });

  /**
   * 监听检查更新配置变化并同步运行时行为。
   */
  watch(config, () => {
    runtime.sync();
  }, { deep: true });

  /**
   * 监听启用状态变化并同步运行时行为。
   */
  watch(enabled, () => {
    runtime.sync();
  });

  /**
   * 组件卸载时销毁检查更新运行时。
   */
  onUnmounted(() => {
    runtime.destroy();
  });

  return {
    enabled,
    hasUpdate,
    config,
  };
}
