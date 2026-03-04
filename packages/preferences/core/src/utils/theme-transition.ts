/**
 * 主题切换过渡动画工具。
 * @description 基于 View Transitions API 实现主题切换的扩散/收缩视觉效果。
 */

import { hasDocument, isBrowser } from './platform';

/**
 * 主题模式类型。
 */
type ThemeMode = 'light' | 'dark';

/**
 * View Transitions API 返回对象（最小子集）。
 */
type ViewTransition = {
  /** 过渡可开始动画时 resolve。 */
  ready: Promise<void>;
  /** 过渡整体完成时 resolve。 */
  finished: Promise<void>;
};

/** 指针坐标判定为“过期”的阈值（毫秒）。 */
const POINTER_IDLE_THRESHOLD = 2000;

/** 最近一次指针事件快照。 */
const pointerState = {
  x: 0,
  y: 0,
  time: 0,
};

/** 是否已完成指针追踪初始化。 */
let trackingInitialized = false;

/**
 * 主题切换动画起点坐标。
 */
interface ThemeTransitionOriginPoint {
  /** 动画起点 X 坐标。 */
  x: number;
  /** 动画起点 Y 坐标。 */
  y: number;
}

/**
 * 初始化指针位置追踪。
 * @description 记录最近一次 `pointerdown` 坐标，用于主题过渡动画起点计算。
 * @returns 无返回值。
 */
export function initThemeTransitionTracking(): void {
  if (!isBrowser || trackingInitialized) return;
  trackingInitialized = true;

  document.addEventListener(
    'pointerdown',
    (event) => {
      pointerState.x = event.clientX;
      pointerState.y = event.clientY;
      pointerState.time = Date.now();
    },
    { passive: true }
  );
}

/**
 * 获取主题切换动画起点。
 * 优先使用最近一次指针位置，超时后回退到视口中心。
 *
 * @returns 动画起点坐标。
 */
function getTransitionOrigin(): ThemeTransitionOriginPoint {
  if (!hasDocument) return { x: 0, y: 0 };

  const now = Date.now();
  if (pointerState.time && now - pointerState.time < POINTER_IDLE_THRESHOLD) {
    return { x: pointerState.x, y: pointerState.y };
  }

  return {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  };
}

/**
 * 执行主题切换过渡。
 * @param nextMode 目标主题模式。
 * @param apply 应用主题变更的回调。
 * @returns 无返回值。
 */
export function runThemeTransition(nextMode: ThemeMode, apply: () => void): void {
  if (!hasDocument) {
    apply();
    return;
  }

  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const documentWithTransition = document as Document & {
    /** 启动文档视图过渡。 */
    startViewTransition?: (callback: () => void) => ViewTransition;
  };

  if (!documentWithTransition.startViewTransition || prefersReducedMotion) {
    apply();
    return;
  }

  const { x, y } = getTransitionOrigin();
  const maxX = Math.max(x, window.innerWidth - x);
  const maxY = Math.max(y, window.innerHeight - y);
  const radius = Math.hypot(maxX, maxY);

  const transition = documentWithTransition.startViewTransition.call(document, () => {
    apply();
  });

  transition.ready
    .then(() => {
      const root = document.documentElement;
      const expand = nextMode === 'dark';
      const from = `circle(0px at ${x}px ${y}px)`;
      const to = `circle(${radius}px at ${x}px ${y}px)`;

      root.animate(
        {
          clipPath: expand ? [from, to] : [to, from],
        },
        {
          duration: 500,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          fill: 'both',
          pseudoElement: expand
            ? '::view-transition-new(root)'
            : '::view-transition-old(root)',
        }
      );
    })
    .catch(() => {
      /**
       * 忽略过渡动画异常。
       * @description 主题切换主流程已完成，动画失败不应阻断业务逻辑。
       */
    });
}
