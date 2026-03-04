/**
 * 主题与安全能力 - 快捷键 Composable（Vue）。
 * @description 负责布局快捷键运行时的创建、启停与启用状态同步。
 */
import {
  createLayoutShortcutKeyRuntime,
  createShortcutKeydownHandler,
  resolveShortcutEnabled,
} from '@admin-core/layout';
import { computed, onMounted, onUnmounted, watch } from 'vue';
import { useLayoutContext } from '../use-layout-context';

/**
 * 注册布局全局快捷键监听。
 * @description 将快捷键配置映射为键盘监听运行时，并在启用状态变化时自动同步。
 * @returns 快捷键配置与启用状态。
 */
export function useShortcutKeys() {
  /**
   * 布局上下文
   * @description 提供快捷键配置与事件处理器集合。
   */
  const context = useLayoutContext();

  /**
   * 快捷键配置对象。
   */
  const config = computed(() => context.props.shortcutKeys || {});
  /**
   * 快捷键功能是否启用。
   */
  const enabled = computed(() => resolveShortcutEnabled(config.value));

  /**
   * `keydown` 事件处理器。
   */
  const handleKeydown = createShortcutKeydownHandler({
    getConfig: () => config.value,
    getHandlers: () => context.events,
  });

  /**
   * 快捷键运行时控制器。
   */
  const runtime = createLayoutShortcutKeyRuntime({
    getEnabled: () => enabled.value,
    onKeydown: handleKeydown,
  });

  /**
   * 组件挂载时启动快捷键监听。
   */
  onMounted(() => {
    runtime.start();
  });

  /**
   * 组件卸载时销毁快捷键监听。
   */
  onUnmounted(() => {
    runtime.destroy();
  });

  /**
   * 监听快捷键启用状态并同步运行时监听。
   */
  watch(enabled, () => {
    runtime.sync();
  });

  return {
    enabled,
    config,
  };
}
