# @admin-core/preferences-vue API Reference

## Initialization

### initPreferences

Initialize the global preferences manager. Call once at app startup.

```typescript
function initPreferences(options?: PreferencesInitOptions): PreferencesManager;
```

```typescript
import { initPreferences } from '@admin-core/preferences-vue';

initPreferences({
  namespace: 'my-app',
  overrides: {
    theme: { colorPrimary: 'oklch(0.6 0.2 250)' },
  },
});
```

### getPreferencesManager

Get the current preferences manager instance.

```typescript
function getPreferencesManager(): PreferencesManager;
```

### destroyPreferences

Destroy the preferences manager and cleanup resources.

```typescript
function destroyPreferences(): void;
```

---

## Composables

### usePreferences

Main composable for accessing and managing preferences.

```typescript
function usePreferences(): {
  preferences: ComputedRef<Preferences | null>;
  actualThemeMode: ComputedRef<'light' | 'dark'>;
  isDark: ComputedRef<boolean>;
  hasChanges: ComputedRef<boolean>;
  setPreferences: (updates: DeepPartial<Preferences>) => void;
  resetPreferences: () => void;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  exportConfig: () => string;
  importConfig: (json: string) => ImportConfigResult;
  manager: PreferencesManager;
};
```

#### Example

```vue
<script setup lang="ts">
import { usePreferences } from '@admin-core/preferences-vue';

const { preferences, isDark, toggleTheme, hasChanges, resetPreferences } = usePreferences();
</script>

<template>
  <div>
    <p>Theme: {{ isDark ? 'Dark' : 'Light' }}</p>
    <button @click="toggleTheme">Toggle</button>
    <button v-if="hasChanges" @click="resetPreferences">Reset</button>
  </div>
</template>
```

---

### usePreferencesContext

Access the PreferencesProvider context for lock screen and drawer controls.

```typescript
function usePreferencesContext(): PreferencesContextValue;

interface PreferencesContextValue {
  // Lock screen
  isLocked: Ref<boolean>;
  lock: () => void;
  unlock: (password?: string) => boolean;
  setPassword: (password: string) => Promise<void>;
  clearPassword: () => void;
  hasPassword: Ref<boolean>;
  
  // Preferences drawer
  isPreferencesOpen: Ref<boolean>;
  togglePreferences: () => void;
  openPreferences: () => void;
  closePreferences: () => void;
}
```

#### Example

```vue
<script setup lang="ts">
import { usePreferencesContext } from '@admin-core/preferences-vue';

const { lock, togglePreferences, isLocked } = usePreferencesContext();
</script>

<template>
  <header>
    <button @click="togglePreferences">Settings</button>
    <button @click="lock" :disabled="isLocked">Lock</button>
  </header>
</template>
```

---

### usePreferencesCategory

Composable for accessing a specific preferences category with optimized reactivity.

```typescript
function usePreferencesCategory<K extends PreferencesKeys>(key: K): {
  value: ComputedRef<Preferences[K] | undefined>;
  setValue: (updates: DeepPartial<Preferences[K]>) => void;
  reset: () => void;
};
```

#### Example

```vue
<script setup lang="ts">
import { usePreferencesCategory } from '@admin-core/preferences-vue';

const { value, setValue, reset } = usePreferencesCategory('sidebar');
</script>

<template>
  <div>
    <label>
      <input
        type="checkbox"
        :checked="value?.collapsed"
        @change="(e) => setValue({ collapsed: (e.target as HTMLInputElement).checked })"
      />
      Collapsed
    </label>
    <input
      type="number"
      :value="value?.width"
      @input="(e) => setValue({ width: Number((e.target as HTMLInputElement).value) })"
    />
    <button @click="reset">Reset</button>
  </div>
</template>
```

---

### useTheme

Composable for theme-specific preferences.

```typescript
function useTheme(): {
  theme: ComputedRef<ThemePreferences | undefined>;
  actualThemeMode: ComputedRef<'light' | 'dark'>;
  isDark: ComputedRef<boolean>;
  setTheme: (updates: DeepPartial<ThemePreferences>) => void;
  setMode: (mode: ThemeModeType) => void;
  setPrimaryColor: (color: string) => void;
  setBuiltinTheme: (theme: BuiltinThemeType) => void;
  setRadius: (radius: string) => void;
  toggleTheme: () => void;
};
```

#### Example

```vue
<script setup lang="ts">
import { useTheme } from '@admin-core/preferences-vue';

const { theme, isDark, setPrimaryColor, setMode, toggleTheme } = useTheme();
</script>

<template>
  <div>
    <button @click="toggleTheme">{{ isDark ? '🌙' : '☀️' }}</button>
    <select :value="theme?.mode" @change="(e) => setMode((e.target as HTMLSelectElement).value as any)">
      <option value="light">Light</option>
      <option value="dark">Dark</option>
      <option value="auto">Auto</option>
    </select>
  </div>
</template>
```

---

### useLayout

Composable for layout-specific preferences.

```typescript
function useLayout(): {
  app: ComputedRef<AppPreferences | undefined>;
  sidebar: ComputedRef<SidebarPreferences | undefined>;
  header: ComputedRef<HeaderPreferences | undefined>;
  tabbar: ComputedRef<TabbarPreferences | undefined>;
  footer: ComputedRef<FooterPreferences | undefined>;
  breadcrumb: ComputedRef<BreadcrumbPreferences | undefined>;
  isSidebarCollapsed: ComputedRef<boolean>;
  currentLayout: ComputedRef<LayoutType | undefined>;
  setApp: (updates: DeepPartial<AppPreferences>) => void;
  setLayout: (layout: LayoutType) => void;
  setSidebar: (updates: DeepPartial<SidebarPreferences>) => void;
  setHeader: (updates: DeepPartial<HeaderPreferences>) => void;
  setTabbar: (updates: DeepPartial<TabbarPreferences>) => void;
  setFooter: (updates: DeepPartial<FooterPreferences>) => void;
  setBreadcrumb: (updates: DeepPartial<BreadcrumbPreferences>) => void;
  toggleSidebarCollapsed: () => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
};
```

#### Example

```vue
<script setup lang="ts">
import { useLayout } from '@admin-core/preferences-vue';

const { currentLayout, setLayout, isSidebarCollapsed, toggleSidebar } = useLayout();
</script>

<template>
  <div>
    <select :value="currentLayout" @change="(e) => setLayout((e.target as HTMLSelectElement).value as any)">
      <option value="sidebar-nav">Sidebar Nav</option>
      <option value="header-nav">Header Nav</option>
      <option value="sidebar-mixed-nav">Mixed Nav</option>
    </select>
    <button @click="toggleSidebar">
      {{ isSidebarCollapsed ? 'Expand' : 'Collapse' }} Sidebar
    </button>
  </div>
</template>
```

---

## Components

### PreferencesProvider

Main wrapper component that provides context and integrates lock screen, shortcuts, and drawer.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `lockScreenBackground` | `string` | - | Custom lock screen background URL |
| `enableShortcuts` | `boolean` | `true` | Enable keyboard shortcuts |
| `enableLockScreen` | `boolean` | `true` | Enable lock screen feature |

#### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `logout` | - | Emitted when logout shortcut is triggered |
| `search` | - | Emitted when search shortcut is triggered |

#### Example

```vue
<PreferencesProvider
  @logout="handleLogout"
  @search="handleSearch"
  lock-screen-background="/images/lock-bg.jpg"
  :enable-shortcuts="true"
  :enable-lock-screen="true"
>
  <App />
</PreferencesProvider>
```

---

### PreferencesDrawer

Settings drawer with tab-based navigation.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` | `false` | Controlled open state (v-model) |
| `defaultTab` | `string` | `'appearance'` | Default active tab |
| `tabs` | `string[]` | All tabs | Visible tabs |
| `class` | `string` | - | Additional CSS class |

#### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `update:open` | `boolean` | Open state change |

#### Example

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { PreferencesDrawer } from '@admin-core/preferences-vue';

const open = ref(false);
</script>

<template>
  <button @click="open = true">Settings</button>
  <PreferencesDrawer
    v-model:open="open"
    default-tab="appearance"
    :tabs="['appearance', 'layout']"
  />
</template>
```

---

### PreferencesTrigger

Floating button to trigger the preferences drawer.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `position` | `'left' \| 'right'` | `'right'` | Button position |
| `class` | `string` | - | Additional CSS class |

#### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `click` | - | Button clicked |

---

### Tab Components

#### AppearanceTab

Theme and appearance settings.

#### LayoutTab

Layout configuration settings.

#### GeneralTab

General application settings.

#### ShortcutKeysTab

Keyboard shortcuts configuration.

---

### Form Components

#### PreferencesBlock

Section container with title.

| Prop | Type | Description |
|------|------|-------------|
| `title` | `string` | Block title |

#### PreferencesSwitchItem

Toggle switch control.

| Prop | Type | Description |
|------|------|-------------|
| `label` | `string` | Label text |
| `modelValue` | `boolean` | Switch state (v-model) |
| `disabled` | `boolean` | Disabled state |
| `description` | `string` | Description text |

#### PreferencesSelectItem

Dropdown select control.

| Prop | Type | Description |
|------|------|-------------|
| `label` | `string` | Label text |
| `modelValue` | `string` | Selected value (v-model) |
| `options` | `Array<{value, label}>` | Options |
| `disabled` | `boolean` | Disabled state |

#### PreferencesSliderItem

Range slider control.

| Prop | Type | Description |
|------|------|-------------|
| `label` | `string` | Label text |
| `modelValue` | `number` | Current value (v-model) |
| `min` | `number` | Minimum value |
| `max` | `number` | Maximum value |
| `step` | `number` | Step increment |
| `disabled` | `boolean` | Disabled state |
| `formatValue` | `(v: number) => string` | Value formatter |

---

### Icon Components

#### Icon

General icon component.

| Prop | Type | Description |
|------|------|-------------|
| `name` | `IconName` | Icon name |
| `size` | `IconSize \| number` | Icon size |
| `class` | `string` | Additional CSS class |

#### LayoutIcon

Layout preview icon component.

| Prop | Type | Description |
|------|------|-------------|
| `layout` | `LayoutType` | Layout type |
| `active` | `boolean` | Active state |
| `class` | `string` | Additional CSS class |

---

## Re-exported from Core

The following are re-exported from `@admin-core/preferences` for convenience:

### Types

- `Preferences`
- `PreferencesKeys`
- `PreferencesInitOptions`
- `ThemePreferences`
- `AppPreferences`
- `SidebarPreferences`
- `HeaderPreferences`
- `TabbarPreferences`
- `FooterPreferences`
- `BreadcrumbPreferences`
- `ThemeModeType`
- `LayoutType`
- `BuiltinThemeType`
- `DeepPartial`
- `IconName`
- `IconSize`

### Constants

- `DEFAULT_PREFERENCES`
- `BUILT_IN_THEME_PRESETS`
- `COLOR_PRESETS`
- `LAYOUT_OPTIONS`
- `PAGE_TRANSITION_OPTIONS`
- `TABS_STYLE_OPTIONS`

### Locales

- `zhCN`
- `enUS`
- `getLocaleLabel`
- `getLocaleMessages`
- `supportedLocales`

### Assets

- `defaultLockScreenBg`
