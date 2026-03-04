/**
 * 页面过渡动画预览组件模块。
 * @description 用于在偏好设置面板中实时展示不同页面切换动画的视觉效果。
 */
import React, { memo, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { PageTransitionType } from '@admin-core/preferences';

/**
 * 动画预览组件属性。
 */
export interface TransitionPreviewProps {
  /** 当前选中的动画类型 */
  transition: PageTransitionType;
  /** 是否启用动画（全局开关） */
  enabled?: boolean;
  /** 是否选中（只有选中时才播放动画） */
  active?: boolean;
  /** 紧凑模式（用于网格展示） */
  compact?: boolean;
}

/**
 * 动画类名映射表。
 * @description 为每种页面过渡类型提供进入与离开动画类名。
 */
const transitionClasses: Record<PageTransitionType, {
  /** 进入动画类名。 */
  enter: string;
  /** 离开动画类名。 */
  leave: string;
}> = {
  'fade': {
    enter: 'transition-preview-fade-enter',
    leave: 'transition-preview-fade-leave',
  },
  'fade-slide': {
    enter: 'transition-preview-fade-slide-enter',
    leave: 'transition-preview-fade-slide-leave',
  },
  'fade-up': {
    enter: 'transition-preview-fade-up-enter',
    leave: 'transition-preview-fade-up-leave',
  },
  'fade-down': {
    enter: 'transition-preview-fade-down-enter',
    leave: 'transition-preview-fade-down-leave',
  },
  'slide-left': {
    enter: 'transition-preview-slide-left-enter',
    leave: 'transition-preview-slide-left-leave',
  },
  'slide-right': {
    enter: 'transition-preview-slide-right-enter',
    leave: 'transition-preview-slide-right-leave',
  },
};

/** 动画时长（毫秒）。 */
const ANIMATION_DURATION = 500;
/** 离场与入场之间的切换间隔（毫秒）。 */
const ANIMATION_GAP = 150;
/** 循环播放间隔（毫秒）。 */
const LOOP_INTERVAL = 3500;

/**
 * 页面切换动画预览组件。
 */
export const TransitionPreview: React.FC<TransitionPreviewProps> = memo(({ 
  transition, 
  enabled = true,
  active = false,
  compact = false,
}) => {
  /**
   * 预览内容是否显示。
   * @description 通过显隐切换模拟路由页面切换前后的内容变化。
   */
  const [showContent, setShowContent] = useState(true);

  /**
   * 当前应用到预览页的动画类名。
   * @description 在离场与入场阶段动态写入 class，驱动 CSS 动画。
   */
  const [currentClass, setCurrentClass] = useState('');

  /**
   * 动画运行中标记。
   * @description 防止同一时刻重复触发播放逻辑导致时序冲突。
   */
  const isAnimatingRef = useRef(false);

  /**
   * 单次动画流程中的延时任务列表。
   * @description 统一缓存所有 `setTimeout` 句柄，便于停止时集中清理。
   */
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  /**
   * 动画循环任务引用。
   * @description 保存 `setInterval` 句柄，用于在组件生命周期内安全启动/停止轮播。
   */
  const loopIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /**
   * 是否应当执行动画。
   * @description 仅当全局启用且当前项处于激活态时才播放预览。
   */
  const shouldAnimate = useMemo(() => enabled && active, [enabled, active]);

  /**
   * 清理动画相关定时器
   * @description 停止单次延时与循环播放任务，并重置动画运行标记。
   */
  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    if (loopIntervalRef.current) {
      clearInterval(loopIntervalRef.current);
      loopIntervalRef.current = null;
    }
    isAnimatingRef.current = false;
  }, []);

  /**
   * 重置动画展示状态
   * @description 恢复内容显示并清空过渡类名，作为动画停止后的统一收尾逻辑。
   */
  const resetAnimationState = useCallback(() => {
    setShowContent(true);
    setCurrentClass('');
  }, []);

  /**
   * 播放一次切换动画
   * @description 按“离开 -> 间隔 -> 进入 -> 结束”时序推进预览状态。
   */
  const playAnimation = useCallback(() => {
    if (!shouldAnimate || isAnimatingRef.current) return;
    
    isAnimatingRef.current = true;
    const classes = transitionClasses[transition] || transitionClasses['fade'];
    
    /**
     * 使用 `requestAnimationFrame` 启动动画序列。
     * @description 确保状态变更发生在浏览器绘制节奏内，减轻卡顿。
     */
    requestAnimationFrame(() => {
      /**
       * 第一阶段：离场动画。
       * @description 先播放离场，再切换内容，最后播放入场动画。
       */
      setCurrentClass(classes.leave);
      
      const timer1 = setTimeout(() => {
        setShowContent(false);
        setCurrentClass('');
        
        /**
         * 第二阶段：短暂间隔后切换并展示新内容。
         * @description 利用间隔让离场与入场有明显分段。
         */
        const timer2 = setTimeout(() => {
          requestAnimationFrame(() => {
            setShowContent(true);
            setCurrentClass(classes.enter);
            
            /**
             * 第三阶段：动画结束后复位状态。
             * @description 清空动画类并释放“播放中”标记。
             */
            const timer3 = setTimeout(() => {
              setCurrentClass('');
              isAnimatingRef.current = false;
            }, ANIMATION_DURATION);
            timersRef.current.push(timer3);
          });
        }, ANIMATION_GAP);
        timersRef.current.push(timer2);
      }, ANIMATION_DURATION);
      timersRef.current.push(timer1);
    });
  }, [shouldAnimate, transition]);

  /**
   * 启动动画循环
   * @description 清理旧任务后延迟执行首帧，再以固定间隔重复播放。
   */
  const startLoop = useCallback(() => {
    if (!shouldAnimate) return;
    clearTimers();
    resetAnimationState();
    const initialTimer = setTimeout(() => {
      playAnimation();
      loopIntervalRef.current = setInterval(playAnimation, LOOP_INTERVAL);
    }, 300);
    timersRef.current.push(initialTimer);
  }, [shouldAnimate, playAnimation, clearTimers, resetAnimationState]);

  /**
   * 停止动画循环
   * @description 终止所有动画任务并恢复初始展示状态。
   */
  const stopLoop = useCallback(() => {
    clearTimers();
    resetAnimationState();
  }, [clearTimers, resetAnimationState]);

  /**
   * 自动循环播放控制。
   * @description 根据启用状态与页面可见性启动或停止循环。
   */
  useEffect(() => {
    if (!shouldAnimate) {
      stopLoop();
      return;
    }
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      stopLoop();
      return;
    }
    startLoop();
    return clearTimers;
  }, [shouldAnimate, startLoop, stopLoop, clearTimers]);

  /**
   * 页面可见性监听。
   * @description 页面不可见时暂停动画，恢复可见后按需重启。
   */
  useEffect(() => {
    if (typeof document === 'undefined') return;
    /**
     * 处理页面可见性变化
     * @description 页面切后台时暂停动画，恢复可见时按需重启动画循环。
     */
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        stopLoop();
      } else if (shouldAnimate) {
        startLoop();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [shouldAnimate, startLoop, stopLoop]);

  /**
   * 计算预览容器类名
   * @description 根据禁用与紧凑状态拼接最终样式类字符串。
   */
  const classNames = (() => {
    const classes = ['transition-preview', 'pref-disabled'];
    if (!enabled) classes.push('disabled');
    if (compact) classes.push('compact');
    return classes.join(' ');
  })();

  return (
    <div className={classNames} data-disabled={!enabled ? 'true' : undefined}>
      <div className="transition-preview-screen">
        {/* 模拟页面头部 */}
        <div className="transition-preview-header">
          <div className="transition-preview-header-dot" />
          <div className="transition-preview-header-dot" />
          <div className="transition-preview-header-dot" />
        </div>
        {/* 模拟侧边栏 */}
        <div className="transition-preview-sidebar">
          <div className="transition-preview-menu-item active" data-state="active" />
          <div className="transition-preview-menu-item" />
          <div className="transition-preview-menu-item" />
        </div>
        {/* 模拟内容区 */}
        <div className="transition-preview-content">
          {showContent && (
            <div className={`transition-preview-page ${currentClass}`}>
              <div className="transition-preview-card" />
              <div className="transition-preview-card small" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

TransitionPreview.displayName = 'TransitionPreview';

/**
 * 默认导出过渡动画预览组件。
 */
export default TransitionPreview;
