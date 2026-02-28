import { useSubscribedVersion } from './use-subscribed-version';

export function createUseLocaleVersionHook<TVersion>(
  getVersion: () => TVersion,
  subscribeVersionChange: (listener: () => void) => () => void
) {
  return function useLocaleVersion() {
    return useSubscribedVersion(getVersion, subscribeVersionChange);
  };
}
