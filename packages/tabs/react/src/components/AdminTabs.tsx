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

const REACT_TABS_DEFAULTS: Partial<AdminTabsOptions> = {
  contentInsetTop: -10,
};

interface Props extends AdminTabsReactProps {
  items?: AdminTabReactItem[];
}

export const AdminTabs = memo(function AdminTabs(props: Props) {
  const items = props.items ?? [];
  const isControlled = props.activeKey !== undefined;
  const [internalActiveKey, setInternalActiveKey] = useState<null | string>(null);
  const localeVersion = useSyncExternalStore(
    subscribeAdminTabsLocale,
    getAdminTabsLocaleVersion,
    getAdminTabsLocaleVersion
  );
  const localeCloseLabel = useMemo(() => {
    return getAdminTabsLocale().close;
  }, [localeVersion]);

  const mergedTabs = useMemo<boolean | AdminTabsOptions | undefined>(() => {
    const setupState = getAdminTabsReactSetupState();
    const rawTabs = props.tabs ?? setupState.defaults.tabs;
    return resolveAdminTabsOptionsWithDefaults(rawTabs, REACT_TABS_DEFAULTS);
  }, [props.tabs]);
  const normalizedTabs = useMemo(() => {
    return normalizeAdminTabsOptions(mergedTabs);
  }, [mergedTabs]);

  const mergedDefaultActiveKey = useMemo<null | string>(() => {
    const setupState = getAdminTabsReactSetupState();
    return props.defaultActiveKey ?? setupState.defaults.defaultActiveKey ?? null;
  }, [props.defaultActiveKey]);

  const closeAriaLabel = useMemo(() => {
    const setupState = getAdminTabsReactSetupState();
    return (
      props.closeAriaLabel ??
      setupState.defaults.closeAriaLabel ??
      localeCloseLabel
    );
  }, [localeCloseLabel, props.closeAriaLabel]);

  const visible = useMemo(() => {
    return resolveAdminTabsVisible(normalizedTabs, items);
  }, [items, normalizedTabs]);

  const itemsKeySignature = useMemo(() => {
    return resolveAdminTabsItemsSignature(items);
  }, [items]);

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

  const handleChange = useCallback((nextKey: string) => {
    if (!isControlled) {
      setInternalActiveKey(nextKey);
    }
    const payload: AdminTabsChangePayload = createAdminTabsChangePayload(
      items,
      nextKey
    );
    props.onChange?.(payload);
  }, [isControlled, items, props.onChange]);

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
                  props.onClose?.(payload);
                }}
              >
                ×
              </button>
            ) : null}
          </span>
        ),
      };
    });
  }, [closeAriaLabel, items, props.onClose]);

  const selectedActiveKey = useMemo(() => {
    return resolveAdminTabsSelectedActiveKey(items, {
      controlledActiveKey: props.activeKey ?? null,
      isControlled,
      uncontrolledActiveKey: internalActiveKey,
    }) ?? undefined;
  }, [internalActiveKey, isControlled, items, props.activeKey]);

  const activeItem = useMemo(() => {
    return resolveAdminTabsActiveItem(items, selectedActiveKey ?? null);
  }, [items, selectedActiveKey]);

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

  const tabsNode = visible ? (
    <Tabs
      activeKey={selectedActiveKey}
      animated={{ inkBar: true, tabPane: false }}
      className={[
        'admin-tabs--antd',
        ...resolveAdminTabsRootClassNames(normalizedTabs),
        props.className ?? '',
      ].filter(Boolean).join(' ')}
      items={tabItems}
      onChange={handleChange}
      style={{
        ...resolveAdminTabsStyleVars(normalizedTabs),
        ...(props.style ?? {}),
      } as CSSProperties}
    />
  ) : null;

  const contentNode = activeContent ? (
    <div className="admin-tabs__content">{activeContent}</div>
  ) : null;

  if (!tabsNode && !contentNode) {
    return null;
  }

  return <Fragment>{tabsNode}{contentNode}</Fragment>;
});
