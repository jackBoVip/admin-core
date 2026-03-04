/**
 * 水印工具。
 * @description 提供框架无关的水印文本计算、缓存键生成与图像 dataURL 绘制能力。
 */

/**
 * 水印配置结构。
 */
export interface WatermarkConfig {
  /** 是否启用。 */
  enabled: boolean;
  /** 水印主文本内容。 */
  content: string;
  /** 水印旋转角度（单位：度）。 */
  angle: number;
  /** 是否在文本后追加当前日期。 */
  appendDate: boolean;
  /** 绘制字体大小（单位：像素）。 */
  fontSize: number;
}

/**
 * 水印生成器初始化参数。
 */
export interface WatermarkGeneratorOptions {
  /** 画布额外留白，避免平铺时水印过于密集。 */
  padding?: number;
  /** 水印文字颜色。 */
  textColor?: string;
  /** 绘制时使用的字体族。 */
  fontFamily?: string;
  /** 内存缓存最多保留的 dataURL 数量。 */
  maxCacheSize?: number;
}

/**
 * 水印生成器接口。
 */
export interface WatermarkGenerator {
  /** 根据配置生成可用于 CSS 背景图的 PNG dataURL。 */
  getDataUrl: (config: WatermarkConfig) => string;
  /** 清空内部缓存。 */
  clear: () => void;
}

/**
 * 水印文本组装配置。
 */
export interface WatermarkTextConfig {
  /** 水印主文本。 */
  content?: string;
  /** 是否追加日期。 */
  appendDate?: boolean;
}

/**
 * 组装最终水印文本。
 *
 * @param config 文本配置。
 * @param now 当前时间，默认使用系统时间；便于测试时注入固定值。
 * @returns 可直接绘制的文本内容；无内容时返回空字符串。
 */
export function formatWatermarkText(
  config: WatermarkTextConfig,
  now: Date = new Date()
): string {
  if (!config.content) return '';
  if (config.appendDate) {
    return `${config.content} ${now.toLocaleDateString()}`;
  }
  return config.content;
}

/**
 * 基于完整水印配置生成文本。
 *
 * @param config 水印配置。
 * @param now 当前时间。
 * @returns 最终水印文本。
 */
export function getWatermarkText(config: WatermarkConfig, now: Date = new Date()): string {
  return formatWatermarkText(config, now);
}

/**
 * 生成水印缓存键。
 *
 * @param config 水印配置。
 * @param text 已计算的水印文本。
 * @returns 缓存键；当水印关闭或文本为空时返回空字符串。
 */
export function buildWatermarkCacheKey(config: WatermarkConfig, text: string): string {
  if (!config.enabled || !text) return '';
  return `${text}|${config.angle}|${config.fontSize}`;
}

/**
 * 创建带内存缓存的水印生成器。
 * @description 内部复用单个 `canvas` 与 LRU 风格 Map 缓存，减少重复绘制开销。
 * @param options 生成器初始化参数。
 * @returns 水印生成器实例。
 */
export function createWatermarkGenerator(options: WatermarkGeneratorOptions = {}): WatermarkGenerator {
  const {
    padding = 80,
    textColor = 'rgba(128, 128, 128, 0.15)',
    fontFamily = 'sans-serif',
    maxCacheSize = 10,
  } = options;

  /** 水印 dataURL 缓存（键为水印参数签名）。 */
  const cache = new Map<string, string>();
  /** 复用画布实例，避免重复创建 DOM 节点。 */
  let canvas: HTMLCanvasElement | null = null;

  /**
   * 清空水印数据缓存。
   * @returns 无返回值。
   */
  const clear = () => {
    cache.clear();
  };

  /**
   * 根据配置生成水印数据 URL。
   * @param config 水印配置。
   * @returns 数据 URL；无法生成时返回空字符串。
   */
  const getDataUrl = (config: WatermarkConfig) => {
    const text = getWatermarkText(config);
    const cacheKey = buildWatermarkCacheKey(config, text);
    if (!cacheKey) return '';
    if (typeof document === 'undefined') return '';

    const cached = cache.get(cacheKey);
    if (cached) return cached;

    if (!canvas) {
      canvas = document.createElement('canvas');
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const angleRad = (config.angle * Math.PI) / 180;
    ctx.font = `${config.fontSize}px ${fontFamily}`;
    const metrics = ctx.measureText(text);
    const textWidth = metrics.width;
    const textHeight = config.fontSize * 1.2;

    const cos = Math.abs(Math.cos(angleRad));
    const sin = Math.abs(Math.sin(angleRad));
    const rotatedWidth = textWidth * cos + textHeight * sin;
    const rotatedHeight = textWidth * sin + textHeight * cos;

    canvas.width = rotatedWidth + padding;
    canvas.height = rotatedHeight + padding;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(angleRad);
    ctx.font = `${config.fontSize}px ${fontFamily}`;
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 0, 0);
    ctx.restore();

    const dataUrl = canvas.toDataURL('image/png');
    if (cache.size > maxCacheSize) {
      const firstKey = cache.keys().next().value;
      if (firstKey) cache.delete(firstKey);
    }
    cache.set(cacheKey, dataUrl);
    return dataUrl;
  };

  return { getDataUrl, clear };
}
