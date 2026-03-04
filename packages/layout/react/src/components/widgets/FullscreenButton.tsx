/**
 * 全屏按钮组件
 * @description 切换浏览器全屏模式
 */
import { logger } from '@admin-core/layout';
import { useState, useEffect, useCallback, memo } from 'react';
import { useLayoutContext } from '../../hooks';
import { renderLayoutIcon } from '../../utils';

/**
 * 兼容不同浏览器前缀的 Fullscreen Document 扩展类型。
 */
type FullscreenDocument = Document & {
  /** 苹果浏览器内核当前全屏元素。 */
  webkitFullscreenElement?: Element | null;
  /** 火狐浏览器当前全屏元素（旧前缀）。 */
  mozFullScreenElement?: Element | null;
  /** 旧版 Edge/IE 当前全屏元素。 */
  msFullscreenElement?: Element | null;
  /** 苹果浏览器内核退出全屏方法。 */
  webkitExitFullscreen?: () => Promise<void>;
  /** 火狐浏览器退出全屏方法（旧前缀）。 */
  mozCancelFullScreen?: () => Promise<void>;
  /** 旧版 Edge/IE 退出全屏方法。 */
  msExitFullscreen?: () => Promise<void>;
};

/**
 * 兼容不同浏览器前缀的 Fullscreen Element 扩展类型。
 */
type FullscreenElement = HTMLElement & {
  /** 苹果浏览器内核请求全屏方法。 */
  webkitRequestFullscreen?: () => Promise<void>;
  /** 火狐浏览器请求全屏方法（旧前缀）。 */
  mozRequestFullScreen?: () => Promise<void>;
  /** 旧版 Edge/IE 请求全屏方法。 */
  msRequestFullscreen?: () => Promise<void>;
};

/**
 * 全屏切换按钮组件。
 * @description 负责请求/退出浏览器全屏并同步全屏状态事件。
 */
export const FullscreenButton = memo(function FullscreenButton() {
  /**
   * 布局事件回调集合。
   */
  const { events } = useLayoutContext();
  /**
   * 全屏状态标识。
   */
  const [isFullscreen, setIsFullscreen] = useState(false);

  /**
   * 检测当前浏览器是否处于全屏状态，并同步到组件状态。
   */
  const checkFullscreen = useCallback(() => {
    const fullscreenDocument = document as FullscreenDocument;
    setIsFullscreen(
      !!(
        document.fullscreenElement ||
        fullscreenDocument.webkitFullscreenElement ||
        fullscreenDocument.mozFullScreenElement ||
        fullscreenDocument.msFullscreenElement
      )
    );
  }, []);

  /**
   * 切换浏览器全屏状态，兼容不同浏览器前缀 API。
   */
  const toggleFullscreen = useCallback(async () => {
    try {
      const fullscreenDocument = document as FullscreenDocument;
      if (isFullscreen) {
        if (fullscreenDocument.exitFullscreen) {
          await fullscreenDocument.exitFullscreen();
        } else if (fullscreenDocument.webkitExitFullscreen) {
          await fullscreenDocument.webkitExitFullscreen();
        } else if (fullscreenDocument.mozCancelFullScreen) {
          await fullscreenDocument.mozCancelFullScreen();
        } else if (fullscreenDocument.msExitFullscreen) {
          await fullscreenDocument.msExitFullscreen();
        }
      } else {
        const element = document.documentElement as FullscreenElement;
        if (element.requestFullscreen) {
          await element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) {
          await element.webkitRequestFullscreen();
        } else if (element.mozRequestFullScreen) {
          await element.mozRequestFullScreen();
        } else if (element.msRequestFullscreen) {
          await element.msRequestFullscreen();
        }
      }
      events.onFullscreenToggle?.(!isFullscreen);
    } catch (error) {
      logger.warn('Fullscreen API not supported:', error);
    }
  }, [isFullscreen, events]);

  useEffect(() => {
    /**
     * 初始化全屏状态并注册全屏变化事件监听。
     */
    checkFullscreen();
    document.addEventListener('fullscreenchange', checkFullscreen);
    document.addEventListener('webkitfullscreenchange', checkFullscreen);
    document.addEventListener('mozfullscreenchange', checkFullscreen);
    document.addEventListener('MSFullscreenChange', checkFullscreen);

    return () => {
      document.removeEventListener('fullscreenchange', checkFullscreen);
      document.removeEventListener('webkitfullscreenchange', checkFullscreen);
      document.removeEventListener('mozfullscreenchange', checkFullscreen);
      document.removeEventListener('MSFullscreenChange', checkFullscreen);
    };
  }, [checkFullscreen]);

  return (
    <button
      type="button"
      className="header-widget-btn"
      data-fullscreen={isFullscreen ? 'true' : undefined}
      onClick={toggleFullscreen}
    >
      {!isFullscreen ? renderLayoutIcon('fullscreen', 'sm') : renderLayoutIcon('fullscreen-exit', 'sm')}
    </button>
  );
});
