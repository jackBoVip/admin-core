/**
 * 全屏按钮组件
 * @description 切换浏览器全屏模式
 */
import { logger } from '@admin-core/layout';
import { useState, useEffect, useCallback, memo } from 'react';
import { useLayoutContext } from '../../hooks';
import { renderLayoutIcon } from '../../utils';

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  mozFullScreenElement?: Element | null;
  msFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void>;
  mozCancelFullScreen?: () => Promise<void>;
  msExitFullscreen?: () => Promise<void>;
};

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void>;
  mozRequestFullScreen?: () => Promise<void>;
  msRequestFullscreen?: () => Promise<void>;
};

export const FullscreenButton = memo(function FullscreenButton() {
  const { events } = useLayoutContext();
  const [isFullscreen, setIsFullscreen] = useState(false);

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
