/**
 * 内容区组件
 */

import { DEFAULT_CONTENT_CONFIG, getTabCacheName } from '@admin-core/layout';
import { cloneElement, isValidElement, memo, useCallback, useEffect, useMemo, useRef, useState, type ReactElement, type ReactNode } from 'react';
import { useLayoutContext, useLayoutComputed, useLayoutState, useRouter } from '../../hooks';
import { usePageTransition, usePanelState, useSidebarState, useTabsState } from '../../hooks/use-layout-state';
import { LayoutRefreshView } from './LayoutRefreshView';

export interface LayoutContentProps {
  children?: ReactNode;
  header?: ReactNode;
  breadcrumb?: ReactNode;
  footer?: ReactNode;
  overlay?: ReactNode;
}

export const LayoutContent = memo(function LayoutContent({
  children,
  header,
  breadcrumb,
  footer,
  overlay,
}: LayoutContentProps) {
  const context = useLayoutContext();
  const computed = useLayoutComputed();
  const [layoutState] = useLayoutState();
  const { collapsed: sidebarCollapsed } = useSidebarState();
  const { collapsed: panelCollapsed, position: panelPosition } = usePanelState();
  const { tabs, activeKey } = useTabsState();
  const { currentPath } = useRouter();
  const { enabled: transitionEnabled, transitionName } = usePageTransition();

  const contentCompact = context.props.contentCompact || DEFAULT_CONTENT_CONFIG.contentCompact;
  const contentCompactWidth = context.props.contentCompactWidth || DEFAULT_CONTENT_CONFIG.contentCompactWidth;
  const keepAliveEnabled = context.props.tabbar?.keepAlive !== false;
  const keepAliveCacheLimit = useMemo(() => {
    const max = context.props.tabbar?.maxCount ?? context.props.autoTab?.maxCount ?? 0;
    return max > 0 ? max : 0;
  }, [context.props.tabbar?.maxCount, context.props.autoTab?.maxCount]);
  const routerLocation = context.props.router?.location;
  const keepAliveAvailable = keepAliveEnabled && !!routerLocation;
  const footerOffset =
    computed.showFooter && context.props.footer?.fixed
      ? computed.footerHeight
      : 0;

  const cacheRef = useRef(new Map<string, { element: ReactNode; refreshKey: number }>());
  const [, forceUpdate] = useState(0);
  const transitionInitRef = useRef(false);
  const transitionRafRef = useRef<number | null>(null);
  const transitionTimerRef = useRef<number | null>(null);
  const [transitionPhase, setTransitionPhase] = useState<'idle' | 'from' | 'active'>('idle');
  const [transitionClassName, setTransitionClassName] = useState<string>('');
  const innerRef = useRef<HTMLDivElement | null>(null);

  const resolveTransitionDuration = useCallback(() => {
    if (typeof window === 'undefined') return 0;
    const styles = getComputedStyle(document.documentElement);
    const raw = styles.getPropertyValue('--admin-page-transition-duration') ||
      styles.getPropertyValue('--admin-duration-normal');
    const value = raw.trim();
    if (!value) return 300;
    if (value.endsWith('ms')) {
      const parsed = Number.parseFloat(value);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 300;
    }
    if (value.endsWith('s')) {
      const parsed = Number.parseFloat(value);
      return Number.isFinite(parsed) && parsed > 0 ? parsed * 1000 : 300;
    }
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 300;
  }, []);

  const clearTransitionTimers = useCallback(() => {
    if (transitionRafRef.current !== null) {
      window.cancelAnimationFrame(transitionRafRef.current);
      transitionRafRef.current = null;
    }
    if (transitionTimerRef.current !== null) {
      window.clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
  }, []);

  const clearTransitionClasses = useCallback(() => {
    setTransitionPhase('idle');
    setTransitionClassName('');
  }, []);

  const applyTransitionInlineFrom = useCallback((el: HTMLElement, name: string) => {
    if (name === 'fade') {
      el.style.setProperty('opacity', '0', 'important');
      return;
    }
    if (name === 'fade-slide') {
      el.style.setProperty('opacity', '0', 'important');
      el.style.setProperty('transform', 'translateX(10px)', 'important');
      return;
    }
    if (name === 'fade-up') {
      el.style.setProperty('opacity', '0', 'important');
      el.style.setProperty('transform', 'translateY(10px)', 'important');
      return;
    }
    if (name === 'fade-down') {
      el.style.setProperty('opacity', '0', 'important');
      el.style.setProperty('transform', 'translateY(-10px)', 'important');
      return;
    }
    if (name === 'slide-left') {
      el.style.setProperty('transform', 'translateX(100%)', 'important');
      return;
    }
    if (name === 'slide-right') {
      el.style.setProperty('transform', 'translateX(-100%)', 'important');
    }
  }, []);

  const clearTransitionInlineFrom = useCallback((el: HTMLElement) => {
    el.style.removeProperty('opacity');
    el.style.removeProperty('transform');
  }, []);

  useEffect(() => {
    if (!transitionInitRef.current) {
      transitionInitRef.current = true;
      return;
    }
    if (!transitionEnabled || typeof window === 'undefined') {
      return;
    }

    clearTransitionTimers();
    clearTransitionClasses();

    const name = transitionName || 'fade-slide';
    const el = innerRef.current;
    if (!el) return;
    setTransitionClassName(name);
    setTransitionPhase('from');
    transitionRafRef.current = window.requestAnimationFrame(() => {
      const target = innerRef.current;
      if (!target) return;
      applyTransitionInlineFrom(target, name);
      void target.offsetWidth;
      transitionRafRef.current = window.requestAnimationFrame(() => {
        clearTransitionInlineFrom(target);
        setTransitionPhase('active');
      });
    });
    transitionTimerRef.current = window.setTimeout(() => {
      clearTransitionClasses();
    }, resolveTransitionDuration());

    return () => {
      clearTransitionTimers();
      clearTransitionClasses();
      clearTransitionInlineFrom(el);
    };
  }, [
    transitionEnabled,
    transitionName,
    activeKey,
    currentPath,
    layoutState.refreshKey,
    resolveTransitionDuration,
    clearTransitionTimers,
    clearTransitionClasses,
    applyTransitionInlineFrom,
    clearTransitionInlineFrom,
  ]);

  useEffect(() => {
    if (transitionEnabled) return;
    clearTransitionTimers();
    clearTransitionClasses();
    if (innerRef.current) {
      clearTransitionInlineFrom(innerRef.current);
    }
  }, [transitionEnabled, clearTransitionTimers, clearTransitionClasses, clearTransitionInlineFrom]);
  const childrenRef = useRef(children);
  const routerLocationRef = useRef(routerLocation);

  // 更新 refs
  useEffect(() => {
    childrenRef.current = children;
    routerLocationRef.current = routerLocation;
  }, [children, routerLocation]);

  const buildCachedElement = useCallback((key: string, refreshKey: number) => {
    let element: ReactNode = childrenRef.current;
    const currentRouterLocation = routerLocationRef.current;
    if (currentRouterLocation && isValidElement(element) && typeof element.type !== 'string') {
      element = cloneElement(element as ReactElement<Record<string, unknown>>, { location: currentRouterLocation } as Record<string, unknown>);
    }
    return <div key={`${key}:${refreshKey}`}>{element}</div>;
  }, []);

  useEffect(() => {
    if (!keepAliveAvailable) {
      cacheRef.current.clear();
      forceUpdate((val) => val + 1);
      return;
    }
    if (!activeKey) return;

    let changed = false;
    const refreshKey = layoutState.refreshKey;
    const existing = cacheRef.current.get(activeKey);
    if (!existing || existing.refreshKey !== refreshKey) {
      cacheRef.current.set(activeKey, {
        element: buildCachedElement(activeKey, refreshKey),
        refreshKey,
      });
      changed = true;
    } else {
      // 访问活跃页时刷新 LRU 顺序
      cacheRef.current.delete(activeKey);
      cacheRef.current.set(activeKey, existing);
    }

    if (keepAliveCacheLimit > 0 && cacheRef.current.size > keepAliveCacheLimit) {
      const tabMap = new Map(tabs.map((tab) => [tab.key, tab]));
      for (const key of cacheRef.current.keys()) {
        if (cacheRef.current.size <= keepAliveCacheLimit) break;
        if (key === activeKey) continue;
        if (tabMap.get(key)?.affix) continue;
        cacheRef.current.delete(key);
        changed = true;
      }
      // 兜底：当均为 affix 时，至少保留当前激活页
      if (cacheRef.current.size > keepAliveCacheLimit) {
        for (const key of cacheRef.current.keys()) {
          if (cacheRef.current.size <= keepAliveCacheLimit) break;
          if (key === activeKey) continue;
          cacheRef.current.delete(key);
          changed = true;
        }
      }
    }

    if (changed) {
      forceUpdate((val) => val + 1);
    }
  }, [
    activeKey,
    keepAliveAvailable,
    keepAliveCacheLimit,
    layoutState.refreshKey,
    buildCachedElement,
    tabs,
  ]);

  useEffect(() => {
    if (!keepAliveAvailable) return;
    const keys = new Set(tabs.map((tab) => tab.key));
    let changed = false;
    cacheRef.current.forEach((_, key) => {
      if (!keys.has(key)) {
        cacheRef.current.delete(key);
        changed = true;
      }
    });
    if (changed) {
      forceUpdate((val) => val + 1);
    }
  }, [tabs, keepAliveAvailable]);

  useEffect(() => {
    if (!keepAliveAvailable) return;
    const excludes = layoutState.keepAliveExcludes || [];
    if (excludes.length === 0) return;

    const excludeSet = new Set(excludes);
    const tabMap = new Map(tabs.map((tab) => [tab.key, tab]));
    let changed = false;
    cacheRef.current.forEach((_entry, key) => {
      const tab = tabMap.get(key);
      const cacheName = tab ? getTabCacheName(tab) : undefined;
      if (!cacheName || !excludeSet.has(cacheName)) return;
      cacheRef.current.delete(key);
      changed = true;
    });

    if (changed) {
      forceUpdate((val) => val + 1);
    }
  }, [tabs, layoutState.keepAliveExcludes, keepAliveAvailable]);

  // 类名
  const contentClassName = useMemo(() => {
    const classes = ['layout-content'];
    if (contentCompact === 'compact') classes.push('layout-content--compact');
    if (sidebarCollapsed && !context.props.isMobile) classes.push('layout-content--collapsed');
    if (computed.showPanel) {
      classes.push('layout-content--with-panel');
      if (panelPosition === 'left') classes.push('layout-content--panel-left');
      if (panelPosition === 'right') classes.push('layout-content--panel-right');
    }
    if (panelCollapsed) classes.push('layout-content--panel-collapsed');
    return classes.join(' ');
  }, [contentCompact, sidebarCollapsed, context.props.isMobile, computed.showPanel, panelPosition, panelCollapsed]);

  // 样式
  const contentStyle = useMemo(() => {
    const paddingBase = context.props.contentPadding ?? DEFAULT_CONTENT_CONFIG.contentPadding;
    const paddingBottom =
      (context.props.contentPaddingBottom ?? paddingBase) + footerOffset;

    return {
      marginLeft: computed.mainStyle.marginLeft,
      marginRight: computed.mainStyle.marginRight,
      marginTop: computed.mainStyle.marginTop,
      paddingTop: `${context.props.contentPaddingTop ?? paddingBase}px`,
      paddingBottom: `${paddingBottom}px`,
      paddingLeft: `${context.props.contentPaddingLeft ?? paddingBase}px`,
      paddingRight: `${context.props.contentPaddingRight ?? paddingBase}px`,
    };
  }, [
    computed.mainStyle,
    context.props.contentPaddingTop,
    context.props.contentPaddingBottom,
    context.props.contentPaddingLeft,
    context.props.contentPaddingRight,
    context.props.contentPadding,
    footerOffset,
  ]);

  // 内容容器样式
  const innerStyle = useMemo(() => {
    const style: Record<string, string | number> = {};
    if (contentCompact === 'compact') {
      style.maxWidth = `${contentCompactWidth}px`;
      style.margin = '0 auto';
    }
    return style;
  }, [contentCompact, contentCompactWidth]);

  const transitionStyle = useMemo(() => {
    if (!transitionEnabled) return {};
    const style: Record<string, string | number> = {
      width: '100%',
    };
    const name = transitionName || 'fade-slide';
    const isSlide = name === 'slide-left' || name === 'slide-right';
    style.transitionProperty = isSlide ? 'transform' : 'opacity, transform';
    style.transitionDuration = 'var(--admin-page-transition-duration, var(--admin-duration-normal, 300ms))';
    style.transitionTimingFunction = 'var(--admin-easing-default, cubic-bezier(0.4, 0, 0.2, 1))';
    if (transitionPhase === 'from') {
      if (name === 'fade') {
        style.opacity = 0;
      } else if (name === 'fade-slide') {
        style.opacity = 0;
        style.transform = 'translateX(10px)';
      } else if (name === 'fade-up') {
        style.opacity = 0;
        style.transform = 'translateY(10px)';
      } else if (name === 'fade-down') {
        style.opacity = 0;
        style.transform = 'translateY(-10px)';
      } else if (name === 'slide-left') {
        style.transform = 'translateX(100%)';
      } else if (name === 'slide-right') {
        style.transform = 'translateX(-100%)';
      }
    }
    return style;
  }, [transitionEnabled, transitionName, transitionPhase]);
  const transitionClasses = useMemo(() => {
    if (!transitionClassName || transitionPhase === 'idle') return '';
    if (transitionPhase === 'from') {
      return `${transitionClassName}-enter-active ${transitionClassName}-enter-from`;
    }
    return `${transitionClassName}-enter-active`;
  }, [transitionClassName, transitionPhase]);

  return (
    <main
      className={contentClassName}
      style={contentStyle}
      data-compact={contentCompact === 'compact' ? 'true' : undefined}
      data-collapsed={sidebarCollapsed && !context.props.isMobile ? 'true' : undefined}
      data-with-panel={computed.showPanel ? 'true' : undefined}
      data-panel-position={computed.showPanel ? panelPosition : undefined}
      data-panel-collapsed={panelCollapsed ? 'true' : undefined}
      data-mobile={context.props.isMobile ? 'true' : undefined}
    >
      {/* 内容头部 */}
      {header && <div className="layout-content__header mb-4">{header}</div>}

      {/* 面包屑 */}
      {breadcrumb && computed.showBreadcrumb && (
        <div className="layout-content__breadcrumb mb-4">{breadcrumb}</div>
      )}

      {/* 主内容 */}
      <div className="layout-content__inner" style={innerStyle}>
        <div
          ref={innerRef}
          className={`layout-content__transition${transitionClasses ? ` ${transitionClasses}` : ''}`}
          style={transitionStyle}
        >
          {!keepAliveAvailable || !activeKey ? (
            <LayoutRefreshView>{children}</LayoutRefreshView>
          ) : (
            Array.from(cacheRef.current.entries()).map(([key, entry]) => (
              <div key={key} style={{ display: key === activeKey ? 'block' : 'none' }}>
                {entry.element}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 内容底部 */}
      {footer && <div className="layout-content__footer mt-4">{footer}</div>}

      {/* 内容遮罩层 */}
      {overlay && <div className="layout-content__overlay">{overlay}</div>}
    </main>
  );
});
