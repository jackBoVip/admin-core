/**
 * 标签栏组件。
 * @description 支持拖拽排序、中键关闭、滚轮滚动、最大化与右键菜单等交互。
 */

import {
  generateContextMenuItems,
  type ContextMenuAction,
  type TabItem,
  LAYOUT_UI_TOKENS,
  LAYOUT_STYLE_CONSTANTS,
  rafThrottle,
  TABBAR_CHROME_SVG_PATHS,
  calculateTabbarScrollOffset,
} from '@admin-core/layout';
import { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo, memo, type ReactNode, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { useLayoutContext, useLayoutComputed } from '../../hooks';
import { useTabsState, useSidebarState } from '../../hooks/use-layout-state';
import { renderLayoutIcon } from '../../utils';

/**
 * 标签栏右键菜单项类型别名。
 */
type TabbarMenuItem = ReturnType<typeof generateContextMenuItems>[number];

/**
 * 标签栏组件属性。
 * @description 支持在左右两侧插入扩展内容，并覆盖默认标签渲染区。
 */
export interface LayoutTabbarProps {
  /** 左侧插槽内容。 */
  left?: ReactNode;
  /** 自定义标签区内容。 */
  tabs?: ReactNode;
  /** 右侧插槽内容。 */
  right?: ReactNode;
  /** 额外插槽内容。 */
  extra?: ReactNode;
}

/**
 * 标签 FLIP 动画状态。
 */
interface TabFlipState {
  /** 是否存在待执行 FLIP 动画。 */
  pending: boolean;
  /** 记录动画前的位置快照。 */
  positions: Map<string, DOMRect>;
}

/**
 * 标签 FLIP 位移动画项。
 */
interface TabFlipMovement {
  /** 目标元素。 */
  el: HTMLDivElement;
  /** 横向位移。 */
  dx: number;
  /** 纵向位移。 */
  dy: number;
}

/**
 * 标签拖拽状态。
 */
interface TabbarDragState {
  /** 当前是否处于拖拽中。 */
  isDragging: boolean;
  /** 拖拽起始索引。 */
  dragIndex: number | null;
  /** 当前目标放置索引。 */
  dropIndex: number | null;
}

/**
 * 标签栏右键菜单状态。
 */
interface TabbarContextMenuState {
  /** 是否可见。 */
  visible: boolean;
  /** 菜单 X 坐标。 */
  x: number;
  /** 菜单 Y 坐标。 */
  y: number;
  /** 当前目标标签 key。 */
  targetKey: string | null;
}

/**
 * 更多菜单状态。
 */
interface TabbarMoreMenuState {
  /** 是否可见。 */
  visible: boolean;
  /** 菜单 X 坐标。 */
  x: number;
  /** 菜单 Y 坐标。 */
  y: number;
}

/**
 * 菜单坐标。
 */
interface MenuPosition {
  /** 菜单 X 坐标。 */
  x: number;
  /** 菜单 Y 坐标。 */
  y: number;
}

/**
 * 标签栏组件。
 * @description 提供标签切换、关闭、右键菜单、拖拽排序与滚动交互能力。
 * @param props 组件参数。
 * @returns 标签栏节点。
 */
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
    handleToggleFavorite,
    handleSort,
    isFavorite,
    canFavorite,
  } = useTabsState();
  const { collapsed: sidebarCollapsed } = useSidebarState();

  const tabbarConfig = context.props.tabbar || {};
  const styleType = tabbarConfig.styleType || 'chrome';
  const headerMode = context.props.header?.mode || 'fixed';
  const isHeaderFixed = headerMode !== 'static';
  const leftOffset = computed.mainStyle.marginLeft || '0';
  const panelRightOffset = computed.mainStyle.marginRight || '0';
  const portalTarget = typeof document === 'undefined' ? null : document.body;

  /**
   * 标签滚动容器与节点引用集合。
   */
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef(new Map<string, HTMLDivElement>());
  const flipStateRef = useRef<TabFlipState>({
    pending: false,
    positions: new Map(),
  });

  /**
   * 记录当前标签节点位置信息，用于后续 FLIP 动画计算。
   */
  const recordTabPositions = useCallback(() => {
    const map = new Map<string, DOMRect>();
    tabRefs.current.forEach((el, key) => {
      map.set(key, el.getBoundingClientRect());
    });
    flipStateRef.current.positions = map;
    flipStateRef.current.pending = true;
  }, []);

  /**
   * 执行标签位置 FLIP 动画，使拖拽排序过渡更平滑。
   */
  const animateTabPositions = useCallback(() => {
    if (!flipStateRef.current.pending) return;
    const prevPositions = flipStateRef.current.positions;
    flipStateRef.current.pending = false;
    const movements: TabFlipMovement[] = [];
    tabRefs.current.forEach((el, key) => {
      const prevRect = prevPositions.get(key);
      if (!prevRect) return;
      const nextRect = el.getBoundingClientRect();
      const dx = prevRect.left - nextRect.left;
      const dy = prevRect.top - nextRect.top;
      if (dx || dy) {
        movements.push({ el, dx, dy });
      }
    });
    if (!movements.length) return;
    for (const { el, dx, dy } of movements) {
      el.style.transition = 'transform 0s';
      el.style.transform = `translate(${dx}px, ${dy}px)`;
    }
    requestAnimationFrame(() => {
      movements.forEach(({ el }) => {
        el.style.transition = 'transform 300ms var(--admin-easing-default, cubic-bezier(0.4, 0, 0.2, 1))';
        el.style.transform = '';
      });
      window.setTimeout(() => {
        movements.forEach(({ el }) => {
          el.style.transition = '';
        });
      }, LAYOUT_UI_TOKENS.TABBAR_SCROLL_DELAY);
    });
  }, []);

  /**
   * 标签拖拽状态。
   */
  const [dragState, setDragState] = useState<TabbarDragState>({
    isDragging: false,
    dragIndex: null,
    dropIndex: null,
  });

  /**
   * 标签栏内容区是否处于最大化状态。
   */
  const [isMaximized, setIsMaximized] = useState(false);

  /**
   * 标签右键菜单状态。
   */
  const [contextMenu, setContextMenu] = useState<TabbarContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    targetKey: null,
  });

  /**
   * 标签“更多”下拉菜单状态。
   */
  const [moreMenu, setMoreMenu] = useState<TabbarMoreMenuState>({
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

  const TAB_RENDER_CHUNK = LAYOUT_UI_TOKENS.TAB_RENDER_CHUNK;
  const [tabRenderCount, setTabRenderCount] = useState<number>(TAB_RENDER_CHUNK);
  const chromeCornerSize = LAYOUT_UI_TOKENS.TABBAR_CHROME_CORNER_SIZE;

  /**
   * 标签栏容器样式类名集合。
   */
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

  /**
   * 标签栏容器样式。
   */
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
        const leftValue = leftOffset !== '0' ? leftOffset : LAYOUT_STYLE_CONSTANTS.ZERO_PX;
        const rightValue = panelRightOffset !== '0' ? panelRightOffset : LAYOUT_STYLE_CONSTANTS.ZERO_PX;
        style.width = `calc(100% - ${leftValue} - ${rightValue})`;
      }
    }

    return style;
  }, [computed.tabbarHeight, computed.headerHeight, isHeaderFixed, leftOffset, panelRightOffset]);

  /**
   * 根据激活标签动态提升初始渲染数量，平衡性能与可见性。
   */
  useEffect(() => {
    const activeIndex = tabIndexMap.get(activeKey ?? '') ?? -1;
    if (activeIndex >= 0) {
      setTabRenderCount(Math.min(tabs.length, Math.max(TAB_RENDER_CHUNK, activeIndex + 1)));
    } else {
      setTabRenderCount(Math.min(TAB_RENDER_CHUNK, tabs.length));
    }
  }, [tabs, activeKey, tabIndexMap, TAB_RENDER_CHUNK]);

  useEffect(() => {
    if (tabRenderCount >= tabs.length) return;
    const frame = requestAnimationFrame(() => {
      setTabRenderCount((prev) => Math.min(prev + TAB_RENDER_CHUNK, tabs.length));
    });
    return () => cancelAnimationFrame(frame);
  }, [tabRenderCount, tabs.length, TAB_RENDER_CHUNK]);

  const visibleTabs = useMemo(() => tabs.slice(0, tabRenderCount), [tabs, tabRenderCount]);

  /**
   * 标签滚动按钮可用状态。
   */
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  /**
   * 更新标签滚动状态，计算左右滚动按钮是否可用。
   */
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
  const updateScrollStateThrottled = useMemo(
    () => rafThrottle(updateScrollState),
    [updateScrollState]
  );

  useEffect(() => {
    updateScrollStateThrottled();
  }, [tabs, tabRenderCount, updateScrollStateThrottled]);

  useEffect(() => {
    window.addEventListener('resize', updateScrollStateThrottled);
    return () => {
      window.removeEventListener('resize', updateScrollStateThrottled);
      updateScrollStateThrottled.cancel?.();
    };
  }, [updateScrollStateThrottled]);

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

  /**
   * 按方向滚动标签容器。
   *
   * @param direction 滚动方向，`-1` 为左滚，`1` 为右滚。
   */
  const scrollTabsBy = useCallback((direction: number) => {
    const container = tabsContainerRef.current;
    if (!container) return;
    const offset = calculateTabbarScrollOffset(container.clientWidth);
    container.scrollBy({ left: offset * direction, behavior: 'smooth' });
    updateScrollStateThrottled();
  }, [updateScrollStateThrottled]);

  /**
   * 关闭标签右键菜单。
   */
  const closeContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, visible: false, targetKey: null }));
  }, []);

  /**
   * 关闭“更多”菜单。
   */
  const closeMoreMenu = useCallback(() => {
    setMoreMenu((prev) => ({ ...prev, visible: false }));
  }, []);

  /**
   * 切换“更多”菜单显示，并基于锚点按钮计算弹层位置。
   */
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

  /**
   * 将菜单位置限制在视口可见区域内，避免弹层超出窗口。
   *
   * @param menu 原始菜单坐标。
   * @param el 菜单元素。
   * @returns 调整后的菜单坐标。
   */
  const adjustMenuPosition = useCallback((menu: MenuPosition, el: HTMLDivElement | null) => {
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

  /**
   * 切换内容最大化状态，并同步 `body` 标记与回调事件。
   */
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

  /**
   * 处理标签菜单动作分发。
   *
   * @param action 菜单动作键。
   * @param targetKey 目标标签键。
   */
  const handleMenuAction = useCallback((action: ContextMenuAction | string, targetKey: string | null) => {
    if (!targetKey) return;
    switch (action) {
      case 'reload':
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
      case 'favorite':
      case 'unfavorite':
        handleToggleFavorite(targetKey);
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
    handleToggleFavorite,
    handleSelect,
    activeKey,
    isMaximized,
    toggleMaximize,
  ]);

  /**
   * 为指定标签生成右键菜单项列表。
   *
   * @param key 目标标签键。
   * @returns 菜单项数组。
   */
  const buildMenuItemsForTabKey = useCallback((key: string | null): TabbarMenuItem[] => {
    if (!key) return [];
    const tab = tabMap.get(key);
    if (!tab) return [];
    const items = generateContextMenuItems(
      tab,
      tabs,
      activeKey ?? '',
      context.t,
      tabIndexMap,
      { isMaximized, isFavorite: isFavorite(tab), canFavorite: canFavorite(tab) }
    );
    return items.filter((item) => {
      if (item.key === 'maximize' || item.key === 'restoreMaximize') {
        return tabbarConfig.showMaximize !== false;
      }
      return true;
    });
  }, [
    tabMap,
    tabs,
    activeKey,
    context.t,
    tabIndexMap,
    isMaximized,
    isFavorite,
    canFavorite,
    tabbarConfig.showMaximize,
  ]);

  /**
   * 渲染右键/更多菜单项列表。
   *
   * @param items 菜单项数组。
   * @param onItemClick 菜单项点击回调。
   * @returns 菜单节点数组。
   */
  const renderMenuItems = useCallback(
    (items: TabbarMenuItem[], onItemClick: (action: ContextMenuAction | string) => void) => (
      items.map((item) => (
        item.divider ? (
          <div key={item.key} className="my-1 h-px bg-border" />
        ) : (
          <button
            key={item.key}
            type="button"
            className="layout-tabbar__menu-item flex w-full items-center px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            disabled={item.disabled}
            onClick={() => onItemClick(item.key)}
          >
            {item.label}
          </button>
        )
      ))
    ),
    []
  );

  const contextMenuItems = useMemo(() => {
    return buildMenuItemsForTabKey(contextMenu.targetKey);
  }, [contextMenu.targetKey, buildMenuItemsForTabKey]);

  const moreMenuItems = useMemo(() => {
    const key = activeKey ?? tabs[0]?.key ?? '';
    return buildMenuItemsForTabKey(key || null);
  }, [activeKey, tabs, buildMenuItemsForTabKey]);

  /**
   * 处理标签右键事件并打开上下文菜单。
   *
   * @param e React 鼠标事件对象。
   * @param key 标签键。
   */
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

  /**
   * 处理标签点击切换。
   *
   * @param e React 鼠标事件对象。
   */
  const handleTabClick = useCallback((e: React.MouseEvent) => {
    const key = (e.currentTarget as HTMLElement).dataset.key;
    if (key) {
      handleSelect(key);
    }
  }, [handleSelect]);

  /**
   * 处理标签右键事件入口。
   *
   * @param e React 鼠标事件对象。
   */
  const handleTabContextMenu = useCallback((e: React.MouseEvent) => {
    const key = (e.currentTarget as HTMLElement).dataset.key;
    if (key) {
      onContextMenu(e, key);
    }
  }, [onContextMenu]);

  /**
   * 处理标签关闭按钮点击。
   *
   * @param e React 鼠标事件对象。
   */
  const handleTabCloseClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const key = (e.currentTarget as HTMLElement).dataset.key;
    if (key) {
      handleClose(key);
    }
  }, [handleClose]);

  /**
   * 处理中键点击关闭标签行为。
   *
   * @param e React 鼠标事件对象。
   * @param tab 目标标签。
   */
  const handleMouseDown = useCallback((e: React.MouseEvent, tab: TabItem) => {
    if (e.button === 1 && tabbarConfig.middleClickToClose !== false) {
      e.preventDefault();
      if (tab.closable !== false && !tab.affix) {
        handleClose(tab.key);
      }
    }
  }, [tabbarConfig.middleClickToClose, handleClose]);

  /**
   * 处理标签栏滚轮横向滚动。
   *
   * @param e React 滚轮事件对象。
   */
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!tabbarConfig.wheelable) return;
    const container = tabsContainerRef.current;
    if (!container) return;
    if (container.scrollWidth <= container.clientWidth) return;
    e.preventDefault();
    const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    container.scrollLeft += delta;
    updateScrollStateThrottled();
  }, [tabbarConfig.wheelable, updateScrollStateThrottled]);

  /**
   * 处理拖拽开始事件并初始化拖拽状态。
   *
   * @param e React 拖拽事件对象。
   * @param index 拖拽起始索引。
   */
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

  /**
   * 处理拖拽悬停并按鼠标位置触发标签重排。
   *
   * @param e React 拖拽事件对象。
   * @param index 当前悬停索引。
   */
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

  /**
   * 处理拖拽放下事件并提交最终排序。
   *
   * @param e React 拖拽事件对象。
   * @param toIndex 目标索引。
   */
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

  /**
   * 处理拖拽结束，重置拖拽状态。
   */
  const onDragEnd = useCallback(() => {
    setDragState({ isDragging: false, dragIndex: null, dropIndex: null });
  }, []);

  useEffect(() => {
    /**
     * 监听 `Escape` 快捷键，退出最大化状态。
     *
     * @param e 原生键盘事件。
     */
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

  /**
   * 解析标签显示标题，优先读取 `meta.newTabTitle` 与 `meta.title`。
   *
   * @param tab 标签对象。
   * @returns 本地化后的标题文本。
   */
  const getTabTitle = useCallback((tab: TabItem) => {
    const meta = tab.meta as Record<string, unknown> | undefined;
    const title = (meta?.newTabTitle as string | undefined) || (meta?.title as string | undefined) || tab.name;
    return context.t(title);
  }, [context]);

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
          onScroll={updateScrollStateThrottled}
        >
          {tabsSlot || (
            visibleTabs.map((tab, index) => {
              const showIcon = tabbarConfig.showIcon && tab.icon;
              const showPin = !!tab.affix;
              const showClose = tab.closable !== false && !tab.affix;
              const tabMainContent = (
                <>
                  {showIcon ? (
                    <span className="layout-tabbar__tab-icon">
                      <span className="text-sm">{tab.icon}</span>
                    </span>
                  ) : null}
                  <span className="layout-tabbar__tab-name truncate">{getTabTitle(tab)}</span>
                </>
              );
              const pinButton = showPin ? (
                <button
                  type="button"
                  className="layout-tabbar__tab-pin"
                  onClick={(e) => { e.stopPropagation(); handleToggleAffix(tab.key); }}
                >
                  {renderLayoutIcon('tabbar-pin', 'xs')}
                </button>
              ) : null;
              const closeButton = showClose ? (
                <button
                  type="button"
                  data-key={tab.key}
                  className="layout-tabbar__tab-close"
                  onClick={handleTabCloseClick}
                >
                  {renderLayoutIcon('tabbar-close', 'xs')}
                </button>
              ) : null;
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
                        <svg
                          className="layout-tabbar__chrome-bg-before"
                          height={chromeCornerSize}
                          width={chromeCornerSize}
                          viewBox="0 0 7 7"
                        >
                          <path d={TABBAR_CHROME_SVG_PATHS.before} />
                        </svg>
                        <svg
                          className="layout-tabbar__chrome-bg-after"
                          height={chromeCornerSize}
                          width={chromeCornerSize}
                          viewBox="0 0 7 7"
                        >
                          <path d={TABBAR_CHROME_SVG_PATHS.after} />
                        </svg>
                      </div>
                      <div className="layout-tabbar__chrome-main">{tabMainContent}</div>
                      <div className="layout-tabbar__chrome-extra">
                        {pinButton}
                        {closeButton}
                      </div>
                    </div>
                  ) : (
                    <div className="layout-tabbar__tab-content">
                      <div className="layout-tabbar__tab-extra">
                        {closeButton}
                        {pinButton}
                      </div>
                      <div className="layout-tabbar__tab-main">{tabMainContent}</div>
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

      {contextMenu.visible && portalTarget && createPortal(
        <>
          <div
            ref={contextMenuRef}
            className="layout-tabbar__context-menu fixed z-layout-overlay min-w-40 rounded-md border border-border py-1 shadow-lg"
            style={{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }}
          >
            {renderMenuItems(contextMenuItems, (key) => {
              handleMenuAction(key, contextMenu.targetKey);
              closeContextMenu();
            })}
          </div>
          <div className="fixed inset-0 z-layout-overlay" onClick={closeContextMenu} />
        </>,
        portalTarget
      )}

      {moreMenu.visible && portalTarget && createPortal(
        <>
          <div
            ref={moreMenuRef}
            className="layout-tabbar__more-menu fixed z-layout-overlay min-w-40 rounded-md border border-border py-1 shadow-lg"
            style={{ left: `${moreMenu.x}px`, top: `${moreMenu.y}px` }}
          >
            {renderMenuItems(moreMenuItems, (key) => {
              handleMenuAction(key, activeKey ?? tabs[0]?.key ?? null);
              closeMoreMenu();
            })}
          </div>
          <div className="fixed inset-0 z-layout-overlay" onClick={closeMoreMenu} />
        </>,
        portalTarget
      )}
    </div>
  );
});
