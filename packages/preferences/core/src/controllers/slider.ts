/**
 * 滑动条控制器（Headless Logic）。
 * @description 封装滑动条取值、步进与样式计算逻辑，供 Vue/React 复用。
 */

/**
 * 滑动条控制器初始化参数。
 * @description 定义滑动条最小值、最大值与可选步进。
 */
export interface SliderOptions {
  /** 最小值。 */
  min: number;
  /** 最大值。 */
  max: number;
  /** 步进值。 */
  step?: number;
}

/**
 * SliderController 类定义。
 * @description 提供百分比换算、取值规整与背景渐变计算能力。
 */
export class SliderController {
  private min: number;
  private max: number;
  private step: number;

  /**
   * 创建滑动条控制器。
   * @param options 滑动条范围与步进配置。
   */
  constructor(options: SliderOptions) {
    this.min = options.min;
    this.max = options.max;
    this.step = options.step ?? 0.01;
  }

  /**
   * 计算当前值的进度百分比（0-100）。
   *
   * @param value 当前值。
   * @returns 归一化后的百分比值。
   */
  calculatePercentage(value: number): number {
    const range = this.max - this.min;
    if (range <= 0) return 0;
    const percentage = ((value - this.min) / range) * 100;
    return Math.max(0, Math.min(100, percentage));
  }

  /**
   * 限制数值在合法范围内，并按步进舍入。
   *
   * @param value 待处理值。
   * @returns 规整后的合法数值。
   */
  clamp(value: number): number {
    const steppedValue = Math.round(value / this.step) * this.step;
    /**
     * 浮点精度修正。
     * @description 通过限制小数位避免二进制浮点误差累积。
     */
    const rounded = parseFloat(steppedValue.toFixed(4));
    return Math.max(this.min, Math.min(this.max, rounded));
  }

  /**
   * 生成滑动条背景渐变样式字符串。
   *
   * @param value 当前值。
   * @param activeColor 已激活区间颜色。
   * @param inactiveColor 未激活区间颜色。
   * @returns CSS `linear-gradient` 字符串。
   */
  getBackgroundStyle(value: number, activeColor: string, inactiveColor: string): string {
    const percentage = this.calculatePercentage(value);
    return `linear-gradient(to right, ${activeColor} 0%, ${activeColor} ${percentage}%, ${inactiveColor} ${percentage}%, ${inactiveColor} 100%)`;
  }
}

/**
 * 工厂函数：创建滑动条控制器。
 *
 * @param options 滑动条控制参数。
 * @returns 滑动条控制器实例。
 */
export function createSliderController(options: SliderOptions) {
  return new SliderController(options);
}
