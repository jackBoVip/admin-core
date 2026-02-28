import { useSyncExternalStore } from 'react';

export function useSubscribedVersion<TVersion>(
  subscribeVersionChange: (listener: () => void) => () => void,
  getVersion: () => TVersion
): TVersion {
  return useSyncExternalStore(
    subscribeVersionChange,
    getVersion,
    getVersion
  );
}
