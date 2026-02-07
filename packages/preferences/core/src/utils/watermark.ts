/**
 * 水印工具
 * @description 生成水印图像的框架无关逻辑
 */

export interface WatermarkConfig {
  enabled: boolean;
  content: string;
  angle: number;
  appendDate: boolean;
  fontSize: number;
}

export interface WatermarkGeneratorOptions {
  padding?: number;
  textColor?: string;
  fontFamily?: string;
  maxCacheSize?: number;
}

export interface WatermarkGenerator {
  getDataUrl: (config: WatermarkConfig) => string;
  clear: () => void;
}

export interface WatermarkTextConfig {
  content?: string;
  appendDate?: boolean;
}

/**
 * 生成水印文本
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
 * 生成水印文本
 */
export function getWatermarkText(config: WatermarkConfig, now: Date = new Date()): string {
  return formatWatermarkText(config, now);
}

/**
 * 生成水印缓存 key
 */
export function buildWatermarkCacheKey(config: WatermarkConfig, text: string): string {
  if (!config.enabled || !text) return '';
  return `${text}|${config.angle}|${config.fontSize}`;
}

/**
 * 创建水印生成器（内部带缓存）
 */
export function createWatermarkGenerator(options: WatermarkGeneratorOptions = {}): WatermarkGenerator {
  const {
    padding = 80,
    textColor = 'rgba(128, 128, 128, 0.15)',
    fontFamily = 'sans-serif',
    maxCacheSize = 10,
  } = options;

  const cache = new Map<string, string>();
  let canvas: HTMLCanvasElement | null = null;

  const clear = () => {
    cache.clear();
  };

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
