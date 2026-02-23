# @admin-core/layout-vue

English | [简体中文](./README.md)

Vue 3 basic layout components with built-in preferences integration.

## Features

- 🚀 **Out of the box** - import components and pass data to start
- 🎨 **Tailwind CSS v4** - uses v4 utilities and design tokens
- 🌍 **Internationalization** - built-in EN/ZH locales, extensible
- 🔌 **Slots & Extensibility** - slots for each region
- 📱 **Responsive** - auto adapts to mobile

## Public API

- **Layout components**: `BasicLayout` and built-in layout/menu components
- **Composables**: `useLayoutContext`, `useLayoutState`, `useLayoutComputed`, `useRouter`, etc.
- **Built-in preferences**: `initPreferences`, `PreferencesProvider`, `PreferencesDrawer` (from `@admin-core/preferences-vue`)
- **Types & constants**: re-exported layout types, configs, and utils from `@admin-core/layout`
- **Route builder**: `createVueRouteAccess` (static routes + dynamic menus -> inject into Vue Router)
- **Vue plugin exports**: `install`, `LayoutPlugin`
- **Styles**: `@admin-core/layout-vue/style.css`

## Export Index (Entry-Aligned)

Notes:
- Entry file: `src/index.ts`
- Published types: `dist/index.d.ts`
- For complete symbols, use `dist/index.d.ts` as source of truth.

Entry groups:
1. Built-in preferences (`@admin-core/preferences-vue`): `initPreferences`, `destroyPreferences`, `usePreferences`, `usePreferencesContext`, `PreferencesProvider`, `PreferencesDrawer`, `PreferencesTrigger`, etc.
2. Layout components: full export from `./components` (layout/menu/widgets)
3. Composables: full export from `./composables` (`useLayoutContext`, `useLayoutState`, `useTimer`, `useEventListener`)
4. Route builder: `createVueRouteAccess`, `VueRouteAccessOptions`, `VueRouteAccessResult`
5. Vue plugin: `install`, `LayoutPlugin`
6. Core re-exports: types/constants/utils/i18n/style tokens from `@admin-core/layout`

## Install

```bash
pnpm add @admin-core/layout-vue
```

## Quick Start

```vue
<script setup lang="ts">
import { BasicLayout } from '@admin-core/layout-vue';
import '@admin-core/layout-vue/style.css';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const menus = [
  { key: '/dashboard', name: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
  {
    key: '/system',
    name: 'System',
    icon: 'setting',
    children: [
      { key: '/system/user', name: 'Users', path: '/system/user' },
      { key: '/system/role', name: 'Roles', path: '/system/role' },
    ],
  },
];
</script>

<template>
  <BasicLayout
    :menus="menus"
    :current-path="route.path"
    :auto-tab="{ enabled: true, affixKeys: ['/dashboard'] }"
    :auto-breadcrumb="{ enabled: true, showHome: true }"
    @menu-select="(item) => router.push(item.path)"
    @tab-select="(item) => router.push(item.path)"
    @breadcrumb-click="(item) => router.push(item.path)"
  >
    <router-view />
  </BasicLayout>
</template>
```

**Auto mode notes:**
- Tabs are generated from menus and follow `currentPath`
- Breadcrumbs are derived from menu paths automatically

## Styles & Tokens

- Layout styles depend on `@admin-core/preferences/styles` global variables (e.g. `--admin-duration-*`, `--admin-easing-*`, `--admin-z-index-*`).
- Page transitions use the `fade-*` animation classes from `@admin-core/preferences`.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `layout` | `LayoutType` | `'sidebar-nav'` | Layout type |
| `menus` | `MenuItem[]` | `[]` | Menu data |
| `currentPath` | `string` | - | Current path (auto tabs/breadcrumbs) |
| `autoTab` | `AutoTabConfig` | `{ enabled: true }` | Auto tab config |
| `autoBreadcrumb` | `AutoBreadcrumbConfig` | `{ enabled: true }` | Auto breadcrumb config |
| `tabs` | `TabItem[]` | `[]` | Manual tabs |
| `breadcrumbs` | `BreadcrumbItem[]` | `[]` | Manual breadcrumbs |
| `activeMenuKey` | `string` | - | Active menu key |
| `activeTabKey` | `string` | - | Active tab key |
| `header` | `HeaderPreferences` | - | Header config |
| `sidebar` | `SidebarPreferences` | - | Sidebar config |
| `tabbar` | `TabbarPreferences` | - | Tabbar config |
| `locale` | `'zh-CN' | 'en-US'` | `'zh-CN'` | Locale |

## AutoTab / AutoBreadcrumb

```typescript
interface AutoTabConfig {
  enabled?: boolean;
  affixKeys?: string[];
  maxCount?: number;
  persistKey?: string;
}

interface AutoBreadcrumbConfig {
  enabled?: boolean;
  showHome?: boolean;
  homePath?: string;
  homeName?: string;
  homeIcon?: string;
}
```

### Example

```vue
<BasicLayout
  :menus="menus"
  :current-path="route.path"
  :auto-tab="{
    enabled: true,
    affixKeys: ['/dashboard', '/workbench'],
    maxCount: 10,
  }"
  :auto-breadcrumb="{
    enabled: true,
    showHome: true,
    homeName: 'Home',
  }"
/>
```

## Slots

### Header Slots

- `header-logo`
- `header-left`
- `header-center`
- `header-menu`
- `header-right`
- `header-actions`
- `header-extra`

### Sidebar Slots

- `sidebar-logo`
- `sidebar-menu`
- `sidebar-mixed-menu`
- `sidebar-extra`
- `sidebar-footer`

### Tabbar Slots

- `tabbar`
- `tabbar-left`
- `tabbar-right`
- `tabbar-extra`

### Content Slots

- `content` / `default`
- `content-header`
- `breadcrumb`
- `content-footer`
- `content-overlay`

### Panel Slots

- `panel`
- `panel-header`
- `panel-footer`

## Events

| Event | Params | Description |
|------|------|------|
| `sidebar-collapse` | `(collapsed: boolean)` | Sidebar collapse state change |
| `menu-select` | `(item, key)` | Menu select |
| `tab-select` | `(item, key)` | Tab select |
| `tab-close` | `(item, key)` | Tab close |
| `tab-close-all` | - | Close all tabs |
| `tab-close-other` | `(exceptKey)` | Close other tabs |
| `tab-refresh` | `(item, key)` | Refresh tab |
| `tab-favorite-change` | `(menu, favorited, keys, menus)` | Favorite change (single action) |
| `favorites-change` | `(menus, keys)` | Favorites list change |

## Composables

```typescript
import {
  useLayoutContext,    // layout context
  useLayoutComputed,   // computed layout values
  useLayoutCSSVars,    // CSS variables
  useSidebarState,     // sidebar state
  useHeaderState,      // header state
  usePanelState,       // panel state
  useMenuState,        // menu state
  useTabsState,        // tab state
  useResponsive,       // breakpoints
  useFullscreenState,  // fullscreen state
} from '@admin-core/layout-vue';
```

## Favorites

`useTabsState()` exposes favorites APIs for sync/init:

- `favoriteMenus`: full `MenuItem[]` for current favorites
- `favoriteKeys`: favorite key list
- `setFavoriteKeys(keys)`: initialize/replace favorites
- `handleToggleFavorite(key)`: toggle favorite

## Advanced Usage

### Custom Menu Component

```vue
<template>
  <BasicLayout :menus="menus">
    <template #sidebar-menu>
      <MyCustomMenu :menus="menus" />
    </template>
  </BasicLayout>
</template>
```

### Preferences Integration

```vue
<script setup>
import { usePreferences } from '@admin-core/preferences-vue';

const { preferences } = usePreferences();
</script>

<template>
  <BasicLayout
    :layout="preferences.app.layout"
    :header="preferences.header"
    :sidebar="preferences.sidebar"
    :tabbar="preferences.tabbar"
  >
    <router-view />
  </BasicLayout>
</template>
```
