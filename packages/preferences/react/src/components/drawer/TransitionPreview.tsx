/**
 * 动画预览组件
 * @description 实时展示页面切换动画效果
 */
import React, { memo, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { PageTransitionType } from '@admin-core/preferences';

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

// 动画 CSS 类映射
const transitionClasses: Record<PageTransitionType, { enter: string; leave: string }> = {
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

// 动画时长配置（毫秒）
const ANIMATION_DURATION = 500; // CSS 动画时长
const ANIMATION_GAP = 150;      // 切换间隔
const LOOP_INTERVAL = 3500;     // 循环间隔

export const TransitionPreview: React.FC<TransitionPreviewProps> = memo(({ 
  transition, 
  enabled = true,
  active = false,
  compact = false,
}) => {
  const [showContent, setShowContent] = useState(true);
  const [currentClass, setCurrentClass] = useState('');
  const isAnimatingRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const loopIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 是否应该播放动画：全局开启 且 当前选中
  const shouldAnimate = useMemo(() => enabled && active, [enabled, active]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    if (loopIntervalRef.current) {
      clearInterval(loopIntervalRef.current);
      loopIntervalRef.current = null;
    }
    isAnimatingRef.current = false;
  }, []);

  const playAnimation = useCallback(() => {
    if (!shouldAnimate || isAnimatingRef.current) return;
    
    isAnimatingRef.current = true;
    const classes = transitionClasses[transition] || transitionClasses['fade'];
    
    // 使用 requestAnimationFrame 确保流畅
    requestAnimationFrame(() => {
      // 离开动画
      setCurrentClass(classes.leave);
      
      const timer1 = setTimeout(() => {
        setShowContent(false);
        setCurrentClass('');
        
        // 短暂延迟后显示新内容
        const timer2 = setTimeout(() => {
          requestAnimationFrame(() => {
            setShowContent(true);
            setCurrentClass(classes.enter);
            
            // 动画结束后重置
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

  // 自动循环播放
  useEffect(() => {
    if (!shouldAnimate) {
      clearTimers();
      setShowContent(true);
      setCurrentClass('');
      return;
    }

    // 延迟启动，避免同时触发多个动画
    const initialTimer = setTimeout(() => {
      playAnimation();
      loopIntervalRef.current = setInterval(playAnimation, LOOP_INTERVAL);
    }, 300);
    timersRef.current.push(initialTimer);

    return clearTimers;
  }, [shouldAnimate, playAnimation, clearTimers]);

  const classNames = [
    'transition-preview',
    !enabled && 'disabled',
    compact && 'compact',
  ].filter(Boolean).join(' ');

  return (
    <div className={classNames}>
      <div className="transition-preview-screen">
        {/* 模拟页面头部 */}
        <div className="transition-preview-header">
          <div className="transition-preview-header-dot" />
          <div className="transition-preview-header-dot" />
          <div className="transition-preview-header-dot" />
        </div>
        {/* 模拟侧边栏 */}
        <div className="transition-preview-sidebar">
          <div className="transition-preview-menu-item active" />
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

export default TransitionPreview;
