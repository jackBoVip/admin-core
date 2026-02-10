# @admin-core/layout

English | [简体中文](./README.md)

Core layout package that provides framework-agnostic types, configuration, i18n, and utilities.

## Features

- 🎯 Out of the box: pass data in, layout works
- 🎨 7 layout modes: sidebar-nav, header-nav, mixed-nav, etc.
- 🌍 Built-in i18n: English and Chinese, extensible
- 🎛️ Highly configurable: everything is customizable
- 📦 Framework-agnostic core: logic decoupled from UI

## Public API

- **Types & constants**: layout types, default configs, sizing & animation constants
- **Utilities**: menu/tab/router/layout helpers, theme, watermark, shortcuts
- **I18n**: `createI18n` with built-in EN/ZH locales
- **Styles & icons**: layout styles entry and built-in icons

## Install

```bash
pnpm add @admin-core/layout
```

## Layout Types

| Type | Description |
|------|-------------|
| `sidebar-nav` | Sidebar navigation (default) |
| `sidebar-mixed-nav` | Mixed sidebar navigation |
| `header-nav` | Header navigation |
| `header-sidebar-nav` | Full header + sidebar navigation |
| `mixed-nav` | Mixed navigation |
| `header-mixed-nav` | Header mixed navigation |
| `full-content` | Full screen content |

## Configuration

### Header (HeaderPreferences)

```typescript
{
  enable: true,           // Enable header
  height: 48,             // Height (px)
  hidden: false,          // Hidden state
  menuAlign: 'start',     // Menu alignment: 'start' | 'center' | 'end'
  menuLauncher: false,    // Menu launcher mode
  mode: 'fixed',          // Mode: 'fixed' | 'static' | 'auto' | 'auto-scroll'
}
```

### Sidebar (SidebarPreferences)

```typescript
{
  enable: true,             // Enable sidebar
  width: 210,               // Expanded width (px)
  collapseWidth: 60,        // Collapsed width (px)
  collapsed: false,         // Collapsed state
  collapsedButton: true,    // Show collapse button
  collapsedShowTitle: false,// Show title when collapsed
  expandOnHover: true,      // Expand on hover
  hidden: false,            // Hidden state
  mixedWidth: 80,           // Mixed mode width (px)
}
```

### Tabbar (TabbarPreferences)

```typescript
{
  enable: true,             // Enable tabbar
  height: 38,               // Height (px)
  styleType: 'chrome',      // Style: 'chrome' | 'card' | 'plain' | 'brisk'
  draggable: true,          // Drag to reorder
  showIcon: true,           // Show icons
  showMaximize: true,       // Show maximize button
  showMore: true,           // Show more menu
  keepAlive: true,          // Keep alive pages
  persist: true,            // Persist tabs
}
```

### Panel (PanelPreferences)

```typescript
{
  enable: false,            // Enable panel
  position: 'right',        // Position: 'left' | 'right'
  width: 280,               // Expanded width (px)
  collapsedWidth: 0,        // Collapsed width (px)
  collapsed: false,         // Collapsed state
  collapsedButton: true,    // Show collapse button
}
```

## Utilities

```typescript
import {
  calculateLayoutComputed,  // Compute layout-derived values
  generateCSSVariables,     // Generate CSS variables
  findMenuByKey,            // Find menu by key
  getMenuPath,              // Get menu path
  flattenMenus,             // Flatten menus
  filterHiddenMenus,        // Filter hidden menus
  mergeConfig,              // Merge configs
} from '@admin-core/layout';
```

## Slots and Extension Points (React / Vue)

This section covers the **key extension points** related to header left/right, tabbar right, and panel area.  
For full slot/prop coverage, refer to the `LayoutSlots / BasicLayout` definitions.

### React (BasicLayout props)

| Area | Prop |
|------|------|
| Header left | `headerLeft` |
| Header right | `headerRight` |
| Header user area | `headerUser` |
| Tabbar right | `tabbarRight` |
| Panel content | `panelSlot` |
| Panel header | `panelHeader` |
| Panel footer | `panelFooter` |
| User dropdown menu | `userDropdownMenu` |

**Example:**
```tsx
<BasicLayout
  headerLeft={<MyHeaderLeft />}
  headerRight={<MyHeaderRight />}
  headerUser={<MyHeaderUser />}
  tabbarRight={<MyTabbarRight />}
  userDropdownMenu={<MyUserMenu />}
  panelHeader={<MyPanelHeader />}
  panelSlot={<MyPanelBody />}
  panelFooter={<MyPanelFooter />}>
  {children}
</BasicLayout>
```

### Vue (BasicLayout slots)

| Area | Slot |
|------|------|
| Header left | `header-left` |
| Header right | `header-right` |
| Header user area | `header-user` |
| Tabbar right | `tabbar-right` |
| Panel content | `panel` |
| Panel header | `panel-header` |
| Panel footer | `panel-footer` |
| User dropdown menu | `user-dropdown-menu` |

**Example:**
```vue
<BasicLayout>
  <template #header-left><MyHeaderLeft /></template>
  <template #header-right><MyHeaderRight /></template>
  <template #header-user><MyHeaderUser /></template>
  <template #tabbar-right><MyTabbarRight /></template>
  <template #user-dropdown-menu><MyUserMenu /></template>
  <template #panel-header><MyPanelHeader /></template>
  <template #panel><MyPanelBody /></template>
  <template #panel-footer><MyPanelFooter /></template>
</BasicLayout>
```

## Internationalization

```typescript
import { createI18n, zhCN, enUS } from '@admin-core/layout';

// Create i18n instance
const i18n = createI18n('en-US');

// Use translation
i18n.t('layout.sidebar.collapse'); // "Collapse Sidebar"

// Switch locale
i18n.setLocale('zh-CN');

// Add custom messages
i18n.addMessages('en-US', {
  custom: { key: 'Custom text' }
});
```

## Style and Animation Tokens

- Layout styles rely on global variables from `@admin-core/preferences/styles` such as `--admin-duration-*`, `--admin-easing-*`, and `--admin-z-index-*`.
- Page transitions use the shared `fade-*` animation classes from `@admin-core/preferences`.

## Tailwind CSS v4 Integration

```typescript
import { layoutFullCSS, layoutThemeTokens } from '@admin-core/layout';

// Use in CSS
// Includes @theme, base styles, and utilities
```

## License

MIT
