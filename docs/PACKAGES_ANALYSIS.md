# packages 目录全方位分析报告

对 `packages/` 下 6 个包（layout/core、layout/vue、layout/react、preferences/core、preferences/react、preferences/vue）的构建、类型、测试、依赖、代码质量与优化点进行梳理。

---

## 一、包结构与构建配置

### 1.1 构建工具不一致

| 包 | 构建工具 | 说明 |
|----|----------|------|
| layout/core | tsup | 纯 TS，无框架 |
| layout/vue | Vite | Vue 组件 + Tailwind |
| layout/react | Vite | React 组件 + Tailwind |
| preferences/core | tsup | 纯 TS + CSS 后处理 |
| preferences/react | tsup | React hooks/组件 |
| preferences/vue | Vite | Vue composables/组件 |

- **结论**：core 用 tsup、框架绑定包用 Vite 是合理分工；建议在根 README 或 CONTRIBUTING 中写明「core 用 tsup、Vue/React 包用 Vite」，避免后续误改。
- **可选优化**：若希望统一，可考虑全部迁到 Vite（或全部 tsup），但成本高、收益有限，当前分工可接受。

### 1.1.1 近期变更：样式与动画统一完成

- 已完成 `@admin-core/preferences` 与 `@admin-core/layout` 的动画/变量/工具类统一。
- 统一变量体系：全局使用 `--admin-duration-*`、`--admin-easing-*`、`--admin-z-index-*`。
- 页面过渡统一为 `fade-*` 系列，旧 `page-fade-*` 已移除。
- 滚动条工具类集中到 `preferences/core`，避免重复定义。

### 1.2 类型声明：.d.cts 缺失（需修复）

- **@admin-core/preferences**、**@admin-core/preferences-react** 的 `package.json` 中：
  - `exports["."].require.types` 指向 `./dist/index.d.cts`
  - tsup 默认只生成 `index.d.ts`，**不会**生成 `index.d.cts`
- 因此 CJS 消费者（如 `require('@admin-core/preferences')`）在 TypeScript 中可能拿不到正确的 CJS 类型，或需额外配置。
- **@admin-core/preferences-vue** 通过 build 脚本手动复制：
  ```bash
  node -e "require('fs').copyFileSync('dist/index.d.ts','dist/index.d.cts')"
  ```
  所以 Vue 包在发布后是有 `.d.cts` 的。

**建议**（任选其一或组合）：

1. **统一用 .d.ts 作为 CJS 类型**（最简单）：  
   在 preferences 和 preferences-react 的 `package.json` 里，把 `require.types` 改为 `./dist/index.d.ts`，与 layout 包一致。
2. **真正生成 .d.cts**：  
   使用 `fix-tsup-cjs` 等工具在 tsup 构建后生成/修复 CJS 类型，或在 onSuccess 里用脚本复制 `.d.ts` → `.d.cts`（与 preferences-vue 一致）。
3. 若采用「复制 .d.ts → .d.cts」：  
   将 preferences-vue 的 `node -e "require('fs')..."` 抽成独立脚本（如 `scripts/copy-d-cts.mjs`），在需要生成 .d.cts 的包中复用，便于维护和跨平台。

### 1.3 preferences 子路径导出语义有误

在 **@admin-core/preferences** 的 `package.json` 中：

```json
"./color": { "import": "./dist/index.js", "require": "./dist/index.cjs" },
"./utils": { "import": "./dist/index.js", "require": "./dist/index.cjs" },
"./constants": { "import": "./dist/index.js", "require": "./dist/index.cjs" },
"./controllers": { "import": "./dist/index.js", "require": "./dist/index.cjs" }
```

这些子路径都指向**主入口**，并不是独立 entry：

- 无法按子路径做 tree-shaking，`import { x } from '@admin-core/preferences/color'` 仍会拉取整包。
- 容易让使用者误以为「只引用了 color/utils 等子模块」，不利于体积预期。

**建议**：

- **方案 A**：删除 `./color`、`./utils`、`./constants`、`./controllers` 子路径，统一从主入口 `@admin-core/preferences` 使用；在文档中说明「仅主入口，按需依赖由打包器 tree-shake」。
- **方案 B**：若确实需要子路径，在 tsup 中为 color、utils、constants、controllers 配置**独立 entry**，并对应修改 exports，使每个子路径对应单独产物（便于 tree-shake）。

### 1.4 layout/core 的 CSS 导出约定

- 当前：`"./styles/layout.css": "./src/styles/layout.css"`，且 `files` 包含 `"src/styles"`，即发布的是**源码目录**下的 CSS。
- 功能上没问题，但与常见约定「发布产物集中在 dist」不一致；若未来对 `src` 做清理或重构，可能误伤已发布的路径。

**建议**：在 layout/core 的构建（如 tsup 的 onSuccess 或单独脚本）中，将 `src/styles/layout.css` 复制到 `dist/styles/layout.css`，exports 改为 `"./styles/layout.css": "./dist/styles/layout.css"`，`files` 只保留 `dist`（及确有需要的其他产物），不再把 `src/styles` 打进包里。

### 1.5 preferences-vue 的 build 脚本可维护性

当前：

```json
"build": "vite build && vite build --config vite.cdn.config.ts && node -e \"require('fs').copyFileSync('dist/index.d.ts','dist/index.d.cts')\""
```

- 内联 `node -e` 可读性差、难调试、Windows 下引号易出问题。

**建议**：新增 `scripts/copy-d-cts.mjs`（或放在各包内），内容为复制 `dist/index.d.ts` → `dist/index.d.cts`，build 改为调用 `node scripts/copy-d-cts.mjs`；若后续 preferences/preferences-react 也采用「复制 .d.cts」方案，可复用同一脚本并传参（如包名/路径）。

---

## 二、依赖与 peerDependencies

### 2.1 依赖关系

- **layout/core** 依赖 `@admin-core/preferences`：用于类型与工具，合理；无循环依赖。
- **layout/vue**、**layout/react** 依赖对应 layout core + preferences + preferences-vue/react：正确。
- **preferences/core** 仅依赖 `culori`，且已 external，合理。
- **preferences/react**、**preferences/vue** 仅依赖 `@admin-core/preferences`，peer 为 react/vue，符合预期。

### 2.2 peer 与版本

- layout/vue：`vue` / `vue-router` / `tailwindcss` 的 peer 范围合理。
- layout/react：未把 `react-dom` 写进 package.json 的 peer（仅 react），但 vite 的 external 含 `react`、`react-dom`、`react/jsx-runtime`，建议在 package.json 的 `peerDependencies` 中显式加上 `react-dom`，与使用方式一致。
- 各包使用的 catalog 版本（如 tailwind、vue、react）与根目录 pnpm-workspace 一致，无冲突。

### 2.3 可选优化

- 若希望更严格的依赖约束，可为 `@floating-ui/*`、`culori` 等指定 catalog 版本，避免多版本共存（当前若未在 catalog 中，可评估是否加入）。

---

## 三、TypeScript 与类型安全

### 3.1 严格度与配置

- 各包继承 `@admin-core/tsconfig/base.json`，`strict: true`、`noUnusedLocals`、`noUnusedParameters` 等已开，整体严格度良好。
- 各包 `tsconfig` 的 `include`/`exclude` 设置合理（如排除 `**/*.test.ts`）。

### 3.2 代码中的 any 使用

当前仓库中与 `any` 相关的用法大致分布如下（建议逐步收紧）：

| 位置 | 用途 | 建议 |
|------|------|------|
| layout 的 `use-layout-state`（Vue/React） | `routerInstance?.push(to: any)`、`item: any`、`newPrefs: any` | 使用路由的 `RouteLocationRaw` 和 layout 的 `MenuItem`/`TabItem`、`Preferences` 等已有类型，避免 any。 |
| BasicLayout.vue 的 emit 类型 | `item: any`（menu-select、tab-select 等） | 改为 `MenuItem`、`TabItem` 等具体类型。 |
| layout FullscreenButton（Vue/React） | `(document as any).webkitFullscreenElement` 等 | 定义 `Document`/`Element` 的扩展接口（如 `DocumentWithFullscreen`），或使用类型断言到该接口，避免裸 `as any`。 |
| layout/core utils/common.ts | `debounce/throttle` 的 `(...args: any[]) => any` | 可保留泛型约束，或改为 `unknown[]` + 泛型返回类型，减少 any。 |
| layout/core 测试 | `overrides as any` | 测试中若为故意「错误类型」，可改为 `as UnknownRecord` 或更窄的类型，便于以后重构。 |

逐步替换上述 any 能提升类型安全和重构时的可靠性。

---

## 四、测试

### 4.1 覆盖情况

| 包 | 测试文件 | 说明 |
|----|----------|------|
| layout/core | common.test.ts, layout.test.ts, menu.test.ts | 有工具/布局/菜单相关用例 |
| layout/vue | 无 | 无单测或集成测 |
| layout/react | 无 | 无单测或集成测 |
| preferences/core | manager, tokens, color, utils 等 | 核心逻辑覆盖较好 |
| preferences/react | init.test.ts | 仅初始化相关 1 个用例 |
| preferences/vue | init.test.ts | 仅初始化相关 1 个用例 |

- 根目录 `vitest.config.ts` 使用 `**/*.{test,spec}.*`，会跑全仓库测试；layout/core 有独立 `vitest.config.ts` 做 `@admin-core/preferences` 的 alias，其他包依赖根配置即可。

### 4.2 建议

- **layout/vue、layout/react**：至少为「布局初始化、偏好注入、基础渲染」等加 1～2 个集成/快照测试（可依赖现有 examples 或新建最小 fixture），防止重大回归。
- **preferences/react、preferences/vue**：在现有 init 测试基础上，为 `usePreferences`、`useTheme`、Provider 行为等增加若干用例，与 core 的 manager 测试形成互补。
- 若后续在包内使用 path alias（如 `@/`），需在该包或根 vitest 中配置 resolve.alias，避免测试无法解析模块。

---

## 五、代码质量与可维护性

### 5.1 设计

- **preferences/core**：Manager、Actions、生命周期、CSS 更新、存储抽象分离清晰；MAX_LISTENERS、merge 的 MAX_DEPTH 等防护到位。
- **layout/core**：类型、常量、工具、locales 分层明确，对 preferences 的依赖仅限类型与少量工具，边界清晰。
- **Vue/React 层**：preferences 的 react/vue 均采用「缓存 actions + 单例 lifecycle」模式，与 core 一致，便于维护。

### 5.2 潜在风险点

- **preferences/core tsup 的 onSuccess**：通过 `import('./src/config/tokens/generate-css')` 调用生成逻辑，路径与仓库结构强绑定；若移动 `config/tokens` 或 `generate-css`，需同步改 tsup 配置。建议在 tsup 或 README 中注释说明该依赖关系。
- **preferences/core 的 generateBundledCSS**：依赖 `src/styles/css/` 下固定文件列表；新增/删除/重命名 CSS 文件时需记得更新该列表，适合在贡献指南或代码注释中写清。

### 5.3 文档与元数据

- 各包 `repository.url` 多为空字符串；若项目开源，建议在根或各 package.json 中填写实际仓库 URL，便于 issue/PR 和自动化。
- 部分包已有 README（如 layout/core、layout/vue、preferences/react、preferences/vue）；建议为 **layout/react**、**preferences/core** 补充简短 README（安装、入口、与 layout-vue / preferences-react 的对比），便于新成员和用户选型。

---

## 六、性能与产物

### 6.1 构建与体积

- preferences/core：ESM/CJS + IIFE（CDN）、splitting、treeshake、minify 已开；CSS 合并与复制逻辑在 onSuccess 中集中处理，结构清晰。
- preferences-react：ESM/CJS + IIFE，React/ReactDOM 在 CDN 构建中 external 到全局，合理。
- layout/vue、layout/react：lib 模式、单 CSS 入口（cssCodeSplit: false）、external 正确，有利于消费方 tree-shake 和按需加载。

### 6.2 建议

- 若后续需要分析体积，可在各 Vite 构建中临时加入 `rollup-plugin-visualizer`（或类似）做一次产物分析，确认无意外大模块；分析完后可从默认 build 中移除，仅保留在单独脚本中。

---

## 七、安全与边界

- **PreferencesManager**：监听器数量上限（MAX_LISTENERS）、存储防抖、mediaQuery 清理等已有考虑，未发现明显泄漏点。
- **deepMerge**：MAX_DEPTH 限制递归深度，可避免恶意或异常深对象导致栈溢出。
- **存储与密码**：存储适配器可插拔；若文档或示例涉及「密码/敏感配置」，建议在 README 或注释中说明应由调用方加密或脱敏，避免误解为内置安全存储。

---

## 八、优化项汇总（按优先级）

### 高优先级（建议尽快处理）

1. **修复 CJS 类型**：为 @admin-core/preferences 和 @admin-core/preferences-react 解决 `.d.cts` 缺失（统一改为使用 `.d.ts` 或增加生成/复制 .d.cts 的步骤）。
2. **修正子路径导出**：对 @admin-core/preferences 的 `./color`、`./utils`、`./constants`、`./controllers` 要么移除，要么改为真实 entry，并在文档中说明。
3. **preferences-vue build 脚本**：将 `node -e "require('fs').copyFileSync(...)"` 抽成独立脚本（如 `scripts/copy-d-cts.mjs`），并在需要 .d.cts 的包中复用。

### 中优先级（建议规划）

4. **layout/core CSS 发布路径**：将 `layout.css` 构建到 dist，exports 和 files 只指向 dist，不再发布 `src/styles`。
5. **减少 any**：从 layout 的 router/menu/tab、FullscreenButton、common 的 debounce/throttle 以及测试中的 as any 开始，逐步替换为具体类型或更安全断言。
6. **测试补充**：为 layout/vue、layout/react 增加最少 1～2 个集成/基础测试；为 preferences/react、preferences/vue 增加 usePreferences/Provider 等用例。
7. **package.json**：layout/react 的 peerDependencies 显式加入 `react-dom`；各包 `repository.url` 如开源则补全。

### 低优先级（可选）

8. **文档**：为 layout/react、preferences/core 补 README；在 tsup/README 中注明 generate-css 与 generateBundledCSS 对目录结构的依赖。
9. **构建一致性说明**：在根 README 或 CONTRIBUTING 中说明「core 用 tsup、Vue/React 用 Vite」及原因。
10. **依赖**：评估将 `@floating-ui/*`、`culori` 等纳入 catalog 统一版本。

---

## 九、结论

- **整体**：包划分清晰（core / vue / react），依赖与构建分工合理，类型严格度与核心逻辑质量较好；主要问题集中在**类型产物（.d.cts）、子路径导出语义、build 脚本可维护性**以及**测试与类型中 any 的收紧**。
- 优先完成「CJS 类型修复、子路径导出、build 脚本抽取」三项，即可显著提升发布产物与使用体验；其余项可按优先级在迭代中逐步完成。

如需要，我可以按上述条目给出具体修改 diff（例如 package.json、tsup 配置、脚本内容等）。

---

## 已落实的修改（本次会话）

- **CJS 类型**：`@admin-core/preferences`、`@admin-core/preferences-react` 的 `require.types` 已改为 `./dist/index.d.ts`；preferences 的 `./tailwind` require.types 改为 `./dist/styles/tailwind/preset.d.ts`。
- **preferences-vue build**：已新增 `packages/preferences/vue/scripts/copy-d-cts.mjs`，build 脚本改为调用 `node scripts/copy-d-cts.mjs`，不再使用内联 `node -e`。
- **layout/react**：已为 `tailwindcss` 增加 `peerDependenciesMeta.optional: true`，便于在非 Tailwind 场景使用。
