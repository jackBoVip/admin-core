/**
 * 复制按钮控制器 (Headless Logic)
 * @description 封装复制按钮的状态管理逻辑，供 Vue 和 React 引用
 */

export interface CopyButtonOptions {
  /** 自动恢复时间（毫秒），默认 3000 */
  autoResetMs?: number;
  /** 复制成功回调 */
  onCopied?: () => void;
  /** 状态重置回调 */
  onReset?: () => void;
}

export interface CopyButtonState {
  /** 是否已复制 */
  isCopied: boolean;
  /** 复制时的值快照（用于检测变化） */
  snapshot: string | null;
}

/** 默认自动恢复时间 */
export const COPY_BUTTON_AUTO_RESET_MS = 3000;

/**
 * 复制按钮控制器
 * @description 管理复制按钮的状态逻辑，包括自动恢复、值变化检测等
 */
export class CopyButtonController {
  private autoResetMs: number;
  private onCopied?: () => void;
  private onReset?: () => void;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(options: CopyButtonOptions = {}) {
    this.autoResetMs = options.autoResetMs ?? COPY_BUTTON_AUTO_RESET_MS;
    this.onCopied = options.onCopied;
    this.onReset = options.onReset;
  }

  /**
   * 创建初始状态
   */
  getInitialState(): CopyButtonState {
    return {
      isCopied: false,
      snapshot: null,
    };
  }

  /**
   * 处理复制成功
   * @param currentValue 当前值（将被序列化为快照）
   * @returns 新状态
   */
  handleCopySuccess<T>(currentValue: T): CopyButtonState {
    // 清除之前的定时器
    this.clearTimeout();

    // 调用成功回调
    this.onCopied?.();

    return {
      isCopied: true,
      snapshot: this.serialize(currentValue),
    };
  }

  /**
   * 设置自动恢复定时器
   * @param onTimeout 定时器触发时的回调
   */
  scheduleAutoReset(onTimeout: () => void): void {
    this.clearTimeout();
    this.timeoutId = setTimeout(() => {
      this.timeoutId = null;
      onTimeout();
    }, this.autoResetMs);
  }

  /**
   * 检查值是否发生变化（相对于快照）
   * @param state 当前状态
   * @param currentValue 当前值
   * @returns 是否应该重置
   */
  shouldResetOnChange<T>(state: CopyButtonState, currentValue: T): boolean {
    if (!state.isCopied || state.snapshot === null) {
      return false;
    }
    const currentSerialized = this.serialize(currentValue);
    return currentSerialized !== state.snapshot;
  }

  /**
   * 重置状态
   * @returns 重置后的状态
   */
  reset(): CopyButtonState {
    this.clearTimeout();
    this.onReset?.();
    return this.getInitialState();
  }

  /**
   * 清理资源（组件卸载时调用）
   */
  dispose(): void {
    this.clearTimeout();
  }

  /**
   * 获取自动恢复时间
   */
  getAutoResetMs(): number {
    return this.autoResetMs;
  }

  /**
   * 清除定时器
   */
  private clearTimeout(): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  /**
   * 序列化值
   */
  private serialize<T>(value: T): string {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
}

/**
 * 工厂函数：创建复制按钮控制器
 */
export function createCopyButtonController(options?: CopyButtonOptions): CopyButtonController {
  return new CopyButtonController(options);
}

/**
 * 复制按钮的无障碍属性
 */
export function getCopyButtonA11yProps(isCopied: boolean) {
  return {
    'aria-live': 'polite' as const,
    'aria-label': isCopied ? 'Copied to clipboard' : 'Copy to clipboard',
  };
}
