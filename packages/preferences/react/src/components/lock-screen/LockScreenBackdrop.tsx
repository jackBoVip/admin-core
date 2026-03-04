/**
 * 锁屏背景组件
 * @description 提供统一的全屏毛玻璃背景、光斑与网格效果，供锁屏等全屏场景复用。
 */
import React, { memo } from 'react';

/**
 * 锁屏背景组件参数。
 */
export interface LockScreenBackdropProps {
  /** 实际背景图片 URL（为空时仅展示渐变 + 光斑 + 网格） */
  backgroundImage?: string | null;
  /** 背景图片的内联样式（通常由 computeLockScreenBackground + useMemo 计算） */
  backgroundStyle?: React.CSSProperties;
}

/**
 * 锁屏背景展示组件。
 */
export const LockScreenBackdrop: React.FC<LockScreenBackdropProps> = memo(({
  backgroundImage,
  backgroundStyle,
}) => {
  /**
   * 背景图片是否可用。
   */
  const hasBackgroundImage = Boolean(backgroundImage);

  return (
    <div className="preferences-lock-backdrop" aria-hidden="true">
      {hasBackgroundImage && (
        <div
          className="preferences-lock-backdrop-image"
          style={backgroundStyle}
        />
      )}
      <div className="preferences-lock-orb orb-1" data-orb="1" />
      <div className="preferences-lock-orb orb-2" data-orb="2" />
      <div className="preferences-lock-orb orb-3" data-orb="3" />
      <div className="preferences-lock-grid" />
    </div>
  );
});

LockScreenBackdrop.displayName = 'LockScreenBackdrop';
