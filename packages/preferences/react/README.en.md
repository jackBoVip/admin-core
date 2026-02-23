# @admin-core/preferences-react

English | [简体中文](./README.md)

> React 18 integration for @admin-core/preferences with hooks and components.

## Features

- **React 18+ Support**: Built with React 18 features including `useSyncExternalStore`
- **Hooks API**: Clean and intuitive hooks for state management
- **Ready-to-use Components**: Pre-built drawer, tabs, and form components
- **TypeScript**: Full type safety with comprehensive type definitions
- **Optimized Rendering**: Smart subscriptions to minimize re-renders

## Public API

- **Initialization**: `initPreferences`, `destroyPreferences`, `getPreferencesManager`
- **Providers & Components**: `PreferencesProvider`, `PreferencesDrawer`, `PreferencesTrigger`, tabs and form items
- **Hooks**: `usePreferences`, `usePreferencesContext`, `usePreferencesCategory`, `useLayout`, `useTheme`, `useDebouncedValue`, `useAdminAntdTheme`
- **Re-exports**: core types, constants, locales, and icons from `@admin-core/preferences`

## Export Index (Entry-Aligned)

Notes:
- Entry file: `src/index.ts`
- Published types: `dist/index.d.ts`
- For complete symbols, use `src/index.ts` and `dist/index.d.ts` as source of truth.

Entry groups:
1. Initialization: `initPreferences`, `destroyPreferences`, `getPreferencesManager`
2. Hooks: `usePreferences`, `usePreferencesContext`, `usePreferencesCategory`, `useLayout`, `useTheme`, `useDebouncedValue`, `useAdminAntdTheme`
3. Components: `PreferencesProvider`, `PreferencesDrawer`, `PreferencesTrigger`, `AppearanceTab`, `LayoutTab`, `ShortcutKeysTab`, `GeneralTab`, `PreferencesBlock`, `PreferencesSwitchItem`, `PreferencesSelectItem`, `PreferencesSliderItem`
4. Icon components: `Icon`, `AdminIcon`, `LayoutIcon`, `AdminLayoutIcon`
5. Core re-exports: preference types, constants, and locales from `@admin-core/preferences`

## Installation

```bash
# npm
npm install @admin-core/preferences-react

# pnpm
pnpm add @admin-core/preferences-react

# yarn
yarn add @admin-core/preferences-react
```

**Peer Dependencies:**
- `react >= 18.0.0`
- `react-dom >= 18.0.0`


### CDN (Production / Development)

```html
<!-- jsDelivr (recommended) -->
<script src="https://cdn.jsdelivr.net/npm/@admin-core/preferences-react/dist/index.global.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@admin-core/preferences-react/dist/index.global.dev.js"></script>

<!-- unpkg -->
<script src="https://unpkg.com/@admin-core/preferences-react/dist/index.global.js"></script>
<script src="https://unpkg.com/@admin-core/preferences-react/dist/index.global.dev.js"></script>
```

## Quick Start

### 1. Initialize Preferences

```tsx
// main.tsx or App.tsx
import { initPreferences } from '@admin-core/preferences-react';
import '@admin-core/preferences/styles';

// Initialize once at app startup
initPreferences({
  namespace: 'my-app',
  overrides: {
    theme: { colorPrimary: 'oklch(0.6 0.2 250)' },
    app: { locale: 'en-US' },
  },
});
```

### 2. Use PreferencesProvider (Recommended)

The `PreferencesProvider` component integrates lock screen, shortcut keys, and preferences drawer automatically.

```tsx
// App.tsx
import { PreferencesProvider } from '@admin-core/preferences-react';

function App() {
  const handleLogout = () => {
    // Handle logout
  };

  const handleSearch = () => {
    // Handle global search
  };

  return (
    <PreferencesProvider
      onLogout={handleLogout}
      onSearch={handleSearch}
    >
      <YourAppContent />
    </PreferencesProvider>
  );
}
```

### 3. Use Hooks in Components

```tsx
import { usePreferences, usePreferencesContext } from '@admin-core/preferences-react';

function MyComponent() {
  // Access preferences state
  const { preferences, setPreferences, isDark, toggleTheme } = usePreferences();
  
  // Access provider context (lock, drawer controls)
  const { lock, togglePreferences, isPreferencesOpen } = usePreferencesContext();

  return (
    <div>
      <p>Current theme: {isDark ? 'Dark' : 'Light'}</p>
      <button onClick={toggleTheme}>Toggle Theme</button>
      <button onClick={togglePreferences}>Open Settings</button>
      <button onClick={lock}>Lock Screen</button>
    </div>
  );
}
```

## Advanced Usage

### Using Individual Hooks

```tsx
import { useTheme, useLayout } from '@admin-core/preferences-react';

function ThemeToggle() {
  const { isDark, toggleTheme, setPrimaryColor } = useTheme();
  
  return (
    <div>
      <button onClick={toggleTheme}>
        {isDark ? '🌙' : '☀️'}
      </button>
      <button onClick={() => setPrimaryColor('oklch(0.6 0.2 150)')}>
        Green Theme
      </button>
    </div>
  );
}

function SidebarToggle() {
  const { isSidebarCollapsed, toggleSidebar, setLayout } = useLayout();
  
  return (
    <div>
      <button onClick={toggleSidebar}>
        {isSidebarCollapsed ? 'Expand' : 'Collapse'}
      </button>
      <button onClick={() => setLayout('header-nav')}>
        Use Header Nav
      </button>
    </div>
  );
}
```

### Using Category Hook

```tsx
import { usePreferencesCategory } from '@admin-core/preferences-react';

function TabbarSettings() {
  const { value, setValue, reset } = usePreferencesCategory('tabbar');
  
  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={value.enable}
          onChange={(e) => setValue({ enable: e.target.checked })}
        />
        Enable Tabbar
      </label>
      <button onClick={reset}>Reset to Default</button>
    </div>
  );
}
```

### Using Components Standalone

```tsx
import {
  PreferencesDrawer,
  PreferencesTrigger,
  AppearanceTab,
  LayoutTab,
} from '@admin-core/preferences-react';

function Settings() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <PreferencesTrigger onClick={() => setOpen(true)} />
      
      <PreferencesDrawer
        open={open}
        onOpenChange={setOpen}
        defaultTab="appearance"
      />
    </>
  );
}
```

## Components

### PreferencesProvider

Main wrapper component that provides context and integrates features.

```tsx
<PreferencesProvider
  onLogout={() => {}}           // Logout callback
  onSearch={() => {}}           // Search callback
  lockScreenBackground="url"    // Custom lock screen background
  enableShortcuts={true}        // Enable keyboard shortcuts
  enableLockScreen={true}       // Enable lock screen feature
>
  {children}
</PreferencesProvider>
```

### PreferencesDrawer

Settings drawer with tab-based navigation.

```tsx
<PreferencesDrawer
  open={open}                    // Controlled open state
  onOpenChange={setOpen}         // Open state change handler
  defaultTab="appearance"        // Default active tab
  tabs={['appearance', 'layout', 'general', 'shortcuts']} // Visible tabs
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

- [@admin-core/preferences](../core/README.en.md) - Core package
- [@admin-core/preferences-vue](../vue/README.en.md) - Vue integration

## License

MIT
