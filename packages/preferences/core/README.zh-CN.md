# @admin-core/preferences

> 框架无关的偏好设置管理系统，支持 OKLCH 颜色系统、多 UI 库适配和国际化。

## 特性

- **框架无关**: 核心逻辑不依赖 Vue/React
- **OKLCH 颜色系统**: 只需配置主色，语义色自动派生
- **多 UI 库适配**: 支持 Ant Design、Element Plus、Naive UI、shadcn/ui
- **国际化**: 内置中英文语言包
- **可配置**: 所有设置通过配置文件管理，禁止硬编码
- **TypeScript**: 完整的类型定义，类型安全
- **Tailwind CSS**: 内置预设，无缝集成 Tailwind

## 安装

```bash
# npm
npm install @admin-core/preferences

# pnpm
pnpm add @admin-core/preferences

# yarn
yarn add @admin-core/preferences
```

## 快速开始

```typescript
import { createPreferencesManager } from '@admin-core/preferences';
import '@admin-core/preferences/styles';

// 创建管理器，可选覆盖默认配置
const manager = createPreferencesManager({
  namespace: 'my-app',
  overrides: {
    theme: {
      colorPrimary: 'oklch(0.6 0.2 250)', // 蓝色
      mode: 'auto',
    },
    app: {
      layout: 'sidebar-nav',
      locale: 'zh-CN',
    },
  },
});

// 初始化
manager.init();

// 订阅变更
manager.subscribe((preferences) => {
  console.log('偏好设置更新:', preferences);
});

// 更新偏好设置
manager.set('theme', { colorPrimary: 'oklch(0.6 0.2 150)' });

// 获取当前偏好设置
const current = manager.get();
```

## OKLCH 颜色系统

偏好设置系统使用 OKLCH 色彩空间进行颜色处理。您只需配置主色，语义色会自动派生：

```typescript
import { deriveSemanticColors } from '@admin-core/preferences';

// 主色
const primary = 'oklch(0.55 0.2 250)';

// 语义色自动派生
const semanticColors = deriveSemanticColors(primary);
// {
//   success: 'oklch(0.55 0.2 35)',   // 色相 +145°
//   warning: 'oklch(0.55 0.2 335)',  // 色相 +85°
//   destructive: 'oklch(0.55 0.2 280)', // 色相 +30°
//   info: 'oklch(0.55 0.2 220)',     // 色相 -30°
// }
```

## UI 库适配

根据您使用的 UI 库导入相应的 CSS 适配器：

```typescript
// Ant Design
import '@admin-core/preferences/styles/antd';

// Element Plus
import '@admin-core/preferences/styles/element';

// Naive UI
import '@admin-core/preferences/styles/naive';

// shadcn/ui
import '@admin-core/preferences/styles/shadcn';

// 所有适配器
import '@admin-core/preferences/styles/adapters';
```

## Tailwind CSS 集成

```javascript
// tailwind.config.js
import { adminCorePreset } from '@admin-core/preferences/tailwind';

export default {
  presets: [adminCorePreset],
  content: ['./src/**/*.{js,ts,jsx,tsx,vue}'],
};
```

## 配置选项

### 初始化选项

| 选项 | 类型 | 描述 |
|------|------|------|
| `namespace` | `string` | 存储命名空间，用于持久化 |
| `overrides` | `DeepPartial<Preferences>` | 覆盖默认偏好设置 |
| `storage` | `StorageAdapter` | 自定义存储适配器 |
| `i18n` | `I18nAdapter` | 自定义国际化适配器 |

### 偏好设置结构

完整的偏好设置接口请参见 [API 文档](./API.md)。

## 国际化

```typescript
import { getTranslation, zhCN, enUS } from '@admin-core/preferences';

// 获取翻译
const label = getTranslation('theme.primaryColor', 'zh-CN');

// 直接访问语言包
console.log(enUS.theme.primaryColor); // "Primary Color"
console.log(zhCN.theme.primaryColor); // "主题色"
```

## 框架集成

如需框架特定的集成，请使用专用包：

- **React**: [@admin-core/preferences-react](../react/README.zh-CN.md)
- **Vue**: [@admin-core/preferences-vue](../vue/README.zh-CN.md)

## API 参考

完整的 API 参考请参见 [API 文档](./API.md)。

## 许可证

MIT
