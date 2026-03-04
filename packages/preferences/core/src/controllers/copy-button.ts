/**
 * 复制按钮控制器 (Headless Logic)
 * @description 封装复制按钮的状态管理逻辑，供 Vue 和 React 引用
 */

/**
 * 复制按钮控制器初始化配置。
 */
export interface CopyButtonOptions {
  /** 自动恢复时间（毫秒），默认 3000 */
  autoResetMs?: number;
  /** 复制成功回调 */
  onCopied?: () => void;
  /** 状态重置回调 */
  onReset?: () => void;
}

/**
 * 复制按钮状态结构。
 */
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

  /**
   * 创建复制按钮控制器。
   * @param options 控制器初始化选项。
   */
  constructor(options: CopyButtonOptions = {}) {
    this.autoResetMs = options.autoResetMs ?? COPY_BUTTON_AUTO_RESET_MS;
    this.onCopied = options.onCopied;
    this.onReset = options.onReset;
  }

  /**
   * 创建初始状态。
   *
   * @returns 初始复制按钮状态。
   */
  getInitialState(): CopyButtonState {
    return {
      isCopied: false,
      snapshot: null,
    };
  }

  /**
   * 处理复制成功。
   *
   * @param currentValue 当前值（将被序列化为快照）。
   * @returns 更新后的复制按钮状态。
   */
  handleCopySuccess<T>(currentValue: T): CopyButtonState {
    /**
     * 清理旧自动恢复定时器。
     * @description 防止重复复制导致多个恢复任务并发。
     */
    this.clearTimeout();

    /**
     * 触发复制成功回调。
     */
    this.onCopied?.();

    return {
      isCopied: true,
      snapshot: this.serialize(currentValue),
    };
  }

  /**
   * 设置自动恢复定时器。
   *
   * @param onTimeout 定时器触发时的回调。
   * @returns 无返回值。
   */
  scheduleAutoReset(onTimeout: () => void): void {
    this.clearTimeout();
    this.timeoutId = setTimeout(() => {
      this.timeoutId = null;
      onTimeout();
    }, this.autoResetMs);
  }

  /**
   * 检查值是否发生变化（相对于快照）。
   *
   * @param state 当前状态。
   * @param currentValue 当前值。
   * @returns 是否应重置状态。
   */
  shouldResetOnChange<T>(state: CopyButtonState, currentValue: T): boolean {
    if (!state.isCopied || state.snapshot === null) {
      return false;
    }
    const currentSerialized = this.serialize(currentValue);
    return currentSerialized !== state.snapshot;
  }

  /**
   * 重置状态。
   *
   * @returns 重置后的状态。
   */
  reset(): CopyButtonState {
    this.clearTimeout();
    this.onReset?.();
    return this.getInitialState();
  }

  /**
   * 清理资源（组件卸载时调用）。
   *
   * @returns 无返回值。
   */
  dispose(): void {
    this.clearTimeout();
  }

  /**
   * 获取自动恢复时间。
   *
   * @returns 自动恢复时长（毫秒）。
   */
  getAutoResetMs(): number {
    return this.autoResetMs;
  }

  /**
   * 清除定时器。
   *
   * @returns 无返回值。
   */
  private clearTimeout(): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  /**
   * 序列化任意值为字符串快照。
   *
   * @param value 待序列化值。
   * @returns 序列化后的字符串。
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
 * 工厂函数：创建复制按钮控制器。
 *
 * @param options 控制器初始化选项。
 * @returns 复制按钮控制器实例。
 */
export function createCopyButtonController(options?: CopyButtonOptions): CopyButtonController {
  return new CopyButtonController(options);
}

/**
 * 获取复制按钮的无障碍属性。
 *
 * @param isCopied 当前是否处于已复制状态。
 * @returns 适用于按钮元素的无障碍属性集合。
 */
export function getCopyButtonA11yProps(isCopied: boolean) {
  return {
    'aria-live': 'polite' as const,
    'aria-label': isCopied ? 'Copied to clipboard' : 'Copy to clipboard',
  };
}
