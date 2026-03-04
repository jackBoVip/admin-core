/**
 * 依赖追踪结果类型。
 */
type TrackedDependencies = 'all' | Set<string>;

/**
 * 判断值是否可被依赖追踪代理。
 * @param value 待判断值。
 * @returns 是否可追踪对象。
 */
function isTrackableObject(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null;
}

/**
 * 拼接路径段。
 * @param base 基础路径。
 * @param key 子路径键。
 * @returns 拼接后的路径。
 */
function joinPath(base: string, key: string) {
  return base ? `${base}.${key}` : key;
}

/**
 * 判断变更字段与依赖集合是否有交集。
 * @param changedFields 变更字段列表。
 * @param dependencies 依赖集合。
 * @returns 是否需要重新计算依赖。
 */
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

/**
 * 通过代理读取行为追踪值依赖路径。
 * @param values 原始值对象。
 * @returns 代理值和依赖读取器。
 */
export function trackValueDependencies<T extends Record<string, any>>(values: T) {
  const proxyCache = new WeakMap<object, any>();
  const dependencies = new Set<string>();
  let dependAll = false;

  /**
   * 标记“依赖任意字段”模式。
   * @returns 无返回值。
   */
  const markWildcard = () => {
    dependAll = true;
  };

  /**
   * 为目标对象创建依赖追踪代理。
   * @param target 当前目标对象。
   * @param path 当前访问路径前缀。
   * @returns 代理对象或原值。
   */
  const createProxy = (target: any, path: string): any => {
    if (!isTrackableObject(target)) {
      return target;
    }
    const cached = proxyCache.get(target);
    if (cached) {
      return cached;
    }
    const proxy = new Proxy(target, {
      /**
       * 追踪属性读取。
       *
       * @param source 代理目标对象。
       * @param key 当前访问键。
       * @param receiver 代理接收器。
       * @returns 属性值（对象值将继续被代理包装）。
       */
      get(source, key, receiver) {
        if (typeof key === 'symbol') {
          return Reflect.get(source, key, receiver);
        }
        const nextPath = joinPath(path, key);
        dependencies.add(nextPath);
        const value = Reflect.get(source, key, receiver);
        return createProxy(value, nextPath);
      },
      /**
       * 追踪属性描述符读取。
       *
       * @param source 代理目标对象。
       * @param key 当前访问键。
       * @returns 属性描述符。
       */
      getOwnPropertyDescriptor(source, key) {
        if (typeof key !== 'symbol') {
          dependencies.add(joinPath(path, key));
        }
        return Reflect.getOwnPropertyDescriptor(source, key);
      },
      /**
       * 追踪 `in` 操作符访问。
       *
       * @param source 代理目标对象。
       * @param key 当前访问键。
       * @returns 键是否存在于对象或其原型链上。
       */
      has(source, key) {
        if (typeof key === 'symbol') {
          markWildcard();
          return Reflect.has(source, key);
        }
        dependencies.add(joinPath(path, key));
        return Reflect.has(source, key);
      },
      /**
       * 追踪对象键枚举访问。
       *
       * @param source 代理目标对象。
       * @returns 目标对象全部可枚举键集合。
       */
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
    /**
     * 获取本次依赖追踪读取到的路径集合。
     *
     * @returns 依赖路径集合；若出现通配访问则返回 `'all'`。
     */
    getDependencies(): TrackedDependencies {
      if (dependAll) {
        return 'all';
      }
      return new Set(dependencies);
    },
  };
}
