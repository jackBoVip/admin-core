# Admin Core

现代化的后台管理系统核心包集合，基于 TypeScript 构建，支持 React 和 Vue 双框架。

## 🌟 项目特色

- **框架无关核心** - 偏好设置和布局逻辑与框架解耦
- **OKLCH 色彩系统** - 智能色彩派生，只需配置主色调
- **多 UI 库适配** - 支持 Ant Design、Element Plus、Naive UI、shadcn/ui
- **完整国际化** - 内置中英文支持
- **灵活布局系统** - 7种布局模式，高度可配置
- **Monorepo架构** - 使用 pnpm workspace 管理多个包
- **现代化工具链** - Turbo、Vitest、ESLint、Prettier 集成

## 📦 包结构

```
packages/
├── preferences/           # 偏好设置系统
│   ├── core/             # 核心包（框架无关）
│   ├── react/            # React集成包
│   └── vue/              # Vue集成包
└── layout/               # 布局系统
    ├── core/             # 核心包（框架无关）
    ├── react/            # React集成包
    └── vue/              # Vue集成包
```

## 🚀 快速开始

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
# 启动所有包的开发模式
pnpm dev

# 启动特定示例
pnpm dev --filter=@admin-core/react-demo
pnpm dev --filter=@admin-core/vue-demo
```

### 构建

```bash
# 构建所有包
pnpm build

# 构建特定包
pnpm build --filter=@admin-core/preferences
```

### 测试

```bash
# 运行所有测试
pnpm test

# 运行测试并监听变化
pnpm test:watch

# 生成覆盖率报告
pnpm test:coverage
```

### 代码检查

```bash
# 运行 ESLint
pnpm lint

# 检查依赖版本
pnpm check:catalog
```

## 🛠 核心功能

### 1. 偏好设置系统 (@admin-core/preferences)

基于 OKLCH 色彩空间的智能偏好管理系统：

```typescript
import { createPreferencesManager } from '@admin-core/preferences';
import '@admin-core/preferences/styles';

const manager = createPreferencesManager({
  namespace: 'my-app',
  overrides: {
    theme: {
      colorPrimary: 'oklch(0.6 0.2 250)', // 只需配置主色
      mode: 'auto',
    },
    app: {
      layout: 'sidebar-nav',
      locale: 'zh-CN',
    },
  },
});

manager.init();
```

**主要特性：**
- 🎨 OKLCH 色彩系统，语义色彩自动派生
- 🌍 完整的国际化支持
- ⚙️ 高度可配置的设置项
- 💾 自动持久化存储
- 🎯 TypeScript 完整类型支持

### 2. 布局系统 (@admin-core/layout)

开箱即用的后台布局组件：

```typescript
import { BasicLayout } from '@admin-core/layout-react'; // 或 layout-vue

function App() {
  return (
    <BasicLayout
      menus={menuData}
      router={routerConfig}
      userInfo={userInfo}
      // 布局会自动响应偏好设置变化
    >
      {/* 页面内容 */}
    </BasicLayout>
  );
}
```

**7种布局模式：**
- `sidebar-nav` - 侧边导航（默认）
- `sidebar-mixed-nav` - 侧边混合导航
- `header-nav` - 顶部导航
- `header-sidebar-nav` - 顶部通栏+侧边导航
- `mixed-nav` - 混合导航
- `header-mixed-nav` - 顶部混合导航
- `full-content` - 全屏内容

## 📁 目录结构

```
admin-core/
├── docs/                 # 文档
├── examples/             # 示例项目
│   ├── react-demo/       # React 示例
│   ├── vue-demo/         # Vue 示例
│   └── vue-vben-admin-main/ # 完整的 Vue 后台模板
├── internal/             # 内部工具
│   ├── eslint-config/    # ESLint 配置
│   └── tsconfig/         # TypeScript 配置
├── packages/             # 核心包
│   ├── layout/           # 布局系统
│   └── preferences/      # 偏好设置
├── scripts/              # 脚本工具
└── tests/                # 测试配置
```

## 🔧 开发工具

### 代码质量

- **ESLint**: 代码规范检查
- **Prettier**: 代码格式化
- **TypeScript**: 类型检查
- **Husky**: Git钩子
- **Lint-staged**: 提交前检查

### 构建工具

- **Turbo**: 高性能构建系统
- **Tsup**: TypeScript打包工具
- **Vite**: 开发服务器和构建工具

### 测试工具

- **Vitest**: 单元测试框架
- **@vitest/coverage-v8**: 代码覆盖率

## 🎯 技术栈

- **语言**: TypeScript 5.7+
- **包管理**: pnpm 10.28.0
- **构建**: Turbo + Vite + Tsup
- **测试**: Vitest
- **代码质量**: ESLint + Prettier
- **版本管理**: Changesets

## 📖 文档

- [偏好设置 API 文档](./packages/preferences/core/API.md)
- [布局系统文档](./packages/layout/core/README.md)
- [TypeScript 配置指南](./internal/tsconfig/README.md)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT

---

**注意**: 这是一个私有 Monorepo 项目，仅供学习和内部使用。