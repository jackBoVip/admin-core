# @admin-core/layout-react

English | [简体中文](./README.md)

React basic layout components with built-in preferences integration.

## Features

- 🚀 **Out of the box** - import components and pass data to start
- 🎨 **Tailwind CSS v4** - uses v4 utilities and design tokens
- 🌍 **Internationalization** - built-in EN/ZH locales, extensible
- 🔌 **Slots & Extensibility** - ReactNode props for each region
- 📱 **Responsive** - auto adapts to mobile

## Public API

- **Layout components**: `BasicLayout` and built-in layout/menu components
- **Hooks**: `useLayoutContext`, `useLayoutState`, `useLayoutComputed`, `useRouter`, etc.
- **Built-in preferences**: `initPreferences`, `PreferencesProvider`, `PreferencesDrawer` (from `@admin-core/preferences-react`)
- **Types & constants**: re-exported layout types, configs, and utils from `@admin-core/layout`
- **Route builder**: `createReactRouteAccess` (static routes + dynamic menus -> React Router `routeObjects`)
- **Styles**: `@admin-core/layout-react/style.css`

## Export Index (Entry-Aligned)

Notes:
- Entry file: `src/index.ts`
- Published types: `dist/index.d.ts`
- For complete symbols, use `dist/index.d.ts` as source of truth.

Entry groups:
1. Built-in preferences (`@admin-core/preferences-react`): `initPreferences`, `destroyPreferences`, `usePreferences`, `usePreferencesContext`, `PreferencesProvider`, `PreferencesDrawer`, `PreferencesTrigger`, `useAdminAntdTheme`, etc.
2. Layout components: full export from `./components` (layout/menu/widgets/ErrorBoundary)
3. Layout hooks: full export from `./hooks` (`useLayoutContext`, `useLayoutState`, etc.)
4. Utilities: full export from `./utils`
5. Route builder: `createReactRouteAccess`, `ReactRouteAccessOptions`, `ReactRouteAccessResult`
6. Core re-exports: types/constants/utils/i18n/style tokens from `@admin-core/layout`

## Install

```bash
pnpm add @admin-core/layout-react
```


### CDN (Production / Development)

```html
<!-- jsDelivr (recommended) -->
<script src="https://cdn.jsdelivr.net/npm/@admin-core/layout-react/dist/index.global.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@admin-core/layout-react/dist/index.global.dev.js"></script>

<!-- unpkg -->
<script src="https://unpkg.com/@admin-core/layout-react/dist/index.global.js"></script>
<script src="https://unpkg.com/@admin-core/layout-react/dist/index.global.dev.js"></script>
```

## Quick Start

```tsx
import { BasicLayout } from '@admin-core/layout-react';
import '@admin-core/layout-react/style.css';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';

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

function App() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <BasicLayout
      menus={menus}
      currentPath={location.pathname}
      autoTab={{ enabled: true, affixKeys: ['/dashboard'] }}
      autoBreadcrumb={{ enabled: true, showHome: true }}
      onMenuSelect={(item) => navigate(item.path)}
      onTabSelect={(item) => navigate(item.path)}
      onBreadcrumbClick={(item) => navigate(item.path)}
    >
      <Outlet />
    </BasicLayout>
  );
}
```

**Auto mode notes:**
- Tabs are generated from menus and follow `currentPath`
- Breadcrumbs are derived from menu paths automatically

## Styles & Tokens

- Layout styles depend on `@admin-core/preferences/styles` global variables (e.g. `--admin-duration-*`, `--admin-easing-*`, `--admin-z-index-*`).
- Page transitions use the `fade-*` animation classes from `@admin-core/preferences`.

## Combine with Form/Table (Avoid Duplicate Styles)

When using `@admin-core/form-react`, `@admin-core/layout-react`, and `@admin-core/table-react` together, import styles once at app entry in this order:

```css
@import "@admin-core/preferences/styles/antd";
@import "@admin-core/layout-react/style.css";
@import "@admin-core/form-react/style.css";
@import "@admin-core/table-react/style.css";
```

- `@admin-core/layout-react/style.css` already includes `tailwindcss`; do not import `@import "tailwindcss"` again in app CSS.
- `@admin-core/table-react/style.css` already includes `antd/dist/reset.css`; do not import Ant Design reset twice.

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

```tsx
<BasicLayout
  menus={menus}
  currentPath={location.pathname}
  autoTab={{
    enabled: true,
    affixKeys: ['/dashboard', '/workbench'],
    maxCount: 10,
  }}
  autoBreadcrumb={{
    enabled: true,
    showHome: true,
    homeName: 'Home',
  }}
/>
```

## Slots (Props)

### Header

- `headerLogo`
- `headerLeft`
- `headerCenter`
- `headerMenu`
- `headerRight`
- `headerActions`
- `headerExtra`

### Sidebar

- `sidebarLogo`
- `sidebarMenu`
- `sidebarMixedMenu`
- `sidebarExtra`
- `sidebarFooter`

### Tabbar

- `tabbar`
- `tabbarLeft`
- `tabbarRight`
- `tabbarExtra`

### Content

- `content` / `children`
- `contentHeader`
- `breadcrumb`
- `contentFooter`
- `contentOverlay`

### Panel

- `panel`
- `panelHeader`
- `panelFooter`

## Events

| Callback | Params | Description |
|------|------|------|
| `onSidebarCollapse` | `(collapsed: boolean)` | Sidebar collapse state change |
| `onMenuSelect` | `(item, key)` | Menu select |
| `onTabSelect` | `(item, key)` | Tab select |
| `onTabClose` | `(item, key)` | Tab close |
| `onTabCloseAll` | - | Close all tabs |
| `onTabCloseOther` | `(exceptKey)` | Close other tabs |
| `onTabRefresh` | `(item, key)` | Refresh tab |
| `onTabFavoriteChange` | `(menu, favorited, keys, menus)` | Favorite change (single action) |
| `onFavoritesChange` | `(menus, keys)` | Favorites list change |

## Hooks

```typescript
import {
  useLayoutContext,    // layout context
  useLayoutComputed,   // computed layout values
  useLayoutCSSVars,    // CSS variables
  useLayoutState,      // layout state (with setter)
  useSidebarState,     // sidebar state
  useHeaderState,      // header state
  usePanelState,       // panel state
  useMenuState,        // menu state
  useTabsState,        // tab state
  useResponsive,       // breakpoints
  useFullscreenState,  // fullscreen state
} from '@admin-core/layout-react';
```

## Favorites

`useTabsState()` exposes favorites APIs for sync/init:

- `favoriteMenus`: full `MenuItem[]` for current favorites
- `favoriteKeys`: favorite key list
- `setFavoriteKeys(keys)`: initialize/replace favorites
- `handleToggleFavorite(key)`: toggle favorite

## Advanced Usage

### Custom Menu Component

```tsx
function App() {
  return (
    <BasicLayout
      menus={menus}
      sidebarMenu={<MyCustomMenu menus={menus} />}
    >
      <Outlet />
    </BasicLayout>
  );
}
```

### Preferences Integration

```tsx
import { usePreferences } from '@admin-core/preferences-react';

function App() {
  const { preferences } = usePreferences();

  return (
    <BasicLayout
      layout={preferences.app.layout}
      header={preferences.header}
      sidebar={preferences.sidebar}
      tabbar={preferences.tabbar}
    >
      <Outlet />
    </BasicLayout>
  );
}
```
