import {
  createLayoutAutoLockRuntime,
  resolveLockScreenSnapshot,
  type LockScreenConfig,
} from '@admin-core/layout';
import { computed, onMounted, onUnmounted, watch } from 'vue';
import { useLayoutContext } from '../use-layout-context';

/**
 * 管理锁屏功能配置与自动锁屏运行时。
 * @returns 锁屏状态快照、配置与手动锁屏方法。
 */
export function useLockScreen() {
  /**
   * 布局上下文
   * @description 提供锁屏配置与锁屏事件分发能力。
   */
  const context = useLayoutContext();

  /**
   * 锁屏配置对象。
   */
  const config = computed<LockScreenConfig>(() => context.props.lockScreen || {});
  /**
   * 锁屏派生快照。
   */
  const snapshot = computed(() => resolveLockScreenSnapshot(config.value));
  /**
   * 自动锁屏运行时控制器。
   */
  const runtime = createLayoutAutoLockRuntime({
    getConfig: () => config.value,
    onLock: () => {
      context.events.onLockScreen?.();
    },
  });

  /**
   * 主动触发锁屏事件。
   */
  const lock = () => {
    context.events.onLockScreen?.();
  };

  /**
   * 预留的解锁动作入口。
   *
   * @param _password 可选密码参数，实际校验由业务侧实现。
   */
  const unlock = (_password?: string) => {
    /* 密码校验逻辑由业务侧实现。 */
  };

  /**
   * 组件挂载时启动自动锁屏运行时。
   */
  onMounted(() => {
    runtime.start();
  });

  /**
   * 监听锁屏配置变化并同步自动锁屏运行时。
   */
  watch(config, () => runtime.sync(), { deep: true });

  /**
   * 组件卸载时销毁自动锁屏运行时。
   */
  onUnmounted(() => {
    runtime.destroy();
  });

  return {
    isLocked: computed(() => snapshot.value.isLocked),
    backgroundImage: computed(() => snapshot.value.backgroundImage),
    showUserInfo: computed(() => snapshot.value.showUserInfo),
    showClock: computed(() => snapshot.value.showClock),
    showDate: computed(() => snapshot.value.showDate),
    config,
    lock,
    unlock,
  };
}
