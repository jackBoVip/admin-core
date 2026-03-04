import { defineConfig } from 'tsup';
import { copyFileSync, mkdirSync, readdirSync, existsSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { stripJSDocCommentsFromDist } from '../../../internal/build-config/tsup.js';

// 复制 CSS 文件到 dist
/**
 * 递归复制目录内容。
 *
 * @param src 源目录。
 * @param dest 目标目录。
 */
function copyDir(src: string, dest: string) {
  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true });
  }
  const entries = readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

// 读取 CSS 文件内容（去掉 @import 语句）
/**
 * 读取 CSS 文件并剔除 `@import` 语句。
 *
 * @param filePath CSS 文件路径。
 * @returns 处理后的 CSS 内容。
 */
function readCSSContent(filePath: string): string {
  if (!existsSync(filePath)) return '';
  const content = readFileSync(filePath, 'utf-8');
  // 移除 @import 语句，保留其他内容
  return content.replace(/@import\s+['"][^'"]+['"]\s*;?\s*/g, '');
}

// 生成合并的 CSS 文件（无 @import，可直接使用）
/**
 * 生成合并后的单文件 CSS 内容。
 *
 * @param tokensCSS 动态生成的设计令牌 CSS。
 * @returns 按预设顺序拼接后的 CSS 字符串。
 */
function generateBundledCSS(tokensCSS: string): string {
  const srcDir = 'src/styles/css';
  
  // 按正确顺序读取所有 CSS 文件
  const cssFiles = [
    // 1. 变量和令牌
    { content: tokensCSS, comment: 'Design Tokens' },
    { path: join(srcDir, 'variables.css'), comment: 'CSS Variables' },
    // 2. 动画
    { path: join(srcDir, 'animations.css'), comment: 'Animations' },
    // 3. 工具类
    { path: join(srcDir, 'utilities.css'), comment: 'Utilities' },
    // 4. 抽屉组件 - Design Tokens 必须在最前面
    { path: join(srcDir, 'drawer/tokens.css'), comment: 'Drawer Tokens' },
    { path: join(srcDir, 'drawer/container.css'), comment: 'Drawer Container' },
    { path: join(srcDir, 'drawer/header.css'), comment: 'Drawer Header' },
    { path: join(srcDir, 'drawer/tabs.css'), comment: 'Drawer Tabs' },
    { path: join(srcDir, 'drawer/blocks.css'), comment: 'Drawer Blocks' },
    { path: join(srcDir, 'drawer/controls.css'), comment: 'Drawer Controls' },
    { path: join(srcDir, 'drawer/themes.css'), comment: 'Drawer Themes' },
    { path: join(srcDir, 'drawer/trigger.css'), comment: 'Drawer Trigger' },
    { path: join(srcDir, 'drawer/slider.css'), comment: 'Drawer Slider' },
    // 5. 锁屏组件
    { path: join(srcDir, 'lock-screen.css'), comment: 'Lock Screen' },
  ];

  const parts: string[] = [
    '/**',
    ' * @admin-core/preferences - Bundled CSS',
    ' * @description 合并后的样式文件，可直接导入使用',
    ' * @usage @import "@admin-core/preferences/styles";',
    ' */',
    '',
    '/* ========== Layer Order Declaration ========== */',
    '/* admin-core layer has highest priority, must be declared before Tailwind imports */',
    '@layer theme, base, components, utilities, admin-core;',
    '',
  ];

  for (const file of cssFiles) {
    parts.push(`/* ========== ${file.comment} ========== */`);
    if ('content' in file) {
      parts.push(file.content);
    } else if (file.path) {
      parts.push(readCSSContent(file.path));
    }
    parts.push('');
  }

  return parts.join('\n');
}

// 生成设计令牌 CSS 文件
/**
 * 运行时加载令牌生成器并生成 CSS 变量文本。
 *
 * @returns 设计令牌 CSS 文本。
 */
async function generateTokensCSS(): Promise<string> {
  const { generateCSSVariables } = await import('./src/tokens/generate-css');
  return generateCSSVariables();
}

/**
 * 默认导出 Preferences Core 的多产物构建配置集合。
 */
export default defineConfig([
  // ESM 和 CJS 格式（NPM 使用）
  {
    entry: {
      index: 'src/index.ts',
      'styles/tailwind/preset': 'src/styles/tailwind/preset.ts',
    },
    format: ['cjs', 'esm'],
    dts: {
      compilerOptions: {
        removeComments: true,
      },
    },
    splitting: true,
    sourcemap: process.env.NODE_ENV !== 'production',
    clean: true,
    treeshake: true,
    minify: true,
    target: 'es2020',
    external: ['culori'],
    /**
     * 注入 NPM 构建横幅，并配置图片资源为 data URL 内联加载。
     *
     * @param options esbuild 配置对象。
     */
    esbuildOptions(options) {
      options.legalComments = 'none';
      options.banner = {
        js: '/* @admin-core/preferences */',
      };
      // 处理图片文件，转换为 base64 data URL（避免运行时资源丢失）
      options.loader = {
        ...options.loader,
        '.jpg': 'dataurl',
        '.jpeg': 'dataurl',
        '.png': 'dataurl',
        '.gif': 'dataurl',
        '.webp': 'dataurl',
      };
    },
    onSuccess: async () => {
      // 生成设计令牌 CSS
      const tokensCSS = await generateTokensCSS();
      
      // 复制原始 CSS 文件（保留分离的文件结构供高级用户使用）
      copyDir('src/styles/css', 'dist/styles/css');
      // 覆盖写入 dist 的 tokens.css，避免构建时修改 src
      if (!existsSync('dist/styles/css')) {
        mkdirSync('dist/styles/css', { recursive: true });
      }
      writeFileSync(join('dist/styles/css', 'tokens.css'), tokensCSS);
      
      // 复制 assets 目录（图片等静态资源）
      if (existsSync('src/assets')) {
        copyDir('src/assets', 'dist/assets');
      }
      
      // 生成合并后的 CSS 文件（主要入口，无 @import）
      const bundledCSS = generateBundledCSS(tokensCSS);
      writeFileSync('dist/styles/css/index.css', bundledCSS);
      stripJSDocCommentsFromDist();
    },
  },
  // IIFE 格式（CDN 使用）
  {
    entry: ['src/index.ts'],
    outDir: 'dist',
    format: ['iife'],
    globalName: 'AdminCorePreferences',
    clean: false,
    outExtension: () => ({ js: '.global.js' }),
    sourcemap: process.env.NODE_ENV !== 'production',
    treeshake: true,
    minify: true,
    target: 'es2020',
    // CDN 版本内联 culori 依赖
    noExternal: ['culori'],
    /**
     * 注入 CDN 生产包横幅，并配置图片资源为 data URL 内联加载。
     *
     * @param options esbuild 配置对象。
     */
    esbuildOptions(options) {
      options.legalComments = 'none';
      options.banner = {
        js: '/* @admin-core/preferences - CDN Build */',
      };
      // 处理图片文件，转换为 base64 data URL
      options.loader = {
        ...options.loader,
        '.jpg': 'dataurl',
        '.jpeg': 'dataurl',
        '.png': 'dataurl',
        '.gif': 'dataurl',
        '.webp': 'dataurl',
      };
    },
    onSuccess() {
      stripJSDocCommentsFromDist();
    },
  },
  {
    entry: ['src/index.ts'],
    outDir: 'dist',
    format: ['iife'],
    globalName: 'AdminCorePreferences',
    clean: false,
    outExtension: () => ({ js: '.global.dev.js' }),
    sourcemap: true,
    treeshake: true,
    minify: false,
    target: 'es2020',
    // CDN 开发版本也内联 culori
    noExternal: ['culori'],
    /**
     * 注入 CDN 开发包横幅，并配置图片资源为 data URL 内联加载。
     *
     * @param options esbuild 配置对象。
     */
    esbuildOptions(options) {
      options.legalComments = 'none';
      options.banner = {
        js: '/* @admin-core/preferences - CDN Development Build */',
      };
      options.loader = {
        ...options.loader,
        '.jpg': 'dataurl',
        '.jpeg': 'dataurl',
        '.png': 'dataurl',
        '.gif': 'dataurl',
        '.webp': 'dataurl',
      };
    },
    onSuccess() {
      stripJSDocCommentsFromDist();
    },
  },
]);
