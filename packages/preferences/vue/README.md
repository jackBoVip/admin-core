# @admin-core/preferences-vue

English | [简体中文](./README.zh-CN.md)

> Vue 3 integration for @admin-core/preferences with composables and components.

## Features

- **Vue 3 Support**: Built with Vue 3 Composition API
- **Composables API**: Reactive state management with Vue composables
- **Ready-to-use Components**: Pre-built drawer, tabs, and form components
- **TypeScript**: Full type safety with comprehensive type definitions
- **Optimized Reactivity**: Efficient subscription management with shallow refs

## Public API

- **Initialization**: `initPreferences`, `destroyPreferences`, `getPreferencesManager`
- **Providers & Components**: `PreferencesProvider`, `PreferencesDrawer`, `PreferencesTrigger`, tabs and form items
- **Composables**: `usePreferences`, `usePreferencesContext`, `usePreferencesCategory`, `useLayout`, `useTheme`
- **Re-exports**: core types, constants, locales, and icons from `@admin-core/preferences`

## Installation

```bash
# npm
npm install @admin-core/preferences-vue

# pnpm
pnpm add @admin-core/preferences-vue

# yarn
yarn add @admin-core/preferences-vue
```

**Peer Dependencies:**
- `vue >= 3.3.0`

## Quick Start

### 1. Initialize Preferences

```typescript
// main.ts
import { createApp } from 'vue';
import { initPreferences } from '@admin-core/preferences-vue';
import '@admin-core/preferences/styles';
import App from './App.vue';

// Initialize once at app startup
initPreferences({
  namespace: 'my-app',
  overrides: {
    theme: { colorPrimary: 'oklch(0.6 0.2 250)' },
    app: { locale: 'zh-CN' },
  },
});

createApp(App).mount('#app');
```

### 2. Use PreferencesProvider (Recommended)

The `PreferencesProvider` component integrates lock screen, shortcut keys, and preferences drawer automatically.

```vue
<!-- App.vue -->
<script setup lang="ts">
import { PreferencesProvider } from '@admin-core/preferences-vue';

const handleLogout = () => {
  // Handle logout
};

const handleSearch = () => {
  // Handle global search
};
</script>

<template>
  <PreferencesProvider @logout="handleLogout" @search="handleSearch">
    <YourAppContent />
  </PreferencesProvider>
</template>
```

### 3. Use Composables in Components

```vue
<script setup lang="ts">
import { usePreferences, usePreferencesContext } from '@admin-core/preferences-vue';

// Access preferences state
const { preferences, setPreferences, isDark, toggleTheme } = usePreferences();

// Access provider context (lock, drawer controls)
const { lock, togglePreferences, isPreferencesOpen } = usePreferencesContext();
</script>

<template>
  <div>
    <p>Current theme: {{ isDark ? 'Dark' : 'Light' }}</p>
    <button @click="toggleTheme">Toggle Theme</button>
    <button @click="togglePreferences">Open Settings</button>
    <button @click="lock">Lock Screen</button>
  </div>
</template>
```

## Advanced Usage

### Using Individual Composables

```vue
<script setup lang="ts">
import { useTheme, useLayout } from '@admin-core/preferences-vue';

const { isDark, toggleTheme, setPrimaryColor } = useTheme();
const { isSidebarCollapsed, toggleSidebar, setLayout } = useLayout();
</script>

<template>
  <div>
    <button @click="toggleTheme">
      {{ isDark ? '🌙' : '☀️' }}
    </button>
    <button @click="() => setPrimaryColor('oklch(0.6 0.2 150)')">
      Green Theme
    </button>
    <button @click="toggleSidebar">
      {{ isSidebarCollapsed ? 'Expand' : 'Collapse' }}
    </button>
    <button @click="() => setLayout('header-nav')">
      Use Header Nav
    </button>
  </div>
</template>
```

### Using Category Composable

```vue
<script setup lang="ts">
import { usePreferencesCategory } from '@admin-core/preferences-vue';

const { value, setValue, reset } = usePreferencesCategory('tabbar');
</script>

<template>
  <div>
    <label>
      <input
        type="checkbox"
        :checked="value?.enable"
        @change="(e) => setValue({ enable: (e.target as HTMLInputElement).checked })"
      />
      Enable Tabbar
    </label>
    <button @click="reset">Reset to Default</button>
  </div>
</template>
```

### Using Components Standalone

```vue
<script setup lang="ts">
import { ref } from 'vue';
import {
  PreferencesDrawer,
  PreferencesTrigger,
} from '@admin-core/preferences-vue';

const open = ref(false);
</script>

<template>
  <PreferencesTrigger @click="open = true" />
  
  <PreferencesDrawer
    v-model:open="open"
    default-tab="appearance"
  />
</template>
```

## Components

### PreferencesProvider

Main wrapper component that provides context and integrates features.

```vue
<PreferencesProvider
  @logout="handleLogout"
  @search="handleSearch"
  lock-screen-background="url"
  :enable-shortcuts="true"
  :enable-lock-screen="true"
>
  <slot />
</PreferencesProvider>
```

### PreferencesDrawer

Settings drawer with tab-based navigation.

```vue
<PreferencesDrawer
  v-model:open="open"
  default-tab="appearance"
  :tabs="['appearance', 'layout', 'general', 'shortcuts']"
/>
```

### Tab Components

Individual tab components that can be used standalone:

- `AppearanceTab` - Theme, colors, mode settings
- `LayoutTab` - Layout type, sidebar, header settings
- `GeneralTab` - Language, shortcuts, watermark settings
- `ShortcutKeysTab` - Keyboard shortcuts configuration

### Form Components

Building blocks for custom settings UI:

- `PreferencesBlock` - Section container with title
- `PreferencesSwitchItem` - Toggle switch
- `PreferencesSelectItem` - Dropdown select
- `PreferencesSliderItem` - Range slider

## API Reference

See [API Documentation](./API.md) for complete API reference.

## Related

- [@admin-core/preferences](../core/README.md) - Core package
- [@admin-core/preferences-react](../react/README.md) - React integration

## License

MIT
