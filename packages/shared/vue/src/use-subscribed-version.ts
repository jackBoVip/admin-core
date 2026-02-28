import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue';

export function useSubscribedVersion<TVersion>(
  getVersion: () => TVersion,
  subscribeVersionChange: (listener: () => void) => () => void
): Readonly<Ref<TVersion>> {
  const version = ref(getVersion()) as Ref<TVersion>;
  let unsubscribe: null | (() => void) = null;

  onMounted(() => {
    unsubscribe = subscribeVersionChange(() => {
      version.value = getVersion();
    });
  });

  onBeforeUnmount(() => {
    unsubscribe?.();
    unsubscribe = null;
  });

  return version;
}
