/**
 * 主题切换过渡动画
 * @description 使用 View Transitions API 实现扩散/收缩效果
 */

import { hasDocument, isBrowser } from './platform';

type ThemeMode = 'light' | 'dark';

type ViewTransition = {
  ready: Promise<void>;
  finished: Promise<void>;
};

const POINTER_IDLE_THRESHOLD = 2000;

const pointerState = {
  x: 0,
  y: 0,
  time: 0,
};

let trackingInitialized = false;

/**
 * 初始化指针位置追踪
 * @description 用于获取主题切换动画的起点
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

function getTransitionOrigin(): { x: number; y: number } {
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
 * 执行主题切换过渡
 * @param nextMode - 目标主题模式
 * @param apply - 应用主题变更的回调
 */
export function runThemeTransition(nextMode: ThemeMode, apply: () => void): void {
  if (!hasDocument) {
    apply();
    return;
  }

  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const documentWithTransition = document as Document & {
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
      // ignore transition errors
    });
}
