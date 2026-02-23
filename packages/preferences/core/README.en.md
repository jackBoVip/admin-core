# @admin-core/preferences

English | [简体中文](./README.md)

> Framework-agnostic preferences management system with OKLCH color system, multi-UI library support, and i18n.

## Features

- **Framework Agnostic**: Core logic independent of Vue/React
- **OKLCH Color System**: Configure only the primary color, semantic colors are derived automatically
- **Multi-UI Library Support**: Adapters for Ant Design, Element Plus, Naive UI, shadcn/ui
- **Internationalization**: Built-in English and Chinese language packs
- **Configurable**: All settings managed through configuration, no hardcoding
- **TypeScript**: Full type safety with comprehensive type definitions
- **Tailwind CSS**: Built-in preset for seamless Tailwind integration

## Public API

- **Manager**: `createPreferencesManager`, `PreferencesManager`, lifecycle helpers
- **Actions & Store**: `createPreferencesActions`, `createThemeActions`, `createLayoutActions`, `getDefaultPreferencesStore`
- **Utilities**: storage helpers, config import/export, shortcuts, i18n helpers
- **Styles & Tokens**: CSS variable helpers, Tailwind preset, theme tokens

## Export Index (Entry-Aligned)

Notes:
- Entry file: `src/index.ts`
- Published types: `dist/index.d.ts`
- README focuses on high-frequency APIs. For the full symbol list, use `API.md` and `dist/index.d.ts`.

Entry export groups:
1. Manager: `createPreferencesManager`, `PreferencesManager`, `ManagerLifecycle`
2. Actions: `createPreferencesActions`, `createThemeActions`, `createLayoutActions`
3. Store: `getDefaultPreferencesStore`
4. Controllers: `createSliderController`, `createCopyButtonController`
5. Helpers: `mapPreferencesToLayoutProps`, `generateThemeCSSVariables`, `generateThemeClasses`, `createTranslatedOptions`, etc.
6. Config/Tokens: `DEFAULT_PREFERENCES`, `configureDesignTokens`, `generateCSSVariables`, `SHORTCUT_KEY_BINDINGS`, etc.
7. Locales: `zhCN`, `enUS`, `supportedLocales`, `getLocaleMessages`
8. Constants: `COLOR_PRESETS`, `LAYOUT_OPTIONS`, `PAGE_TRANSITION_OPTIONS`, `TABS_STYLE_OPTIONS`

Subpath exports (`package.json`):
- `@admin-core/preferences/styles`
- `@admin-core/preferences/styles/antd`
- `@admin-core/preferences/styles/element`
- `@admin-core/preferences/styles/naive`
- `@admin-core/preferences/styles/shadcn`
- `@admin-core/preferences/styles/adapters`
- `@admin-core/preferences/tailwind`

## Installation

```bash
# npm
npm install @admin-core/preferences

# pnpm
pnpm add @admin-core/preferences

# yarn
yarn add @admin-core/preferences
```


### CDN (Production / Development)

```html
<!-- jsDelivr (recommended) -->
<script src="https://cdn.jsdelivr.net/npm/@admin-core/preferences/dist/index.global.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@admin-core/preferences/dist/index.global.dev.js"></script>

<!-- unpkg -->
<script src="https://unpkg.com/@admin-core/preferences/dist/index.global.js"></script>
<script src="https://unpkg.com/@admin-core/preferences/dist/index.global.dev.js"></script>
```

## Quick Start

```typescript
import { createPreferencesManager } from '@admin-core/preferences';
import '@admin-core/preferences/styles';

// Create manager with optional overrides
const manager = createPreferencesManager({
  namespace: 'my-app',
  overrides: {
    theme: {
      colorPrimary: 'oklch(0.6 0.2 250)', // Blue
      mode: 'auto',
    },
    app: {
      layout: 'sidebar-nav',
      locale: 'en-US',
    },
  },
});

// Initialize
manager.init();

// Subscribe to changes
manager.subscribe((preferences) => {
  console.log('Preferences updated:', preferences);
});

// Update preferences
manager.set('theme', { colorPrimary: 'oklch(0.6 0.2 150)' });

// Get current preferences
const current = manager.get();
```

## OKLCH Color System

The preferences system uses OKLCH color space for better color manipulation. You only need to configure the primary color, and semantic colors are automatically derived:

```typescript
import { deriveSemanticColors } from '@admin-core/preferences';

// Primary color
const primary = 'oklch(0.55 0.2 250)';

// Semantic colors are derived automatically
const semanticColors = deriveSemanticColors(primary);
// {
//   success: 'oklch(0.55 0.2 35)',   // +145° hue rotation
//   warning: 'oklch(0.55 0.2 335)',  // +85° hue rotation
//   destructive: 'oklch(0.55 0.2 280)', // +30° hue rotation
//   info: 'oklch(0.55 0.2 220)',     // -30° hue rotation
// }
```

## UI Library Adapters

Import the appropriate CSS adapter for your UI library:

```typescript
// Ant Design
import '@admin-core/preferences/styles/antd';

// Element Plus
import '@admin-core/preferences/styles/element';

// Naive UI
import '@admin-core/preferences/styles/naive';

// shadcn/ui
import '@admin-core/preferences/styles/shadcn';

// All adapters
import '@admin-core/preferences/styles/adapters';
```

## Tailwind CSS Integration

```javascript
// tailwind.config.js
import { adminCorePreset } from '@admin-core/preferences/tailwind';

export default {
  presets: [adminCorePreset],
  content: ['./src/**/*.{js,ts,jsx,tsx,vue}'],
};
```

## Configuration Options

### Initialization Options

| Option | Type | Description |
|--------|------|-------------|
| `namespace` | `string` | Storage namespace for persistence |
| `overrides` | `DeepPartial<Preferences>` | Override default preferences |
| `storage` | `StorageAdapter` | Custom storage adapter |
| `i18n` | `I18nAdapter` | Custom i18n adapter |

### Preferences Structure

See [API Documentation](./API.md) for complete preferences interface.

## Internationalization

```typescript
import { getTranslation, zhCN, enUS } from '@admin-core/preferences';

// Get translation
const label = getTranslation('theme.primaryColor', 'en-US');

// Access locale messages directly
console.log(enUS.theme.primaryColor); // "Primary Color"
console.log(zhCN.theme.primaryColor); // "主题色"
```

## Framework Integration

For framework-specific integration, use the dedicated packages:

- **React**: [@admin-core/preferences-react](../react/README.en.md)
- **Vue**: [@admin-core/preferences-vue](../vue/README.en.md)

## API Reference

See [API Documentation](./API.md) for complete API reference.

## License

MIT
