/**
 * 标签栏组件
 * @description 支持拖拽排序、中键关闭、滚轮滚动、最大化、右键菜单等功能
 */

import { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo, memo, type ReactNode, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { renderLayoutIcon } from '../../utils';
import { useLayoutContext, useLayoutComputed } from '../../hooks';
import { useTabsState, useSidebarState } from '../../hooks/use-layout-state';
import {
  generateContextMenuItems,
  type ContextMenuAction,
  type TabItem,
} from '@admin-core/layout';

export interface LayoutTabbarProps {
  left?: ReactNode;
  tabs?: ReactNode;
  right?: ReactNode;
  extra?: ReactNode;
}

export const LayoutTabbar = memo(function LayoutTabbar({
  left,
  tabs: tabsSlot,
  right,
  extra,
}: LayoutTabbarProps) {
  const context = useLayoutContext();
  const computed = useLayoutComputed();
  const {
    tabs,
    activeKey,
    handleSelect,
    handleClose,
    handleCloseAll,
    handleCloseOther,
    handleCloseLeft,
    handleCloseRight,
    handleRefresh,
    handleToggleAffix,
    handleOpenInNewWindow,
    handleSort,
  } = useTabsState();
  const { collapsed: sidebarCollapsed } = useSidebarState();

  const tabbarConfig = context.props.tabbar || {};
  const styleType = tabbarConfig.styleType || 'chrome';
  const headerMode = context.props.header?.mode || 'fixed';
  const isHeaderFixed = headerMode !== 'static';
  const leftOffset = computed.mainStyle.marginLeft || '0';
  const panelRightOffset = computed.mainStyle.marginRight || '0';

  // 标签列表容器引用
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef(new Map<string, HTMLDivElement>());
  const flipStateRef = useRef<{ pending: boolean; positions: Map<string, DOMRect> }>({
    pending: false,
    positions: new Map(),
  });

  const recordTabPositions = useCallback(() => {
    const map = new Map<string, DOMRect>();
    tabRefs.current.forEach((el, key) => {
      map.set(key, el.getBoundingClientRect());
    });
    flipStateRef.current.positions = map;
    flipStateRef.current.pending = true;
  }, []);

  const animateTabPositions = useCallback(() => {
    if (!flipStateRef.current.pending) return;
    const prevPositions = flipStateRef.current.positions;
    flipStateRef.current.pending = false;
    const animated: HTMLDivElement[] = [];
    tabRefs.current.forEach((el, key) => {
      const prevRect = prevPositions.get(key);
      if (!prevRect) return;
      const nextRect = el.getBoundingClientRect();
      const dx = prevRect.left - nextRect.left;
      const dy = prevRect.top - nextRect.top;
      if (dx || dy) {
        el.style.transition = 'transform 0s';
        el.style.transform = `translate(${dx}px, ${dy}px)`;
        animated.push(el);
      }
    });
    if (!animated.length) return;
    requestAnimationFrame(() => {
      animated.forEach((el) => {
        el.style.transition = 'transform 300ms var(--admin-easing-default, cubic-bezier(0.4, 0, 0.2, 1))';
        el.style.transform = '';
      });
      window.setTimeout(() => {
        animated.forEach((el) => {
          el.style.transition = '';
        });
      }, 320);
    });
  }, []);

  // 拖拽状态
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    dragIndex: number | null;
    dropIndex: number | null;
  }>({
    isDragging: false,
    dragIndex: null,
    dropIndex: null,
  });

  // 最大化状态
  const [isMaximized, setIsMaximized] = useState(false);

  // 右键菜单状态
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    targetKey: string | null;
  }>({
    visible: false,
    x: 0,
    y: 0,
    targetKey: null,
  });

  // 更多菜单状态
  const [moreMenu, setMoreMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
  }>({
    visible: false,
    x: 0,
    y: 0,
  });
  const moreMenuAnchorRef = useRef<HTMLButtonElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const tabMap = useMemo(() => {
    const map = new Map<string, TabItem>();
    for (const tab of tabs) {
      map.set(tab.key, tab);
    }
    return map;
  }, [tabs]);
  const tabIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    tabs.forEach((tab, index) => map.set(tab.key, index));
    return map;
  }, [tabs]);

  const TAB_RENDER_CHUNK = 60;
  const [tabRenderCount, setTabRenderCount] = useState(TAB_RENDER_CHUNK);

  // 类名
  const tabbarClassName = useMemo(() => {
    const classes = ['layout-tabbar', `layout-tabbar--${styleType}`];
    if (computed.showSidebar && !context.props.isMobile) {
      classes.push('layout-tabbar--with-sidebar');
    }
    if (sidebarCollapsed && !context.props.isMobile) {
      classes.push('layout-tabbar--collapsed');
    }
    return classes.join(' ');
  }, [styleType, computed.showSidebar, context.props.isMobile, sidebarCollapsed]);

  // 样式
  const tabbarStyle = useMemo(() => {
    const style: CSSProperties = {
      height: `${computed.tabbarHeight}px`,
    };

    if (isHeaderFixed) {
      style.position = 'fixed';
      style.top = `${computed.headerHeight}px`;
      style.left = leftOffset;
      if (panelRightOffset !== '0') {
        style.right = panelRightOffset;
      }
    } else {
      style.position = 'static';
      if (leftOffset !== '0') {
        style.marginLeft = leftOffset;
      }
      if (panelRightOffset !== '0') {
        style.marginRight = panelRightOffset;
      }
      if (leftOffset !== '0' || panelRightOffset !== '0') {
        const leftValue = leftOffset !== '0' ? leftOffset : '0px';
        const rightValue = panelRightOffset !== '0' ? panelRightOffset : '0px';
        style.width = `calc(100% - ${leftValue} - ${rightValue})`;
      }
    }

    return style;
  }, [computed.tabbarHeight, computed.headerHeight, isHeaderFixed, leftOffset, panelRightOffset]);

  // 渲染数量
  useEffect(() => {
    const activeIndex = tabIndexMap.get(activeKey ?? '') ?? -1;
    if (activeIndex >= 0) {
      setTabRenderCount(Math.min(tabs.length, Math.max(TAB_RENDER_CHUNK, activeIndex + 1)));
    } else {
      setTabRenderCount(Math.min(TAB_RENDER_CHUNK, tabs.length));
    }
  }, [tabs, activeKey, tabIndexMap]);

  useEffect(() => {
    if (tabRenderCount >= tabs.length) return;
    const frame = requestAnimationFrame(() => {
      setTabRenderCount((prev) => Math.min(prev + TAB_RENDER_CHUNK, tabs.length));
    });
    return () => cancelAnimationFrame(frame);
  }, [tabRenderCount, tabs.length]);

  const visibleTabs = useMemo(() => tabs.slice(0, tabRenderCount), [tabs, tabRenderCount]);

  // 滚动状态
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const container = tabsContainerRef.current;
    if (!container) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }
    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
  }, []);

  useEffect(() => {
    updateScrollState();
  }, [tabs, tabRenderCount, updateScrollState]);

  useEffect(() => {
    window.addEventListener('resize', updateScrollState);
    return () => window.removeEventListener('resize', updateScrollState);
  }, [updateScrollState]);

  useEffect(() => {
    const key = activeKey ?? '';
    const el = tabRefs.current.get(key);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [activeKey, visibleTabs]);

  useLayoutEffect(() => {
    animateTabPositions();
  }, [tabs, animateTabPositions]);

  const scrollTabsBy = useCallback((direction: number) => {
    const container = tabsContainerRef.current;
    if (!container) return;
    const offset = Math.max(container.clientWidth * 0.6, 120);
    container.scrollBy({ left: offset * direction, behavior: 'smooth' });
    requestAnimationFrame(updateScrollState);
  }, [updateScrollState]);

  const closeContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, visible: false, targetKey: null }));
  }, []);

  const closeMoreMenu = useCallback(() => {
    setMoreMenu((prev) => ({ ...prev, visible: false }));
  }, []);

  const openMoreMenu = useCallback(() => {
    if (!moreMenuAnchorRef.current) return;
    const rect = moreMenuAnchorRef.current.getBoundingClientRect();
    setMoreMenu({
      visible: !moreMenu.visible,
      x: rect.left,
      y: rect.bottom + 6,
    });
    setContextMenu((prev) => ({ ...prev, visible: false, targetKey: null }));
  }, [moreMenu.visible]);

  const adjustMenuPosition = useCallback((menu: { x: number; y: number }, el: HTMLDivElement | null) => {
    if (!el || typeof window === 'undefined') return menu;
    const margin = 8;
    const rect = el.getBoundingClientRect();
    let x = menu.x;
    let y = menu.y;
    const maxX = window.innerWidth - rect.width - margin;
    const maxY = window.innerHeight - rect.height - margin;
    if (rect.left < margin) x = margin;
    if (rect.right > window.innerWidth - margin) x = Math.max(margin, maxX);
    if (rect.top < margin) y = margin;
    if (rect.bottom > window.innerHeight - margin) y = Math.max(margin, maxY);
    return x === menu.x && y === menu.y ? menu : { x, y };
  }, []);

  useLayoutEffect(() => {
    if (!contextMenu.visible) return;
    const next = adjustMenuPosition({ x: contextMenu.x, y: contextMenu.y }, contextMenuRef.current);
    if (next.x !== contextMenu.x || next.y !== contextMenu.y) {
      setContextMenu((prev) => ({ ...prev, x: next.x, y: next.y }));
    }
  }, [contextMenu.visible, contextMenu.x, contextMenu.y, adjustMenuPosition]);

  useLayoutEffect(() => {
    if (!moreMenu.visible) return;
    const next = adjustMenuPosition({ x: moreMenu.x, y: moreMenu.y }, moreMenuRef.current);
    if (next.x !== moreMenu.x || next.y !== moreMenu.y) {
      setMoreMenu((prev) => ({ ...prev, x: next.x, y: next.y }));
    }
  }, [moreMenu.visible, moreMenu.x, moreMenu.y, adjustMenuPosition]);

  const toggleMaximize = useCallback(() => {
    setIsMaximized((prev) => {
      const next = !prev;
      context.events?.onTabMaximize?.(next);
      if (next) {
        document.body.classList.add('layout-content-maximized');
        document.body.dataset.contentMaximized = 'true';
      } else {
        document.body.classList.remove('layout-content-maximized');
        delete document.body.dataset.contentMaximized;
      }
      return next;
    });
  }, [context.events]);

  const handleMenuAction = useCallback((action: ContextMenuAction, targetKey: string | null) => {
    if (!targetKey) return;
    switch (action) {
      case 'refresh':
        handleRefresh(targetKey);
        break;
      case 'close':
        handleClose(targetKey);
        break;
      case 'closeOther':
        handleCloseOther(targetKey);
        break;
      case 'closeLeft':
        handleCloseLeft(targetKey);
        break;
      case 'closeRight':
        handleCloseRight(targetKey);
        break;
      case 'closeAll':
        handleCloseAll();
        break;
      case 'pin':
      case 'unpin':
        handleToggleAffix(targetKey);
        break;
      case 'openInNewWindow':
        handleOpenInNewWindow(targetKey);
        break;
      case 'maximize':
        if (!isMaximized) {
          if (targetKey !== activeKey) {
            handleSelect(targetKey);
          }
          toggleMaximize();
        }
        break;
      case 'restoreMaximize':
        if (isMaximized) {
          toggleMaximize();
        }
        break;
      default:
        break;
    }
  }, [
    handleRefresh,
    handleClose,
    handleCloseOther,
    handleCloseLeft,
    handleCloseRight,
    handleCloseAll,
    handleToggleAffix,
    handleOpenInNewWindow,
    handleSelect,
    activeKey,
    isMaximized,
    toggleMaximize,
  ]);

  const contextMenuItems = useMemo(() => {
    if (!contextMenu.targetKey) return [];
    const tab = tabMap.get(contextMenu.targetKey);
    if (!tab) return [];
    const items = generateContextMenuItems(
      tab,
      tabs,
      activeKey ?? '',
      context.t,
      tabIndexMap,
      { isMaximized }
    );
    return items.filter((item) => {
      if (item.key === 'maximize' || item.key === 'restoreMaximize') {
        return tabbarConfig.showMaximize !== false;
      }
      return true;
    });
  }, [contextMenu.targetKey, tabMap, tabs, activeKey, tabIndexMap, context.t, isMaximized, tabbarConfig.showMaximize]);

  const moreMenuItems = useMemo(() => {
    const key = activeKey ?? tabs[0]?.key ?? '';
    if (!key) return [];
    const tab = tabMap.get(key);
    if (!tab) return [];
    const items = generateContextMenuItems(
      tab,
      tabs,
      activeKey ?? '',
      context.t,
      tabIndexMap,
      { isMaximized }
    );
    return items.filter((item) => {
      if (item.key === 'maximize' || item.key === 'restoreMaximize') {
        return tabbarConfig.showMaximize !== false;
      }
      return true;
    });
  }, [activeKey, tabs, tabMap, tabIndexMap, context.t, isMaximized, tabbarConfig.showMaximize]);

  const onContextMenu = useCallback((e: React.MouseEvent, key: string) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      targetKey: key,
    });
    setMoreMenu((prev) => ({ ...prev, visible: false }));
  }, []);

  const handleTabClick = useCallback((e: React.MouseEvent) => {
    const key = (e.currentTarget as HTMLElement).dataset.key;
    if (key) {
      handleSelect(key);
    }
  }, [handleSelect]);

  const handleTabContextMenu = useCallback((e: React.MouseEvent) => {
    const key = (e.currentTarget as HTMLElement).dataset.key;
    if (key) {
      onContextMenu(e, key);
    }
  }, [onContextMenu]);

  const handleTabCloseClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const key = (e.currentTarget as HTMLElement).dataset.key;
    if (key) {
      handleClose(key);
    }
  }, [handleClose]);

  const handleMouseDown = useCallback((e: React.MouseEvent, tab: TabItem) => {
    if (e.button === 1 && tabbarConfig.middleClickToClose !== false) {
      e.preventDefault();
      if (tab.closable !== false && !tab.affix) {
        handleClose(tab.key);
      }
    }
  }, [tabbarConfig.middleClickToClose, handleClose]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!tabbarConfig.wheelable) return;
    const container = tabsContainerRef.current;
    if (!container) return;
    if (container.scrollWidth <= container.clientWidth) return;
    e.preventDefault();
    const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    container.scrollLeft += delta;
    updateScrollState();
  }, [tabbarConfig.wheelable, updateScrollState]);

  const onDragStart = useCallback((e: React.DragEvent, index: number) => {
    if (!tabbarConfig.draggable) return;
    const tab = tabs[index];
    if (tab?.affix) {
      e.preventDefault();
      return;
    }
    setDragState({
      isDragging: true,
      dragIndex: index,
      dropIndex: null,
    });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  }, [tabbarConfig.draggable, tabs]);

  const onDragOver = useCallback((e: React.DragEvent, index: number) => {
    if (!tabbarConfig.draggable || !dragState.isDragging) return;
    e.preventDefault();
    const tab = tabs[index];
    if (tab?.affix) return;
    const fromIndex = dragState.dragIndex;
    if (fromIndex === null) return;
    setDragState((prev) => ({ ...prev, dropIndex: index }));
    if (fromIndex === index) return;
    const targetKey = tab.key;
    const targetEl = tabRefs.current.get(targetKey);
    if (!targetEl) return;
    const rect = targetEl.getBoundingClientRect();
    const midpoint = rect.left + rect.width / 2;
    const shouldMove =
      (fromIndex < index && e.clientX > midpoint) ||
      (fromIndex > index && e.clientX < midpoint);
    if (!shouldMove) return;
    recordTabPositions();
    handleSort(fromIndex, index);
    setDragState((prev) => ({ ...prev, dragIndex: index, dropIndex: index }));
  }, [tabbarConfig.draggable, dragState.isDragging, dragState.dragIndex, tabs, handleSort, recordTabPositions]);

  const onDrop = useCallback((e: React.DragEvent, toIndex: number) => {
    if (!tabbarConfig.draggable) return;
    e.preventDefault();
    const fromIndex = dragState.dragIndex;
    if (fromIndex !== null && fromIndex !== toIndex) {
      const targetTab = tabs[toIndex];
      if (!targetTab?.affix) {
        recordTabPositions();
        handleSort(fromIndex, toIndex);
      }
    }
    setDragState({ isDragging: false, dragIndex: null, dropIndex: null });
  }, [tabbarConfig.draggable, dragState.dragIndex, tabs, handleSort, recordTabPositions]);

  const onDragEnd = useCallback(() => {
    setDragState({ isDragging: false, dragIndex: null, dropIndex: null });
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMaximized(false);
        context.events?.onTabMaximize?.(false);
        document.body.classList.remove('layout-content-maximized');
        delete document.body.dataset.contentMaximized;
      }
    };
    if (isMaximized) {
      document.addEventListener('keydown', handler);
    }
    return () => {
      document.removeEventListener('keydown', handler);
    };
  }, [isMaximized, context.events]);

  const getTabTitle = useCallback((tab: TabItem) => {
    const meta = tab.meta as Record<string, unknown> | undefined;
    const title = (meta?.newTabTitle as string | undefined) || (meta?.title as string | undefined) || tab.name;
    return context.t(title);
  }, [context.t]);

  const isChrome = styleType === 'chrome';

  const showScrollButtons = canScrollLeft || canScrollRight;

  return (
    <div
      className={tabbarClassName}
      style={tabbarStyle}
      data-with-sidebar={computed.showSidebar && !context.props.isMobile ? 'true' : undefined}
      data-collapsed={sidebarCollapsed && !context.props.isMobile ? 'true' : undefined}
      data-style={styleType}
      onClick={() => { closeContextMenu(); closeMoreMenu(); }}
    >
      <div className="layout-tabbar__inner flex h-full">
        {left ? <div className="layout-tabbar__left shrink-0 px-2">{left}</div> : null}

        {showScrollButtons ? (
          <button
            type="button"
            className="layout-tabbar__scroll-btn layout-tabbar__scroll-btn--left"
            data-disabled={canScrollLeft ? 'false' : 'true'}
            disabled={!canScrollLeft}
            onClick={(e) => {
              e.stopPropagation();
              if (canScrollLeft) scrollTabsBy(-1);
            }}
          >
            {renderLayoutIcon('tabbar-scroll-left', 'sm')}
          </button>
        ) : null}

        <div
          ref={tabsContainerRef}
          className="layout-tabbar__tabs layout-scroll-container flex h-full flex-1 overflow-x-auto scrollbar-none"
          data-dragging={dragState.isDragging ? 'true' : undefined}
          onWheel={handleWheel}
          onScroll={updateScrollState}
        >
          {tabsSlot || (
            visibleTabs.map((tab, index) => {
              const showIcon = tabbarConfig.showIcon && tab.icon;
              const showPin = !!tab.affix;
              const showClose = tab.closable !== false && !tab.affix;
              return (
                <div
                  key={tab.key}
                  ref={(el) => {
                    if (el) {
                      tabRefs.current.set(tab.key, el);
                    } else {
                      tabRefs.current.delete(tab.key);
                    }
                  }}
                  data-key={tab.key}
                  data-index={index}
                  data-state={tab.key === activeKey ? 'active' : 'inactive'}
                  data-style={styleType}
                  data-hovered={undefined}
                  data-affix={tab.affix ? 'true' : undefined}
                  data-dragging={dragState.isDragging && dragState.dragIndex === index ? 'true' : undefined}
                  data-drop-target={dragState.isDragging && dragState.dropIndex === index ? 'true' : undefined}
                  className={[
                    'layout-tabbar__tab',
                    `layout-tabbar__tab--${styleType}`,
                    'group',
                    tab.key === activeKey ? 'layout-tabbar__tab--active' : '',
                    tab.affix ? 'layout-tabbar__tab--affix' : '',
                    dragState.isDragging && dragState.dragIndex === index ? 'layout-tabbar__tab--dragging' : '',
                    dragState.isDragging && dragState.dropIndex === index ? 'layout-tabbar__tab--drop-target' : '',
                  ].filter(Boolean).join(' ')}
                  draggable={tabbarConfig.draggable && !tab.affix}
                  onClick={handleTabClick}
                  onContextMenu={handleTabContextMenu}
                  onMouseDown={(e) => handleMouseDown(e, tab)}
                  onDragStart={(e) => onDragStart(e, index)}
                  onDragOver={(e) => onDragOver(e, index)}
                  onDragLeave={() => setDragState((prev) => ({ ...prev, dropIndex: null }))}
                  onDrop={(e) => onDrop(e, index)}
                  onDragEnd={onDragEnd}
                >
                  {isChrome ? (
                    <div className="layout-tabbar__chrome">
                      <div className="layout-tabbar__chrome-divider" />
                      <div className="layout-tabbar__chrome-bg">
                        <div className="layout-tabbar__chrome-bg-content" />
                        <svg className="layout-tabbar__chrome-bg-before" height="7" width="7" viewBox="0 0 7 7">
                          <path d="M 0 7 A 7 7 0 0 0 7 0 L 7 7 Z" />
                        </svg>
                        <svg className="layout-tabbar__chrome-bg-after" height="7" width="7" viewBox="0 0 7 7">
                          <path d="M 0 0 A 7 7 0 0 0 7 7 L 0 7 Z" />
                        </svg>
                      </div>
                      <div className="layout-tabbar__chrome-main">
                        {showIcon ? (
                          <span className="layout-tabbar__tab-icon">
                            <span className="text-sm">{tab.icon}</span>
                          </span>
                        ) : null}
                        <span className="layout-tabbar__tab-name truncate">{getTabTitle(tab)}</span>
                      </div>
                      <div className="layout-tabbar__chrome-extra">
                        {showPin ? (
                          <button
                            type="button"
                            className="layout-tabbar__tab-pin"
                            onClick={(e) => { e.stopPropagation(); handleToggleAffix(tab.key); }}
                          >
                            {renderLayoutIcon('tabbar-pin', 'xs')}
                          </button>
                        ) : null}
                        {showClose ? (
                          <button
                            type="button"
                            data-key={tab.key}
                            className="layout-tabbar__tab-close"
                            onClick={handleTabCloseClick}
                          >
                            {renderLayoutIcon('tabbar-close', 'xs')}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <div className="layout-tabbar__tab-content">
                      <div className="layout-tabbar__tab-extra">
                        {showClose ? (
                          <button
                            type="button"
                            data-key={tab.key}
                            className="layout-tabbar__tab-close"
                            onClick={handleTabCloseClick}
                          >
                            {renderLayoutIcon('tabbar-close', 'xs')}
                          </button>
                        ) : null}
                        {showPin ? (
                          <button
                            type="button"
                            className="layout-tabbar__tab-pin"
                            onClick={(e) => { e.stopPropagation(); handleToggleAffix(tab.key); }}
                          >
                            {renderLayoutIcon('tabbar-pin', 'xs')}
                          </button>
                        ) : null}
                      </div>
                      <div className="layout-tabbar__tab-main">
                        {showIcon ? (
                          <span className="layout-tabbar__tab-icon">
                            <span className="text-sm">{tab.icon}</span>
                          </span>
                        ) : null}
                        <span className="layout-tabbar__tab-name truncate">{getTabTitle(tab)}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {showScrollButtons ? (
          <button
            type="button"
            className="layout-tabbar__scroll-btn layout-tabbar__scroll-btn--right"
            data-disabled={canScrollRight ? 'false' : 'true'}
            disabled={!canScrollRight}
            onClick={(e) => {
              e.stopPropagation();
              if (canScrollRight) scrollTabsBy(1);
            }}
          >
            {renderLayoutIcon('tabbar-scroll-right', 'sm')}
          </button>
        ) : null}

        {right ? <div className="layout-tabbar__right shrink-0 px-2">{right}</div> : null}

        {tabbarConfig.showMaximize ? (
          <button
            type="button"
            className="layout-tabbar__tool-btn"
            title={isMaximized ? context.t('layout.tabbar.restore') : context.t('layout.tabbar.maximize')}
            onClick={(e) => { e.stopPropagation(); toggleMaximize(); }}
          >
            {!isMaximized ? renderLayoutIcon('tabbar-maximize', 'sm') : renderLayoutIcon('tabbar-restore', 'sm')}
          </button>
        ) : null}

        {tabbarConfig.showMore !== false ? (
          <div className="layout-tabbar__more">
            {extra || (
              <button
                ref={moreMenuAnchorRef}
                type="button"
                className="layout-tabbar__tool-btn"
                title={context.t('layout.common.more')}
                onClick={(e) => { e.stopPropagation(); openMoreMenu(); }}
              >
                {renderLayoutIcon('tabbar-more', 'sm')}
              </button>
            )}
          </div>
        ) : null}
      </div>

      {contextMenu.visible && createPortal(
        <>
          <div
            ref={contextMenuRef}
            className="layout-tabbar__context-menu fixed z-layout-overlay min-w-40 rounded-md border border-border py-1 shadow-lg"
            style={{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }}
          >
            {contextMenuItems.map((item) => (
              item.divider ? (
                <div key={item.key} className="my-1 h-px bg-border" />
              ) : (
                <button
                  key={item.key}
                  type="button"
                  className="layout-tabbar__menu-item flex w-full items-center px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={item.disabled}
                  onClick={() => { handleMenuAction(item.key, contextMenu.targetKey); closeContextMenu(); }}
                >
                  {item.label}
                </button>
              )
            ))}
          </div>
          <div className="fixed inset-0 z-layout-overlay" onClick={closeContextMenu} />
        </>,
        document.body
      )}

      {moreMenu.visible && createPortal(
        <>
          <div
            ref={moreMenuRef}
            className="layout-tabbar__more-menu fixed z-layout-overlay min-w-40 rounded-md border border-border py-1 shadow-lg"
            style={{ left: `${moreMenu.x}px`, top: `${moreMenu.y}px` }}
          >
            {moreMenuItems.map((item) => (
              item.divider ? (
                <div key={item.key} className="my-1 h-px bg-border" />
              ) : (
                <button
                  key={item.key}
                  type="button"
                  className="layout-tabbar__menu-item flex w-full items-center px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={item.disabled}
                  onClick={() => { handleMenuAction(item.key, activeKey ?? tabs[0]?.key ?? null); closeMoreMenu(); }}
                >
                  {item.label}
                </button>
              )
            ))}
          </div>
          <div className="fixed inset-0 z-layout-overlay" onClick={closeMoreMenu} />
        </>,
        document.body
      )}
    </div>
  );
});
