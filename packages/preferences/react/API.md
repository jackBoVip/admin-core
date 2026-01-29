# @admin-core/preferences-react API Reference

## Initialization

### initPreferences

Initialize the global preferences manager. Call once at app startup.

```typescript
function initPreferences(options?: PreferencesInitOptions): PreferencesManager;
```

```tsx
import { initPreferences } from '@admin-core/preferences-react';

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

## Hooks

### usePreferences

Main hook for accessing and managing preferences.

```typescript
function usePreferences(): {
  preferences: Preferences;
  actualThemeMode: 'light' | 'dark';
  isDark: boolean;
  hasChanges: boolean;
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

```tsx
function Settings() {
  const { preferences, isDark, toggleTheme, hasChanges, resetPreferences } = usePreferences();

  return (
    <div>
      <p>Theme: {isDark ? 'Dark' : 'Light'}</p>
      <button onClick={toggleTheme}>Toggle</button>
      {hasChanges && <button onClick={resetPreferences}>Reset</button>}
    </div>
  );
}
```

---

### usePreferencesContext

Access the PreferencesProvider context for lock screen and drawer controls.

```typescript
function usePreferencesContext(): {
  // Lock screen
  isLocked: boolean;
  lock: () => void;
  unlock: (password?: string) => boolean;
  setPassword: (password: string) => Promise<void>;
  clearPassword: () => void;
  hasPassword: boolean;
  
  // Preferences drawer
  isPreferencesOpen: boolean;
  togglePreferences: () => void;
  openPreferences: () => void;
  closePreferences: () => void;
};
```

#### Example

```tsx
function Header() {
  const { lock, togglePreferences, isLocked } = usePreferencesContext();

  return (
    <header>
      <button onClick={togglePreferences}>Settings</button>
      <button onClick={lock} disabled={isLocked}>Lock</button>
    </header>
  );
}
```

---

### usePreferencesCategory

Hook for accessing a specific preferences category with optimized re-renders.

```typescript
function usePreferencesCategory<K extends PreferencesKeys>(key: K): {
  value: Preferences[K];
  setValue: (updates: DeepPartial<Preferences[K]>) => void;
  reset: () => void;
};
```

#### Example

```tsx
function SidebarSettings() {
  const { value, setValue, reset } = usePreferencesCategory('sidebar');

  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={value.collapsed}
          onChange={(e) => setValue({ collapsed: e.target.checked })}
        />
        Collapsed
      </label>
      <input
        type="number"
        value={value.width}
        onChange={(e) => setValue({ width: Number(e.target.value) })}
      />
      <button onClick={reset}>Reset</button>
    </div>
  );
}
```

---

### useTheme

Hook for theme-specific preferences.

```typescript
function useTheme(): {
  theme: ThemePreferences;
  actualThemeMode: 'light' | 'dark';
  isDark: boolean;
  setTheme: (updates: DeepPartial<ThemePreferences>) => void;
  setMode: (mode: ThemeModeType) => void;
  setPrimaryColor: (color: string) => void;
  setBuiltinTheme: (theme: BuiltinThemeType) => void;
  setRadius: (radius: string) => void;
  toggleTheme: () => void;
};
```

#### Example

```tsx
function ThemeSettings() {
  const { theme, isDark, setPrimaryColor, setMode, toggleTheme } = useTheme();

  return (
    <div>
      <button onClick={toggleTheme}>{isDark ? '🌙' : '☀️'}</button>
      <select value={theme.mode} onChange={(e) => setMode(e.target.value as ThemeModeType)}>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="auto">Auto</option>
      </select>
      <input
        type="color"
        value={theme.colorPrimary}
        onChange={(e) => setPrimaryColor(e.target.value)}
      />
    </div>
  );
}
```

---

### useLayout

Hook for layout-specific preferences.

```typescript
function useLayout(): {
  app: AppPreferences;
  sidebar: SidebarPreferences;
  header: HeaderPreferences;
  tabbar: TabbarPreferences;
  footer: FooterPreferences;
  breadcrumb: BreadcrumbPreferences;
  isSidebarCollapsed: boolean;
  currentLayout: LayoutType;
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

```tsx
function LayoutSettings() {
  const { currentLayout, setLayout, isSidebarCollapsed, toggleSidebar } = useLayout();

  return (
    <div>
      <select value={currentLayout} onChange={(e) => setLayout(e.target.value as LayoutType)}>
        <option value="sidebar-nav">Sidebar Nav</option>
        <option value="header-nav">Header Nav</option>
        <option value="sidebar-mixed-nav">Mixed Nav</option>
      </select>
      <button onClick={toggleSidebar}>
        {isSidebarCollapsed ? 'Expand' : 'Collapse'} Sidebar
      </button>
    </div>
  );
}
```

---

## Components

### PreferencesProvider

Main wrapper component that provides context and integrates lock screen, shortcuts, and drawer.

```typescript
interface PreferencesProviderProps {
  children: React.ReactNode;
  onLogout?: () => void;
  onSearch?: () => void;
  lockScreenBackground?: string;
  enableShortcuts?: boolean;
  enableLockScreen?: boolean;
}
```

#### Example

```tsx
<PreferencesProvider
  onLogout={() => authService.logout()}
  onSearch={() => setSearchOpen(true)}
  lockScreenBackground="/images/lock-bg.jpg"
  enableShortcuts={true}
  enableLockScreen={true}
>
  <App />
</PreferencesProvider>
```

---

### PreferencesDrawer

Settings drawer with tab-based navigation.

```typescript
interface PreferencesDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: 'appearance' | 'layout' | 'general' | 'shortcuts';
  tabs?: Array<'appearance' | 'layout' | 'general' | 'shortcuts'>;
  className?: string;
}
```

#### Example

```tsx
function SettingsButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)}>Settings</button>
      <PreferencesDrawer
        open={open}
        onOpenChange={setOpen}
        defaultTab="appearance"
        tabs={['appearance', 'layout']}
      />
    </>
  );
}
```

---

### PreferencesTrigger

Floating button to trigger the preferences drawer.

```typescript
interface PreferencesTriggerProps {
  onClick?: () => void;
  position?: 'left' | 'right';
  className?: string;
}
```

---

### Tab Components

#### AppearanceTab

Theme and appearance settings.

```typescript
interface AppearanceTabProps {
  className?: string;
}
```

#### LayoutTab

Layout configuration settings.

```typescript
interface LayoutTabProps {
  className?: string;
}
```

#### GeneralTab

General application settings.

```typescript
interface GeneralTabProps {
  className?: string;
}
```

#### ShortcutKeysTab

Keyboard shortcuts configuration.

```typescript
interface ShortcutKeysTabProps {
  className?: string;
}
```

---

### Form Components

#### PreferencesBlock

Section container with title.

```typescript
interface PreferencesBlockProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}
```

#### PreferencesSwitchItem

Toggle switch control.

```typescript
interface PreferencesSwitchItemProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  description?: string;
}
```

#### PreferencesSelectItem

Dropdown select control.

```typescript
interface PreferencesSelectItemProps {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  disabled?: boolean;
}
```

#### PreferencesSliderItem

Range slider control.

```typescript
interface PreferencesSliderItemProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  formatValue?: (value: number) => string;
}
```

---

### Icon Components

#### Icon

General icon component.

```typescript
interface IconProps {
  name: IconName;
  size?: IconSize | number;
  className?: string;
}
```

#### LayoutIcon

Layout preview icon component.

```typescript
interface LayoutIconProps {
  layout: LayoutType;
  active?: boolean;
  className?: string;
}
```

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
