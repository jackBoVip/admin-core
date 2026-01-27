# Admin Core 偏好设置系统 - 实施计划

## 项目结构

```
packages/
└── preferences/                    # 偏好设置模块
    ├── core/                       # @admin-core/preferences
    │   └── src/
    │       ├── types/              # 类型定义
    │       ├── constants/          # 常量配置
    │       ├── utils/              # 共享工具
    │       ├── styles/             # 样式系统
    │       ├── locales/            # 国际化
    │       ├── adapters/           # UI 适配器
    │       ├── preferences-manager.ts
    │       └── index.ts
    │
    ├── vue/                        # @admin-core/preferences-vue
    │   └── src/
    │       ├── composables/        # Vue Composables
    │       ├── components/         # Vue 组件
    │       └── index.ts
    │
    └── react/                      # @admin-core/preferences-react
        └── src/
            ├── hooks/              # React Hooks
            ├── components/         # React 组件
            ├── context/            # React Context
            └── index.ts
```

## npm 包名

| 包路径 | npm 包名 | 说明 |
|--------|----------|------|
| `packages/preferences/core` | `@admin-core/preferences` | 核心包 |
| `packages/preferences/vue` | `@admin-core/preferences-vue` | Vue 实现 |
| `packages/preferences/react` | `@admin-core/preferences-react` | React 实现 |

## 实施阶段

### 第一阶段：Core 包基础

| 序号 | 任务 | 优先级 | 状态 |
|-----|------|--------|------|
| 1.1 | 创建 `core/src/types/` - 类型定义 | P0 | 待开始 |
| 1.2 | 创建 `core/src/constants/` - 常量配置 | P0 | 待开始 |
| 1.3 | 创建 `core/src/utils/` - 工具函数 | P0 | 待开始 |
| 1.4 | 配置 tsup 构建 | P0 | 待开始 |

### 第二阶段：Core 包核心功能

| 序号 | 任务 | 优先级 | 状态 |
|-----|------|--------|------|
| 2.1 | 创建 `core/src/styles/` - CSS 变量 & 动画 | P0 | 待开始 |
| 2.2 | 创建 `core/src/preferences-manager.ts` - 核心管理器 | P0 | 待开始 |
| 2.3 | 创建 `core/src/locales/` - 国际化 | P1 | 待开始 |
| 2.4 | 创建 `core/src/adapters/` - UI 适配器 | P1 | 待开始 |
| 2.5 | 编写核心单元测试 | P1 | 待开始 |

### 第三阶段：Vue 包

| 序号 | 任务 | 优先级 | 状态 |
|-----|------|--------|------|
| 3.1 | 创建 `vue/src/composables/` - usePreferences | P0 | 待开始 |
| 3.2 | 创建 `vue/src/components/blocks/` - 基础控件 | P0 | 待开始 |
| 3.3 | 创建 `vue/src/components/` - 设置区块 | P0 | 待开始 |
| 3.4 | 创建 `vue/src/components/` - 抽屉/按钮 | P0 | 待开始 |
| 3.5 | 编写 Vue 组件测试 | P1 | 待开始 |

### 第四阶段：React 包

| 序号 | 任务 | 优先级 | 状态 |
|-----|------|--------|------|
| 4.1 | 创建 `react/src/hooks/` - usePreferences | P0 | 待开始 |
| 4.2 | 创建 `react/src/context/` - PreferencesProvider | P0 | 待开始 |
| 4.3 | 创建 `react/src/components/blocks/` - 基础控件 | P0 | 待开始 |
| 4.4 | 创建 `react/src/components/` - 设置区块 | P0 | 待开始 |
| 4.5 | 编写 React 组件测试 | P1 | 待开始 |

### 第五阶段：文档与示例

| 序号 | 任务 | 优先级 | 状态 |
|-----|------|--------|------|
| 5.1 | 编写 API 文档 | P1 | 待开始 |
| 5.2 | 创建 Vue 示例项目 | P1 | 待开始 |
| 5.3 | 创建 React 示例项目 | P1 | 待开始 |
| 5.4 | 发布流程测试 | P0 | 待开始 |

## 包依赖关系

```
@admin-core/preferences (core)
    │
    │  内部包含:
    │  ├── types/
    │  ├── constants/
    │  ├── utils/
    │  ├── styles/
    │  ├── locales/
    │  └── adapters/
    │
    ├─────────────────────────────────┐
    ▼                                 ▼
@admin-core/preferences-vue    @admin-core/preferences-react
    │                                 │
    ├── 依赖 core                     ├── 依赖 core
    ├── 依赖 vue                      ├── 依赖 react
    └── 导出 Vue 组件                  └── 导出 React 组件
```

## 核心功能清单

### Core 包功能

#### 主题系统
- [x] 设计完成
- [ ] 深色/浅色/自动模式
- [ ] 内置主题预设 (15种，OKLCH 格式)
- [ ] 只配置主色，语义色自动派生（OKLCH 色相旋转）
- [ ] 圆角配置
- [ ] 字体大小配置
- [ ] 半深色模式 (Header/Sidebar)

#### 共享图标
- [x] 设计完成
- [ ] 布局图标 (7种布局 + 内容紧凑)
- [ ] 主题图标 (sun/moon/monitor)
- [ ] 通用图标 (settings)

#### 布局系统
- [x] 设计完成
- [ ] 7种布局模式
- [ ] 侧边栏配置 (折叠/宽度/悬停展开等)
- [ ] 顶栏配置 (固定/静态/自动)
- [ ] 标签栏配置 (样式/拖拽/缓存等)
- [ ] 面包屑配置
- [ ] 页脚配置
- [ ] 版权信息配置

#### 动画系统
- [x] 设计完成
- [ ] 页面切换动画 (4种)
- [ ] 加载进度条
- [ ] 页面加载动画

#### 功能配置
- [x] 设计完成
- [ ] 快捷键支持
- [ ] 水印功能
- [ ] 检查更新
- [ ] 动态标题
- [ ] 语言切换

#### 辅助功能
- [x] 设计完成
- [ ] 色弱模式
- [ ] 灰色模式
- [ ] 紧凑模式

#### 国际化
- [x] 设计完成
- [ ] 中文 (zh-CN)
- [ ] 英文 (en-US)
- [ ] 可扩展语言包

#### UI 适配器
- [x] 设计完成
- [ ] shadcn/ui 适配器
- [ ] Ant Design 适配器
- [ ] Element Plus 适配器
- [ ] Naive UI 适配器

### Vue 包功能
- [ ] usePreferences composable
- [ ] useOpenPreferences composable
- [ ] PreferencesDrawer 组件
- [ ] PreferencesButton 组件
- [ ] 设置区块组件
- [ ] 图标组件（包装 core 的共享 SVG）

### React 包功能
- [ ] usePreferences hook
- [ ] useOpenPreferences hook
- [ ] PreferencesProvider
- [ ] PreferencesDrawer 组件
- [ ] PreferencesButton 组件
- [ ] 设置区块组件
- [ ] 图标组件（包装 core 的共享 SVG）

## 技术选型

| 类别 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 包管理 | pnpm | 10.x | |
| 构建工具 | tsup | 8.x | |
| 任务编排 | turbo | 2.x | |
| CSS 框架 | Tailwind CSS | 4.x | |
| 颜色工具 | culori | 4.x | OKLCH 色彩空间处理 |
| 测试框架 | Vitest | 4.x | |
| 版本管理 | Changesets | 2.x | |
| Vue | Vue | 3.5+ | |
| React | React | 19.x | |
| TypeScript | TypeScript | 5.9+ | |

## 关键设计决策

### 1. OKLCH 颜色系统

- **只配置主色**: 用户只需配置一个主色（primary），其他语义色（success/warning/destructive/info）自动派生
- **色相旋转派生**: 使用 OKLCH 色彩空间的色相旋转来生成协调的语义色
  - Primary: 原色
  - Success: 色相 +145° (绿色方向)
  - Warning: 色相 +85° (黄色方向)
  - Destructive: 色相 +30° (红色方向)
  - Info: 色相 -30° (青色方向)
- **感知均匀**: OKLCH 是感知均匀的色彩空间，生成的颜色更加协调

### 2. 共享图标

- **图标定义在 core**: 所有 SVG 图标以字符串形式存储在 `core/src/icons/`
- **框架包装使用**: Vue/React 包各自将 SVG 字符串包装为组件
- **分类存储**: 
  - `icons/layouts/` - 布局预览图标
  - `icons/common/` - 通用图标（sun/moon/monitor/settings）

### 3. 主题预设

- 内置 15 种主题预设，使用 OKLCH 格式定义
- 支持 `custom` 类型允许用户自定义主色
- 部分主题（zinc/neutral/slate/gray）在暗色模式下使用不同的主色

## 命名规范

### 包命名
- 核心包: `@admin-core/preferences`
- Vue 包: `@admin-core/preferences-vue`
- React 包: `@admin-core/preferences-react`

### CSS 变量命名
- 布局变量: `--admin-xxx`
- 主题变量: `--primary`, `--success`, `--warning`, `--destructive`
- 色阶变量: `--primary-50` ~ `--primary-950`

### 导出命名
- 类: `PascalCase` (如 `PreferencesManager`)
- 函数: `camelCase` (如 `updatePreferences`)
- 常量: `UPPER_SNAKE_CASE` (如 `DEFAULT_PREFERENCES`)
- 类型: `PascalCase` + `Type` 后缀 (如 `ThemeModeType`)
- 接口: `PascalCase` + `Preferences` 后缀 (如 `AppPreferences`)

## 质量标准

### 代码规范
- ESLint 检查通过
- Prettier 格式化
- TypeScript 严格模式
- 无 `any` 类型

### 测试要求
- 核心函数测试覆盖率 > 80%
- 组件测试覆盖主要交互
- E2E 测试覆盖关键流程

### 文档要求
- 所有公开 API 有 JSDoc 注释
- 关键函数有中文注释
- README 完整

## 发布流程

```bash
# 1. 添加变更记录
pnpm changeset:add

# 2. 更新版本号
pnpm changeset:version

# 3. 构建检查
pnpm build

# 4. 测试
pnpm test:run

# 5. 发布
pnpm release
```

## 注意事项

1. **禁止硬编码** - 所有配置项必须可通过配置文件覆盖
2. **框架解耦** - 核心包不依赖任何前端框架
3. **向后兼容** - API 变更需要考虑迁移路径
4. **性能优先** - 使用防抖、懒加载等优化手段
5. **类型安全** - 完整的 TypeScript 类型定义
6. **可测试性** - 便于单元测试的模块设计
