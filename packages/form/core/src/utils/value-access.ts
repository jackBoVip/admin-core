type TrackedDependencies = 'all' | Set<string>;

function isTrackableObject(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null;
}

function joinPath(base: string, key: string) {
  return base ? `${base}.${key}` : key;
}

export function pathDependenciesIntersect(
  changedFields: string[],
  dependencies: TrackedDependencies | undefined
) {
  if (!dependencies) {
    return true;
  }
  if (dependencies === 'all') {
    return true;
  }
  if (changedFields.length === 0) {
    return true;
  }
  for (const changedField of changedFields) {
    for (const dependency of dependencies) {
      if (
        changedField === dependency ||
        changedField.startsWith(`${dependency}.`) ||
        dependency.startsWith(`${changedField}.`)
      ) {
        return true;
      }
    }
  }
  return false;
}

export function trackValueDependencies<T extends Record<string, any>>(values: T) {
  const proxyCache = new WeakMap<object, any>();
  const dependencies = new Set<string>();
  let dependAll = false;

  const markWildcard = () => {
    dependAll = true;
  };

  const createProxy = (target: any, path: string): any => {
    if (!isTrackableObject(target)) {
      return target;
    }
    const cached = proxyCache.get(target);
    if (cached) {
      return cached;
    }
    const proxy = new Proxy(target, {
      get(source, key, receiver) {
        if (typeof key === 'symbol') {
          return Reflect.get(source, key, receiver);
        }
        const nextPath = joinPath(path, key);
        dependencies.add(nextPath);
        const value = Reflect.get(source, key, receiver);
        return createProxy(value, nextPath);
      },
      getOwnPropertyDescriptor(source, key) {
        if (typeof key !== 'symbol') {
          dependencies.add(joinPath(path, key));
        }
        return Reflect.getOwnPropertyDescriptor(source, key);
      },
      has(source, key) {
        if (typeof key === 'symbol') {
          markWildcard();
          return Reflect.has(source, key);
        }
        dependencies.add(joinPath(path, key));
        return Reflect.has(source, key);
      },
      ownKeys(source) {
        markWildcard();
        return Reflect.ownKeys(source);
      },
    });
    proxyCache.set(target, proxy);
    return proxy;
  };

  return {
    values: createProxy(values, '') as T,
    getDependencies(): TrackedDependencies {
      if (dependAll) {
        return 'all';
      }
      return new Set(dependencies);
    },
  };
}
