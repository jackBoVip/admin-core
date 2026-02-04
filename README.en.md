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
├── preferences/           # Preference system
│   ├── core/             # Core package (framework agnostic)
│   ├── react/            # React integration package
│   └── vue/              # Vue integration package
└── layout/               # Layout system
    ├── core/             # Core package (framework agnostic)
    ├── react/            # React integration package
    └── vue/              # Vue integration package
```

## 🚀 Quick Start

### Install Dependencies

```bash
pnpm install
```

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

## 📁 Directory Structure

```
admin-core/
├── docs/                 # Documentation
├── examples/             # Example projects
│   ├── react-demo/       # React example
│   ├── vue-demo/         # Vue example
│   └── vue-vben-admin-main/ # Complete Vue admin template
├── internal/             # Internal tools
│   ├── eslint-config/    # ESLint configuration
│   └── tsconfig/         # TypeScript configuration
├── packages/             # Core packages
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

- [Preference System API Docs](./packages/preferences/core/API.md)
- [Layout System Docs](./packages/layout/core/README.md)
- [TypeScript Configuration Guide](./internal/tsconfig/README.md)

## 🤝 Contributing

Welcome to submit Issues and Pull Requests!

## 📄 License

MIT

---

**Note**: This is a private Monorepo project for learning and internal use only.