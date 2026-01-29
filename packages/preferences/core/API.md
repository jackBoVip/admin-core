# @admin-core/preferences API Reference

## Manager API

### createPreferencesManager

Create a preferences manager instance.

```typescript
function createPreferencesManager(options?: PreferencesInitOptions): PreferencesManager;
```

#### PreferencesInitOptions

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `namespace` | `string` | `'admin-core'` | Storage namespace |
| `overrides` | `DeepPartial<Preferences>` | `{}` | Override default preferences |
| `storage` | `StorageAdapter` | `localStorage` | Custom storage adapter |
| `i18n` | `I18nAdapter` | - | Custom i18n adapter |

#### PreferencesManager Methods

| Method | Type | Description |
|--------|------|-------------|
| `init()` | `void` | Initialize manager and apply CSS variables |
| `get()` | `Preferences` | Get current preferences |
| `get(key)` | `Preferences[K]` | Get specific category |
| `set(key, value)` | `void` | Update specific category |
| `setAll(value)` | `void` | Update all preferences |
| `reset()` | `void` | Reset to default preferences |
| `resetCategory(key)` | `void` | Reset specific category |
| `subscribe(listener)` | `() => void` | Subscribe to changes, returns unsubscribe |
| `destroy()` | `void` | Destroy manager and cleanup |

---

## Lifecycle API

### getDefaultLifecycle

Get the global lifecycle manager (singleton).

```typescript
function getDefaultLifecycle(): ManagerLifecycle;
```

### createManagerLifecycle

Create a new lifecycle manager instance.

```typescript
function createManagerLifecycle(): ManagerLifecycle;
```

#### ManagerLifecycle Methods

| Method | Type | Description |
|--------|------|-------------|
| `init(options)` | `PreferencesManager` | Initialize global manager |
| `get()` | `PreferencesManager` | Get current manager |
| `destroy()` | `void` | Destroy current manager |
| `subscribe(listener)` | `() => void` | Subscribe to preference changes |
| `getPreferences()` | `Preferences \| null` | Get current preferences |

---

## Actions API

### createPreferencesActions

Create preference action handlers.

```typescript
function createPreferencesActions(manager: PreferencesManager): PreferencesActions;
```

#### PreferencesActions

| Method | Description |
|--------|-------------|
| `setPreferences(updates)` | Update preferences with partial object |
| `resetPreferences()` | Reset to defaults |
| `toggleTheme()` | Toggle between light/dark mode |
| `toggleSidebar()` | Toggle sidebar collapsed state |
| `getActualThemeMode()` | Get resolved theme mode (handles 'auto') |
| `exportConfig()` | Export preferences as JSON string |
| `importConfig(json)` | Import preferences from JSON string |

### createThemeActions

Create theme-specific action handlers.

```typescript
function createThemeActions(manager: PreferencesManager): ThemeActions;
```

#### ThemeActions

| Method | Description |
|--------|-------------|
| `setTheme(updates)` | Update theme preferences |
| `setMode(mode)` | Set theme mode |
| `setPrimaryColor(color)` | Set primary color |
| `setBuiltinTheme(theme)` | Set builtin theme preset |
| `setRadius(radius)` | Set border radius |
| `toggleTheme()` | Toggle between light/dark |
| `getActualThemeMode()` | Get resolved theme mode |

### createLayoutActions

Create layout-specific action handlers.

```typescript
function createLayoutActions(manager: PreferencesManager): LayoutActions;
```

#### LayoutActions

| Method | Description |
|--------|-------------|
| `setApp(updates)` | Update app preferences |
| `setLayout(layout)` | Set layout type |
| `setSidebar(updates)` | Update sidebar preferences |
| `setHeader(updates)` | Update header preferences |
| `setTabbar(updates)` | Update tabbar preferences |
| `setFooter(updates)` | Update footer preferences |
| `setBreadcrumb(updates)` | Update breadcrumb preferences |
| `toggleSidebarCollapsed()` | Toggle sidebar collapsed |
| `setSidebarCollapsed(collapsed)` | Set sidebar collapsed state |

---

## Preferences Types

### Preferences Interface

```typescript
interface Preferences {
  app: AppPreferences;
  breadcrumb: BreadcrumbPreferences;
  copyright: CopyrightPreferences;
  footer: FooterPreferences;
  header: HeaderPreferences;
  lockScreen: LockScreenPreferences;
  logo: LogoPreferences;
  navigation: NavigationPreferences;
  panel: PanelPreferences;
  shortcutKeys: ShortcutKeyPreferences;
  sidebar: SidebarPreferences;
  tabbar: TabbarPreferences;
  theme: ThemePreferences;
  transition: TransitionPreferences;
  widget: WidgetPreferences;
}
```

### ThemePreferences

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `builtinType` | `BuiltinThemeType` | `'default'` | Built-in theme type |
| `colorPrimary` | `string` | `'oklch(0.55 0.2 250)'` | Primary color in OKLCH |
| `fontScale` | `number` | `1` | Global font scale (0.8-1.2) |
| `mode` | `ThemeModeType` | `'auto'` | Theme mode: 'light', 'dark', 'auto' |
| `radius` | `string` | `'0.5rem'` | Border radius |
| `semiDarkHeader` | `boolean` | `false` | Semi-dark header in light mode |
| `semiDarkSidebar` | `boolean` | `false` | Semi-dark sidebar in light mode |

### AppPreferences

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `layout` | `LayoutType` | `'sidebar-nav'` | Layout type |
| `locale` | `SupportedLanguagesType` | `'zh-CN'` | Language |
| `colorGrayMode` | `boolean` | `false` | Grayscale mode |
| `colorWeakMode` | `boolean` | `false` | Color-blind mode |
| `compact` | `boolean` | `false` | Compact mode |
| `watermark` | `boolean` | `false` | Enable watermark |
| `watermarkContent` | `string` | `''` | Watermark text |
| ... | ... | ... | See full type definition |

### SidebarPreferences

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `collapsed` | `boolean` | `false` | Collapsed state |
| `collapsedButton` | `boolean` | `true` | Show collapse button |
| `collapsedShowTitle` | `boolean` | `false` | Show title when collapsed |
| `collapseWidth` | `number` | `48` | Width when collapsed (px) |
| `enable` | `boolean` | `true` | Enable sidebar |
| `expandOnHover` | `boolean` | `true` | Expand on hover |
| `width` | `number` | `220` | Width when expanded (px) |
| ... | ... | ... | See full type definition |

### HeaderPreferences

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `enable` | `boolean` | `true` | Enable header |
| `height` | `number` | `48` | Header height (px) |
| `hidden` | `boolean` | `false` | Hide header |
| `menuAlign` | `LayoutHeaderMenuAlignType` | `'start'` | Menu alignment |
| `menuLauncher` | `boolean` | `false` | Menu launcher mode |
| `mode` | `LayoutHeaderModeType` | `'fixed'` | Header mode |

### LockScreenPreferences

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `isLocked` | `boolean` | `false` | Lock state |
| `password` | `string` | `''` | Password hash |
| `backgroundImage` | `string` | `''` | Background image URL |
| `autoLockTime` | `number` | `0` | Auto-lock time (minutes) |

---

## Color API

### parseToOklch

Parse any color to OKLCH format.

```typescript
function parseToOklch(color: string): OklchColor | null;
```

### oklchToHex

Convert OKLCH to HEX color.

```typescript
function oklchToHex(oklch: OklchColor): string;
```

### deriveSemanticColors

Derive semantic colors from primary color.

```typescript
function deriveSemanticColors(primaryColor: string): SemanticColors;

interface SemanticColors {
  primary: string;
  success: string;
  warning: string;
  destructive: string;
  info: string;
}
```

### generateColorScale

Generate color scale (50-950 shades).

```typescript
function generateColorScale(baseColor: string): Record<ColorShade, string>;

type ColorShade = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950;
```

### getAccessibleForeground

Get WCAG compliant foreground color.

```typescript
function getAccessibleForeground(backgroundColor: string, level?: WCAGLevel): string;

type WCAGLevel = 'AA' | 'AAA';
```

---

## CSS API

### updateAllCSSVariables

Update all CSS variables for current preferences.

```typescript
function updateAllCSSVariables(preferences: Preferences): void;
```

### setCSSVariable / getCSSVariable

Set or get individual CSS variables.

```typescript
function setCSSVariable(name: string, value: string, element?: HTMLElement): void;
function getCSSVariable(name: string, element?: HTMLElement): string;
```

### setDOMSelectors

Configure DOM selectors for CSS variable application.

```typescript
function setDOMSelectors(selectors: DOMSelectors): void;

interface DOMSelectors {
  root?: string;      // Default: ':root'
  body?: string;      // Default: 'body'
  layout?: string;    // Default: '.layout'
}
```

---

## Utility API

### deepMerge

Deep merge objects with proper type inference.

```typescript
function deepMerge<T>(target: T, ...sources: DeepPartial<T>[]): T;
```

### diff

Calculate differences between two objects.

```typescript
function diff<T>(oldObj: T, newObj: T): DiffResult<T>;
```

### getPlatform

Detect current platform.

```typescript
function getPlatform(): PlatformType;

type PlatformType = 'macos' | 'windows' | 'linux' | 'ios' | 'android' | 'unknown';
```

### formatShortcut

Format keyboard shortcut for current platform.

```typescript
function formatShortcut(shortcut: string): string;
// Example: 'Ctrl+K' → '⌘K' on macOS
```

---

## Constants

### Layout Types

```typescript
type LayoutType =
  | 'sidebar-nav'       // Sidebar navigation
  | 'sidebar-mixed-nav' // Mixed sidebar navigation
  | 'header-nav'        // Header navigation
  | 'header-mixed-nav'  // Mixed header navigation
  | 'full-content';     // Full content (no navigation)
```

### Theme Mode Types

```typescript
type ThemeModeType = 'light' | 'dark' | 'auto';
```

### Builtin Theme Types

```typescript
type BuiltinThemeType = 'default' | 'violet' | 'pink' | 'rose' | 'sky' | 'cyan' | 'green' | 'orange';
```

### Transition Types

```typescript
type PageTransitionType =
  | 'fade'
  | 'fade-slide'
  | 'fade-up'
  | 'fade-down'
  | 'slide-left'
  | 'slide-right'
  | 'none';
```

---

## Icons API

### getIcon

Get icon SVG by name.

```typescript
function getIcon(name: IconName, size?: IconSize): string;

type IconName = 'sun' | 'moon' | 'settings' | 'menu' | 'close' | ...;
type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
```

### getLayoutIcon

Get layout preview icon.

```typescript
function getLayoutIcon(layout: LayoutType): string;
```

---

## Locales API

### getTranslation

Get translation for key.

```typescript
function getTranslation(key: string, locale: SupportedLanguagesType): string;
```

### getLocaleMessages

Get all messages for locale.

```typescript
function getLocaleMessages(locale: SupportedLanguagesType): LocaleMessages;
```

### Supported Locales

```typescript
type SupportedLanguagesType = 'zh-CN' | 'en-US';

const supportedLocales: SupportedLanguagesType[];
```

---

## Design Tokens API

### configureDesignTokens

Configure global design tokens.

```typescript
function configureDesignTokens(tokens: DeepPartial<DesignTokens>): void;
```

### getDesignTokens

Get current design tokens.

```typescript
function getDesignTokens(): DesignTokens;
```

### Default Tokens

```typescript
const DEFAULT_DESIGN_TOKENS: DesignTokens;

interface DesignTokens {
  drawer: DrawerTokens;
  layoutIcon: LayoutIconTokens;
  iconSizes: IconSizeTokens;
  fontSize: FontSizeTokens;
  radius: RadiusTokens;
  border: BorderTokens;
  transition: TransitionTokens;
  colors: ColorTokens;
  zIndex: ZIndexTokens;
}
```

---

## Lock Screen API

### createLockScreenManager

Create lock screen manager.

```typescript
function createLockScreenManager(options: LockScreenManagerOptions): {
  lock: () => void;
  unlock: (password: string) => boolean;
  setPassword: (password: string) => void;
  clearPassword: () => void;
  isLocked: () => boolean;
  hasPassword: () => boolean;
};
```

### hashPassword / verifyPassword

Password utilities with SHA-256.

```typescript
function hashPassword(password: string): Promise<string>;
function verifyPassword(password: string, hash: string): Promise<boolean>;

// Sync versions
function hashPasswordSync(password: string): string;
function verifyPasswordSync(password: string, hash: string): boolean;
```

---

## Shortcut Keys API

### createShortcutManager

Create shortcut key manager.

```typescript
function createShortcutManager(options: ShortcutManagerOptions): {
  enable: () => void;
  disable: () => void;
  destroy: () => void;
};

interface ShortcutManagerOptions {
  preferences: ShortcutKeyPreferences;
  callbacks: ShortcutKeyCallbacks;
}

interface ShortcutKeyCallbacks {
  onSearch?: () => void;
  onLockScreen?: () => void;
  onLogout?: () => void;
  onPreferences?: () => void;
}
```

### SHORTCUT_KEY_BINDINGS

Default shortcut key bindings.

```typescript
const SHORTCUT_KEY_BINDINGS: Record<string, ShortcutKeyBinding>;

// Example:
// {
//   globalSearch: { key: 'k', ctrl: true },
//   globalLockScreen: { key: 'l', ctrl: true, shift: true },
//   globalLogout: { key: 'q', ctrl: true, shift: true },
//   globalPreferences: { key: ',', ctrl: true },
// }
```
