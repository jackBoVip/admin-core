# Admin Core

Modern admin system core package collection built with TypeScript, supporting both React and Vue frameworks.

## 🌟 Key Features

- **Framework Agnostic Core** - Preference and layout logic decoupled from frameworks
- **OKLCH Color System** - Intelligent color derivation, configure only primary color
- **Multi-UI Library Support** - Adapters for Ant Design, Element Plus, Naive UI, shadcn/ui
- **Complete Internationalization** - Built-in English and Chinese support
- **Flexible Layout System** - 7 layout modes, highly configurable
- **Monorepo Architecture** - Managed with pnpm workspace
- **Modern Toolchain** - Integrated Turbo, Vitest, ESLint, Prettier

## 📦 Package Structure

```
packages/
├── form/                  # Form system
│   ├── core/             # Core package (framework agnostic)
│   ├── react/            # React integration package
│   └── vue/              # Vue integration package
├── table/                 # Table system
│   ├── core/             # Core package (framework agnostic)
│   ├── react/            # React integration package
│   └── vue/              # Vue integration package
├── page/                  # Content page system
│   ├── core/             # Core package (framework agnostic)
│   ├── react/            # React integration package
│   └── vue/              # Vue integration package
├── preferences/           # Preference system
│   ├── core/             # Core package (framework agnostic)
│   ├── react/            # React integration package
│   └── vue/              # Vue integration package
└── layout/                # Layout system
    ├── core/             # Core package (framework agnostic)
    ├── react/            # React integration package
    └── vue/              # Vue integration package
```

## 🚀 Quick Start

### Install Dependencies

```bash
pnpm install
```

### Package Installation (NPM / CDN)

- NPM: all packages support `npm / pnpm / yarn` installation (see each package README, "Install").
- CDN (production): `https://cdn.jsdelivr.net/npm/<package-name>/dist/index.global.js`
- CDN (development): `https://cdn.jsdelivr.net/npm/<package-name>/dist/index.global.dev.js`
- Note: `<package-name>` examples: `@admin-core/table-react`, `@admin-core/layout-vue`.

### Development Mode

```bash
# Start development mode for all packages
pnpm dev

# Start specific example
pnpm dev --filter=@admin-core/react-demo
pnpm dev --filter=@admin-core/vue-demo
```

### Build

```bash
# Build all packages
pnpm build

# Build specific package
pnpm build --filter=@admin-core/preferences
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Generate coverage report
pnpm test:coverage
```

### Code Quality

```bash
# Run ESLint
pnpm lint

# Check dependency versions
pnpm check:catalog
```

## 🛠 Core Features

### 1. Preference System (@admin-core/preferences)

Intelligent preference management system based on OKLCH color space:

```typescript
import { createPreferencesManager } from '@admin-core/preferences';
import '@admin-core/preferences/styles';

const manager = createPreferencesManager({
  namespace: 'my-app',
  overrides: {
    theme: {
      colorPrimary: 'oklch(0.6 0.2 250)', // Only configure primary color
      mode: 'auto',
    },
    app: {
      layout: 'sidebar-nav',
      locale: 'en-US',
    },
  },
});

manager.init();
```

**Key Features:**
- 🎨 OKLCH color system with automatic semantic color derivation
- 🌍 Complete internationalization support
- ⚙️ Highly configurable settings
- 💾 Automatic persistence storage
- 🎯 Full TypeScript type support

### 2. Layout System (@admin-core/layout)

Out-of-the-box admin layout components:

```typescript
import { BasicLayout } from '@admin-core/layout-react'; // or layout-vue

function App() {
  return (
    <BasicLayout
      menus={menuData}
      router={routerConfig}
      userInfo={userInfo}
      // Layout automatically responds to preference changes
    >
      {/* Page content */}
    </BasicLayout>
  );
}
```

**7 Layout Modes:**
- `sidebar-nav` - Sidebar navigation (default)
- `sidebar-mixed-nav` - Mixed sidebar navigation
- `header-nav` - Header navigation
- `header-sidebar-nav` - Full header + sidebar navigation
- `mixed-nav` - Mixed navigation
- `header-mixed-nav` - Header mixed navigation
- `full-content` - Full screen content

### 3. Table System (@admin-core/table-vue / @admin-core/table-react)

Unified cross-framework table contract with aligned semantics for Vue and React:

```ts
import { useAdminTable } from '@admin-core/table-react'; // or @admin-core/table-vue

const [Table, tableApi] = useAdminTable({
  tableTitle: 'User List',
  gridOptions: {
    seqColumn: true,
    toolbarConfig: { refresh: true, zoom: true, custom: true },
    rowSelection: { type: 'checkbox', trigger: 'row' },
    operationColumn: true,
  },
});
```

Main capabilities:

- Toolbar (built-in icons + generated tools + slots)
- Column custom panel (drag, fixed, sort, filter, persistence)
- Search form integration (`formOptions` + `proxyConfig`)
- Row/cell strategy (style, compute, click, regex conditions)
- Theme and locale integration with preferences

### 4. Page System (@admin-core/page-vue / @admin-core/page-react)

Content-area page container plus built-in "query form + table" composition:

```ts
import { useAdminPageQueryTable } from '@admin-core/page-vue'; // or @admin-core/page-react

const [PageQueryTable, pageApi] = useAdminPageQueryTable({
  formOptions: {
    schema: [{ fieldName: 'keyword', component: 'input', label: 'Keyword' }],
  },
  tableOptions: {
    tableTitle: 'Users',
    gridOptions: { columns: [{ field: 'name', title: 'Name' }], data: [] },
  },
});
```

Main capabilities:

- Page container (route page + component page + scroll control)
- Out-of-the-box top query form and bottom table layout
- API passthrough via `pageApi.formApi` / `pageApi.tableApi`
- `bridge` for submit-query, reset-reload, and param mapping

### 5. Static + Dynamic Routes

The framework provides a unified builder for **static route constants + dynamic menu API**, and generates **routes, menus, and breadcrumbs** automatically.  
Both static and dynamic routes use **RouteRecord style**, and `component` is a string path (e.g. `/system/user`) resolved by the framework.

#### Vue Example (Auto inject into Router)

```ts
import { createRouter, createWebHistory } from 'vue-router';
import { createVueRouteAccess } from '@admin-core/layout-vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/', name: 'Root', component: () => import('./layouts/BasicLayout.vue') }],
});

const staticRoutes = [
  { name: 'home', path: '/', component: '/home', meta: { title: 'Home', icon: 'home' } },
];

const pageMap = import.meta.glob('./views/**/*.vue');

const { menus } = await createVueRouteAccess({
  router,
  staticRoutes,
  fetchMenuList: async () => await fetch('/api/menu').then(r => r.json()),
  pageMap,
  viewsRoot: '/src/views',
});

export { router, menus };
```

#### React Example (Returns RouteObject[])

```tsx
import { useRoutes } from 'react-router-dom';
import { createReactRouteAccess } from '@admin-core/layout-react';

const staticRoutes = [
  { name: 'home', path: '/', component: '/home', meta: { title: 'Home', icon: 'home' } },
];

const pageMap = {
  '/home': HomePage,
  '/system/user': UserPage,
};

const { routeObjects, menus } = await createReactRouteAccess({
  staticRoutes,
  fetchMenuList: async () => await fetch('/api/menu').then(r => r.json()),
  pageMap,
  viewsRoot: '/src/pages',
});

const routesElement = useRoutes(routeObjects);
```

## 📁 Directory Structure

```
admin-core/
├── docs/                 # Documentation
├── examples/             # Example projects
│   ├── react-demo/       # React example
│   ├── vue-demo/         # Vue example
├── internal/             # Internal tools
│   ├── eslint-config/    # ESLint configuration
│   └── tsconfig/         # TypeScript configuration
├── packages/             # Core packages
│   ├── form/             # Form system
│   ├── table/            # Table system
│   ├── page/             # Content page system
│   ├── layout/           # Layout system
│   └── preferences/      # Preference system
├── scripts/              # Script tools
└── tests/                # Test configuration
```

## 🔧 Development Tools

### Code Quality

- **ESLint**: Code style checking
- **Prettier**: Code formatting
- **TypeScript**: Type checking
- **Husky**: Git hooks
- **Lint-staged**: Pre-commit checking

### Build Tools

- **Turbo**: High-performance build system
- **Tsup**: TypeScript bundler
- **Vite**: Development server and build tool

### Testing Tools

- **Vitest**: Unit testing framework
- **@vitest/coverage-v8**: Code coverage

## 🎯 Tech Stack

- **Language**: TypeScript 5.7+
- **Package Manager**: pnpm 10.28.0
- **Build**: Turbo + Vite + Tsup
- **Testing**: Vitest
- **Code Quality**: ESLint + Prettier
- **Version Management**: Changesets

## 📖 Documentation

### Package Docs Matrix

| Package | Chinese Docs | English Docs |
| --- | --- | --- |
| `@admin-core/preferences` | [README](./packages/preferences/core/README.md) | [README.en](./packages/preferences/core/README.en.md) |
| `@admin-core/preferences-vue` | [README](./packages/preferences/vue/README.md) | [README.en](./packages/preferences/vue/README.en.md) |
| `@admin-core/preferences-react` | [README](./packages/preferences/react/README.md) | [README.en](./packages/preferences/react/README.en.md) |
| `@admin-core/layout` | [README](./packages/layout/core/README.md) | [README.en](./packages/layout/core/README.en.md) |
| `@admin-core/layout-vue` | [README](./packages/layout/vue/README.md) | [README.en](./packages/layout/vue/README.en.md) |
| `@admin-core/layout-react` | [README](./packages/layout/react/README.md) | [README.en](./packages/layout/react/README.en.md) |
| `@admin-core/form-core` | [README](./packages/form/core/README.md) | [README.en](./packages/form/core/README.en.md) |
| `@admin-core/form-vue` | [README](./packages/form/vue/README.md) | [README.en](./packages/form/vue/README.en.md) |
| `@admin-core/form-react` | [README](./packages/form/react/README.md) | [README.en](./packages/form/react/README.en.md) |
| `@admin-core/table-core` | [README](./packages/table/core/README.md) | [README.en](./packages/table/core/README.en.md) |
| `@admin-core/table-vue` | [README](./packages/table/vue/README.md) | [README.en](./packages/table/vue/README.en.md) |
| `@admin-core/table-react` | [README](./packages/table/react/README.md) | [README.en](./packages/table/react/README.en.md) |
| `@admin-core/page-core` | [README](./packages/page/core/README.md) | [README.en](./packages/page/core/README.en.md) |
| `@admin-core/page-vue` | [README](./packages/page/vue/README.md) | [README.en](./packages/page/vue/README.en.md) |
| `@admin-core/page-react` | [README](./packages/page/react/README.md) | [README.en](./packages/page/react/README.en.md) |

### API Docs

- [Preferences Core API](./packages/preferences/core/API.md)
- [Preferences Vue API](./packages/preferences/vue/API.md)
- [Preferences React API](./packages/preferences/react/API.md)
- [TypeScript Configuration Guide](./internal/tsconfig/README.md)

## 🔁 Legacy Table Migration Quick Map

| Legacy | admin-core |
| --- | --- |
| `legacySetupVxeTable` | `setupAdminTableVue` / `setupAdminTableReact` |
| `legacyUseVxeGrid` | `useAdminTable` |
| `VxeGridApi` | `AdminTableApi` |
| `CellTag/CellSwitch/CellOperation` | Same renderer names retained |

## 🤝 Contributing

Welcome to submit Issues and Pull Requests!

## 📄 License

MIT

---

**Note**: This is a private Monorepo project for learning and internal use only.
