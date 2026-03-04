<script lang="ts" setup>
/**
 * Table Vue 主表格组件实现。
 * @description 负责 VXE 表格渲染、列自定义、查询联动、工具栏与分页交互等核心逻辑。
 */
import type {
  VxeGridInstance,
  VxeGridListeners,
  VxeGridProps as VxeTableGridProps,
} from 'vxe-table';

import type {
  AdminTableApi,
  AdminTablePaginationChangePayload,
  ColumnCustomDragHoverState,
  ColumnCustomDragPosition,
  ColumnCustomDragState,
  ColumnCustomFlipRect,
  ColumnCustomSnapshot,
  ResolvedTablePagerExportAction,
  ResolvedToolbarActionTool,
  TableColumnFixedValue,
  TableColumnRecord,
} from '@admin-core/table-core';
import type { AdminTableVueProps } from '../types';

import {
  computed,
  defineComponent,
  getCurrentInstance,
  h,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  toRaw,
  useSlots,
  watch,
  withDirectives,
} from 'vue';

import {
  applySelectionCheckFieldToRows,
  applyColumnCustomFlipOffsets,
  applyColumnCustomDragMove,
  buildBuiltinToolbarTools,
  buildColumnCustomControls,
  buildColumnRuntimeItems,
  buildDefaultColumnFilterOptions,
  collectSelectionKeysByField,
  collectSelectionKeysByRows,
  collectColumnCustomFlipOffsets,
  collectColumnCustomFlipRects,
  createColumnCustomControlsOrderDigest,
  createTableComparableSelectionKeySet,
  createColumnCustomDragResetState,
  createColumnCustomChangePayload,
  createPagerExportEventPayload,
  createTableSearchFormActionHandlers,
  createTableLocaleText,
  deepEqual,
  ensureSeqColumn,
  ensureSelectionColumn,
  executeTablePagerExportAction,
  extendProxyOptions,
  getColumnFilterValueKey,
  getSearchPanelToggleTitle,
  getColumnValueByPath,
  getSeparatorStyle,
  getLocaleMessages,
  getGlobalTableFormatterRegistry,
  forceColumnCustomFlipReflow,
  hasColumnCustomDraftChanges,
  flattenTableRows,
  hasTableRowStrategyStyle,
  hasColumnCustomSnapshot,
  isProxyEnabled,
  mergeWithArrayOverride,
  normalizeTableSelectionKeys,
  readColumnCustomStateFromStorage,
  resetColumnCustomFlipTransforms,
  resolveColumnCustomAutoScrollTop,
  resolveColumnCustomCancelTransition,
  resolveColumnCustomConfirmTransition,
  resolveColumnCustomDragOverState,
  resolveColumnCustomDragStartState,
  resolveColumnCustomDraggingKey,
  resolveColumnCustomOpenSnapshot,
  resolveColumnCustomOpenTransition,
  resolveColumnCustomResetTransition,
  resolveColumnCustomWorkingSnapshot,
  resolveToolbarActionButtonRenderState,
  resolveToolbarConfigRecord,
  resolveColumnCustomState,
  resolveColumnCustomPersistenceConfig,
  resolveToolbarInlinePosition,
  resolveToolbarHintConfig,
  resolveToolbarHintOverflowEnabled,
  resolveToolbarHintPresentation,
  resolveToolbarHintShouldScroll,
  resolveToolbarCenterVisible,
  resolveToolbarVisible,
  resolvePagerVisibilityState,
  resolvePagerSlotBindings,
  resolveTablePagerExportPagination,
  resolveTablePagerExportTriggerState,
  resolveTablePagerExportVisible,
  resolveVisibleTablePagerExportActions,
  resolveTableMobileMatched,
  resolveSelectionMode,
  resolveSelectionRowsByKeys,
  resolveTableSelectionChange,
  resolveTableStripeConfig,
  resolveTableStripePresentation,
  resolveTableThemeCssVars,
  resolveTablePagerLayouts,
  resolveTablePagerPageSizes,
  resolveTablePagerExportConfig,
  resolveTableCellStrategyResult,
  resolveTableRowStrategyInlineStyle,
  resolveTableRowStrategyResult,
  resolveOperationColumnConfig,
  resolveOperationCellAlignClass,
  cleanupTableRuntimeApis,
  pickTableRuntimeStateOptions,
  resolveVisibleOperationActionTools,
  resolveVisibleToolbarActionTools,
  resolveToolbarToolVisibility,
  shouldShowSeparator,
  resolveToolbarToolsPlacement,
  resolveToolbarToolsSlotState,
  resolveToolbarToolsSlotPosition,
  shallowEqualObjectRecord,
  triggerOperationActionTool,
  triggerTableCellStrategyClick,
  triggerTableRowStrategyClick,
  triggerToolbarActionTool,
  toggleAllColumnCustomVisible,
  toggleColumnCustomFilterable,
  toggleColumnCustomFixed,
  toggleColumnCustomSortable,
  toggleColumnCustomVisible,
  toTableComparableSelectionKey,
  writeColumnCustomStateToStorage,
} from '@admin-core/table-core';
import { useAdminForm } from '@admin-core/form-vue';
import { VxeGrid, VxeUI } from 'vxe-table';

import { useLocaleVersion } from '../composables/useLocaleVersion';
import {
  getAdminTableVueSetupState,
  getAdminTableVueThemeSignal,
  syncAdminTableVueWithPreferences,
} from '../setup';
import '../styles/index.css';

/**
 * AdminTable 组件属性定义，继承通用 Vue 表格属性并强制要求表格 API 实例。
 */
interface Props extends AdminTableVueProps {
  /** 表格 API 实例。 */
  api: AdminTableApi;
}

/**
 * 表格行选择键类型，兼容数值和字符串主键。
 */
type TableSelectionKey = number | string;
/**
 * 表格行选择模式。
 */
type TableSelectionMode = 'checkbox' | 'radio';
/**
 * 分页关键信号，用于判断外部传入分页是否变化。
 */
interface TablePagerSignal {
  /** 当前页码。 */
  currentPage: null | number;
  /** 每页条数。 */
  pageSize: null | number;
  /** 总记录数。 */
  total: null | number;
}

/**
 * 组件入参
 * @description 接收表格运行时配置与 API 实例。
 */
const props = defineProps<Props>();
/** 当前组件插槽映射。 */
const slots = useSlots() as Record<string, (...args: any[]) => any>;
/**
 * Vue 端表格初始化状态
 * @description 提供权限、主题等运行时上下文能力。
 */
const setupState = getAdminTableVueSetupState();
/**
 * 主题变化信号
 * @description 用于驱动表格主题 CSS 变量的响应式刷新。
 */
const themeSignal = getAdminTableVueThemeSignal();
/**
 * 当前应用可用指令映射
 * @description 在权限场景下生成按钮指令绑定时使用。
 */
const appDirectives = (getCurrentInstance()?.appContext.directives ?? {}) as Record<string, any>;
/**
 * 表格根节点引用
 * @description 用于测量布局尺寸与同步滚动区域高度。
 */
const tableRootRef = ref<HTMLElement | null>(null);
/**
 * VxeGrid 组件实例引用
 * @description 用于读取运行时行数据与触发表格方法。
 */
const gridRef = ref<VxeGridInstance>();
/**
 * 工具栏提示视口节点引用
 * @description 用于检测提示文本是否溢出并决定是否滚动。
 */
const toolbarHintViewportRef = ref<HTMLDivElement | null>(null);
/**
 * 工具栏提示文本节点引用
 * @description 与视口引用配合计算文本溢出状态。
 */
const toolbarHintTextRef = ref<HTMLSpanElement | null>(null);
/**
 * 工具栏提示是否滚动
 * @description 为模板层提供提示文本滚动动画开关。
 */
const toolbarHintShouldScroll = ref(false);
/**
 * 分页提示视口节点引用
 * @description 用于检测分页提示区域文本溢出。
 */
const pagerHintViewportRef = ref<HTMLDivElement | null>(null);
/**
 * 分页提示文本节点引用
 * @description 与视口引用配合计算分页提示滚动状态。
 */
const pagerHintTextRef = ref<HTMLSpanElement | null>(null);
/**
 * 分页提示是否滚动
 * @description 为模板层提供分页提示滚动动画开关。
 */
const pagerHintShouldScroll = ref(false);
/**
 * 语言版本信号
 * @description 用于触发表格文案在语言切换后的重算。
 */
const localeVersion = useLocaleVersion();
/** 表格语言文案。 */
const localeText = computed(() => {
  const tick = localeVersion.value;
  void tick;
  return createTableLocaleText(getLocaleMessages().table);
});

/**
 * 表格运行时状态快照
 * @description 镜像 `api.store` 的 props 子状态，驱动组件渲染。
 */
const state = ref(props.api.getSnapshot().props as AdminTableVueProps);
/**
 * 状态订阅取消函数
 * @description 组件卸载时调用，释放 store 订阅监听。
 */
const unsub = props.api.store.subscribeSelector(
  (snapshot) => snapshot.props,
  (next) => {
    state.value = next as AdminTableVueProps;
  }
);
/**
 * 最近一次写入 store 的外部属性快照
 * @description 用于浅比较去重，避免重复触发 `setState`。
 */
let latestIncomingProps: null | AdminTableVueProps = null;
/**
 * 最近一次写入的分页信号
 * @description 用于识别分页字段是否真正变化，保护运行时分页状态。
 */
let latestIncomingPagerSignal: null | TablePagerSignal = null;

/**
 * 将任意分页字段值规范为数值或空值。
 *
 * @param value 待转换的原始值。
 * @returns 有效数值返回 number，否则返回 null。
 */
function toPagerSignalNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * 从分页配置中提取用于比较的分页信号。
 *
 * @param pagerConfig 分页配置对象。
 * @returns 规范化后的分页信号对象。
 */
function resolvePagerSignal(pagerConfig: unknown): TablePagerSignal {
  const record =
    pagerConfig && typeof pagerConfig === 'object'
      ? (pagerConfig as Record<string, unknown>)
      : {};
  return {
    currentPage: toPagerSignalNumber(record.currentPage),
    pageSize: toPagerSignalNumber(record.pageSize),
    total: toPagerSignalNumber(record.total),
  };
}

/**
 * 判断分页信号是否至少包含一个有效字段。
 *
 * @param signal 待判断的分页信号。
 * @returns 是否存在有效分页字段。
 */
function hasPagerSignal(signal: null | TablePagerSignal) {
  return !!signal && (
    signal.currentPage !== null ||
    signal.pageSize !== null ||
    signal.total !== null
  );
}

/**
 * 比较两次分页信号是否一致。
 *
 * @param previous 上一次分页信号。
 * @param next 本次分页信号。
 * @returns 是否完全一致。
 */
function isSamePagerSignal(
  previous: null | TablePagerSignal,
  next: TablePagerSignal
) {
  return !!previous &&
    previous.currentPage === next.currentPage &&
    previous.pageSize === next.pageSize &&
    previous.total === next.total;
}

watch(
  () => [
    props.class,
    props.formOptions,
    props.gridEvents,
    props.gridOptions,
    props.separator,
    props.showSearchForm,
    props.tableTitle,
    props.tableTitleHelp,
  ],
  () => {
    const { api: _api, ...rest } = props;
    let nextProps = pickTableRuntimeStateOptions(
      rest as Record<string, any>
    ) as AdminTableVueProps;
    const nextGridOptions =
      nextProps.gridOptions && typeof nextProps.gridOptions === 'object'
        ? (nextProps.gridOptions as Record<string, any>)
        : null;
    const nextPagerConfig =
      nextGridOptions?.pagerConfig && typeof nextGridOptions.pagerConfig === 'object'
        ? (nextGridOptions.pagerConfig as Record<string, any>)
        : null;
    const nextPagerSignal = resolvePagerSignal(nextPagerConfig);
    const incomingPagerUnchanged = isSamePagerSignal(
      latestIncomingPagerSignal,
      nextPagerSignal
    );
    const shouldPreservePager =
      incomingPagerUnchanged &&
      hasPagerSignal(nextPagerSignal) &&
      !!nextGridOptions;
    if (shouldPreservePager) {
      const runtimeSnapshot = props.api.getSnapshot().props as AdminTableVueProps;
      const runtimeGridOptions =
        runtimeSnapshot.gridOptions && typeof runtimeSnapshot.gridOptions === 'object'
          ? (runtimeSnapshot.gridOptions as Record<string, any>)
          : null;
      const runtimePagerConfig =
        runtimeGridOptions?.pagerConfig && typeof runtimeGridOptions.pagerConfig === 'object'
          ? (runtimeGridOptions.pagerConfig as Record<string, any>)
          : null;
      if (runtimePagerConfig) {
        nextProps = {
          ...nextProps,
          gridOptions: {
            ...nextGridOptions,
            pagerConfig: {
              ...(nextPagerConfig ?? {}),
              currentPage: runtimePagerConfig.currentPage ?? nextPagerConfig?.currentPage,
              pageSize: runtimePagerConfig.pageSize ?? nextPagerConfig?.pageSize,
              total: runtimePagerConfig.total ?? nextPagerConfig?.total,
            },
          } as any,
        };
      }
    }
    latestIncomingPagerSignal = nextPagerSignal;
    if (
      latestIncomingProps &&
      shallowEqualObjectRecord(
        latestIncomingProps as Record<string, any>,
        nextProps as Record<string, any>
      )
    ) {
      return;
    }
    latestIncomingProps = nextProps;
    props.api.setState(nextProps as any);
  },
  { immediate: true }
);

/**
 * 查询表单组件与表单 API
 * @description 统一承载表格查询条件输入、提交与重置回调桥接。
 */
const [SearchForm, formApi] = useAdminForm({
  ...createTableSearchFormActionHandlers({
    getFormApi: () => formApi as any,
    reload: async (values) => props.api.reload(values),
    shouldReloadOnReset: () => !state.value.formOptions?.submitOnChange,
  }),
  compact: true,
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  showCollapseButton: true,
  submitButtonOptions: {
    content: localeText.value.search,
  },
  wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
});

/**
 * 同步外部查询表单配置
 * @description 当 `state.formOptions` 变更时合并到内部表单状态。
 */
watch(
  () => state.value.formOptions,
  (next) => {
    formApi.setState((prev) => mergeWithArrayOverride(next ?? {}, prev));
  },
  { immediate: true }
);

/**
 * 同步查询按钮文案
 * @description 语言变化后刷新表单提交按钮文本。
 */
watch(
  localeText,
  (next) => {
    formApi.setState((prev) => ({
      ...prev,
      submitButtonOptions: {
        ...(prev?.submitButtonOptions ?? {}),
        content: next.search,
      },
    }));
  },
  { immediate: true }
);

/**
 * 当前是否命中移动端断点
 * @description 用于切换移动端布局与交互分支。
 */
const isMobile = ref(false);
/**
 * 表格是否处于最大化状态
 * @description 控制全屏样式及相关工具按钮状态。
 */
const maximized = ref(false);
/**
 * 刷新进行中状态
 * @description 防止重复触发刷新动作并显示加载反馈。
 */
const refreshing = ref(false);
/**
 * 分页尺寸变更后待回到第一页标记
 * @description 在页大小切换时协调分页状态重置流程。
 */
const resetPageSizeToFirstPending = ref(false);
/**
 * 自动计算的表格主体高度
 * @description 在滚动锁模式下用于写入 `scrollY.gt`。
 */
const autoBodyScrollHeight = ref<null | number>(null);

/**
 * 列自定义面板开关状态
 * @description 控制列设置弹层的展开与关闭。
 */
const customPanelOpen = ref(false);
/**
 * 列可见性草稿状态
 * @description 在列设置面板内暂存用户变更，确认后再提交。
 */
const customDraftVisibleColumns = ref<Record<string, boolean>>({});
/**
 * 列筛选能力草稿状态
 * @description 暂存列“可筛选”开关变更。
 */
const customDraftFilterableColumns = ref<Record<string, boolean>>({});
/**
 * 列固定位置草稿状态
 * @description 暂存列固定方向调整（左/右/不固定）。
 */
const customDraftFixedColumns = ref<Record<string, TableColumnFixedValue>>({});
/**
 * 列顺序草稿状态
 * @description 暂存列拖拽排序后的字段顺序。
 */
const customDraftOrder = ref<string[]>([]);
/**
 * 列可排序能力草稿状态
 * @description 暂存列“可排序”开关变更。
 */
const customDraftSortableColumns = ref<Record<string, boolean>>({});
/**
 * 列拖拽状态初始值
 * @description 提供拖拽状态与悬停状态的统一初始快照。
 */
const initialCustomDragState = createColumnCustomDragResetState();
/**
 * 当前列拖拽运行时状态
 * @description 记录拖拽过程中的位置信息与动画状态。
 */
const customDragState = ref<ColumnCustomDragState>(initialCustomDragState.dragState);
/**
 * 内部选中行键集合
 * @description 作为受控/非受控选择态同步的中间状态。
 */
const innerSelectedRowKeys = ref<TableSelectionKey[]>([]);

/**
 * 生效列可见性映射
 * @description 驱动运行时列显隐计算。
 */
const visibleColumns = ref<Record<string, boolean>>({});
/**
 * 生效列筛选能力映射
 * @description 驱动运行时列筛选配置构建。
 */
const filterableColumns = ref<Record<string, boolean>>({});
/**
 * 生效列固定位置映射
 * @description 驱动运行时列固定布局。
 */
const fixedColumns = ref<Record<string, TableColumnFixedValue>>({});
/**
 * 生效列顺序数组
 * @description 控制运行时列渲染顺序。
 */
const columnOrder = ref<string[]>([]);
/**
 * 生效列可排序能力映射
 * @description 控制列是否允许排序交互。
 */
const sortableColumns = ref<Record<string, boolean>>({});

/**
 * 列自定义原始快照
 * @description 打开列设置面板时记录基线，用于比较“是否有改动”。
 */
const customOriginState = ref<ColumnCustomSnapshot>({
  filterable: {},
  fixed: {},
  order: [],
  sortable: {},
  visible: {},
});
/**
 * 列设置行节点引用映射
 * @description 按字段缓存 DOM 引用，服务拖拽动画与自动滚动。
 */
const customRowRefs = ref<Record<string, HTMLDivElement | null>>({});
/**
 * 列设置面板内容容器引用
 * @description 用于处理拖拽时的滚动边界计算。
 */
const customBodyRef = ref<HTMLDivElement | null>(null);
/**
 * 列设置弹层节点引用
 * @description 用于面板内外点击与定位相关逻辑。
 */
const customPopoverRef = ref<HTMLDivElement | null>(null);
/**
 * 列设置触发按钮引用
 * @description 用于弹层关闭后恢复焦点。
 */
const customTriggerRef = ref<HTMLButtonElement | null>(null);

/**
 * 列设置行矩形缓存
 * @description FLIP 动画过程中缓存每行布局矩形。
 */
let customRowRects = new Map<string, ColumnCustomFlipRect>();
/**
 * 行 FLIP 动画帧句柄
 * @description 用于取消未执行的行位移动画帧。
 */
let customRowAnimationFrame: null | number = null;
/**
 * 拖拽移动动画帧句柄
 * @description 用于节流拖拽移动过程中的重排计算。
 */
let customMoveAnimationFrame: null | number = null;
/**
 * 待应用的拖拽移动目标
 * @description 在动画帧中合并处理拖拽位置更新请求。
 */
let customPendingMove: null | {
  dragKey: string;
  overKey: string;
  position: ColumnCustomDragPosition;
} = null;
/**
 * 当前拖拽中的列字段
 * @description 标记正在拖拽的列键。
 */
const customDraggingKey = ref<null | string>(null);
/**
 * 当前拖拽悬停状态
 * @description 标记目标列与插入方向，用于提示线展示。
 */
const customDragHover = ref<ColumnCustomDragHoverState>(initialCustomDragState.dragHover);
/**
 * 运行时筛选后的行缓存
 * @description 为默认筛选选项构建提供稳定数据源。
 */
const runtimeFilterRows = ref<null | Array<Record<string, any>>>(null);
/**
 * 是否正在从外部状态同步选中态
 * @description 防止选中事件回写导致循环更新。
 */
let syncingSelectionFromState = false;
/**
 * 是否已应用默认选中
 * @description 用于只在初次加载阶段应用默认选中行。
 */
let hasAppliedDefaultSelection = false;

/**
 * 刷新移动端匹配状态并同步提示溢出与表格主体高度。
 * @returns 无返回值。
 */
const updateMobile = () => {
  isMobile.value = resolveTableMobileMatched();
  void nextTick(syncToolbarHintOverflow);
  void nextTick(syncPagerHintOverflow);
  void nextTick(syncBodyScrollHeight);
};

/**
 * 主体滚动锁类名
 * @description 命中该类名时启用“锁定主体高度”滚动策略。
 */
const BODY_SCROLL_LOCK_CLASS = 'admin-table--lock-body-scroll';
/**
 * 主体滚动高度安全间隙（像素）
 * @description 避免临界高度造成滚动条闪动。
 */
const BODY_SCROLL_SAFE_GAP = 2;
/**
 * 固定页脚选择器
 * @description 用于计算可用视口底部边界，避免表格被固定页脚遮挡。
 */
const FIXED_FOOTER_SELECTOR = '.layout-footer--fixed, .layout-footer[data-fixed="true"]';
/**
 * 空表格行常量
 * @description 统一复用空数组引用，减少无意义对象创建。
 */
const EMPTY_TABLE_ROWS: Array<Record<string, any>> = [];
/**
 * 是否启用主体滚动锁定模式。
 * @description 通过类名开关决定表格是否按“锁定容器高度”策略计算滚动区。
 */
const bodyScrollLockEnabled = computed(() => {
  const className = typeof state.value.class === 'string'
    ? state.value.class
    : '';
  if (!className.trim()) {
    return false;
  }
  return className
    .split(/\s+/)
    .filter(Boolean)
    .includes(BODY_SCROLL_LOCK_CLASS);
});

/**
 * 解析 CSS 像素值字符串。
 *
 * @param value 像素值文本。
 * @returns 有效浮点数，非法值返回 0。
 */
function parseCssPixel(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * 计算元素外部高度（包含上下外边距）。
 *
 * @param element 目标元素。
 * @returns 外部高度。
 */
function resolveElementOuterHeight(element: null | HTMLElement) {
  if (!element) {
    return 0;
  }
  const rect = element.getBoundingClientRect();
  const styles = window.getComputedStyle(element);
  return (
    rect.height + parseCssPixel(styles.marginTop) + parseCssPixel(styles.marginBottom)
  );
}

/**
 * 解析显式像素高度配置。
 *
 * @param value 高度配置值。
 * @returns 合法像素高度，否则返回 null。
 */
function resolveExplicitPixelHeight(value: unknown) {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 ? value : null;
  }
  if (typeof value !== 'string') {
    return null;
  }
  const text = value.trim();
  if (!text) {
    return null;
  }
  if (!/^[+]?\d+(\.\d+)?(px)?$/i.test(text)) {
    return null;
  }
  const parsed = Number.parseFloat(text);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

/**
 * 解析表格主体可用的底部边界，规避固定页脚遮挡。
 *
 * @param rootElement 表格根节点。
 * @returns 可用区域底部坐标。
 */
function resolveBodyScrollBottomBoundary(rootElement: HTMLElement) {
  if (typeof window === 'undefined') {
    return 0;
  }
  let bottomBoundary = window.innerHeight;
  if (typeof document !== 'undefined') {
    const fixedFooter = document.querySelector(FIXED_FOOTER_SELECTOR) as HTMLElement | null;
    if (fixedFooter) {
      const styles = window.getComputedStyle(fixedFooter);
      if (styles.display !== 'none' && styles.visibility !== 'hidden') {
        bottomBoundary = Math.min(
          bottomBoundary,
          Math.max(0, fixedFooter.getBoundingClientRect().top)
        );
      }
    }
  }
  const contentElement = rootElement.closest('.layout-content') as HTMLElement | null;
  if (contentElement) {
    const contentRect = contentElement.getBoundingClientRect();
    const contentStyles = window.getComputedStyle(contentElement);
    const contentBottom = contentRect.bottom - parseCssPixel(contentStyles.paddingBottom);
    bottomBoundary = Math.min(bottomBoundary, contentBottom);
  }
  return bottomBoundary;
}

/**
 * 同步主体滚动区高度，优先使用容器测量值并提供多级降级计算。
 * @returns 无返回值。
 */
function syncBodyScrollHeight() {
  if (!bodyScrollLockEnabled.value) {
    autoBodyScrollHeight.value = null;
    return;
  }
  const rootElement = tableRootRef.value;
  if (!rootElement) {
    return;
  }
  const gridElement = rootElement.querySelector(
    '.admin-table-vxe.vxe-grid, .admin-table-vxe .vxe-grid'
  ) as HTMLElement | null;
  const pagerElement =
    (rootElement.querySelector(
      '.admin-table-vxe .vxe-grid--pager-wrapper'
    ) as HTMLElement | null) ??
    (rootElement.querySelector('.admin-table-vxe .vxe-pager') as HTMLElement | null);
  const pagerHeight = resolveElementOuterHeight(pagerElement);
  const rootRect = rootElement.getBoundingClientRect();
  const gridRect = gridElement?.getBoundingClientRect() ?? null;
  let nextHeightByClient = Math.floor(
    rootElement.clientHeight - pagerHeight - BODY_SCROLL_SAFE_GAP
  );
  if (gridRect) {
    const occupiedBeforeGrid = Math.max(
      0,
      Math.round(gridRect.top - rootRect.top)
    );
    const occupiedAfterGrid = Math.max(
      0,
      Math.round(rootRect.bottom - gridRect.bottom)
    );
    nextHeightByClient = Math.floor(
      rootElement.clientHeight
      - occupiedBeforeGrid
      - occupiedAfterGrid
      - pagerHeight
      - BODY_SCROLL_SAFE_GAP
    );
  }
  if (nextHeightByClient > 0) {
    autoBodyScrollHeight.value = nextHeightByClient;
    return;
  }
  const viewportBottomBoundary = resolveBodyScrollBottomBoundary(rootElement);
  const viewportTop = gridRect?.top ?? rootRect.top;
  const nextHeightByViewport = Math.floor(
    viewportBottomBoundary - viewportTop - pagerHeight - BODY_SCROLL_SAFE_GAP
  );
  if (nextHeightByViewport > 0) {
    autoBodyScrollHeight.value = nextHeightByViewport;
    return;
  }

  if (gridRect) {
    const nextHeightByRect =
      Math.floor(rootRect.bottom - gridRect.top) - pagerHeight - BODY_SCROLL_SAFE_GAP;
    if (nextHeightByRect > 0) {
      autoBodyScrollHeight.value = nextHeightByRect;
      return;
    }
  }

  const nextHeightByRoot = Math.floor(
    rootElement.clientHeight - pagerHeight - BODY_SCROLL_SAFE_GAP
  );
  if (nextHeightByRoot > 0) {
    autoBodyScrollHeight.value = nextHeightByRoot;
    return;
  }

  autoBodyScrollHeight.value = null;
}

/**
 * 延迟调度主体滚动区高度同步，覆盖渲染后与下一帧布局阶段。
 * @returns 无返回值。
 */
function scheduleSyncBodyScrollHeight() {
  void nextTick(() => {
    syncBodyScrollHeight();
    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        syncBodyScrollHeight();
      });
    }
  });
}

/**
 * 读取状态层表格数据数组。
 * @description 统一保证返回数组引用，避免后续流程出现空值分支。
 */
const stateGridRows = computed<Array<Record<string, any>>>(() => {
  const rows = state.value.gridOptions?.data;
  return Array.isArray(rows)
    ? (rows as Array<Record<string, any>>)
    : EMPTY_TABLE_ROWS;
});

/**
 * 获取状态层中的表格行数据。
 *
 * @returns 当前状态中的数据行集合。
 */
function resolveStateGridRows() {
  return stateGridRows.value;
}

/**
 * 从 VxeGrid 运行时实例读取当前数据行。
 *
 * @returns 运行时行数据，不可用时返回 null。
 */
function resolveGridRuntimeRows() {
  const grid = gridRef.value as
    | (VxeGridInstance & {
        getData?: () => unknown;
        getTableData?: () => { tableData?: unknown };
      })
    | undefined;
  if (!grid) {
    return null;
  }
  const tableData = grid.getTableData?.()?.tableData;
  if (Array.isArray(tableData)) {
    return tableData as Array<Record<string, any>>;
  }
  const gridData = grid.getData?.();
  if (Array.isArray(gridData)) {
    return gridData as Array<Record<string, any>>;
  }
  return null;
}

/**
 * 将运行时行数据同步到筛选缓存，优先取运行时数据。
 * @returns 无返回值。
 */
function syncRuntimeFilterRows() {
  const runtimeRows = resolveGridRuntimeRows();
  const nextRows = runtimeRows ?? resolveStateGridRows();
  if (runtimeFilterRows.value !== nextRows) {
    runtimeFilterRows.value = nextRows;
  }
}

/**
 * 包装代理请求成功回调，在执行原逻辑后刷新筛选缓存与高度。
 *
 * @param callback 原始回调函数。
 * @returns 供 proxy 使用的异步成功回调。
 */
function createProxySuccessHook(callback: unknown) {
  return async (...args: any[]) => {
    const result =
      typeof callback === 'function'
        ? await (callback as (...innerArgs: any[]) => any)(...args)
        : undefined;
    await nextTick();
    syncRuntimeFilterRows();
    scheduleSyncBodyScrollHeight();
    return result;
  };
}

/**
 * 解析工具栏配置对象。
 */
const toolbarConfig = computed(() => {
  return (state.value.gridOptions?.toolbarConfig ?? {}) as Record<string, any>;
});

/**
 * 解析可见工具栏动作列表。
 * @description 会结合权限、全屏状态与查询面板状态过滤不可用工具。
 */
const toolbarTools = computed<ResolvedToolbarActionTool[]>(() => {
  return resolveVisibleToolbarActionTools({
    accessCodes: setupState.accessCodes,
    accessRoles: setupState.accessRoles,
    directiveRenderer: (candidate) =>
      !!toButtonDirectiveTuple(candidate as ResolvedToolbarActionTool),
    excludeCodes: ['search'],
    maximized: maximized.value,
    permissionChecker: setupState.permissionChecker,
    showSearchForm: state.value.showSearchForm,
    tools: toolbarConfig.value.tools,
    useDirectiveWhenNoAccess: true,
  });
});

/**
 * 解析工具栏中部提示配置。
 */
const toolbarHintConfig = computed(() => {
  return resolveToolbarHintConfig(toolbarConfig.value.hint);
});

/**
 * 解析工具栏中部提示展示形态。
 */
const toolbarHintPresentation = computed(() => {
  return resolveToolbarHintPresentation(toolbarHintConfig.value);
});

/** 是否提供 `toolbar-center` 插槽。 */
const hasToolbarCenterSlot = computed(() => {
  return !!slots['toolbar-center'];
});

/** 是否展示工具栏中部区域（插槽或提示任一存在）。 */
const showToolbarCenter = computed(() => {
  return resolveToolbarCenterVisible({
    hasCenterSlot: hasToolbarCenterSlot.value,
    hasHint: !!toolbarHintConfig.value,
  });
});

/** 工具栏动作默认插入位置。 */
const toolbarToolsPosition = computed(() => {
  return resolveToolbarInlinePosition(toolbarConfig.value.toolsPosition, 'after');
});

/** 工具栏动作插槽位置策略。 */
const toolbarToolsSlotPosition = computed(() => {
  return resolveToolbarToolsSlotPosition(toolbarConfig.value.toolsSlotPosition);
});

/** 工具栏动作插槽命中状态。 */
const toolbarToolsSlotState = computed(() => {
  return resolveToolbarToolsSlotState(
    !!slots['toolbar-tools'],
    toolbarToolsSlotPosition.value
  );
});

/** 是否存在工具栏动作插槽。 */
const hasToolbarToolsSlot = computed(() => {
  return toolbarToolsSlotState.value.hasSlot;
});

/** 工具栏动作插槽是否替换内置动作。 */
const hasToolbarToolsSlotReplaceBuiltin = computed(() => {
  return toolbarToolsSlotState.value.replace;
});

/** 工具栏动作插槽是否在内置动作前渲染。 */
const hasToolbarToolsSlotBeforeBuiltin = computed(() => {
  return toolbarToolsSlotState.value.before;
});

/** 工具栏动作插槽是否在内置动作后渲染。 */
const hasToolbarToolsSlotAfterBuiltin = computed(() => {
  return toolbarToolsSlotState.value.after;
});

/** 解析工具栏动作在“前/后”区域的分配结果。 */
const toolbarToolsPlacement = computed(() => {
  return resolveToolbarToolsPlacement(
    toolbarTools.value,
    toolbarToolsPosition.value,
    'after'
  );
});

/** 工具栏前置动作列表。 */
const toolbarToolsBeforeBuiltin = computed(() => {
  return toolbarToolsPlacement.value.before;
});

/** 工具栏后置动作列表。 */
const toolbarToolsAfterBuiltin = computed(() => {
  return toolbarToolsPlacement.value.after;
});

/**
 * 构建内置工具栏按钮列表。
 * @description 根据配置决定是否展示刷新、全屏、列设置等默认工具。
 */
const builtinToolbarTools = computed(() => {
  return buildBuiltinToolbarTools(toolbarConfig.value as any, localeText.value, {
    hasToolbarToolsSlot: hasToolbarToolsSlotReplaceBuiltin.value,
    maximized: maximized.value,
  });
});

/** 是否显示工具栏查询按钮。 */
const showSearchButton = computed(() => {
  return !!toolbarConfig.value.search && !!state.value.formOptions;
});

/**
 * 解析分页配置记录。
 */
const pagerConfigRecord = computed(() => {
  return ((state.value.gridOptions as Record<string, any> | undefined)?.pagerConfig ??
    {}) as Record<string, any>;
});

/** 分页条主要工具区域位置（左/右）。 */
const pagerPosition = computed(() => {
  return pagerConfigRecord.value.position === 'left' ? 'left' : 'right';
});

/**
 * 解析分页条工具栏配置。
 * @description 兼容 `toolbar` 与 `toolbarConfig` 字段。
 */
const pagerToolbarConfig = computed(() => {
  return resolveToolbarConfigRecord(
    pagerConfigRecord.value.toolbar ?? pagerConfigRecord.value.toolbarConfig
  );
});

/** 是否提供 `pager-left` 插槽。 */
const hasPagerLeftSlot = computed(() => {
  return !!slots['pager-left'];
});

/** 是否提供 `pager-center` 插槽。 */
const hasPagerCenterSlot = computed(() => {
  return !!slots['pager-center'];
});

/** 是否提供 `pager-tools` 插槽。 */
const hasPagerToolsSlot = computed(() => {
  return !!slots['pager-tools'];
});

/** 分页中部提示配置。 */
const pagerHintConfig = computed(() => {
  return resolveToolbarHintConfig(pagerToolbarConfig.value.hint);
});

/** 分页中部提示展示形态。 */
const pagerHintPresentation = computed(() => {
  return resolveToolbarHintPresentation(pagerHintConfig.value);
});

/** 是否展示分页中部区域（插槽或提示任一存在）。 */
const showPagerCenter = computed(() => {
  return resolveToolbarCenterVisible({
    hasCenterSlot: hasPagerCenterSlot.value,
    hasHint: !!pagerHintConfig.value,
  });
});

/** 分页左侧动作默认插入位置。 */
const pagerLeftToolsPosition = computed(() => {
  return resolveToolbarInlinePosition(pagerToolbarConfig.value.leftToolsPosition, 'before');
});

/** 分页左侧动作插槽位置策略。 */
const pagerLeftToolsSlotPosition = computed(() => {
  return resolveToolbarToolsSlotPosition(pagerToolbarConfig.value.leftToolsSlotPosition);
});

/** 分页左侧插槽命中状态。 */
const pagerLeftSlotState = computed(() => {
  return resolveToolbarToolsSlotState(
    !!slots['pager-left'],
    pagerLeftToolsSlotPosition.value
  );
});

/** 分页左侧插槽是否替换左侧动作。 */
const hasPagerLeftSlotReplaceTools = computed(() => {
  return pagerLeftSlotState.value.replace;
});

/** 分页左侧插槽是否在动作前渲染。 */
const hasPagerLeftSlotBeforeTools = computed(() => {
  return pagerLeftSlotState.value.before;
});

/** 分页左侧插槽是否在动作后渲染。 */
const hasPagerLeftSlotAfterTools = computed(() => {
  return pagerLeftSlotState.value.after;
});

/** 解析分页左侧可见动作列表。 */
const pagerLeftTools = computed<ResolvedToolbarActionTool[]>(() => {
  return resolveVisibleToolbarActionTools({
    accessCodes: setupState.accessCodes,
    accessRoles: setupState.accessRoles,
    directiveRenderer: (candidate) =>
      !!toButtonDirectiveTuple(candidate as ResolvedToolbarActionTool),
    maximized: maximized.value,
    permissionChecker: setupState.permissionChecker,
    showSearchForm: state.value.showSearchForm,
    tools: pagerToolbarConfig.value.leftTools,
    useDirectiveWhenNoAccess: true,
  });
});

/** 解析分页左侧动作在“前/后”区域的分配结果。 */
const pagerLeftToolsPlacement = computed(() => {
  return resolveToolbarToolsPlacement(
    pagerLeftTools.value,
    pagerLeftToolsPosition.value,
    'before'
  );
});

/** 分页左侧插槽前置动作。 */
const pagerLeftToolsBeforeSlot = computed(() => {
  return pagerLeftToolsPlacement.value.before;
});

/** 分页左侧插槽后置动作。 */
const pagerLeftToolsAfterSlot = computed(() => {
  return pagerLeftToolsPlacement.value.after;
});

/** 分页右侧动作原始来源（优先 `rightTools`）。 */
const pagerRightToolsSource = computed(() => {
  if (Array.isArray(pagerToolbarConfig.value.rightTools)) {
    return pagerToolbarConfig.value.rightTools;
  }
  return pagerToolbarConfig.value.tools;
});

/** 分页右侧动作默认插入位置。 */
const pagerRightToolsPosition = computed(() => {
  return resolveToolbarInlinePosition(
    pagerToolbarConfig.value.rightToolsPosition ??
      pagerToolbarConfig.value.toolsPosition,
    'before'
  );
});

/** 分页右侧动作插槽位置策略。 */
const pagerRightToolsSlotPosition = computed(() => {
  return resolveToolbarToolsSlotPosition(
    pagerToolbarConfig.value.rightToolsSlotPosition ??
      pagerToolbarConfig.value.toolsSlotPosition
  );
});

/** 分页右侧动作插槽命中状态。 */
const pagerToolsSlotState = computed(() => {
  return resolveToolbarToolsSlotState(
    !!slots['pager-tools'],
    pagerRightToolsSlotPosition.value
  );
});

/** 分页右侧插槽是否替换内置动作。 */
const hasPagerToolsSlotReplaceTools = computed(() => {
  return pagerToolsSlotState.value.replace;
});

/** 分页右侧插槽是否在动作前渲染。 */
const hasPagerToolsSlotBeforeTools = computed(() => {
  return pagerToolsSlotState.value.before;
});

/** 分页右侧插槽是否在动作后渲染。 */
const hasPagerToolsSlotAfterTools = computed(() => {
  return pagerToolsSlotState.value.after;
});

/** 解析分页右侧可见动作列表。 */
const pagerRightTools = computed<ResolvedToolbarActionTool[]>(() => {
  return resolveVisibleToolbarActionTools({
    accessCodes: setupState.accessCodes,
    accessRoles: setupState.accessRoles,
    directiveRenderer: (candidate) =>
      !!toButtonDirectiveTuple(candidate as ResolvedToolbarActionTool),
    maximized: maximized.value,
    permissionChecker: setupState.permissionChecker,
    showSearchForm: state.value.showSearchForm,
    tools: pagerRightToolsSource.value,
    useDirectiveWhenNoAccess: true,
  });
});

/** 解析分页右侧动作在“前/后”区域的分配结果。 */
const pagerRightToolsPlacement = computed(() => {
  return resolveToolbarToolsPlacement(
    pagerRightTools.value,
    pagerRightToolsPosition.value,
    'before'
  );
});

/** 分页右侧前置动作列表。 */
const pagerRightToolsBeforeBuiltin = computed(() => {
  return pagerRightToolsPlacement.value.before;
});

/** 分页右侧后置动作列表。 */
const pagerRightToolsAfterBuiltin = computed(() => {
  return pagerRightToolsPlacement.value.after;
});

/**
 * 解析分页导出配置。
 * @description 标准化导出动作、导出文件名与展示标题。
 */
const pagerExportConfig = computed(() => {
  return resolveTablePagerExportConfig(
    pagerConfigRecord.value.exportConfig,
    localeText.value
  );
});

/**
 * 解析当前可见导出动作。
 * @description 按权限与动作配置过滤得到最终导出菜单项。
 */
const pagerExportActions = computed<Array<ResolvedTablePagerExportAction>>(() => {
  return resolveVisibleTablePagerExportActions({
    accessCodes: setupState.accessCodes,
    accessRoles: setupState.accessRoles,
    actions: pagerExportConfig.value?.options,
    permissionChecker: setupState.permissionChecker,
  });
});

/**
 * 解析分页导出触发器状态。
 * @description 判断是否为单动作直出或多动作菜单模式。
 */
const pagerExportTriggerState = computed(() => {
  return resolveTablePagerExportTriggerState({
    actions: pagerExportActions.value,
  });
});

/**
 * 分页导出单动作
 * @description 当仅存在一个可导出动作时直接返回该动作，供按钮直出模式使用。
 */
const pagerExportSingleAction = computed<
  ResolvedTablePagerExportAction | undefined
>(() => {
  return pagerExportTriggerState.value.singleAction;
});

/** 是否以下拉菜单展示分页导出动作。 */
const showPagerExportMenu = computed(() => {
  return pagerExportTriggerState.value.showMenu;
});

/** 分页导出入口是否显示。 */
const showPagerExport = computed(() => {
  return resolveTablePagerExportVisible({
    actionsLength: pagerExportActions.value.length,
    pagerEnabled: pagerConfigRecord.value.enabled !== false,
  });
});

/**
 * 解析分页区域展示状态。
 * @description 汇总左右区域、导出入口、中心区等可见性条件。
 */
const pagerVisibilityState = computed(() => {
  return resolvePagerVisibilityState({
    hasLeftSlot: hasPagerLeftSlot.value,
    hasLeftSlotContent: !!slots['pager-left'],
    hasRightSlot: hasPagerToolsSlot.value,
    hasRightSlotContent: !!slots['pager-tools'],
    leftSlotReplace: hasPagerLeftSlotReplaceTools.value,
    leftToolsLength: pagerLeftTools.value.length,
    rightSlotReplace: hasPagerToolsSlotReplaceTools.value,
    rightToolsLength: pagerRightTools.value.length,
    showCenter: showPagerCenter.value,
    showExport: showPagerExport.value,
  });
});

/** 导出入口是否放在分页右侧区域。 */
const showPagerExportInRight = computed(() => {
  return pagerVisibilityState.value.showExportInRight;
});

/** 分页左侧区域是否显示。 */
const showPagerLeftArea = computed(() => {
  return pagerVisibilityState.value.showLeft;
});

/** 分页右侧区域是否显示。 */
const showPagerRightArea = computed(() => {
  return pagerVisibilityState.value.showRight;
});

/** 表格标题区域是否显示。 */
const showTableTitle = computed<boolean>(() => {
  return !!slots['table-title'] || !!state.value.tableTitle;
});

/**
 * 计算工具栏是否显示。
 */
const showToolbar = computed<boolean>(() => {
  return resolveToolbarVisible({
    builtinToolsLength: builtinToolbarTools.value.length,
    hasActionsSlot: !!slots['toolbar-actions'],
    hasToolsSlot: hasToolbarToolsSlot.value,
    showCenter: showToolbarCenter.value,
    showSearchButton: showSearchButton.value,
    showTableTitle: showTableTitle.value,
    toolsLength: toolbarTools.value.length,
  });
});

/**
 * 构建基础网格配置。
 * @description 合并全局 vxe-grid 配置与组件状态配置，并补齐代理钩子与插槽映射。
 */
const baseGridOptions = computed(() => {
  const globalGridConfig = (VxeUI?.getConfig()?.grid ?? {}) as VxeTableGridProps;
  const stateGridOptions = (state.value.gridOptions ?? {}) as Record<string, any>;
  const merged = mergeWithArrayOverride(
    ({
      ...stateGridOptions,
    } as Partial<VxeTableGridProps>),
    globalGridConfig
  ) as VxeTableGridProps;
  if (Array.isArray(stateGridOptions.data)) {
    (merged as Record<string, any>).data = stateGridOptions.data;
  }
  if (Array.isArray(stateGridOptions.columns)) {
    (merged as Record<string, any>).columns = stateGridOptions.columns;
  }

  if (merged.proxyConfig) {
    const proxyConfig = merged.proxyConfig as Record<string, any>;
    const ajax =
      proxyConfig.ajax && typeof proxyConfig.ajax === 'object'
        ? {
            ...(proxyConfig.ajax as Record<string, any>),
          }
        : proxyConfig.ajax;
    if (ajax && typeof ajax === 'object') {
      ajax.querySuccess = createProxySuccessHook(ajax.querySuccess);
      ajax.reloadSuccess = createProxySuccessHook(ajax.reloadSuccess);
    }
    merged.proxyConfig = {
      ...proxyConfig,
      ajax,
      autoLoad: false,
      enabled: !!proxyConfig.ajax,
    };
  }

  if (merged.formConfig) {
    merged.formConfig = {
      ...merged.formConfig,
      enabled: false,
    };
  }

  if (merged.toolbarConfig) {
    merged.toolbarConfig = {
      ...merged.toolbarConfig,
      enabled: false,
    } as any;
  }

  const resolvedStripeConfig = resolveTableStripeConfig(
    (merged as Record<string, any>).stripe as any,
    {
      enabled: false,
      followTheme: false,
    }
  );
  (merged as Record<string, any>).stripe = resolvedStripeConfig.enabled;
  (merged as Record<string, any>).__adminStripeFollowTheme =
    resolvedStripeConfig.followTheme;

  return merged;
});

/**
 * 解析最终传入 VxeGrid 的配置。
 * @description 统一处理分页、插槽绑定、本地分页切片及移动端布局差异。
 */
const sourceGridOptions = computed(() => {
  const merged = {
    ...(baseGridOptions.value as Record<string, any>),
  } as VxeTableGridProps;

  if (merged.pagerConfig) {
    const {
      exportConfig: _exportConfig,
      position: _position,
      resetToFirstOnPageSizeChange: _resetToFirstOnPageSizeChange,
      toolbar: _toolbar,
      toolbarConfig: _toolbarConfig,
      ...pagerConfig
    } = (merged.pagerConfig as Record<string, any>) ?? {};
    const sourceClassName =
      typeof pagerConfig.className === 'string' ? pagerConfig.className.trim() : '';
    const resolvedPageSizes = resolveTablePagerPageSizes(pagerConfig.pageSizes);
    const resolvedLayouts = resolveTablePagerLayouts(
      pagerConfig.layouts,
      isMobile.value
    );
    const rawPageSize = Number(pagerConfig.pageSize);
    const resolvedPageSize =
      Number.isFinite(rawPageSize) && rawPageSize > 0
        ? rawPageSize
        : resolvedPageSizes.includes(20)
          ? 20
          : (resolvedPageSizes[0] ?? 20);
    const pagerClassName = [
      sourceClassName,
      'mt-2',
      'w-full',
      `admin-table__pager--align-${pagerPosition.value}`,
    ]
      .filter((item) => item.length > 0)
      .join(' ');

    merged.pagerConfig = {
      ...pagerConfig,
      align: pagerPosition.value,
      background: true,
      className: pagerClassName,
      layouts: resolvedLayouts,
      pageSize: resolvedPageSize,
      pageSizes: resolvedPageSizes,
      size: 'mini',
    } as any;

    const pagerConfigRecord = merged.pagerConfig as Record<string, any>;
    const paginationEnabled = pagerConfigRecord.enabled !== false;
    const hasProxy = isProxyEnabled(merged.proxyConfig as Record<string, any>);
    const sourceRows = Array.isArray(merged.data)
      ? (merged.data as Array<Record<string, any>>)
      : EMPTY_TABLE_ROWS;

    if (paginationEnabled && !hasProxy) {
      const totalRaw = Number(pagerConfigRecord.total);
      const hasExplicitTotal = Number.isFinite(totalRaw) && totalRaw >= 0;
      const explicitTotal = hasExplicitTotal ? Math.floor(totalRaw) : 0;
      const useExternalPagedData = hasExplicitTotal && explicitTotal > sourceRows.length;
      const total = useExternalPagedData
        ? explicitTotal
        : sourceRows.length;
      const currentRaw = Number(pagerConfigRecord.currentPage);
      const requestedCurrent = Number.isFinite(currentRaw) && currentRaw > 0
        ? Math.floor(currentRaw)
        : 1;
      const pageCount = Math.max(1, Math.ceil(total / resolvedPageSize));
      const currentPage = Math.min(requestedCurrent, pageCount);

      if (!useExternalPagedData) {
        const start = Math.max(0, (currentPage - 1) * resolvedPageSize);
        const end = start + resolvedPageSize;
        merged.data = sourceRows.slice(start, end) as any;
      }
      merged.pagerConfig = {
        ...(pagerConfigRecord as Record<string, any>),
        currentPage,
        total,
      } as any;
    }

    const nextSlots = resolvePagerSlotBindings({
      showCenter: pagerVisibilityState.value.showCenter,
      showLeft: showPagerLeftArea.value,
      showRight: showPagerRightArea.value,
      sourceSlots: pagerConfig.slots,
    });
    if (nextSlots) {
      merged.pagerConfig = {
        ...(merged.pagerConfig as Record<string, any>),
        slots: nextSlots,
      } as any;
    }
  }

  return merged;
});

/** 条纹配置状态（启用与是否跟随主题）。 */
const stripeConfig = computed(() => {
  const source = sourceGridOptions.value as Record<string, any>;
  const enabled = source?.stripe === true;
  const followTheme = enabled && source?.__adminStripeFollowTheme === true;
  return {
    enabled,
    followTheme,
  };
});

/**
 * 解析条纹样式类名。
 */
const stripeClassName = computed(() => {
  return resolveTableStripePresentation(stripeConfig.value).className;
});

/**
 * 解析表格根节点主题 CSS 变量。
 */
const runtimeRootStyle = computed(() => {
  themeSignal.value;
  return resolveTableThemeCssVars(setupState.theme) as
    | Record<string, string>
    | undefined;
});

/**
 * 是否在分页尺寸变化时自动回到第一页。
 */
const resetToFirstOnPageSizeChange = computed(() => {
  return (state.value.gridOptions as Record<string, any> | undefined)?.pagerConfig
    ?.resetToFirstOnPageSizeChange === true;
});

/**
 * 源列配置集合。
 */
const sourceColumns = computed<TableColumnRecord[]>(() => {
  return (baseGridOptions.value.columns as TableColumnRecord[]) ?? [];
});

/**
 * 列自定义持久化配置。
 */
const columnCustomPersistenceConfig = computed(() => {
  return resolveColumnCustomPersistenceConfig(
    baseGridOptions.value as Record<string, any>,
    sourceColumns.value
  );
});

/**
 * 外部列自定义状态。
 * @description 优先读取外部显式配置，未提供时回退到本地持久化存储。
 */
const externalColumnCustomState = computed(() => {
  const external = resolveColumnCustomState(baseGridOptions.value as Record<string, any>);
  if (hasColumnCustomSnapshot(external)) {
    return external;
  }
  return readColumnCustomStateFromStorage(columnCustomPersistenceConfig.value);
});

/**
 * 默认筛选项缓存
 * @description 按字段缓存默认筛选选项，避免在同一数据源上重复构建。
 */
const defaultColumnFilterOptionsCache = new Map<
  string,
  {
    emptyLabel: string;
    options: ReturnType<typeof buildDefaultColumnFilterOptions>;
    rows: Array<Record<string, any>>;
  }
>();

/**
 * 解析运行时列定义。
 * @description 处理列可见/固定/顺序、默认筛选、格式化与单元格策略样式。
 */
const runtimeColumns = computed<TableColumnRecord[]>(() => {
  const sourceData = runtimeFilterRows.value ?? resolveStateGridRows();
  const emptyFilterLabel = localeText.value.emptyValue;
  const sourceGridOptionsRecord = baseGridOptions.value as Record<string, any>;
  const formatterRegistry = getGlobalTableFormatterRegistry();
  const cellStrategyCache = new WeakMap<
    Record<string, any>,
    Map<
      string,
      {
        rawValue: unknown;
        result: ReturnType<typeof resolveTableCellStrategyResult>;
      }
    >
  >();
  /**
   * 解析列默认筛选项并按数据源与空值文案做缓存复用。
   *
   * @param field 列字段名。
   * @returns 默认筛选选项列表。
   */
  const resolveDefaultFilterOptions = (field: string) => {
    const cached = defaultColumnFilterOptionsCache.get(field);
    if (
      cached?.rows === sourceData &&
      cached.emptyLabel === emptyFilterLabel
    ) {
      return cached.options;
    }
    const next = buildDefaultColumnFilterOptions(sourceData, field, {
      emptyLabel: emptyFilterLabel,
    });
    defaultColumnFilterOptionsCache.set(field, {
      emptyLabel: emptyFilterLabel,
      options: next,
      rows: sourceData,
    });
    return next;
  };
  /**
   * 解析单元格策略结果，并基于行与字段缓存避免重复计算。
   *
   * @param column 当前列配置。
   * @param field 字段名。
   * @param row 当前行数据。
   * @param rowIndex 当前行索引。
   * @param rawValue 原始单元格值。
   * @returns 单元格策略解析结果。
   */
  const resolveCellStrategy = (
    column: TableColumnRecord,
    field: string,
    row: Record<string, any>,
    rowIndex: number,
    rawValue: unknown
  ) => {
    if (!row || typeof row !== 'object') {
      return resolveTableCellStrategyResult({
        column,
        field,
        gridOptions: sourceGridOptionsRecord,
        row,
        rowIndex,
        value: rawValue,
      });
    }
    let rowCache = cellStrategyCache.get(row);
    if (!rowCache) {
      rowCache = new Map<
        string,
        {
          rawValue: unknown;
          result: ReturnType<typeof resolveTableCellStrategyResult>;
        }
      >();
      cellStrategyCache.set(row, rowCache);
    }
    const cacheKey = `${field}:${rowIndex}`;
    const cached = rowCache.get(cacheKey);
    if (cached && Object.is(cached.rawValue, rawValue)) {
      return cached.result;
    }
    const resolved = resolveTableCellStrategyResult({
      column,
      field,
      gridOptions: sourceGridOptionsRecord,
      row,
      rowIndex,
      value: rawValue,
    });
    rowCache.set(cacheKey, {
      rawValue,
      result: resolved,
    });
    return resolved;
  };

  return buildColumnRuntimeItems(
    sourceColumns.value,
    {
      filterable: filterableColumns.value,
      fixed: fixedColumns.value,
      order: columnOrder.value,
      sortable: sortableColumns.value,
      visible: visibleColumns.value,
    },
    {
      includeVisibilityFlags: true,
    }
  ).map((item) => {
    const column = {
      ...(item.column as Record<string, any>),
    } as TableColumnRecord;
    const field = String(column.field ?? column.dataIndex ?? '');

    if (
      item.filterable &&
      field &&
      (!Array.isArray(column.filters) || column.filters.length <= 0) &&
      typeof column.filterRender === 'undefined' &&
      typeof column.filterMethod !== 'function'
    ) {
      const filters = resolveDefaultFilterOptions(field);
      if (filters.length > 0) {
        column.filters = filters.map((option) => ({
          data: option.value,
          label: option.label,
          value: option.value,
        }));
        column.filterMethod = ({ option, row }: { option?: Record<string, any>; row: Record<string, any> }) => {
          const rowValue = getColumnValueByPath(row, field);
          const rowKey = getColumnFilterValueKey(rowValue);
          return rowKey === option?.value;
        };
      }
    }

    if (field) {
      const sourceFormatter = column.formatter;
      const sourceCellClassName = column.cellClassName;
      const sourceCellStyle = column.cellStyle;

      column.formatter = (params: Record<string, any>) => {
        const row = (params?.row ?? {}) as Record<string, any>;
        const rowIndex =
          typeof params?.rowIndex === 'number'
            ? params.rowIndex
            : typeof params?._rowIndex === 'number'
              ? params._rowIndex
              : -1;
        const rawValue = Object.prototype.hasOwnProperty.call(params ?? {}, 'cellValue')
          ? params.cellValue
          : getColumnValueByPath(row, field);
        const strategyResult = resolveCellStrategy(
          column,
          field,
          row,
          rowIndex,
          rawValue
        );
        const strategyValue = strategyResult ? strategyResult.value : rawValue;

        if (typeof sourceFormatter === 'function') {
          try {
            return sourceFormatter({
              ...(params ?? {}),
              cellValue: strategyValue,
              value: strategyValue,
            });
          } catch {
            return strategyValue;
          }
        }
        if (typeof sourceFormatter === 'string') {
          const formatter = formatterRegistry.get(sourceFormatter);
          if (formatter) {
            return formatter(strategyValue, {
              column,
              row,
            });
          }
        }
        return strategyResult?.hasDisplayOverride
          ? strategyResult.displayValue
          : strategyValue;
      };

      column.cellClassName = (params: Record<string, any>) => {
        const sourceClassName = typeof sourceCellClassName === 'function'
          ? sourceCellClassName(params)
          : sourceCellClassName;
        const row = (params?.row ?? {}) as Record<string, any>;
        const rowIndex =
          typeof params?.rowIndex === 'number'
            ? params.rowIndex
            : typeof params?._rowIndex === 'number'
              ? params._rowIndex
              : -1;
        const rawValue = Object.prototype.hasOwnProperty.call(params ?? {}, 'cellValue')
          ? params.cellValue
          : getColumnValueByPath(row, field);
        const strategyResult = resolveCellStrategy(
          column,
          field,
          row,
          rowIndex,
          rawValue
        );
        return [
          sourceClassName,
          strategyResult?.className,
          strategyResult?.clickable ? 'admin-table__strategy-clickable' : '',
        ]
          .filter(Boolean)
          .join(' ');
      };

      column.cellStyle = (params: Record<string, any>) => {
        const sourceStyle = typeof sourceCellStyle === 'function'
          ? sourceCellStyle(params)
          : sourceCellStyle;
        const row = (params?.row ?? {}) as Record<string, any>;
        const rowIndex =
          typeof params?.rowIndex === 'number'
            ? params.rowIndex
            : typeof params?._rowIndex === 'number'
              ? params._rowIndex
              : -1;
        const rawValue = Object.prototype.hasOwnProperty.call(params ?? {}, 'cellValue')
          ? params.cellValue
          : getColumnValueByPath(row, field);
        const strategyResult = resolveCellStrategy(
          column,
          field,
          row,
          rowIndex,
          rawValue
        );
        return {
          ...((sourceStyle as Record<string, any> | undefined) ?? {}),
          ...((strategyResult?.style ?? {}) as Record<string, any>),
        };
      };
    }

    return column;
  });
});

/**
 * 补齐序号列后的运行时列集合。
 */
const runtimeColumnsWithSeq = computed(() => {
  return ensureSeqColumn(
    runtimeColumns.value,
    (sourceGridOptions.value as Record<string, any>)?.seqColumn,
    {
      title: localeText.value.seq,
    }
  );
});

/**
 * 解析操作列配置。
 */
const operationColumnConfig = computed(() => {
  return resolveOperationColumnConfig(
    (sourceGridOptions.value as Record<string, any>)?.operationColumn as any,
    localeText.value
  );
});

/**
 * 解析可见操作列工具。
 */
const operationTools = computed<ResolvedToolbarActionTool[]>(() => {
  if (!operationColumnConfig.value) {
    return [];
  }
  return resolveVisibleOperationActionTools({
    accessCodes: setupState.accessCodes,
    accessRoles: setupState.accessRoles,
    directiveRenderer: (candidate) =>
      !!toButtonDirectiveTuple(candidate as ResolvedToolbarActionTool),
    maximized: maximized.value,
    operationColumn: (sourceGridOptions.value as Record<string, any>)
      ?.operationColumn as any,
    permissionChecker: setupState.permissionChecker,
    showSearchForm: state.value.showSearchForm,
    useDirectiveWhenNoAccess: true,
  });
});

/**
 * 解析当前行选择模式。
 */
const selectionMode = computed<TableSelectionMode | undefined>(() => {
  return resolveSelectionMode(
    sourceGridOptions.value as Record<string, any>,
    runtimeColumnsWithSeq.value
  );
});

/**
 * 解析通用 rowSelection 配置。
 */
const rowSelectionConfig = computed(() => {
  return ((sourceGridOptions.value as Record<string, any>)?.rowSelection ??
    undefined) as Record<string, any> | undefined;
});

/**
 * 按模式解析行选择专属配置（radio/checkbox）。
 */
const modeSelectionConfig = computed(() => {
  if (selectionMode.value === 'radio') {
    return (sourceGridOptions.value as Record<string, any>)?.radioConfig as Record<string, any> | undefined;
  }
  if (selectionMode.value === 'checkbox') {
    return (sourceGridOptions.value as Record<string, any>)?.checkboxConfig as Record<string, any> | undefined;
  }
  return undefined;
});

/**
 * 解析行主键字段。
 */
const selectionRowKeyField = computed(() => {
  const rowConfig = (sourceGridOptions.value as Record<string, any>)?.rowConfig as Record<string, any> | undefined;
  const keyField = rowConfig?.keyField;
  return typeof keyField === 'string' && keyField.trim().length > 0
    ? keyField.trim()
    : 'id';
});

/**
 * 解析勾选字段名（checkField）。
 */
const selectionCheckField = computed(() => {
  const modeValue = modeSelectionConfig.value?.checkField;
  const rowValue = rowSelectionConfig.value?.checkField;
  const value = typeof modeValue === 'string'
    ? modeValue
    : typeof rowValue === 'string'
      ? rowValue
      : undefined;
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : undefined;
});

/**
 * 解析行可选判定方法（checkMethod）。
 */
const selectionCheckMethod = computed(() => {
  if (typeof modeSelectionConfig.value?.checkMethod === 'function') {
    return modeSelectionConfig.value.checkMethod as ((ctx: { row: Record<string, any>; rowIndex: number }) => boolean);
  }
  if (typeof rowSelectionConfig.value?.checkMethod === 'function') {
    return rowSelectionConfig.value.checkMethod as ((ctx: { row: Record<string, any>; rowIndex: number }) => boolean);
  }
  return undefined;
});

/**
 * 解析行选择触发方式。
 */
const selectionTrigger = computed(() => {
  const trigger = modeSelectionConfig.value?.trigger ?? rowSelectionConfig.value?.trigger;
  if (
    trigger === 'cell' ||
    trigger === 'default' ||
    trigger === 'manual' ||
    trigger === 'row'
  ) {
    return trigger;
  }
  return undefined;
});

/**
 * 解析选中高亮开关。
 */
const selectionHighlight = computed(() => {
  const modeValue = modeSelectionConfig.value?.highlight;
  if (typeof modeValue === 'boolean') {
    return modeValue;
  }
  const rowValue = rowSelectionConfig.value?.highlight;
  if (typeof rowValue === 'boolean') {
    return rowValue;
  }
  return selectionMode.value ? true : undefined;
});

/**
 * 解析选择严格模式。
 */
const selectionStrict = computed(() => {
  const modeValue = modeSelectionConfig.value?.strict;
  if (typeof modeValue === 'boolean') {
    return modeValue;
  }
  const rowValue = rowSelectionConfig.value?.strict;
  if (typeof rowValue === 'boolean') {
    return rowValue;
  }
  return undefined;
});

/**
 * 受控选中键集合。
 */
const controlledSelectedRowKeys = computed<TableSelectionKey[] | undefined>(() => {
  const mode = selectionMode.value;
  if (!mode) {
    return undefined;
  }
  const value = rowSelectionConfig.value?.selectedRowKeys;
  if (!Array.isArray(value)) {
    return undefined;
  }
  return normalizeTableSelectionKeys<TableSelectionKey>(value, mode);
});

/**
 * 默认选中键集合（非受控初始值）。
 */
const defaultSelectedRowKeys = computed<TableSelectionKey[]>(() => {
  const mode = selectionMode.value;
  if (!mode) {
    return [];
  }
  const value = rowSelectionConfig.value?.defaultSelectedRowKeys;
  if (!Array.isArray(value)) {
    return [];
  }
  return normalizeTableSelectionKeys<TableSelectionKey>(value, mode);
});

/**
 * 当前生效的选中键集合。
 */
const effectiveSelectedRowKeys = computed<TableSelectionKey[]>(() => {
  if (!selectionMode.value) {
    return [];
  }
  return controlledSelectedRowKeys.value ?? innerSelectedRowKeys.value;
});

/**
 * 生成最终传给 VxeGrid 的运行时配置。
 * @description 聚合列定义、行策略、选择策略、分页配置与代理配置。
 */
const gridOptions = computed(() => {
  const baseGridOptionsRecord =
    baseGridOptions.value as Record<string, any>;
  const sourceGridOptionsRecord =
    sourceGridOptions.value as Record<string, any>;
  const stateGridOptionsRecord =
    (state.value.gridOptions ?? {}) as Record<string, any>;
  const runtimeColumnsWithSelection = ensureSelectionColumn(
    runtimeColumnsWithSeq.value,
    selectionMode.value,
    {
      key: '__admin-table-auto-selection',
    }
  );
  const runtimeColumnsWithOperation =
    operationColumnConfig.value && operationTools.value.length > 0
      ? [
          ...runtimeColumnsWithSelection,
          {
            align: operationColumnConfig.value.align,
            fixed: operationColumnConfig.value.fixed,
            key: operationColumnConfig.value.key,
            slots: {
              default: '__admin_table_operation',
            },
            title: operationColumnConfig.value.title,
            width: operationColumnConfig.value.width,
            ...(operationColumnConfig.value.attrs ?? {}),
          } as TableColumnRecord,
        ]
      : runtimeColumnsWithSelection;
  const merged = {
    ...sourceGridOptionsRecord,
    columns: runtimeColumnsWithOperation,
  } as VxeTableGridProps;
  const sourceRowClassName = (merged as Record<string, any>).rowClassName;
  const sourceRowStyle = (merged as Record<string, any>).rowStyle;
  const rowStrategyCache = new WeakMap<
    Record<string, any>,
    Map<number, ReturnType<typeof resolveTableRowStrategyResult>>
  >();
  const rowInlineStyleCache = new WeakMap<
    Record<string, any>,
    Map<number, ReturnType<typeof resolveTableRowStrategyInlineStyle> | undefined>
  >();
  /**
   * 解析行策略结果，并按行实例与索引进行缓存。
   *
   * @param row 当前行数据。
   * @param rowIndex 当前行索引。
   * @returns 行策略解析结果。
   */
  const resolveRowStrategy = (
    row: Record<string, any>,
    rowIndex: number
  ) => {
    if (!row || typeof row !== 'object') {
      return resolveTableRowStrategyResult({
        gridOptions: baseGridOptionsRecord,
        row,
        rowIndex,
      });
    }
    let rowCache = rowStrategyCache.get(row);
    if (!rowCache) {
      rowCache = new Map<number, ReturnType<typeof resolveTableRowStrategyResult>>();
      rowStrategyCache.set(row, rowCache);
    }
    if (rowCache.has(rowIndex)) {
      return rowCache.get(rowIndex);
    }
    const resolved = resolveTableRowStrategyResult({
      gridOptions: baseGridOptionsRecord,
      row,
      rowIndex,
    });
    rowCache.set(rowIndex, resolved);
    return resolved;
  };
  /**
   * 解析行策略内联样式，并对结果进行缓存复用。
   *
   * @param row 当前行数据。
   * @param rowIndex 当前行索引。
   * @returns 行内联样式对象或空值。
   */
  const resolveRowStrategyInlineStyleCached = (
    row: Record<string, any>,
    rowIndex: number
  ) => {
    if (!row || typeof row !== 'object') {
      const rowStrategyResult = resolveRowStrategy(row, rowIndex);
      return resolveTableRowStrategyInlineStyle(rowStrategyResult?.style);
    }
    let rowCache = rowInlineStyleCache.get(row);
    if (!rowCache) {
      rowCache = new Map<
        number,
        ReturnType<typeof resolveTableRowStrategyInlineStyle> | undefined
      >();
      rowInlineStyleCache.set(row, rowCache);
    }
    if (rowCache.has(rowIndex)) {
      return rowCache.get(rowIndex);
    }
    const rowStrategyResult = resolveRowStrategy(row, rowIndex);
    const resolved = resolveTableRowStrategyInlineStyle(rowStrategyResult?.style);
    rowCache.set(rowIndex, resolved);
    return resolved;
  };

  (merged as Record<string, any>).rowClassName = (params: Record<string, any>) => {
    const sourceClassName = typeof sourceRowClassName === 'function'
      ? sourceRowClassName(params)
      : sourceRowClassName;
    const row = (params?.row ?? {}) as Record<string, any>;
    const rowIndex =
      typeof params?.rowIndex === 'number'
        ? params.rowIndex
        : typeof params?._rowIndex === 'number'
          ? params._rowIndex
          : -1;
    const rowStrategyResult = resolveRowStrategy(row, rowIndex);
    return [
      sourceClassName,
      hasTableRowStrategyStyle(rowStrategyResult?.style)
        ? 'admin-table__row--strategy'
        : '',
      rowStrategyResult?.className,
    ]
      .filter(Boolean)
      .join(' ');
  };

  (merged as Record<string, any>).rowStyle = (params: Record<string, any>) => {
    const sourceStyle = typeof sourceRowStyle === 'function'
      ? sourceRowStyle(params)
      : sourceRowStyle;
    const row = (params?.row ?? {}) as Record<string, any>;
    const rowIndex =
      typeof params?.rowIndex === 'number'
        ? params.rowIndex
        : typeof params?._rowIndex === 'number'
          ? params._rowIndex
          : -1;
    const strategyInlineStyle = resolveRowStrategyInlineStyleCached(
      row,
      rowIndex
    );
    return {
      ...((sourceStyle as Record<string, any> | undefined) ?? {}),
      ...((strategyInlineStyle ?? {}) as Record<string, any>),
    };
  };

  const mode = selectionMode.value;
  const selectedKeys = controlledSelectedRowKeys.value;
  const defaultKeys = defaultSelectedRowKeys.value;

  if (mode === 'checkbox') {
    const checkboxConfig = {
      ...((merged as Record<string, any>).checkboxConfig ?? {}),
    } as Record<string, any>;
    if (
      typeof checkboxConfig.checkField !== 'string' &&
      selectionCheckField.value
    ) {
      checkboxConfig.checkField = selectionCheckField.value;
    }
    if (
      typeof checkboxConfig.checkMethod !== 'function' &&
      selectionCheckMethod.value
    ) {
      checkboxConfig.checkMethod = selectionCheckMethod.value;
    }
    if (
      (checkboxConfig.trigger === null ||
        checkboxConfig.trigger === undefined ||
        checkboxConfig.trigger === '') &&
      selectionTrigger.value
    ) {
      checkboxConfig.trigger = selectionTrigger.value;
    }
    if (typeof checkboxConfig.highlight !== 'boolean') {
      checkboxConfig.highlight = selectionHighlight.value ?? true;
    }
    if (
      typeof checkboxConfig.strict !== 'boolean' &&
      typeof selectionStrict.value === 'boolean'
    ) {
      checkboxConfig.strict = selectionStrict.value;
    }
    if (Array.isArray(selectedKeys)) {
      checkboxConfig.checkRowKeys = selectedKeys;
    } else if (
      (!Array.isArray(checkboxConfig.checkRowKeys) ||
        checkboxConfig.checkRowKeys.length <= 0) &&
      defaultKeys.length > 0
    ) {
      checkboxConfig.checkRowKeys = defaultKeys;
    }
    (merged as Record<string, any>).checkboxConfig = checkboxConfig;
  } else if (mode === 'radio') {
    const radioConfig = {
      ...((merged as Record<string, any>).radioConfig ?? {}),
    } as Record<string, any>;
    if (
      typeof radioConfig.checkMethod !== 'function' &&
      selectionCheckMethod.value
    ) {
      radioConfig.checkMethod = selectionCheckMethod.value;
    }
    if (
      (radioConfig.trigger === null ||
        radioConfig.trigger === undefined ||
        radioConfig.trigger === '') &&
      selectionTrigger.value
    ) {
      radioConfig.trigger = selectionTrigger.value;
    }
    if (typeof radioConfig.highlight !== 'boolean') {
      radioConfig.highlight = selectionHighlight.value ?? true;
    }
    if (
      typeof radioConfig.strict !== 'boolean' &&
      typeof selectionStrict.value === 'boolean'
    ) {
      radioConfig.strict = selectionStrict.value;
    }
    if (Array.isArray(selectedKeys)) {
      radioConfig.checkRowKey = selectedKeys[0];
    } else if (
      (radioConfig.checkRowKey === null ||
        radioConfig.checkRowKey === undefined ||
        radioConfig.checkRowKey === '') &&
      defaultKeys.length > 0
    ) {
      radioConfig.checkRowKey = defaultKeys[0];
    }
    (merged as Record<string, any>).radioConfig = radioConfig;
  }

  if (bodyScrollLockEnabled.value) {
    const hasStateHeight = Object.prototype.hasOwnProperty.call(
      stateGridOptionsRecord,
      'height'
    );
    const hasStateMaxHeight = Object.prototype.hasOwnProperty.call(
      stateGridOptionsRecord,
      'maxHeight'
    );
    const measuredHeight = autoBodyScrollHeight.value;
    if (
      typeof measuredHeight === 'number'
      && Number.isFinite(measuredHeight)
      && measuredHeight > 0
    ) {
      const normalizedMeasuredHeight = Math.max(
        1,
        Math.floor(measuredHeight)
      );
      const explicitHeight = resolveExplicitPixelHeight(
        (stateGridOptionsRecord as Record<string, any>).height
      );
      (merged as Record<string, any>).height =
        typeof explicitHeight === 'number'
          ? Math.max(
            1,
            Math.floor(Math.min(explicitHeight, normalizedMeasuredHeight))
          )
          : normalizedMeasuredHeight;
      delete (merged as Record<string, any>).maxHeight;
    } else if (!hasStateHeight && !hasStateMaxHeight) {
      (merged as Record<string, any>).height = '100%';
      delete (merged as Record<string, any>).maxHeight;
    } else if (!hasStateMaxHeight) {
      delete (merged as Record<string, any>).maxHeight;
    }
  }

  delete (merged as Record<string, any>).seqColumn;

  return extendProxyOptions(merged as Record<string, any>, () => {
    return formApi.getLatestSubmissionValues?.() ?? {};
  });
});

/**
 * 解析运行时网格事件配置。
 */
const runtimeGridEvents = computed(() => {
  return (state.value.gridEvents ?? {}) as Record<string, any>;
});

/**
 * 选中行扁平化缓存的源数据引用
 * @description 用于判断源数据是否变化，从而决定是否复用缓存。
 */
let flattenedSelectionRowsSource: null | Array<Record<string, any>> = null;
/**
 * 选中行扁平化缓存结果
 * @description 复用 flatten 结果，降低频繁读取时的计算开销。
 */
let flattenedSelectionRowsCache: Array<Record<string, any>> = EMPTY_TABLE_ROWS;
/**
 * 缓存扁平化后的可选行集合。
 * @description 当源数据引用不变时复用上次展开结果，减少重复 flatten 计算。
 */
const flattenedSelectionRows = computed(() => {
  const sourceRows = stateGridRows.value;
  if (flattenedSelectionRowsSource === sourceRows) {
    return flattenedSelectionRowsCache;
  }
  flattenedSelectionRowsSource = sourceRows;
  flattenedSelectionRowsCache = sourceRows.length > 0
    ? flattenTableRows(sourceRows)
    : sourceRows;
  return flattenedSelectionRowsCache;
});

/**
 * 获取扁平化后的可选行集合。
 *
 * @returns 当前可选行数组。
 */
function getSelectionRows() {
  return flattenedSelectionRows.value;
}

/**
 * 基于行数据提取选中键集合。
 *
 * @param rows 待提取的行数据。
 * @returns 归一化后的选中键数组。
 */
function getSelectionKeysByRows(rows: Array<Record<string, any>>) {
  return collectSelectionKeysByRows<
    Record<string, any>,
    TableSelectionKey
  >(rows, {
    keyField: selectionRowKeyField.value,
    mode: selectionMode.value,
  });
}

/**
 * 将选中状态同步到 `checkField` 字段，保证数据层与组件选中状态一致。
 *
 * @param keys 当前选中键集合。
 * @returns 无返回值。
 */
function applySelectionCheckField(keys: TableSelectionKey[]) {
  const checkField = selectionCheckField.value;
  if (!checkField) {
    return;
  }
  const rowKeyField = selectionRowKeyField.value;
  const sourceRows = stateGridRows.value;
  if (sourceRows.length <= 0) {
    return;
  }
  const nextRows = applySelectionCheckFieldToRows(sourceRows, {
    checkField,
    keyField: rowKeyField,
    selectedKeys: keys,
  });
  if (nextRows.changed) {
    props.api.setGridOptions({
      data: nextRows.rows as any,
    });
  }
}

/**
 * 统一更新选中状态，并向外触发 onChange 回调。
 *
 * @param keys 新的选中键集合。
 * @param params 表格事件参数。
 * @returns 无返回值。
 */
function updateSelectionState(
  keys: TableSelectionKey[],
  params?: Record<string, any>
) {
  const mode = selectionMode.value;
  const resolved = resolveTableSelectionChange<
    Record<string, any>,
    TableSelectionKey
  >({
    keys,
    mode,
    rowKeyField: selectionRowKeyField.value,
    rows: getSelectionRows(),
  });
  if (!resolved) {
    return;
  }
  const alignedKeys = resolved.alignedKeys;
  if (!controlledSelectedRowKeys.value) {
    if (!deepEqual(innerSelectedRowKeys.value, alignedKeys)) {
      innerSelectedRowKeys.value = alignedKeys;
    }
  } else {
    void nextTick(() => syncGridSelectionFromState());
  }
  if (mode === 'radio' && selectionCheckField.value) {
    applySelectionCheckField(alignedKeys);
  }
  const onChange = rowSelectionConfig.value?.onChange;
  if (typeof onChange === 'function') {
    onChange(
      alignedKeys,
      resolved.selectedRows,
      params
    );
  }
}

/**
 * 处理单选模式下的选择变更。
 *
 * @param params VxeTable 单选事件参数。
 * @returns 无返回值。
 */
function handleSelectionRadioChange(params: Record<string, any>) {
  if (syncingSelectionFromState) {
    return;
  }
  const selectedRow =
    gridRef.value?.getRadioRecord?.(true) ??
    params?.row ??
    null;
  const keyField = selectionRowKeyField.value;
  const rowKey = selectedRow?.[keyField];
  const keys =
    rowKey === null || rowKey === undefined
      ? []
      : [rowKey as TableSelectionKey];
  updateSelectionState(keys, params);
}

/**
 * 处理多选模式下的选择变更。
 *
 * @param params VxeTable 多选事件参数。
 * @returns 无返回值。
 */
function handleSelectionCheckboxChange(params: Record<string, any>) {
  if (syncingSelectionFromState) {
    return;
  }
  const records = Array.isArray(params?.records)
    ? (params.records as Array<Record<string, any>>)
    : (gridRef.value?.getCheckboxRecords?.(true) as Array<Record<string, any>> | undefined) ?? [];
  updateSelectionState(getSelectionKeysByRows(records), params);
}

/**
 * 根据受控选中键将选择状态回写到 VxeGrid 实例。
 * @returns 无返回值。
 */
async function syncGridSelectionFromState() {
  const grid = gridRef.value as any;
  const mode = selectionMode.value;
  if (!grid || !mode) {
    return;
  }
  const controlledKeys = controlledSelectedRowKeys.value;
  if (!Array.isArray(controlledKeys)) {
    return;
  }
  const keys = normalizeTableSelectionKeys<TableSelectionKey>(controlledKeys, mode);
  const keySet = createTableComparableSelectionKeySet(keys);
  const rows = getSelectionRows();
  const keyField = selectionRowKeyField.value;

  syncingSelectionFromState = true;
  try {
    if (mode === 'radio') {
      const selectedKey = keys[0];
      if (selectedKey !== null && selectedKey !== undefined) {
        if (typeof grid.setRadioRowKey === 'function') {
          await grid.setRadioRowKey(selectedKey);
        } else {
          const selectedRow = rows.find((row) =>
            keySet.has(
              toTableComparableSelectionKey(row?.[keyField] as TableSelectionKey) ?? ''
            )
          );
          if (selectedRow) {
            await grid.setRadioRow?.(selectedRow);
          } else {
            await grid.clearRadioRow?.();
          }
        }
      } else {
        await grid.clearRadioRow?.();
      }
      return;
    }

    await grid.clearCheckboxRow?.();
    if (keys.length <= 0) {
      return;
    }
    if (typeof grid.setCheckboxRowKey === 'function') {
      await grid.setCheckboxRowKey(keys, true);
      return;
    }
    const selectedRows = rows.filter((row) =>
      keySet.has(
        toTableComparableSelectionKey(row?.[keyField] as TableSelectionKey) ?? ''
      )
    );
    if (selectedRows.length > 0 && typeof grid.setCheckboxRow === 'function') {
      await grid.setCheckboxRow(selectedRows, true);
    }
  } finally {
    syncingSelectionFromState = false;
  }
}

/**
 * 汇总 VxeGrid 事件处理器。
 * @description 统一桥接分页、选择、单元格策略和原始事件回调。
 */
const gridEvents = computed(() => {
  const source = runtimeGridEvents.value;
  const baseGridOptionsRecord = baseGridOptions.value as Record<string, any>;
  const sourceGridOptionsRecord = sourceGridOptions.value as Record<string, any>;
  const next = {
    ...source,
  } as Record<string, any>;
  delete next.onPageChange;
  delete next.onPageSizeChange;
  delete next.onPaginationChange;
  const sourceRadioChange = source.radioChange;
  const sourceCheckboxChange = source.checkboxChange;
  const sourceCheckboxAll = source.checkboxAll;
  const sourceCellClick = source.cellClick;
  const sourcePageChange = source.pageChange;
  const sourceRowClick = source.rowClick;

  /**
   * 处理单选变化事件，先同步内部选中态再透传原事件处理器。
   *
   * @param params VxeTable 事件参数。
   * @returns 无返回值。
   */
  next.radioChange = (params: Record<string, any>) => {
    handleSelectionRadioChange(params);
    if (typeof sourceRadioChange === 'function') {
      sourceRadioChange(params);
    }
  };
  /**
   * 处理多选变化事件（单项勾选），并透传原事件处理器。
   *
   * @param params VxeTable 事件参数。
   * @returns 无返回值。
   */
  next.checkboxChange = (params: Record<string, any>) => {
    handleSelectionCheckboxChange(params);
    if (typeof sourceCheckboxChange === 'function') {
      sourceCheckboxChange(params);
    }
  };
  /**
   * 处理多选全选/全不选事件，并透传原事件处理器。
   *
   * @param params VxeTable 事件参数。
   * @returns 无返回值。
   */
  next.checkboxAll = (params: Record<string, any>) => {
    handleSelectionCheckboxChange(params);
    if (typeof sourceCheckboxAll === 'function') {
      sourceCheckboxAll(params);
    }
  };
  /**
   * 处理单元格点击事件，优先执行单元格策略点击逻辑，再透传原事件。
   *
   * @param params VxeTable 事件参数。
   * @returns 无返回值。
   */
  next.cellClick = (params: Record<string, any>) => {
    const row = (params?.row ?? {}) as Record<string, any>;
    const rowIndex =
      typeof params?.rowIndex === 'number'
        ? params.rowIndex
        : typeof params?._rowIndex === 'number'
          ? params._rowIndex
          : -1;
    const field = String(
      params?.column?.field ??
      params?.column?.property ??
      params?.column?.dataIndex ??
      ''
    );
    if (field) {
      const column = (params?.column ?? {}) as Record<string, any>;
      const strategyResult = resolveTableCellStrategyResult({
        column,
        field,
        gridOptions: baseGridOptionsRecord,
        row,
        rowIndex,
        value: Object.prototype.hasOwnProperty.call(params ?? {}, 'cellValue')
          ? params.cellValue
          : getColumnValueByPath(row, field),
      });
      const triggerResult = triggerTableCellStrategyClick({
        column,
        event: params?.$event ?? params?.event,
        field,
        respectDefaultPrevented: false,
        row,
        rowIndex,
        strategyResult,
      });
      if (triggerResult.blocked) {
        return;
      }
    }
    if (typeof sourceCellClick === 'function') {
      sourceCellClick(params);
    }
  };
  /**
   * 处理行点击事件，优先执行行策略点击逻辑，再透传原事件。
   *
   * @param params VxeTable 事件参数。
   * @returns 无返回值。
   */
  next.rowClick = (params: Record<string, any>) => {
    const row = (params?.row ?? {}) as Record<string, any>;
    const rowIndex =
      typeof params?.rowIndex === 'number'
        ? params.rowIndex
        : typeof params?._rowIndex === 'number'
          ? params._rowIndex
          : -1;
    const rowStrategyResult = resolveTableRowStrategyResult({
      gridOptions: baseGridOptionsRecord,
      row,
      rowIndex,
    });
    const triggerResult = triggerTableRowStrategyClick({
      event: params?.$event ?? params?.event,
      respectDefaultPrevented: false,
      row,
      rowIndex,
      strategyResult: rowStrategyResult,
    });
    if (triggerResult.blocked) {
      return;
    }
    if (typeof sourceRowClick === 'function') {
      sourceRowClick(params);
    }
  };
  /**
   * 处理分页变化事件，同步分页状态并派发统一分页回调。
   *
   * @param params VxeTable 分页事件参数。
   * @returns 无返回值。
   */
  next.pageChange = (params: Record<string, any>) => {
    const eventCurrentPageRaw = params?.currentPage ?? params?.page?.currentPage;
    const eventCurrentPage = Number(eventCurrentPageRaw);
    if (
      resetPageSizeToFirstPending.value &&
      params?.type === 'current' &&
      Number.isFinite(eventCurrentPage) &&
      eventCurrentPage === 1
    ) {
      resetPageSizeToFirstPending.value = false;
      if (typeof sourcePageChange === 'function') {
        sourcePageChange(params);
      }
      return;
    }

    const currentPageRaw =
      params?.currentPage ??
      params?.page?.currentPage ??
      sourceGridOptionsRecord?.pagerConfig?.currentPage ??
      1;
    const pageSizeRaw =
      params?.pageSize ??
      params?.page?.pageSize ??
      sourceGridOptionsRecord?.pagerConfig?.pageSize ??
      20;
    const sourceTotalRaw = sourceGridOptionsRecord?.pagerConfig?.total;
    const eventTotalRaw = params?.total ?? params?.page?.total;
    const eventTotal = Number(eventTotalRaw);
    const sourceTotal = Number(sourceTotalRaw);
    const hasProxyPagination = isProxyEnabled(
      sourceGridOptionsRecord?.proxyConfig as Record<string, any>
    );
    const totalRaw =
      !hasProxyPagination &&
      Number.isFinite(eventTotal) &&
      eventTotal <= 0 &&
      Number.isFinite(sourceTotal) &&
      sourceTotal > 0
        ? sourceTotalRaw
        : (eventTotalRaw ?? sourceTotalRaw);
    const currentPage = Number(currentPageRaw);
    const pageSize = Number(pageSizeRaw);
    const total = Number(totalRaw);
    const normalizedCurrentPage = Number.isFinite(currentPage) ? currentPage : 1;
    const normalizedPageSize = Number.isFinite(pageSize) ? pageSize : 20;
    const shouldResetToFirstOnPageSizeChange =
      params?.type === 'size' &&
      resetToFirstOnPageSizeChange.value === true &&
      normalizedCurrentPage !== 1;
    const nextCurrentPage = shouldResetToFirstOnPageSizeChange
      ? 1
      : normalizedCurrentPage;
    const payload: AdminTablePaginationChangePayload = {
      currentPage: nextCurrentPage,
      pageSize: normalizedPageSize,
      raw: params,
      source: 'vue',
      total: Number.isFinite(total) ? total : undefined,
      type: params?.type === 'size' ? 'size' : 'current',
    };

    const sourcePagerConfig = (sourceGridOptionsRecord?.pagerConfig ??
      {}) as Record<string, any>;
    const sourceCurrentPage = Number(sourcePagerConfig.currentPage);
    const sourcePageSize = Number(sourcePagerConfig.pageSize);
    const sourcePagerTotal = Number(sourcePagerConfig.total);
    const shouldSyncPagerConfig =
      !Number.isFinite(sourceCurrentPage) ||
      sourceCurrentPage !== nextCurrentPage ||
      !Number.isFinite(sourcePageSize) ||
      sourcePageSize !== normalizedPageSize ||
      (Number.isFinite(total) &&
        (!Number.isFinite(sourcePagerTotal) || sourcePagerTotal !== total));
    if (shouldSyncPagerConfig) {
      const pagerConfigPatch: Record<string, any> = {
        currentPage: nextCurrentPage,
        pageSize: normalizedPageSize,
      };
      if (Number.isFinite(total)) {
        pagerConfigPatch.total = total;
      }
      props.api.setGridOptions({
        pagerConfig: pagerConfigPatch as any,
      });
    }

    runtimeGridEvents.value?.onPageChange?.(payload);
    runtimeGridEvents.value?.onPaginationChange?.(payload);

    if (payload.type === 'size') {
      runtimeGridEvents.value?.onPageSizeChange?.(payload);
    }

    if (shouldResetToFirstOnPageSizeChange) {
      const grid = gridRef.value as Record<string, any> | undefined;
      if (typeof grid?.setCurrentPage === 'function') {
        resetPageSizeToFirstPending.value = true;
        void Promise.resolve(grid.setCurrentPage(1))
          .catch(() => undefined)
          .finally(() => {
            if (resetPageSizeToFirstPending.value) {
              resetPageSizeToFirstPending.value = false;
            }
          });
      }
    }

    if (typeof sourcePageChange === 'function') {
      sourcePageChange(params);
    }
  };

  return next as VxeGridListeners;
});

watch(
  selectionMode,
  (nextMode, prevMode) => {
    if (nextMode !== prevMode) {
      hasAppliedDefaultSelection = false;
    }
    if (!nextMode) {
      innerSelectedRowKeys.value = [];
    }
  },
  { immediate: true }
);

watch(
  [
    stateGridRows,
    selectionCheckField,
    selectionMode,
    controlledSelectedRowKeys,
    defaultSelectedRowKeys,
    selectionRowKeyField,
  ],
  ([
    _rows,
    checkField,
    mode,
    controlledKeys,
    defaultKeys,
    rowKeyField,
  ]) => {
    if (!mode) {
      if (innerSelectedRowKeys.value.length > 0) {
        innerSelectedRowKeys.value = [];
      }
      hasAppliedDefaultSelection = false;
      return;
    }
    if (Array.isArray(controlledKeys)) {
      if (!deepEqual(innerSelectedRowKeys.value, controlledKeys)) {
        innerSelectedRowKeys.value = controlledKeys;
      }
      hasAppliedDefaultSelection = true;
      return;
    }
    if (checkField) {
      const derivedKeys = collectSelectionKeysByField(
        getSelectionRows(),
        {
          checkField,
          keyField: rowKeyField,
          mode,
        }
      );
      if (!deepEqual(innerSelectedRowKeys.value, derivedKeys)) {
        innerSelectedRowKeys.value = derivedKeys;
      }
      hasAppliedDefaultSelection = true;
      return;
    }
    if (!hasAppliedDefaultSelection) {
      if (
        defaultKeys.length > 0 &&
        !deepEqual(innerSelectedRowKeys.value, defaultKeys)
      ) {
        innerSelectedRowKeys.value = defaultKeys;
      }
      hasAppliedDefaultSelection = true;
    }
  },
  { immediate: true }
);

watch(
  [
    () => gridRef.value,
    stateGridRows,
    effectiveSelectedRowKeys,
    selectionMode,
    selectionRowKeyField,
  ],
  () => {
    void nextTick(() => syncGridSelectionFromState());
  },
  { flush: 'post', immediate: true }
);

watch(
  [() => gridRef.value, stateGridRows],
  () => {
    void nextTick(syncRuntimeFilterRows);
  },
  { flush: 'post', immediate: true }
);

/**
 * 获取当前生效的列自定义状态快照。
 *
 * @returns 当前列可见性、固定、排序与顺序配置。
 */
function getCurrentColumnCustomState() {
  return {
    filterable: filterableColumns.value,
    fixed: fixedColumns.value,
    order: columnOrder.value,
    sortable: sortableColumns.value,
    visible: visibleColumns.value,
  };
}

/**
 * 获取列自定义面板中的草稿状态。
 *
 * @returns 面板草稿的列配置快照。
 */
function getDraftColumnCustomState() {
  return {
    filterable: customDraftFilterableColumns.value,
    fixed: customDraftFixedColumns.value,
    order: customDraftOrder.value,
    sortable: customDraftSortableColumns.value,
    visible: customDraftVisibleColumns.value,
  };
}

/**
 * 应用列自定义“当前态”快照到运行时状态。
 *
 * @param snapshot 待应用的快照。
 * @returns 无返回值。
 */
function applyCurrentColumnCustomSnapshot(snapshot: ColumnCustomSnapshot) {
  if (!deepEqual(visibleColumns.value, snapshot.visible)) {
    visibleColumns.value = snapshot.visible;
  }
  if (!deepEqual(fixedColumns.value, snapshot.fixed)) {
    fixedColumns.value = snapshot.fixed;
  }
  if (!deepEqual(sortableColumns.value, snapshot.sortable)) {
    sortableColumns.value = snapshot.sortable;
  }
  if (!deepEqual(filterableColumns.value, snapshot.filterable)) {
    filterableColumns.value = snapshot.filterable;
  }
  if (!deepEqual(columnOrder.value, snapshot.order)) {
    columnOrder.value = snapshot.order;
  }
}

/**
 * 应用列自定义“草稿态”快照到面板状态。
 *
 * @param snapshot 待应用的草稿快照。
 * @returns 无返回值。
 */
function applyDraftColumnCustomSnapshot(snapshot: ColumnCustomSnapshot) {
  if (!deepEqual(customDraftVisibleColumns.value, snapshot.visible)) {
    customDraftVisibleColumns.value = snapshot.visible;
  }
  if (!deepEqual(customDraftFixedColumns.value, snapshot.fixed)) {
    customDraftFixedColumns.value = snapshot.fixed;
  }
  if (!deepEqual(customDraftOrder.value, snapshot.order)) {
    customDraftOrder.value = snapshot.order;
  }
  if (!deepEqual(customDraftSortableColumns.value, snapshot.sortable)) {
    customDraftSortableColumns.value = snapshot.sortable;
  }
  if (!deepEqual(customDraftFilterableColumns.value, snapshot.filterable)) {
    customDraftFilterableColumns.value = snapshot.filterable;
  }
}

watch(
  [sourceColumns, externalColumnCustomState],
  ([nextColumns, nextExternalState]) => {
    const snapshot = resolveColumnCustomWorkingSnapshot(nextColumns, {
      current: getCurrentColumnCustomState(),
      external: nextExternalState,
    });
    applyCurrentColumnCustomSnapshot(snapshot);
  },
  { immediate: true }
);

watch(
  [
    sourceColumns,
    customPanelOpen,
    visibleColumns,
    fixedColumns,
    columnOrder,
    sortableColumns,
    filterableColumns,
  ],
  () => {
    if (customPanelOpen.value) {
      return;
    }
    const snapshot = resolveColumnCustomOpenSnapshot(
      sourceColumns.value,
      getCurrentColumnCustomState()
    );
    applyDraftColumnCustomSnapshot(snapshot);
  },
  {
    immediate: true,
  }
);

/**
 * 列自定义面板控制项集合。
 */
const customColumnControls = computed(() => {
  return buildColumnCustomControls(sourceColumns.value, {
    filterable: customDraftFilterableColumns.value,
    fixed: customDraftFixedColumns.value,
    order: customDraftOrder.value,
    sortable: customDraftSortableColumns.value,
    visible: customDraftVisibleColumns.value,
  });
});
/** 列控制顺序摘要，用于驱动 FLIP 动画重排检测。 */
const customColumnControlOrderDigest = computed(() => {
  return createColumnCustomControlsOrderDigest(customColumnControls.value);
});

/** 列自定义面板是否“全选”。 */
const customAllChecked = computed(() => {
  return (
    customColumnControls.value.length > 0 &&
    customColumnControls.value.every((column) => column.checked)
  );
});

/** 列自定义面板是否处于半选态。 */
const customAllIndeterminate = computed(() => {
  return (
    customColumnControls.value.some((column) => column.checked) &&
    !customAllChecked.value
  );
});

/**
 * 列自定义草稿是否发生变更。
 */
const customPanelDirty = computed(() => {
  return hasColumnCustomDraftChanges(
    getDraftColumnCustomState(),
    customOriginState.value
  );
});

watch(
  [customColumnControlOrderDigest, customPanelOpen],
  async ([, open]) => {
    if (typeof window === 'undefined') {
      return;
    }

    if (!open) {
      customRowRects.clear();
      clearCustomMoveFrame();
      cancelCustomRowAnimation();
      resetColumnCustomFlipTransforms(Object.values(customRowRefs.value));
      return;
    }

    await nextTick();
    const controls = customColumnControls.value;

    const nextRects = collectColumnCustomFlipRects({
      controls,
      resolveNode: (key) => customRowRefs.value[key],
    });

    if (customRowRects.size > 0) {
      const flipOffsets = collectColumnCustomFlipOffsets({
        controls,
        draggingKey: customDraggingKey.value,
        nextRects,
        prevRects: customRowRects,
      });
      const movedNodes = applyColumnCustomFlipOffsets({
        offsets: flipOffsets,
        resolveNode: (key) => customRowRefs.value[key],
      });

      if (movedNodes.length > 0) {
        forceColumnCustomFlipReflow(movedNodes);

        cancelCustomRowAnimation();
        customRowAnimationFrame = window.requestAnimationFrame(() => {
          resetColumnCustomFlipTransforms(movedNodes);
          customRowAnimationFrame = null;
        });
      }
    }

    customRowRects = nextRects;
  },
  { flush: 'post' }
);

/**
 * 透传到 VxeGrid 的普通插槽名称集合。
 * @description 排除组件内部占用插槽，仅保留业务扩展插槽。
 */
const delegatedSlots = computed<string[]>(() => {
  return Object.keys(slots).filter(
    (name) =>
      ![
        'table-title',
        'toolbar-center',
        'toolbar-actions',
        'toolbar-tools',
        'pager-left',
        'pager-center',
        'pager-tools',
        'form',
        'empty',
        'loading',
      ].includes(name) && !name.startsWith('form-')
  );
});

/**
 * 透传到查询表单的插槽名称集合（去除 `form-` 前缀）。
 */
const delegatedFormSlots = computed<string[]>(() => {
  return Object.keys(slots)
    .filter((name) => name.startsWith('form-'))
    .map((name) => name.replace('form-', ''));
});

/**
 * 是否显示查询区分隔线。
 */
const showSeparator = computed(() => {
  return shouldShowSeparator({
    hasFormOptions: !!state.value.formOptions,
    separator: state.value.separator,
    showSearchForm: state.value.showSearchForm,
  });
});

/**
 * 查询区分隔线样式。
 */
const separatorStyle = computed(() => {
  return getSeparatorStyle(state.value.separator);
});

/**
 * 同步工具栏中部提示是否需要滚动播放。
 * @returns 无返回值。
 */
function syncToolbarHintOverflow() {
  const config = toolbarHintConfig.value;
  if (!resolveToolbarHintOverflowEnabled({ hasCenterSlot: hasToolbarCenterSlot.value, hint: config })) {
    toolbarHintShouldScroll.value = false;
    return;
  }
  const viewport = toolbarHintViewportRef.value;
  const textNode = toolbarHintTextRef.value;
  toolbarHintShouldScroll.value = resolveToolbarHintShouldScroll({
    hasCenterSlot: hasToolbarCenterSlot.value,
    hint: config,
    textScrollWidth: textNode?.scrollWidth,
    viewportClientWidth: viewport?.clientWidth,
  });
}

watch(
  () => [
    toolbarHintConfig.value?.align,
    toolbarHintConfig.value?.overflow,
    toolbarHintConfig.value?.speed,
    toolbarHintConfig.value?.text,
    hasToolbarCenterSlot.value,
    showToolbar.value,
  ],
  () => {
    void nextTick(syncToolbarHintOverflow);
  },
  { immediate: true }
);

/**
 * 同步分页区域提示文本是否需要滚动播放。
 * @returns 无返回值。
 */
function syncPagerHintOverflow() {
  const config = pagerHintConfig.value;
  if (!resolveToolbarHintOverflowEnabled({ hasCenterSlot: hasPagerCenterSlot.value, hint: config })) {
    pagerHintShouldScroll.value = false;
    return;
  }
  const viewport = pagerHintViewportRef.value;
  const textNode = pagerHintTextRef.value;
  pagerHintShouldScroll.value = resolveToolbarHintShouldScroll({
    hasCenterSlot: hasPagerCenterSlot.value,
    hint: config,
    textScrollWidth: textNode?.scrollWidth,
    viewportClientWidth: viewport?.clientWidth,
  });
}

watch(
  () => [
    hasPagerCenterSlot.value,
    pagerHintConfig.value?.align,
    pagerHintConfig.value?.overflow,
    pagerHintConfig.value?.speed,
    pagerHintConfig.value?.text,
    showPagerCenter.value,
  ],
  () => {
    void nextTick(syncPagerHintOverflow);
  },
  { immediate: true }
);

/**
 * 取消列自定义面板行动画帧。
 * @returns 无返回值。
 */
function cancelCustomRowAnimation() {
  if (typeof window !== 'undefined' && customRowAnimationFrame !== null) {
    window.cancelAnimationFrame(customRowAnimationFrame);
  }
  customRowAnimationFrame = null;
}

/**
 * 清理列拖拽重排调度帧与待处理移动任务。
 * @returns 无返回值。
 */
function clearCustomMoveFrame() {
  customPendingMove = null;
  if (typeof window !== 'undefined' && customMoveAnimationFrame !== null) {
    window.cancelAnimationFrame(customMoveAnimationFrame);
  }
  customMoveAnimationFrame = null;
}

/**
 * 重置列拖拽状态到初始值。
 * @returns 无返回值。
 */
function resetCustomDragState() {
  clearCustomMoveFrame();
  const nextState = createColumnCustomDragResetState();
  customDraggingKey.value = nextState.draggingKey;
  customDragHover.value = nextState.dragHover;
  customDragState.value = nextState.dragState;
}

/**
 * 维护列自定义行节点引用缓存。
 *
 * @param key 列键。
 * @param node 行节点。
 * @returns 无返回值。
 */
function setCustomRowRef(key: string, node: HTMLDivElement | null) {
  if (node) {
    customRowRefs.value[key] = node;
    return;
  }
  delete customRowRefs.value[key];
}

/**
 * 拖拽列时根据鼠标位置自动滚动自定义面板内容区。
 *
 * @param clientY 鼠标纵向坐标。
 * @returns 无返回值。
 */
function autoScrollCustomBody(clientY: number) {
  const body = customBodyRef.value;
  if (!body) {
    return;
  }
  const rect = body.getBoundingClientRect();
  if (rect.height <= 0) {
    return;
  }
  const nextScrollTop = resolveColumnCustomAutoScrollTop({
    clientY,
    containerBottom: rect.bottom,
    containerHeight: rect.height,
    containerTop: rect.top,
    scrollTop: body.scrollTop,
  });

  if (nextScrollTop !== body.scrollTop) {
    body.scrollTop = nextScrollTop;
  }
}

/**
 * 将列自定义快照写入存储并同步到表格列配置。
 *
 * @param snapshot 已确认的列快照。
 * @returns 无返回值。
 */
function applyDraftToGrid(snapshot: ColumnCustomSnapshot) {
  writeColumnCustomStateToStorage(columnCustomPersistenceConfig.value, snapshot);
  const nextColumns = buildColumnRuntimeItems(
    sourceColumns.value,
    snapshot,
    {
      includeVisibilityFlags: true,
    }
  ).map((item) => item.column);

  props.api.setGridOptions({
    columnCustomState: snapshot as any,
    columns: nextColumns as any,
  });
}

/**
 * 对外派发列自定义状态变化事件。
 *
 * @param action 触发动作。
 * @param snapshot 对应列快照。
 * @returns 无返回值。
 */
function emitColumnCustomChange(action: 'cancel' | 'confirm' | 'open' | 'reset', snapshot: ColumnCustomSnapshot) {
  runtimeGridEvents.value?.columnCustomChange?.(
    createColumnCustomChangePayload(
      sourceColumns.value,
      action,
      snapshot
    ) as any
  );
}

/**
 * 打开列自定义面板并初始化草稿态。
 * @returns 无返回值。
 */
function openCustomPanel() {
  const transition = resolveColumnCustomOpenTransition(
    sourceColumns.value,
    getCurrentColumnCustomState()
  );
  customOriginState.value = transition.origin;
  applyDraftColumnCustomSnapshot(transition.draft);
  resetCustomDragState();
  customPanelOpen.value = transition.panelOpen;

  runtimeGridEvents.value?.toolbarToolClick?.({
    code: 'custom',
  } as any);
  emitColumnCustomChange(transition.action, transition.snapshot);
}

/**
 * 取消列自定义修改并回退面板草稿态。
 * @returns 无返回值。
 */
function handleCustomCancel() {
  const transition = resolveColumnCustomCancelTransition(
    sourceColumns.value,
    {
      current: getCurrentColumnCustomState(),
      origin: customOriginState.value,
    }
  );
  applyDraftColumnCustomSnapshot(transition.draft);
  customPanelOpen.value = transition.panelOpen;
  resetCustomDragState();
  emitColumnCustomChange(transition.action, transition.snapshot);
}

/**
 * 确认列自定义修改并应用到表格。
 * @returns 无返回值。
 */
function handleCustomConfirm() {
  const transition = resolveColumnCustomConfirmTransition(
    sourceColumns.value,
    getDraftColumnCustomState()
  );
  customOriginState.value = transition.origin;
  applyCurrentColumnCustomSnapshot(transition.current);
  applyDraftToGrid(transition.snapshot);

  customPanelOpen.value = transition.panelOpen;
  resetCustomDragState();
  emitColumnCustomChange(transition.action, transition.snapshot);
}

/**
 * 重置列自定义配置到默认状态。
 * @returns 无返回值。
 */
function handleCustomReset() {
  if (!customPanelDirty.value) {
    return;
  }
  const confirmed = typeof window === 'undefined'
    ? true
    : window.confirm(localeText.value.customRestoreConfirm);
  if (!confirmed) {
    return;
  }

  const transition = resolveColumnCustomResetTransition(
    sourceColumns.value
  );
  customOriginState.value = transition.origin;
  applyDraftColumnCustomSnapshot(transition.draft);
  applyCurrentColumnCustomSnapshot(transition.current);
  applyDraftToGrid(transition.snapshot);

  customPanelOpen.value = transition.panelOpen;
  resetCustomDragState();
  emitColumnCustomChange(transition.action, transition.snapshot);
}

/**
 * 切换列自定义面板中的“全选/全不选”状态。
 * @returns 无返回值。
 */
function toggleCustomAllColumns() {
  const next = toggleAllColumnCustomVisible(
    sourceColumns.value,
    customDraftVisibleColumns.value
  );
  if (!deepEqual(customDraftVisibleColumns.value, next)) {
    customDraftVisibleColumns.value = next;
  }
}

/**
 * 切换指定列的可见状态。
 *
 * @param key 列键。
 * @returns 无返回值。
 */
function toggleCustomColumnVisibleByKey(key: string) {
  const next = toggleColumnCustomVisible(customDraftVisibleColumns.value, key);
  if (!deepEqual(customDraftVisibleColumns.value, next)) {
    customDraftVisibleColumns.value = next;
  }
}

/**
 * 切换指定列的固定位置。
 *
 * @param key 列键。
 * @param value 固定方向。
 * @returns 无返回值。
 */
function toggleCustomColumnFixedByKey(
  key: string,
  value: TableColumnFixedValue
) {
  const next = toggleColumnCustomFixed(customDraftFixedColumns.value, key, value);
  if (!deepEqual(customDraftFixedColumns.value, next)) {
    customDraftFixedColumns.value = next;
  }
}

/**
 * 切换指定列的可排序状态。
 *
 * @param key 列键。
 * @returns 无返回值。
 */
function toggleCustomColumnSortableByKey(key: string) {
  const next = toggleColumnCustomSortable(customDraftSortableColumns.value, key);
  if (!deepEqual(customDraftSortableColumns.value, next)) {
    customDraftSortableColumns.value = next;
  }
}

/**
 * 切换指定列的可筛选状态。
 *
 * @param key 列键。
 * @returns 无返回值。
 */
function toggleCustomColumnFilterableByKey(key: string) {
  const next = toggleColumnCustomFilterable(customDraftFilterableColumns.value, key);
  if (!deepEqual(customDraftFilterableColumns.value, next)) {
    customDraftFilterableColumns.value = next;
  }
}

/**
 * 执行列拖拽重排并更新草稿顺序。
 *
 * @param dragKey 被拖拽列键。
 * @param overKey 目标列键。
 * @param position 落点位置。
 * @returns 无返回值。
 */
function moveCustomColumnTo(
  dragKey: string,
  overKey: string,
  position: ColumnCustomDragPosition
) {
  const next = applyColumnCustomDragMove(
    sourceColumns.value,
    customDraftOrder.value,
    dragKey,
    overKey,
    position
  );
  if (!deepEqual(customDraftOrder.value, next)) {
    customDraftOrder.value = next;
  }
}

/**
 * 合并同帧列重排请求，减少拖拽过程中的重复计算。
 *
 * @param dragKey 被拖拽列键。
 * @param overKey 目标列键。
 * @param position 落点位置。
 * @returns 无返回值。
 */
function queueCustomMove(
  dragKey: string,
  overKey: string,
  position: ColumnCustomDragPosition
) {
  customPendingMove = {
    dragKey,
    overKey,
    position,
  };

  if (typeof window === 'undefined') {
    const pending = customPendingMove;
    customPendingMove = null;
    if (!pending) {
      return;
    }
    moveCustomColumnTo(pending.dragKey, pending.overKey, pending.position);
    return;
  }

  if (customMoveAnimationFrame !== null) {
    return;
  }

  customMoveAnimationFrame = window.requestAnimationFrame(() => {
    customMoveAnimationFrame = null;
    const pending = customPendingMove;
    customPendingMove = null;
    if (!pending) {
      return;
    }
    moveCustomColumnTo(pending.dragKey, pending.overKey, pending.position);
  });
}

/**
 * 处理列拖拽开始事件并初始化拖拽状态。
 *
 * @param key 被拖拽列键。
 * @param event 原始拖拽事件。
 * @returns 无返回值。
 */
function handleCustomDragStart(key: string, event: DragEvent) {
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', key);
  }

  const nextState = resolveColumnCustomDragStartState(key);
  customDraggingKey.value = nextState.draggingKey;
  customDragHover.value = nextState.dragHover;
  customDragState.value = nextState.dragState;
}

/**
 * 处理列拖拽经过目标行事件，计算拖拽悬停状态并调度重排。
 *
 * @param key 目标列键。
 * @param event 原始拖拽事件。
 * @returns 无返回值。
 */
function handleCustomDragOver(key: string, event: DragEvent) {
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }

  const dragKey = resolveColumnCustomDraggingKey(
    customDraggingKey.value,
    customDragState.value
  );
  if (!dragKey) {
    return;
  }

  const target = event.currentTarget as HTMLElement | null;
  if (!target) {
    return;
  }

  if (typeof event.clientY === 'number') {
    autoScrollCustomBody(event.clientY);
  }

  const rect = target.getBoundingClientRect();
  const nextState = resolveColumnCustomDragOverState({
    dragKey,
    offsetY: event.clientY - rect.top,
    overKey: key,
    previousHover: customDragHover.value,
    rowHeight: rect.height,
  });
  if (!nextState) {
    return;
  }

  if (!deepEqual(customDragState.value, nextState.dragState)) {
    customDragState.value = nextState.dragState;
  }

  if (!nextState.shouldQueueMove) {
    return;
  }

  customDragHover.value = nextState.dragHover;
  queueCustomMove(
    dragKey,
    key,
    nextState.dragState.position as ColumnCustomDragPosition
  );
}

/**
 * 处理自定义面板内容区拖拽经过事件，保持拖拽过程可自动滚动。
 *
 * @param event 原始拖拽事件。
 * @returns 无返回值。
 */
function handleCustomBodyDragOver(event: DragEvent) {
  const dragKey = resolveColumnCustomDraggingKey(
    customDraggingKey.value,
    customDragState.value
  );
  if (!dragKey) {
    return;
  }

  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }

  if (typeof event.clientY === 'number') {
    autoScrollCustomBody(event.clientY);
  }
}

/**
 * 处理列拖拽落下事件并清理拖拽状态。
 *
 * @param _key 目标列键（保留参数）。
 * @param event 原始拖拽事件。
 * @returns 无返回值。
 */
function handleCustomDrop(_key: string, event: DragEvent) {
  event.preventDefault();
  resetCustomDragState();
}

/**
 * 处理列拖拽结束事件。
 * @returns 无返回值。
 */
function handleCustomDragEnd() {
  resetCustomDragState();
}

/**
 * 切换列自定义面板显示状态。
 * @returns 无返回值。
 */
function toggleCustomPanel() {
  if (customPanelOpen.value) {
    handleCustomCancel();
    return;
  }
  openCustomPanel();
}

/**
 * 切换查询表单显示状态并触发工具栏点击事件。
 * @returns 无返回值。
 */
function handleSearchToggle() {
  props.api.toggleSearchForm();
  runtimeGridEvents.value?.toolbarToolClick?.({
    code: 'search',
  } as any);
}

/**
 * 解析当前分页导出所需的分页元信息。
 *
 * @returns 当前页、页大小与总数信息。
 */
function resolvePagerExportMeta() {
  const grid = gridRef.value as Record<string, any> | undefined;
  const pagerConfig = (gridOptions.value?.pagerConfig ??
    sourceGridOptions.value?.pagerConfig ??
    {}) as Record<string, any>;
  const proxyPager = grid?.getProxyInfo?.()?.pager as Record<string, any> | undefined;
  const currentPageRaw =
    grid?.getCurrentPage?.() ??
    proxyPager?.currentPage ??
    pagerConfig.currentPage ??
    1;
  const pageSizeRaw =
    grid?.getPageSize?.() ??
    proxyPager?.pageSize ??
    pagerConfig.pageSize ??
    20;
  const totalRaw = proxyPager?.total ?? pagerConfig.total;
  return resolveTablePagerExportPagination({
    currentPage: currentPageRaw,
    pageSize: pageSizeRaw,
    total: totalRaw,
  });
}

/**
 * 解析“当前页导出”时的行数据集合。
 *
 * @returns 当前页扁平化行数据。
 */
function resolveCurrentPageRowsForExport() {
  const grid = gridRef.value as Record<string, any> | undefined;
  const tableData = grid?.getTableData?.();
  if (Array.isArray(tableData?.tableData)) {
    return flattenTableRows(
      tableData.tableData as Array<Record<string, any>>
    );
  }
  return flattenTableRows(
    ((sourceGridOptions.value as Record<string, any>)?.data ??
      []) as Array<Record<string, any>>
  );
}

/**
 * 解析“选中导出”时的行数据集合。
 *
 * @param currentRows 当前页行数据，可选。
 * @returns 选中行数组。
 */
function resolveSelectedRowsForExport(
  currentRows?: Array<Record<string, any>>
) {
  const grid = gridRef.value as Record<string, any> | undefined;
  if (selectionMode.value === 'radio' && typeof grid?.getRadioRecord === 'function') {
    const row = grid.getRadioRecord();
    return row ? [row as Record<string, any>] : [];
  }
  if (selectionMode.value === 'checkbox' && typeof grid?.getCheckboxRecords === 'function') {
    const rows = grid.getCheckboxRecords();
    if (Array.isArray(rows)) {
      return flattenTableRows(rows as Array<Record<string, any>>);
    }
  }
  return resolveSelectionRowsByKeys(
    currentRows ?? resolveCurrentPageRowsForExport(),
    {
      keyField: selectionRowKeyField.value,
      selectedKeys: effectiveSelectedRowKeys.value,
    }
  );
}

/**
 * 处理分页导出动作并对外派发导出事件。
 *
 * @param action 导出动作配置。
 */
async function handlePagerExportAction(
  action: ResolvedTablePagerExportAction
) {
  if (action.disabled) {
    return;
  }
  const { currentPage, pageSize, total } = resolvePagerExportMeta();
  const currentPageRows = resolveCurrentPageRowsForExport();
  const selectedRows = action.type === 'selected'
    ? resolveSelectedRowsForExport(currentPageRows)
    : [];
  const allRows = action.type === 'all'
    ? flattenTableRows(
        ((sourceGridOptions.value as Record<string, any>)?.data ??
          []) as Array<Record<string, any>>
      )
    : [];
  const exportColumnsSource =
    ((gridOptions.value as Record<string, any>)?.columns ??
      []) as Array<Record<string, any>>;
  const result = await executeTablePagerExportAction({
    action,
    allRows,
    columns: exportColumnsSource,
    currentPage,
    currentRows: currentPageRows,
    exportAll: pagerExportConfig.value?.exportAll,
    fileNameFallback: state.value.tableTitle ?? 'table-export',
    missingAllHandlerMessage: localeText.value.exportAllMissingHandler,
    onMissingAllHandler: (message: string) => {
      console.warn(message);
    },
    pageSize,
    pagerFileName: pagerExportConfig.value?.fileName,
    selectedRowKeys: effectiveSelectedRowKeys.value,
    selectedRows,
    seqStart: action.type === 'current'
      ? (currentPage - 1) * pageSize
      : undefined,
    total,
  });
  if (!result.executed || !result.payload) {
    return;
  }

  runtimeGridEvents.value?.pagerExportClick?.(
    createPagerExportEventPayload({
      code: result.payload.type,
      currentPage: result.payload.currentPage,
      fileName: result.payload.fileName,
      pageSize: result.payload.pageSize,
      source: 'vue',
      total: result.payload.total,
    })
  );
  runtimeGridEvents.value?.toolbarToolClick?.({
    code: `pager-export-${result.payload.type}`,
    tool: action,
  } as any);
}

/**
 * 处理分页导出主按钮点击（单动作场景）。
 * @returns 无返回值。
 */
function handlePagerExportTriggerClick() {
  if (!pagerExportSingleAction.value) {
    return;
  }
  void handlePagerExportAction(pagerExportSingleAction.value);
}

/**
 * 调用 VxeGrid 的代理执行器并在完成后同步运行时状态。
 *
 * @param mode 代理执行模式。
 * @param params 查询参数。
 * @returns 代理执行结果。
 */
async function runCommitProxy(mode: 'query' | 'reload', params: Record<string, any>) {
  if (!gridRef.value?.commitProxy) {
    return undefined;
  }
  const result = await gridRef.value.commitProxy(mode, toRaw(params));
  await nextTick();
  syncRuntimeFilterRows();
  scheduleSyncBodyScrollHeight();
  return result;
}

/**
 * 处理内置工具栏按钮点击（刷新、全屏）。
 *
 * @param code 工具栏按钮编码。
 * @returns 无返回值。
 */
async function handleBuiltinToolClick(code: 'refresh' | 'zoom') {
  if (code === 'refresh') {
    const hasProxy = isProxyEnabled(gridOptions.value.proxyConfig as Record<string, any> | undefined);
    refreshing.value = true;
    try {
      if (hasProxy) {
        const values = formApi.getLatestSubmissionValues?.() ?? {};
        await props.api.query(values);
      } else {
        const nextData = [...((state.value.gridOptions?.data as any[]) ?? [])];
        props.api.setLoading(true);
        props.api.setGridOptions({
          data: nextData,
        });
        await new Promise((resolve) => {
          setTimeout(resolve, 220);
        });
        props.api.setLoading(false);
      }
    } finally {
      refreshing.value = false;
    }
  }

  if (code === 'zoom') {
    maximized.value = !maximized.value;
  }

  runtimeGridEvents.value?.toolbarToolClick?.({
    code,
  } as any);
}

/**
 * 处理自定义工具栏按钮点击。
 *
 * @param tool 工具配置。
 * @param index 工具索引。
 * @returns 无返回值。
 */
function handleCustomToolClick(tool: Record<string, any>, index: number) {
  if (tool?.disabled) {
    return;
  }
  triggerToolbarActionTool(tool, index, {
    onToolbarToolClick: (payload) => {
      runtimeGridEvents.value?.toolbarToolClick?.(payload as any);
    },
  });
}

/**
 * 处理操作列按钮点击。
 *
 * @param tool 操作工具配置。
 * @param index 工具索引。
 * @param row 当前行数据。
 * @param rowIndex 当前行索引。
 * @returns 无返回值。
 */
function handleOperationToolClick(
  tool: Record<string, any>,
  index: number,
  row: Record<string, any>,
  rowIndex: number
) {
  if (tool?.disabled) {
    return;
  }
  triggerOperationActionTool(tool, index, {
    onOperationToolClick: (payload) => {
      runtimeGridEvents.value?.operationToolClick?.(payload as any);
    },
    row,
    rowIndex,
  });
}

/**
 * 将权限配置转换为 Vue 指令元组，供 `withDirectives` 使用。
 *
 * @param tool 工具配置。
 * @returns 指令元组，不可渲染时返回 null。
 */
function toButtonDirectiveTuple(
  tool: ResolvedToolbarActionTool
): null | [any, any, any, Record<string, boolean>] {
  const permission = tool.permission;
  if (!permission) {
    return null;
  }
  const directiveName =
    typeof permission.name === 'string' && permission.name.trim().length > 0
      ? permission.name
      : 'access';
  const directive = appDirectives[directiveName];
  if (!directive) {
    return null;
  }
  const modifiers = {
    ...(permission.modifiers ?? {}),
  };
  if (
    !Object.prototype.hasOwnProperty.call(modifiers, 'and') &&
    !Object.prototype.hasOwnProperty.call(modifiers, 'or') &&
    (permission.mode === 'and' || permission.mode === 'or')
  ) {
    modifiers[permission.mode] = true;
  }
  return [
    directive,
    permission.value,
    permission.arg,
    modifiers,
  ];
}

/**
 * 判断工具项在当前权限上下文中是否可渲染。
 *
 * @param tool 工具配置。
 * @returns 是否可渲染。
 */
function canRenderToolbarActionTool(
  tool: null | Record<string, any> | undefined
) {
  return resolveToolbarToolVisibility(tool, {
    accessCodes: setupState.accessCodes,
    accessRoles: setupState.accessRoles,
    directiveRenderer: (candidate) =>
      !!toButtonDirectiveTuple(candidate as ResolvedToolbarActionTool),
    permissionChecker: setupState.permissionChecker,
    useDirectiveWhenNoAccess: true,
  });
}

/**
 * 工具栏动作按钮渲染组件
 * @description 统一封装权限判断、指令绑定与按钮展示态渲染。
 */
const ToolbarActionButton = defineComponent({
  name: 'AdminTableToolbarActionButton',
  props: {
    tool: {
      required: true,
      type: Object as any,
    },
  },
  /**
   * 工具栏动作按钮渲染逻辑。
   * @param buttonProps 组件属性。
   * @returns 渲染函数。
   */
  setup(buttonProps) {
    return () => {
      const tool = buttonProps.tool as ResolvedToolbarActionTool;
      if (!canRenderToolbarActionTool(tool)) {
        return null;
      }
      const { attrs, classList, disabled, presentation, title } =
        resolveToolbarActionButtonRenderState(tool);
      const iconNode = presentation.hasIcon
        ? h('i', {
            'aria-hidden': 'true',
            class: [
              'admin-table__toolbar-action-icon',
              presentation.iconClass,
            ],
          })
        : null;
      const textNode = presentation.text
        ? h(
            'span',
            {
              class: 'admin-table__toolbar-action-text',
            },
            presentation.text
          )
        : null;
      const children = [iconNode, textNode].filter(Boolean);
      const node = h(
        'button',
        {
          ...attrs,
          class: classList,
          disabled,
          title,
          type: 'button',
          /**
           * 触发工具栏动作按钮点击。
           */
          onClick: () => {
            handleCustomToolClick(tool, tool.index);
          },
        },
        children
      );

      const tuple = toButtonDirectiveTuple(tool);
      if (!tuple) {
        return node;
      }
      return withDirectives(node, [tuple]);
    };
  },
});

/**
 * 操作列动作按钮渲染组件
 * @description 为行级动作提供与工具栏一致的渲染与权限处理逻辑。
 */
const OperationActionButton = defineComponent({
  name: 'AdminTableOperationActionButton',
  props: {
    row: {
      required: true,
      type: Object as any,
    },
    rowIndex: {
      default: -1,
      type: Number,
    },
    tool: {
      required: true,
      type: Object as any,
    },
  },
  /**
   * 操作列动作按钮渲染逻辑。
   * @param buttonProps 组件属性。
   * @returns 渲染函数。
   */
  setup(buttonProps) {
    return () => {
      const tool = buttonProps.tool as ResolvedToolbarActionTool;
      if (!canRenderToolbarActionTool(tool)) {
        return null;
      }
      const { attrs, classList, disabled, presentation, title } =
        resolveToolbarActionButtonRenderState(tool);
      const iconNode = presentation.hasIcon
        ? h('i', {
            'aria-hidden': 'true',
            class: [
              'admin-table__toolbar-action-icon',
              presentation.iconClass,
            ],
          })
        : null;
      const textNode = presentation.text
        ? h(
            'span',
            {
              class: 'admin-table__toolbar-action-text',
            },
            presentation.text
          )
        : null;
      const children = [iconNode, textNode].filter(Boolean);
      const node = h(
        'button',
        {
          ...attrs,
          class: classList,
          disabled,
          title,
          type: 'button',
          /**
           * 触发操作列动作按钮点击，并阻止事件冒泡到行点击。
           *
           * @param event 鼠标事件。
           * @returns 无返回值。
           */
          onClick: (event: MouseEvent) => {
            event.stopPropagation();
            handleOperationToolClick(
              tool,
              tool.index,
              buttonProps.row as Record<string, any>,
              buttonProps.rowIndex
            );
          },
        },
        children
      );

      const tuple = toButtonDirectiveTuple(tool);
      if (!tuple) {
        return node;
      }
      return withDirectives(node, [tuple]);
    };
  },
});

/**
 * 处理文档点击，点击面板外区域时关闭列自定义面板。
 *
 * @param event 鼠标事件。
 * @returns 无返回值。
 */
function handleDocumentMouseDown(event: MouseEvent) {
  if (!customPanelOpen.value) {
    return;
  }
  const target = event.target as Node | null;
  if (!target) {
    return;
  }
  if (customPopoverRef.value?.contains(target)) {
    return;
  }
  if (customTriggerRef.value?.contains(target)) {
    return;
  }
  handleCustomCancel();
}

/**
 * 处理全局键盘事件，支持 `Escape` 关闭面板或退出全屏。
 *
 * @param event 键盘事件。
 * @returns 无返回值。
 */
function handleWindowKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape') {
    return;
  }

  if (customPanelOpen.value) {
    handleCustomCancel();
    return;
  }

  if (maximized.value) {
    maximized.value = false;
  }
}

/**
 * 监听全屏状态并同步页面滚动锁定。
 * @description 最大化时禁止 `body` 滚动，退出时恢复默认滚动行为。
 */
watch(maximized, (enabled) => {
  if (typeof document === 'undefined') {
    return;
  }
  document.body.style.overflow = enabled ? 'hidden' : '';
});

/**
 * 初始化表格实例挂载、执行器绑定与自动加载逻辑。
 * @returns 无返回值。
 */
async function initialize() {
  await nextTick();

  /**
   * 挂载核心表格 API。
   * @description 注入查询/重载执行器与表单 API，建立组件与 core 层桥接。
   */
  props.api.mount(gridRef.value, {
    executors: {
      query: ({ params }) => runCommitProxy('query', params),
      reload: ({ params }) => runCommitProxy('reload', params),
    },
    formApi,
  });

  const autoLoad = !!gridOptions.value.proxyConfig?.autoLoad;
  const enableProxy = !!gridOptions.value.proxyConfig?.enabled;

  if (autoLoad && enableProxy) {
    /**
     * 自动加载查询参数。
     * @description 存在查询表单时读取表单值，否则使用空参数对象。
     */
    const values = state.value.formOptions ? await formApi.getValues() : {};
    await runCommitProxy('query', values ?? {});
  }
}

/**
 * 组件挂载生命周期。
 * @description 负责注册全局监听、初始化尺寸观察器并启动首次数据加载。
 */
onMounted(() => {
  syncAdminTableVueWithPreferences();
  updateMobile();
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', updateMobile);
    window.addEventListener('keydown', handleWindowKeydown);
  }
  if (typeof document !== 'undefined') {
    document.addEventListener('mousedown', handleDocumentMouseDown);
  }
  if (typeof ResizeObserver !== 'undefined' && tableRootRef.value) {
    const observer = new ResizeObserver(() => {
      scheduleSyncBodyScrollHeight();
    });
    observer.observe(tableRootRef.value);
    const toolbarElement = tableRootRef.value.querySelector(
      '.admin-table__toolbar'
    ) as HTMLElement | null;
    const searchElement = tableRootRef.value.querySelector(
      '.admin-table__search'
    ) as HTMLElement | null;
    if (toolbarElement) {
      observer.observe(toolbarElement);
    }
    if (searchElement) {
      observer.observe(searchElement);
    }
    bodyScrollResizeObserver = observer;
  }
  scheduleSyncBodyScrollHeight();
  void initialize();
});

/**
 * 主体滚动高度观察器引用
 * @description 监听表格容器尺寸变化并触发滚动高度重算。
 */
let bodyScrollResizeObserver: null | ResizeObserver = null;

watch(
  () => {
    const gridOptions = (state.value.gridOptions ?? {}) as Record<string, any>;
    const dataLength = Array.isArray(gridOptions.data) ? gridOptions.data.length : 0;
    const pagerConfig = (gridOptions.pagerConfig ?? {}) as Record<string, any>;
    return [
      bodyScrollLockEnabled.value,
      state.value.showSearchForm,
      !!state.value.formOptions,
      dataLength,
      Number(pagerConfig.total ?? 0),
      Number(pagerConfig.pageSize ?? 0),
      Number(pagerConfig.currentPage ?? 0),
    ];
  },
  () => {
    scheduleSyncBodyScrollHeight();
  },
  { immediate: true }
);

/**
 * 组件卸载生命周期。
 * @description 释放事件监听、动画帧、观察器与状态订阅，避免内存泄漏。
 */
onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', updateMobile);
    window.removeEventListener('keydown', handleWindowKeydown);
  }
  if (typeof document !== 'undefined') {
    document.removeEventListener('mousedown', handleDocumentMouseDown);
    document.body.style.overflow = '';
  }
  cancelCustomRowAnimation();
  clearCustomMoveFrame();
  cleanupTableRuntimeApis({
    formApi,
    ownsFormApi: true,
    ownsTableApi: false,
    tableApi: props.api,
  });
  bodyScrollResizeObserver?.disconnect();
  bodyScrollResizeObserver = null;
  unsub();
});
</script>

<template>
  <div
    ref="tableRootRef"
    :class="[
      'admin-table',
      state.class,
      stripeConfig.enabled ? 'admin-table--striped' : '',
      stripeClassName,
      showPagerCenter ? 'admin-table--pager-has-center' : '',
      maximized ? 'admin-table--maximized' : '',
    ]"
    :style="runtimeRootStyle"
  >
    <div v-if="showToolbar" class="admin-table__toolbar">
      <div class="admin-table__toolbar-actions">
        <slot v-if="showTableTitle" name="table-title">
          <div class="admin-table__toolbar-title">
            <span>{{ state.tableTitle }}</span>
            <span
              v-if="state.tableTitleHelp"
              class="admin-table__toolbar-help"
              :title="state.tableTitleHelp"
              :aria-label="state.tableTitleHelp"
            >
              ?
            </span>
          </div>
        </slot>
        <div v-if="slots['toolbar-actions']" class="admin-table__toolbar-slot-content">
          <slot name="toolbar-actions" />
        </div>
      </div>

      <div
        v-if="showToolbarCenter"
        :class="[
          'admin-table__toolbar-center',
          toolbarHintPresentation.alignClass,
          toolbarHintPresentation.overflowClass,
        ]"
      >
        <div v-if="slots['toolbar-center']" class="admin-table__toolbar-center-slot">
          <slot name="toolbar-center" />
        </div>
        <div
          v-else-if="toolbarHintConfig"
          ref="toolbarHintViewportRef"
          class="admin-table__toolbar-hint-viewport"
        >
          <span
            ref="toolbarHintTextRef"
            :class="['admin-table__toolbar-hint-text', toolbarHintShouldScroll ? 'is-running' : '']"
            :style="toolbarHintPresentation.textStyle"
          >
            {{ toolbarHintConfig.text }}
          </span>
        </div>
      </div>

      <div class="admin-table__toolbar-tools">
        <ToolbarActionButton
          v-for="tool in toolbarToolsBeforeBuiltin"
          :key="`${tool?.code ?? tool?.title ?? 'tool'}-${tool.index}`"
          :tool="tool"
        />

        <div v-if="hasToolbarToolsSlotBeforeBuiltin" class="admin-table__toolbar-slot-content">
          <slot name="toolbar-tools" />
        </div>

        <button
          v-for="tool in builtinToolbarTools.filter((item) => item.code !== 'custom')"
          :key="`builtin-${tool.code}`"
          :class="[
            'admin-table__toolbar-tool-btn',
            tool.code === 'zoom' && maximized ? 'is-active' : '',
          ]"
          :title="tool.title"
          type="button"
          @click="() => handleBuiltinToolClick(tool.code as 'refresh' | 'zoom')"
        >
          <i
            v-if="tool.code === 'refresh'"
            class="admin-table__toolbar-tool-icon vxe-table-icon-repeat"
            :class="{ roll: refreshing }"
          />
          <i
            v-else-if="tool.code === 'zoom'"
            class="admin-table__toolbar-tool-icon"
            :class="maximized ? 'vxe-table-icon-minimize' : 'vxe-table-icon-fullscreen'"
          />
        </button>

        <div
          v-if="builtinToolbarTools.some((item) => item.code === 'custom')"
          class="admin-table__toolbar-custom-wrap"
        >
          <button
            ref="customTriggerRef"
            :class="['admin-table__toolbar-tool-btn', customPanelOpen ? 'is-active' : '']"
            :title="localeText.custom"
            type="button"
            @click="toggleCustomPanel"
          >
            <i class="admin-table__toolbar-tool-icon vxe-table-icon-custom-column" />
          </button>

          <div
            v-if="customPanelOpen"
            ref="customPopoverRef"
            class="admin-table__toolbar-custom-popover admin-table__toolbar-custom-popover-panel"
          >
            <div class="admin-table__toolbar-custom-panel">
              <div class="admin-table__toolbar-custom-header">
                <button
                  :class="[
                    'admin-table__toolbar-custom-checkbox',
                    customAllChecked ? 'is-checked' : '',
                    customAllIndeterminate ? 'is-indeterminate' : '',
                  ]"
                  type="button"
                  @click="toggleCustomAllColumns"
                >
                  <i
                    :class="[
                      'vxe-checkbox--icon',
                      customAllIndeterminate
                        ? 'vxe-table-icon-checkbox-indeterminate-fill'
                        : customAllChecked
                          ? 'vxe-table-icon-checkbox-checked-fill'
                          : 'vxe-table-icon-checkbox-unchecked',
                    ]"
                  />
                  <span class="vxe-checkbox--label">{{ localeText.customAll }}</span>
                </button>
              </div>

              <div
                ref="customBodyRef"
                :class="['admin-table__toolbar-custom-body', customDragState.dragKey ? 'is-dragging' : '']"
                @dragover="handleCustomBodyDragOver"
              >
                <div
                  v-for="column in customColumnControls"
                  :key="column.key"
                  :ref="(node) => setCustomRowRef(column.key, node as HTMLDivElement | null)"
                  :class="[
                    'admin-table__toolbar-custom-row',
                    customDragState.dragKey === column.key ? 'is-drag-origin' : '',
                    customDragState.overKey === column.key ? 'is-drag-over' : '',
                    customDragState.overKey === column.key && customDragState.position === 'top'
                      ? 'is-drag-over-top'
                      : '',
                    customDragState.overKey === column.key && customDragState.position === 'bottom'
                      ? 'is-drag-over-bottom'
                      : '',
                  ]"
                  @dragover="(event) => handleCustomDragOver(column.key, event as DragEvent)"
                  @drop="(event) => handleCustomDrop(column.key, event as DragEvent)"
                >
                  <div class="admin-table__toolbar-custom-main">
                    <button
                      :class="[
                        'admin-table__toolbar-custom-checkbox',
                        column.checked ? 'is-checked' : '',
                      ]"
                      type="button"
                      @click="() => toggleCustomColumnVisibleByKey(column.key)"
                    >
                      <i
                        :class="[
                          'vxe-checkbox--icon',
                          column.checked
                            ? 'vxe-table-icon-checkbox-checked-fill'
                            : 'vxe-table-icon-checkbox-unchecked',
                        ]"
                      />
                    </button>
                    <div class="admin-table__toolbar-custom-name-option">
                      <button
                        :class="[
                          'admin-table__toolbar-custom-sort-btn',
                          column.checked ? '' : 'is-disabled',
                        ]"
                        :disabled="!column.checked"
                        :draggable="column.checked"
                        :title="localeText.customMoveUp"
                        type="button"
                        @dragend="handleCustomDragEnd"
                        @dragstart="(event) => handleCustomDragStart(column.key, event as DragEvent)"
                      >
                        <i class="vxe-table-icon-drag-handle" />
                      </button>
                      <span class="admin-table__toolbar-custom-title">{{ column.title }}</span>
                    </div>
                  </div>

                  <div class="admin-table__toolbar-custom-fixed-option">
                    <button
                      :class="[
                        'admin-table__toolbar-custom-icon-btn',
                        column.sortable ? 'is-active' : '',
                      ]"
                      :disabled="!column.checked"
                      :title="localeText.customSort"
                      type="button"
                      @click="() => toggleCustomColumnSortableByKey(column.key)"
                    >
                      <i class="admin-table__toolbar-custom-icon-sort" />
                    </button>
                    <button
                      :class="[
                        'admin-table__toolbar-custom-icon-btn',
                        column.filterable ? 'is-active' : '',
                      ]"
                      :disabled="!column.checked"
                      :title="localeText.customFilter"
                      type="button"
                      @click="() => toggleCustomColumnFilterableByKey(column.key)"
                    >
                      <i class="admin-table__toolbar-custom-icon-filter" />
                    </button>
                    <button
                      :class="[
                        'admin-table__toolbar-custom-icon-btn',
                        column.fixed === 'left' ? 'is-active' : '',
                      ]"
                      :disabled="!column.checked"
                      :title="localeText.customFixedLeft"
                      type="button"
                      @click="() => toggleCustomColumnFixedByKey(column.key, 'left')"
                    >
                      <i
                        :class="
                          column.fixed === 'left'
                            ? 'vxe-table-icon-fixed-left-fill'
                            : 'vxe-table-icon-fixed-left'
                        "
                      />
                    </button>
                    <button
                      :class="[
                        'admin-table__toolbar-custom-icon-btn',
                        column.fixed === 'right' ? 'is-active' : '',
                      ]"
                      :disabled="!column.checked"
                      :title="localeText.customFixedRight"
                      type="button"
                      @click="() => toggleCustomColumnFixedByKey(column.key, 'right')"
                    >
                      <i
                        :class="
                          column.fixed === 'right'
                            ? 'vxe-table-icon-fixed-right-fill'
                            : 'vxe-table-icon-fixed-right'
                        "
                      />
                    </button>
                  </div>
                </div>
              </div>

              <div class="admin-table__toolbar-custom-footer">
                <button
                  class="admin-table__toolbar-custom-btn"
                  :disabled="!customPanelDirty"
                  type="button"
                  @click="handleCustomReset"
                >
                  {{ localeText.customReset }}
                </button>
                <button
                  class="admin-table__toolbar-custom-btn"
                  type="button"
                  @click="handleCustomCancel"
                >
                  {{ localeText.customCancel }}
                </button>
                <button
                  class="admin-table__toolbar-custom-btn is-primary"
                  type="button"
                  @click="handleCustomConfirm"
                >
                  {{ localeText.customConfirm }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <ToolbarActionButton
          v-for="tool in toolbarToolsAfterBuiltin"
          :key="`${tool?.code ?? tool?.title ?? 'tool'}-${tool.index}`"
          :tool="tool"
        />

        <div v-if="hasToolbarToolsSlotAfterBuiltin" class="admin-table__toolbar-slot-content">
          <slot name="toolbar-tools" />
        </div>

        <button
          v-if="showSearchButton"
          :class="['admin-table__toolbar-action-btn', state.showSearchForm ? 'is-primary' : '']"
          type="button"
          @click="handleSearchToggle"
        >
          {{ getSearchPanelToggleTitle(state.showSearchForm, localeText) }}
        </button>
      </div>
    </div>

    <div v-if="state.formOptions && state.showSearchForm !== false" class="admin-table__search">
      <slot name="form">
        <SearchForm>
          <template v-for="slotName in delegatedFormSlots" :key="slotName" #[slotName]="slotProps">
            <slot :name="`form-${slotName}`" v-bind="slotProps ?? {}" />
          </template>
          <template #reset-before="slotProps">
            <slot name="reset-before" v-bind="slotProps ?? {}" />
          </template>
          <template #submit-before="slotProps">
            <slot name="submit-before" v-bind="slotProps ?? {}" />
          </template>
          <template #expand-before="slotProps">
            <slot name="expand-before" v-bind="slotProps ?? {}" />
          </template>
          <template #expand-after="slotProps">
            <slot name="expand-after" v-bind="slotProps ?? {}" />
          </template>
        </SearchForm>
      </slot>
      <div v-if="showSeparator" class="admin-table__separator" :style="separatorStyle" />
    </div>

    <VxeGrid
      ref="gridRef"
      :class="['admin-table-vxe', state.gridClass]"
      v-bind="gridOptions"
      v-on="gridEvents"
    >
      <template v-for="slotName in delegatedSlots" :key="slotName" #[slotName]="slotProps">
        <slot :name="slotName" v-bind="slotProps" />
      </template>

      <template #__admin_table_pager_left>
        <div v-if="showPagerLeftArea" class="admin-table__pager-region is-left">
          <ToolbarActionButton
            v-for="tool in pagerLeftToolsBeforeSlot"
            :key="`${tool?.code ?? tool?.title ?? 'pager-left-tool'}-${tool.index}`"
            :tool="tool"
          />
          <div v-if="hasPagerLeftSlotBeforeTools" class="admin-table__toolbar-slot-content">
            <slot name="pager-left" />
          </div>
          <ToolbarActionButton
            v-for="tool in pagerLeftToolsAfterSlot"
            :key="`${tool?.code ?? tool?.title ?? 'pager-left-tool'}-${tool.index}`"
            :tool="tool"
          />
          <div
            v-if="hasPagerLeftSlotAfterTools || hasPagerLeftSlotReplaceTools"
            class="admin-table__toolbar-slot-content"
          >
            <slot name="pager-left" />
          </div>
        </div>
        <div v-if="showPagerCenter" class="admin-table__pager-region is-center">
          <div v-if="hasPagerCenterSlot" class="admin-table__toolbar-center-slot">
            <slot name="pager-center" />
          </div>
          <div
            v-else-if="pagerHintConfig"
            :class="[
              'admin-table__toolbar-center',
              'admin-table__pager-bar-center',
              pagerHintPresentation.alignClass,
              pagerHintPresentation.overflowClass,
            ]"
          >
            <div ref="pagerHintViewportRef" class="admin-table__toolbar-hint-viewport">
              <span
                ref="pagerHintTextRef"
                :class="['admin-table__toolbar-hint-text', pagerHintShouldScroll ? 'is-running' : '']"
                :style="pagerHintPresentation.textStyle"
              >
                {{ pagerHintConfig.text }}
              </span>
            </div>
          </div>
        </div>
      </template>

      <template #__admin_table_pager_right>
        <div v-if="showPagerRightArea" class="admin-table__pager-region is-right">
          <ToolbarActionButton
            v-for="tool in pagerRightToolsBeforeBuiltin"
            :key="`${tool?.code ?? tool?.title ?? 'pager-right-tool'}-${tool.index}`"
            :tool="tool"
          />
          <div v-if="hasPagerToolsSlotBeforeTools" class="admin-table__toolbar-slot-content">
            <slot name="pager-tools" />
          </div>
          <div v-if="showPagerExportInRight" class="admin-table__pager-export">
            <button
              class="admin-table__toolbar-tool-btn"
              :title="pagerExportConfig?.title || localeText.export"
              type="button"
              @click="handlePagerExportTriggerClick"
            >
              <i
                :class="[
                  'admin-table__toolbar-tool-icon',
                  pagerExportConfig?.icon || 'admin-table-icon-export',
                ]"
              />
            </button>
            <div
              v-if="showPagerExportMenu"
              class="admin-table__pager-export-menu"
            >
              <button
                v-for="action in pagerExportActions"
                :key="`pager-export-${action.type}-${action.index}`"
                class="admin-table__pager-export-item"
                :disabled="action.disabled"
                type="button"
                @click.stop="() => handlePagerExportAction(action)"
              >
                {{ action.title }}
              </button>
            </div>
          </div>
          <ToolbarActionButton
            v-for="tool in pagerRightToolsAfterBuiltin"
            :key="`${tool?.code ?? tool?.title ?? 'pager-right-tool'}-${tool.index}`"
            :tool="tool"
          />
          <div
            v-if="hasPagerToolsSlotAfterTools || hasPagerToolsSlotReplaceTools"
            class="admin-table__toolbar-slot-content"
          >
            <slot name="pager-tools" />
          </div>
        </div>
      </template>

      <template #__admin_table_operation="slotProps">
        <div
          :class="[
            'admin-table__operation-cell',
            resolveOperationCellAlignClass(operationColumnConfig?.align),
          ]"
        >
          <OperationActionButton
            v-for="tool in operationTools"
            :key="`${tool?.code ?? tool?.title ?? 'operation'}-${tool.index}`"
            :row="slotProps?.row ?? {}"
            :row-index="slotProps?.rowIndex ?? -1"
            :tool="tool"
          />
        </div>
      </template>

      <template #loading>
        <slot name="loading">
          <div class="admin-table__empty admin-table__empty--loading">Loading...</div>
        </slot>
      </template>

      <template #empty>
        <slot name="empty">
          <div class="admin-table__empty admin-table__empty--no-data">
            <svg
              aria-hidden="true"
              class="admin-table__empty-illustration"
              viewBox="0 0 88 72"
              xmlns="http://www.w3.org/2000/svg"
            >
              <ellipse cx="44" cy="62" rx="24" ry="6" fill="currentColor" opacity="0.1" />
              <rect x="16" y="18" width="56" height="38" rx="8" fill="currentColor" opacity="0.14" />
              <path
                d="M28 36h32v14a6 6 0 0 1-6 6H34a6 6 0 0 1-6-6V36Z"
                fill="currentColor"
                opacity="0.22"
              />
              <rect x="30" y="8" width="28" height="30" rx="4" fill="currentColor" opacity="0.28" />
              <path
                d="M36 16h16M36 22h16M36 28h10"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-width="2"
                opacity="0.75"
              />
              <circle cx="66" cy="14" r="7" fill="currentColor" opacity="0.18" />
              <circle cx="64" cy="14" r="1.5" fill="currentColor" opacity="0.8" />
              <circle cx="68" cy="14" r="1.5" fill="currentColor" opacity="0.8" />
            </svg>
            <span class="admin-table__empty-text">{{ localeText.noData }}</span>
          </div>
        </slot>
      </template>

      <template #empty-content>
        <slot name="empty">
          <div class="admin-table__empty admin-table__empty--no-data">
            <svg
              aria-hidden="true"
              class="admin-table__empty-illustration"
              viewBox="0 0 88 72"
              xmlns="http://www.w3.org/2000/svg"
            >
              <ellipse cx="44" cy="62" rx="24" ry="6" fill="currentColor" opacity="0.1" />
              <rect x="16" y="18" width="56" height="38" rx="8" fill="currentColor" opacity="0.14" />
              <path
                d="M28 36h32v14a6 6 0 0 1-6 6H34a6 6 0 0 1-6-6V36Z"
                fill="currentColor"
                opacity="0.22"
              />
              <rect x="30" y="8" width="28" height="30" rx="4" fill="currentColor" opacity="0.28" />
              <path
                d="M36 16h16M36 22h16M36 28h10"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-width="2"
                opacity="0.75"
              />
              <circle cx="66" cy="14" r="7" fill="currentColor" opacity="0.18" />
              <circle cx="64" cy="14" r="1.5" fill="currentColor" opacity="0.8" />
              <circle cx="68" cy="14" r="1.5" fill="currentColor" opacity="0.8" />
            </svg>
            <span class="admin-table__empty-text">{{ localeText.noData }}</span>
          </div>
        </slot>
      </template>
    </VxeGrid>
  </div>
</template>
