/**
 * Shared React 开关状态 Hook。
 * @description 提供统一的打开/关闭/切换状态管理能力，适配常见浮层组件场景。
 */
import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';

/**
 * 开关状态 Hook 返回值。
 * @description 统一封装开关状态读写与常见操作函数。
 */
export interface UseOpenStateReturn {
  /** 当前是否打开。 */
  isOpen: boolean;
  /** 直接写入开关状态。 */
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  /** 打开状态。 */
  open: () => void;
  /** 关闭状态。 */
  close: () => void;
  /** 切换状态。 */
  toggle: () => void;
}

/**
 * 管理开关状态的通用 Hook。
 * @description 适用于弹窗、下拉、抽屉等典型开合场景。
 * @param initialOpen 初始开关状态，默认 `false`。
 * @returns 包含当前状态、状态写入函数及常用开关操作方法。
 */
export function useOpenState(initialOpen = false): UseOpenStateReturn {
  const [isOpen, setIsOpen] = useState(initialOpen);

  /**
   * 将开关状态设置为打开。
   *
   * @returns 无返回值。
   */
  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  /**
   * 将开关状态设置为关闭。
   *
   * @returns 无返回值。
   */
  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  /**
   * 反转当前开关状态。
   *
   * @returns 无返回值。
   */
  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return {
    isOpen,
    setIsOpen,
    open,
    close,
    toggle,
  };
}
