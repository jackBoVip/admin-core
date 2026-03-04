/**
 * Tabs React 组件实现。
 * @description 负责渲染页签头、处理受控/非受控激活态并派发切换/关闭事件。
 */
import type {
  AdminTabsOptions,
} from '@admin-core/tabs-core';
import type {
  TabsProps,
} from 'antd';
import type {
  AdminTabReactComponent,
  AdminTabReactItem,
  AdminTabsChangePayload,
  AdminTabsClosePayload,
  AdminTabsReactProps,
} from '../types';

import {
  createAdminTabsChangePayload,
  createAdminTabsClosePayload,
  getAdminTabsLocale,
  getAdminTabsLocaleVersion,
  normalizeAdminTabsOptions,
  resolveAdminTabsOptionsWithDefaults,
  resolveAdminTabsActiveItem,
  resolveAdminTabsItemsSignature,
  resolveAdminTabsRootClassNames,
  resolveAdminTabsSelectedActiveKey,
  resolveAdminTabsShowClose,
  resolveAdminTabsStyleVars,
  resolveAdminTabsUncontrolledActiveKey,
  resolveAdminTabsVisible,
  subscribeAdminTabsLocale,
} from '@admin-core/tabs-core';
import { Tabs } from 'antd';
import {
  Fragment,
  createElement,
  isValidElement,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';
import type { CSSProperties } from 'react';

import { getAdminTabsReactSetupState } from '../setup';

/**
 * React 适配层注入的 Tabs 默认配置。
 * @description 用于在用户未显式传入 `tabs` 参数时统一补齐体验参数。
 */
const REACT_TABS_DEFAULTS: Partial<AdminTabsOptions> = {
  contentInsetTop: -10,
};

/**
 * AdminTabs 组件参数。
 */
interface Props extends AdminTabsReactProps {
  /** 页签数据列表。未传时使用空数组。 */
  items?: AdminTabReactItem[];
}

/**
 * 空页签列表常量。
 * @description 复用同一个数组引用，避免渲染期间重复创建临时空数组。
 */
const EMPTY_TAB_ITEMS: AdminTabReactItem[] = [];

/**
 * React 版页签组件。
 * @description 支持受控/非受控激活态、关闭按钮与内容区域联动渲染。
 *
 * @param props 组件属性。
 * @returns 页签头与激活内容节点。
 */
export const AdminTabs = memo(function AdminTabs(props: Props) {
  /**
   * 外部传入的 Tabs 运行时参数。
   * @description 用于控制激活态、样式与事件回调等核心行为。
   */
  const {
    activeKey,
    className,
    closeAriaLabel: closeAriaLabelProp,
    defaultActiveKey,
    onChange,
    onClose,
    style,
    tabs,
  } = props;
  /**
   * 页签项列表（空值兜底为共享空数组）。
   */
  const items = props.items ?? EMPTY_TAB_ITEMS;
  /**
   * 是否处于受控模式。
   */
  const isControlled = activeKey !== undefined;
  /**
   * 非受控模式下的内部激活键。
   */
  const [internalActiveKey, setInternalActiveKey] = useState<null | string>(null);
  /**
   * 当前语言版本号（用于触发本地化文案刷新）。
   */
  const localeVersion = useSyncExternalStore(
    subscribeAdminTabsLocale,
    getAdminTabsLocaleVersion,
    getAdminTabsLocaleVersion
  );
  /**
   * 当前语言下关闭按钮文案。
   */
  const localeCloseLabel = useMemo(() => {
    void localeVersion;
    return getAdminTabsLocale().close;
  }, [localeVersion]);

  /**
   * 合并 setup 默认值后的 tabs 配置。
   */
  const mergedTabs = useMemo<boolean | AdminTabsOptions | undefined>(() => {
    const setupState = getAdminTabsReactSetupState();
    const rawTabs = tabs ?? setupState.defaults.tabs;
    return resolveAdminTabsOptionsWithDefaults(rawTabs, REACT_TABS_DEFAULTS);
  }, [tabs]);
  /**
   * 标准化后的 tabs 配置。
   */
  const normalizedTabs = useMemo(() => {
    return normalizeAdminTabsOptions(mergedTabs);
  }, [mergedTabs]);

  /**
   * 默认激活键（含 setup 默认值回退）。
   */
  const mergedDefaultActiveKey = useMemo<null | string>(() => {
    const setupState = getAdminTabsReactSetupState();
    return defaultActiveKey ?? setupState.defaults.defaultActiveKey ?? null;
  }, [defaultActiveKey]);

  /**
   * 关闭按钮的 aria-label。
   */
  const closeAriaLabel = useMemo(() => {
    const setupState = getAdminTabsReactSetupState();
    return (
      closeAriaLabelProp ??
      setupState.defaults.closeAriaLabel ??
      localeCloseLabel
    );
  }, [closeAriaLabelProp, localeCloseLabel]);

  /**
   * 是否显示页签头区域。
   */
  const visible = useMemo(() => {
    return resolveAdminTabsVisible(normalizedTabs, items);
  }, [items, normalizedTabs]);

  /**
   * 页签项签名，用于判定列表变更。
   */
  const itemsKeySignature = useMemo(() => {
    return resolveAdminTabsItemsSignature(items);
  }, [items]);

  /**
   * 监听页签列表与默认激活项变化并维护非受控激活态。
   */
  useEffect(() => {
    if (isControlled) {
      return;
    }

    setInternalActiveKey((previous) => {
      return resolveAdminTabsUncontrolledActiveKey(
        items,
        previous,
        mergedDefaultActiveKey
      );
    });
  }, [isControlled, items, itemsKeySignature, mergedDefaultActiveKey]);

  /**
   * 处理页签切换。
   * @description 非受控模式下更新内部激活态，并向外派发切换事件负载。
   *
   * @param nextKey 目标页签键值。
   * @returns 无返回值。
   */
  const handleChange = useCallback((nextKey: string) => {
    if (!isControlled) {
      setInternalActiveKey(nextKey);
    }
    const payload: AdminTabsChangePayload = createAdminTabsChangePayload(
      items,
      nextKey
    );
    onChange?.(payload);
  }, [isControlled, items, onChange]);

  /**
   * 构建 antd `Tabs` 所需的页签项配置。
   * @description 统一处理禁用态、标题文案与关闭按钮行为。
   *
   * @returns antd 页签项数组。
   */
  const tabItems = useMemo<NonNullable<TabsProps['items']>>(() => {
    const showClose = resolveAdminTabsShowClose(items);
    return items.map((item) => {
      return {
        disabled: item.disabled,
        key: item.key,
        label: (
          <span className="admin-tabs__tab-label-wrap">
            <span className="admin-tabs__tab-label">{item.title ?? item.key}</span>
            {showClose && item.closable !== false ? (
              <button
                aria-label={closeAriaLabel}
                className="admin-tabs__tab-close"
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  const payload: AdminTabsClosePayload = createAdminTabsClosePayload(item);
                  onClose?.(payload);
                }}
              >
                ×
              </button>
            ) : null}
          </span>
        ),
      };
    });
  }, [closeAriaLabel, items, onClose]);

  /**
   * 最终激活键（兼容受控与非受控模式）。
   */
  const selectedActiveKey = useMemo(() => {
    return resolveAdminTabsSelectedActiveKey(items, {
      controlledActiveKey: activeKey ?? null,
      isControlled,
      uncontrolledActiveKey: internalActiveKey,
    }) ?? undefined;
  }, [activeKey, internalActiveKey, isControlled, items]);

  /**
   * 当前激活页签项。
   */
  const activeItem = useMemo(() => {
    return resolveAdminTabsActiveItem(items, selectedActiveKey ?? null);
  }, [items, selectedActiveKey]);

  /**
   * 解析当前激活页签对应内容节点。
   * @description 兼容 React 元素与组件类型两种配置形式。
   *
   * @returns 激活内容节点，未命中时返回 `null`。
   */
  const activeContent = useMemo(() => {
    const component = activeItem?.component as AdminTabReactComponent | undefined;
    if (!component) {
      return null;
    }
    if (isValidElement(component)) {
      return component;
    }
    return createElement(component, activeItem?.componentProps ?? {});
  }, [activeItem]);

  /**
   * 页签头节点
   * @description 当 `visible` 为真时渲染 antd Tabs 头部与交互能力。
   */
  const tabsNode = visible ? (
    <Tabs
      activeKey={selectedActiveKey}
      animated={{ inkBar: true, tabPane: false }}
      className={[
        'admin-tabs--antd',
        ...resolveAdminTabsRootClassNames(normalizedTabs),
        className ?? '',
      ].filter(Boolean).join(' ')}
      items={tabItems}
      onChange={handleChange}
      style={{
        ...resolveAdminTabsStyleVars(normalizedTabs),
        ...(style ?? {}),
      } as CSSProperties}
    />
  ) : null;

  /**
   * 激活内容节点
   * @description 当前激活项存在可渲染内容时输出内容容器。
   */
  const contentNode = activeContent ? (
    <div className="admin-tabs__content">{activeContent}</div>
  ) : null;

  if (!tabsNode && !contentNode) {
    return null;
  }

  return <Fragment>{tabsNode}{contentNode}</Fragment>;
});
