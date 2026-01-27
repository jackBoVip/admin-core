/**
 * 滑动条控制器 (Headless Logic)
 * @description 封装滑动条的核心逻辑，供 Vue 和 React 引用
 */

export interface SliderOptions {
  min: number;
  max: number;
  step?: number;
}

export class SliderController {
  private min: number;
  private max: number;
  private step: number;

  constructor(options: SliderOptions) {
    this.min = options.min;
    this.max = options.max;
    this.step = options.step ?? 0.01;
  }

  /**
   * 计算当前值的进度百分比 (0-100)
   */
  calculatePercentage(value: number): number {
    const range = this.max - this.min;
    if (range <= 0) return 0;
    const percentage = ((value - this.min) / range) * 100;
    return Math.max(0, Math.min(100, percentage));
  }

  /**
   * 限制数值在合法范围内，并按步进舍入
   */
  clamp(value: number): number {
    const steppedValue = Math.round(value / this.step) * this.step;
    // 修正浮点数精度
    const rounded = parseFloat(steppedValue.toFixed(4));
    return Math.max(this.min, Math.min(this.max, rounded));
  }

  /**
   * 生成背景渐变样式字符串
   */
  getBackgroundStyle(value: number, activeColor: string, inactiveColor: string): string {
    const percentage = this.calculatePercentage(value);
    return `linear-gradient(to right, ${activeColor} 0%, ${activeColor} ${percentage}%, ${inactiveColor} ${percentage}%, ${inactiveColor} 100%)`;
  }
}

/**
 * 工厂函数：创建滑动条控制器
 */
export function createSliderController(options: SliderOptions) {
  return new SliderController(options);
}
