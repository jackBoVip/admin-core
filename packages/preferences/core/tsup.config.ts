import { defineConfig } from 'tsup';
import { copyFileSync, mkdirSync, readdirSync, existsSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

// 复制 CSS 文件到 dist
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
function readCSSContent(filePath: string): string {
  if (!existsSync(filePath)) return '';
  const content = readFileSync(filePath, 'utf-8');
  // 移除 @import 语句，保留其他内容
  return content.replace(/@import\s+['"][^'"]+['"]\s*;?\s*/g, '');
}

// 生成合并的 CSS 文件（无 @import，可直接使用）
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
    // 4. 抽屉组件
    { path: join(srcDir, 'drawer/container.css'), comment: 'Drawer Container' },
    { path: join(srcDir, 'drawer/header.css'), comment: 'Drawer Header' },
    { path: join(srcDir, 'drawer/tabs.css'), comment: 'Drawer Tabs' },
    { path: join(srcDir, 'drawer/blocks.css'), comment: 'Drawer Blocks' },
    { path: join(srcDir, 'drawer/controls.css'), comment: 'Drawer Controls' },
    { path: join(srcDir, 'drawer/themes.css'), comment: 'Drawer Themes' },
    { path: join(srcDir, 'drawer/trigger.css'), comment: 'Drawer Trigger' },
    { path: join(srcDir, 'drawer/slider.css'), comment: 'Drawer Slider' },
  ];

  const parts: string[] = [
    '/**',
    ' * @admin-core/preferences - Bundled CSS',
    ' * @description 合并后的样式文件，可直接导入使用',
    ' * @usage @import "@admin-core/preferences/styles";',
    ' */',
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
async function generateTokensCSS(): Promise<string> {
  const { generateCSSVariables } = await import('./src/config/tokens/generate-css');
  const css = generateCSSVariables();
  const destDir = 'dist/styles/css';
  if (!existsSync(destDir)) {
    mkdirSync(destDir, { recursive: true });
  }
  writeFileSync(join(destDir, 'tokens.css'), css);
  
  // 同时写入 src 目录供开发时使用
  const srcDir = 'src/styles/css';
  writeFileSync(join(srcDir, 'tokens.css'), css);
  
  return css;
}

export default defineConfig([
  // ESM 和 CJS 格式（NPM 使用）
  {
    entry: {
      index: 'src/index.ts',
      'styles/tailwind/preset': 'src/styles/tailwind/preset.ts',
    },
    format: ['cjs', 'esm'],
    dts: true,
    splitting: true,
    sourcemap: process.env.NODE_ENV !== 'production',
    clean: true,
    treeshake: true,
    minify: true,
    target: 'es2020',
    external: ['culori'],
    esbuildOptions(options) {
      options.banner = {
        js: '/* @admin-core/preferences */',
      };
    },
    onSuccess: async () => {
      // 生成设计令牌 CSS
      const tokensCSS = await generateTokensCSS();
      console.log('Design tokens CSS generated');
      
      // 复制原始 CSS 文件（保留分离的文件结构供高级用户使用）
      copyDir('src/styles/css', 'dist/styles/css');
      console.log('CSS files copied successfully');
      
      // 生成合并后的 CSS 文件（主要入口，无 @import）
      const bundledCSS = generateBundledCSS(tokensCSS);
      writeFileSync('dist/styles/css/index.css', bundledCSS);
      console.log('Bundled CSS generated (no @import statements)');
    },
  },
  // IIFE 格式（CDN 使用）
  {
    entry: ['src/index.ts'],
    outDir: 'dist',
    format: ['iife'],
    globalName: 'AdminCorePreferences',
    outExtension: () => ({ js: '.global.js' }),
    sourcemap: process.env.NODE_ENV !== 'production',
    treeshake: true,
    minify: true,
    target: 'es2020',
    // CDN 版本内联 culori 依赖
    noExternal: ['culori'],
    esbuildOptions(options) {
      options.banner = {
        js: '/* @admin-core/preferences - CDN Build */',
      };
    },
  },
]);
