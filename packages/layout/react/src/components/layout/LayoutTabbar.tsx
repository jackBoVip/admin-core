/**
 * 标签栏组件
 * @description 支持拖拽排序、中键关闭、滚轮切换、最大化等功能
 */

import { useState, useRef, useEffect, useCallback, useMemo, memo, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useLayoutContext, useLayoutComputed } from '../../hooks';
import type { TabItem } from '@admin-core/layout';
import { useTabsState, useSidebarState } from '../../hooks/use-layout-state';

export interface LayoutTabbarProps {
  left?: ReactNode;
  tabs?: ReactNode;
  right?: ReactNode;
  extra?: ReactNode;
}

export const LayoutTabbar = memo(function LayoutTabbar({ left, tabs: tabsSlot, right, extra }: LayoutTabbarProps) {
  const context = useLayoutContext();
  const computed = useLayoutComputed();
  const { 
    tabs, 
    activeKey, 
    handleSelect, 
    handleClose, 
    handleCloseAll, 
    handleCloseOther, 
    handleRefresh,
    handleSort,
  } = useTabsState();
  const { collapsed: sidebarCollapsed } = useSidebarState();

  const tabbarConfig = context.props.tabbar || {};
  const styleType = tabbarConfig.styleType || 'chrome';

  // 标签列表容器引用
  const tabsContainerRef = useRef<HTMLDivElement>(null);


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

  // 悬停状态
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
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

  const wheelableRef = useRef(tabbarConfig.wheelable);
  const tabsRef = useRef(tabs);
  const activeKeyRef = useRef(activeKey);
  const tabIndexMapRef = useRef(tabIndexMap);
  const handleSelectRef = useRef(handleSelect);

  useEffect(() => {
    wheelableRef.current = tabbarConfig.wheelable;
  }, [tabbarConfig.wheelable]);

  useEffect(() => {
    tabsRef.current = tabs;
  }, [tabs]);

  useEffect(() => {
    activeKeyRef.current = activeKey;
  }, [activeKey]);

  useEffect(() => {
    tabIndexMapRef.current = tabIndexMap;
  }, [tabIndexMap]);

  useEffect(() => {
    handleSelectRef.current = handleSelect;
  }, [handleSelect]);
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
  const tabbarStyle = useMemo(() => ({
    height: `${computed.tabbarHeight}px`,
    top: `${computed.headerHeight}px`,
    left:
      computed.showSidebar && !context.props.isMobile
        ? `${computed.sidebarWidth}px`
        : '0',
  }), [computed.tabbarHeight, computed.headerHeight, computed.showSidebar, context.props.isMobile, computed.sidebarWidth]);
  const contextMenuStyle = useMemo(
    () => ({ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }),
    [contextMenu.x, contextMenu.y]
  );

  // 处理右键菜单
  const onContextMenu = useCallback((e: React.MouseEvent, key: string) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      targetKey: key,
    });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, visible: false, targetKey: null }));
  }, []);

  const handleContextMenuAction = useCallback((e: React.MouseEvent) => {
    const action = (e.currentTarget as HTMLElement).dataset.action;
    if (!action) return;
    if (action === 'reload') {
      if (contextMenu.targetKey) handleRefresh(contextMenu.targetKey);
    } else if (action === 'close') {
      if (contextMenu.targetKey) handleClose(contextMenu.targetKey);
    } else if (action === 'closeOther') {
      if (contextMenu.targetKey) handleCloseOther(contextMenu.targetKey);
    } else if (action === 'closeAll') {
      handleCloseAll();
    }
    closeContextMenu();
  }, [contextMenu.targetKey, handleRefresh, handleClose, handleCloseOther, handleCloseAll, closeContextMenu]);

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

  const handleTabMouseEnter = useCallback((e: React.MouseEvent) => {
    const key = (e.currentTarget as HTMLElement).dataset.key;
    if (key) {
      setHoveredKey((prev) => (prev === key ? prev : key));
    }
  }, []);

  const handleTabMouseLeave = useCallback(() => {
    setHoveredKey((prev) => (prev === null ? prev : null));
  }, []);

  const handleTabCloseClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const key = (e.currentTarget as HTMLElement).dataset.key;
    if (key) {
      handleClose(key);
    }
  }, [handleClose]);

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

  // 获取标签类名 - 使用 useMemo 缓存
  const tabClassNames = useMemo(() => {
    const classMap = new Map<string, string>();
    visibleTabs.forEach((tab, index) => {
      const classes = ['layout-tabbar__tab', `layout-tabbar__tab--${styleType}`];
      if (tab.key === activeKey) classes.push('layout-tabbar__tab--active');
      if (tab.affix) classes.push('layout-tabbar__tab--affix');
      if (dragState.isDragging && dragState.dragIndex === index) {
        classes.push('layout-tabbar__tab--dragging');
      }
      if (dragState.isDragging && dragState.dropIndex === index) {
        classes.push('layout-tabbar__tab--drop-target');
      }
      classMap.set(tab.key, classes.join(' '));
    });
    return classMap;
  }, [visibleTabs, styleType, activeKey, dragState]);

  // ==================== 拖拽排序功能 ====================
  const onDragStart = (e: React.DragEvent, index: number) => {
    if (!tabbarConfig.draggable) return;
    
    // 固定标签不可拖拽
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
  };

  const onDragOver = (e: React.DragEvent, index: number) => {
    if (!tabbarConfig.draggable || !dragState.isDragging) return;
    
    e.preventDefault();
    
    // 固定标签位置不可替换
    const tab = tabs[index];
    if (tab?.affix) return;
    
    setDragState(prev => (prev.dropIndex === index ? prev : { ...prev, dropIndex: index }));
  };

  const onDragLeave = () => {
    setDragState(prev => (prev.dropIndex === null ? prev : { ...prev, dropIndex: null }));
  };

  const onDrop = (e: React.DragEvent, toIndex: number) => {
    if (!tabbarConfig.draggable) return;
    
    e.preventDefault();
    
    const fromIndex = dragState.dragIndex;
    if (fromIndex !== null && fromIndex !== toIndex) {
      // 固定标签位置不可替换
      const targetTab = tabs[toIndex];
      if (!targetTab?.affix) {
        handleSort(fromIndex, toIndex);
      }
    }
    
    setDragState({
      isDragging: false,
      dragIndex: null,
      dropIndex: null,
    });
  };

  const onDragEnd = () => {
    setDragState({
      isDragging: false,
      dragIndex: null,
      dropIndex: null,
    });
  };

  // ==================== 中键关闭功能 ====================
  const onMouseDown = (e: React.MouseEvent, tab: (typeof tabs)[0]) => {
    // 中键点击
    if (e.button === 1 && tabbarConfig.middleClickToClose !== false) {
      e.preventDefault();
      if (tab.closable !== false && !tab.affix) {
        handleClose(tab.key);
      }
    }
  };

  const handleTabMouseDown = useCallback((e: React.MouseEvent) => {
    const key = (e.currentTarget as HTMLElement).dataset.key;
    if (!key) return;
    const tab = tabMap.get(key);
    if (tab) {
      onMouseDown(e, tab);
    }
  }, [tabMap, onMouseDown]);

  const handleTabDragStart = useCallback((e: React.DragEvent) => {
    const index = Number((e.currentTarget as HTMLElement).dataset.index);
    if (!Number.isNaN(index)) {
      onDragStart(e, index);
    }
  }, [onDragStart]);

  const handleTabDragOver = useCallback((e: React.DragEvent) => {
    const index = Number((e.currentTarget as HTMLElement).dataset.index);
    if (!Number.isNaN(index)) {
      onDragOver(e, index);
    }
  }, [onDragOver]);

  const handleTabDrop = useCallback((e: React.DragEvent) => {
    const index = Number((e.currentTarget as HTMLElement).dataset.index);
    if (!Number.isNaN(index)) {
      onDrop(e, index);
    }
  }, [onDrop]);

  // ==================== 滚轮切换功能 ====================
  const onWheel = useCallback((e: WheelEvent) => {
    if (!wheelableRef.current) return;
    const currentIndex = tabIndexMapRef.current.get(activeKeyRef.current ?? '') ?? -1;
    if (currentIndex === -1) return;
    
    const currentTabs = tabsRef.current;
    if (currentTabs.length < 2) return;

    e.preventDefault();

    let nextIndex: number;
    if (e.deltaY > 0 || e.deltaX > 0) {
      // 向下/右滚动 - 下一个标签
      nextIndex = currentIndex + 1;
      if (nextIndex >= currentTabs.length) {
        nextIndex = 0; // 循环到第一个
      }
    } else {
      // 向上/左滚动 - 上一个标签
      nextIndex = currentIndex - 1;
      if (nextIndex < 0) {
        nextIndex = currentTabs.length - 1; // 循环到最后一个
      }
    }
    
    const nextTab = currentTabs[nextIndex];
    if (nextTab) {
      handleSelectRef.current(nextTab.key);
    }
  }, []);

  // 滚轮事件监听
  useEffect(() => {
    const container = tabsContainerRef.current;
    if (!container) return;
    
    container.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', onWheel);
    };
  }, [onWheel]);

  // ==================== 最大化功能 ====================
  const toggleMaximize = useCallback(() => {
    setIsMaximized(prev => {
      const newValue = !prev;
      // 触发事件通知父组件
      context.events?.onTabMaximize?.(newValue);
      
      // 添加/移除 body class 来控制其他元素的显示
      if (newValue) {
        document.body.classList.add('layout-content-maximized');
        document.body.dataset.contentMaximized = 'true';
      } else {
        document.body.classList.remove('layout-content-maximized');
        delete document.body.dataset.contentMaximized;
      }
      
      return newValue;
    });
  }, [context.events]);

  // 监听 ESC 键退出最大化（仅在最大化时绑定）
  useEffect(() => {
    if (!isMaximized) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        toggleMaximize();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMaximized, toggleMaximize]);

  // 确保卸载时移除 class
  useEffect(() => {
    return () => {
      document.body.classList.remove('layout-content-maximized');
      delete document.body.dataset.contentMaximized;
    };
  }, []);

  return (
    <div
      className={tabbarClassName}
      style={tabbarStyle}
      data-with-sidebar={computed.showSidebar && !context.props.isMobile ? 'true' : undefined}
      data-collapsed={sidebarCollapsed && !context.props.isMobile ? 'true' : undefined}
      data-style={styleType}
      onClick={closeContextMenu}
    >
      <div className="layout-tabbar__inner flex h-full items-end">
        {/* 左侧插槽 */}
        {left && <div className="layout-tabbar__left shrink-0 px-2">{left}</div>}

        {/* 标签列表 */}
        <div 
          ref={tabsContainerRef}
          className="layout-tabbar__tabs layout-scroll-container flex flex-1 items-end overflow-x-auto scrollbar-none"
        >
          {tabsSlot ||
            visibleTabs.map((tab, index) => (
              <div
                key={tab.key}
                className={`${tabClassNames.get(tab.key) || ''} data-active:text-primary`}
                data-state={tab.key === activeKey ? 'active' : 'inactive'}
                data-style={styleType}
                data-hovered={hoveredKey === tab.key ? 'true' : undefined}
                data-affix={tab.affix ? 'true' : undefined}
                data-dragging={dragState.isDragging && dragState.dragIndex === index ? 'true' : undefined}
                data-drop-target={dragState.isDragging && dragState.dropIndex === index ? 'true' : undefined}
                data-key={tab.key}
                data-index={index}
                draggable={tabbarConfig.draggable && !tab.affix}
                onClick={handleTabClick}
                onContextMenu={handleTabContextMenu}
                onMouseEnter={handleTabMouseEnter}
                onMouseLeave={handleTabMouseLeave}
                onMouseDown={handleTabMouseDown}
                onDragStart={handleTabDragStart}
                onDragOver={handleTabDragOver}
                onDragLeave={onDragLeave}
                onDrop={handleTabDrop}
                onDragEnd={onDragEnd}
              >
                {/* 图标 */}
                {tabbarConfig.showIcon && tab.icon && (
                  <span className="layout-tabbar__tab-icon mr-1.5">
                    <span className="text-sm">{tab.icon}</span>
                  </span>
                )}

                {/* 名称 */}
                <span className="layout-tabbar__tab-name truncate">{tab.name}</span>

                {/* 关闭按钮 */}
                {tab.closable !== false && !tab.affix && (
                  <button
                    type="button"
                    className={`layout-tabbar__tab-close ml-1.5 flex h-4 w-4 items-center justify-center rounded-full transition-opacity hover:bg-black/10 ${
                      tab.key === activeKey ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                    data-key={tab.key}
                    onClick={handleTabCloseClick}
                  >
                    <svg
                      className="h-3 w-3"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
        </div>

        {/* 右侧插槽 */}
        {right && <div className="layout-tabbar__right shrink-0 px-2">{right}</div>}

        {/* 最大化按钮 */}
        {tabbarConfig.showMaximize && (
          <div className="layout-tabbar__maximize shrink-0 px-1">
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded transition-colors hover:bg-black/5"
              title={isMaximized ? context.t('layout.tabbar.restore') : context.t('layout.tabbar.maximize')}
              onClick={toggleMaximize}
            >
              {!isMaximized ? (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                </svg>
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                </svg>
              )}
            </button>
          </div>
        )}

        {/* 更多操作 */}
        {tabbarConfig.showMore !== false && (
          <div className="layout-tabbar__more shrink-0 px-2">
            {extra || (
              <button
                type="button"
                className="flex h-7 w-7 items-center justify-center rounded transition-colors hover:bg-black/5"
                title={context.t('layout.common.more')}
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="19" cy="12" r="1" />
                  <circle cx="5" cy="12" r="1" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 右键菜单 */}
      {contextMenu.visible &&
        createPortal(
          <>
            <div
              className="layout-tabbar__context-menu fixed z-300 min-w-32 rounded-md border border-border bg-white py-1 shadow-lg"
              style={contextMenuStyle}
            >
              <button
                type="button"
                className="flex w-full items-center px-3 py-1.5 text-sm hover:bg-gray-100"
                data-action="reload"
                onClick={handleContextMenuAction}
              >
                {context.t('layout.tabbar.contextMenu.reload')}
              </button>
              <button
                type="button"
                className="flex w-full items-center px-3 py-1.5 text-sm hover:bg-gray-100"
                data-action="close"
                onClick={handleContextMenuAction}
              >
                {context.t('layout.tabbar.contextMenu.close')}
              </button>
              <button
                type="button"
                className="flex w-full items-center px-3 py-1.5 text-sm hover:bg-gray-100"
                data-action="closeOther"
                onClick={handleContextMenuAction}
              >
                {context.t('layout.tabbar.contextMenu.closeOther')}
              </button>
              <button
                type="button"
                className="flex w-full items-center px-3 py-1.5 text-sm hover:bg-gray-100"
                data-action="closeAll"
                onClick={handleContextMenuAction}
              >
                {context.t('layout.tabbar.contextMenu.closeAll')}
              </button>
            </div>
            <div className="fixed inset-0 z-299" onClick={closeContextMenu} />
          </>,
          document.body
        )}
    </div>
  );
});
