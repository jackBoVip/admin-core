import {
  createLayoutAutoLockRuntime,
  resolveLockScreenSnapshot,
  type LockScreenConfig,
} from '@admin-core/layout';
import { computed, onMounted, onUnmounted, watch } from 'vue';
import { useLayoutContext } from '../use-layout-context';

export function useLockScreen() {
  const context = useLayoutContext();

  const config = computed<LockScreenConfig>(() => context.props.lockScreen || {});
  const snapshot = computed(() => resolveLockScreenSnapshot(config.value));
  const runtime = createLayoutAutoLockRuntime({
    getConfig: () => config.value,
    onLock: () => {
      context.events.onLockScreen?.();
    },
  });

  const lock = () => {
    context.events.onLockScreen?.();
  };

  const unlock = (_password?: string) => {
    // 验证密码逻辑由外部处理
  };

  onMounted(() => {
    runtime.start();
  });

  watch(config, () => runtime.sync(), { deep: true });

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
