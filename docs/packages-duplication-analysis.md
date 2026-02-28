# packages 重复代码分析与抽取结果

更新时间：2026-02-28

## 1. 分析范围
- 扫描目录：`packages/**`
- 文件类型：`*.ts`, `*.tsx`, `*.js`, `*.mjs`, `*.cjs`, `*.vue`
- 排除目录：`node_modules`, `dist`, `lib`, `coverage`
- 判定方式：
  - 精确重复：基于文件内容哈希分组
  - 可维护性重复：按 React/Vue 适配层同构代码人工核对并抽取

## 2. 已完成的公共抽取
- 新增公共/共享包：
  - `@admin-core/layout-shared`
  - `@admin-core/tabs-shared`
  - `@admin-core/form-shared`
  - `@admin-core/page-shared`
  - `@admin-core/table-shared`
- 已落地的重复收敛（核心）：
  - React/Vue 适配层核心导出统一改为复用 `*-shared`
  - `page` 适配层 setup 公共逻辑抽到 `page-shared/src/setup.ts`
  - `form` 适配器 runtime 公共逻辑抽到 `form-shared/src/registry.ts`
  - `tabs` setup 与类型公共逻辑抽到 `tabs-shared/src/setup.ts`、`types.ts`
  - `tabs` 新增 setup runtime 工厂，React/Vue setup 逻辑统一复用
  - `table` 偏好、主题、权限、locale 核心逻辑抽到 `table-shared/src/preferences.ts`、`types.ts`
  - `page` 新增 setup runtime 工厂，React/Vue setup 逻辑统一复用
  - `form/page/table core` 的 `store` 与 `store types` 壳层已内联删除（直接复用 `@admin-core/shared-core`）
  - `table/tabs core` 的 `constants/index.ts` 壳层已删除（改为直接导出/引用 `constants/defaults`）
  - `form/table core` 的 `adapter/index.ts` 与 `renderer/index.ts` 壳层已删除（改为直接引用 `registry`）
  - React/Vue `useLocaleVersion` 模式抽成公共工厂：
    - `packages/shared/react/src/use-locale-version.ts`
    - `packages/shared/vue/src/use-locale-version.ts`
  - 偏好资源声明统一到 `packages/shared/core/src/assets.d.ts`

## 3. 当前重复情况（最新扫描）
- `packages/**` 扫描结果：精确重复文件组 = `0`
- 本轮进一步收敛：
  - 删除 `preferences/react|vue` 的 `assets.d.ts` 引用壳
  - 将重复的 `eslint.config.js` / `vitest.config.ts` 外提到 `internal/build-config/configs/**`
  - 对应包脚本统一改为 `eslint -c ...` / `vitest -c ...`
  - `packages/**` 下本地 `eslint.config.js` / `vitest.config.ts` 已清零
  - 将 `form/layout/page/table/tabs core` 的 `copy-*-css.mjs` 收敛到 `internal/build-config/tsup.js` 的 `copyEntries` 能力
  - 删除对应 `postbuild` 重复脚本，改为公共 tsup 配置自动拷贝样式/资源

结论：`packages` 目录内可扫描到的重复实现已清零。

## 4. 是否还可以继续抽
- 仍可继续，但主要属于“结构优化”而非去重刚需：
  - 统一更多脚本入口（如按框架分组 lint/test 命令模板）
  - 对 `internal/build-config/configs/**` 做命名与分层规范化

建议：
- 保留当前状态作为稳定版本（推荐）。
- 下一步优先做完整 `typecheck/test` 回归，确认批量脚本切换无行为差异。

## 5. 本轮补充修复
- 修复隐式依赖：
  - `packages/table/shared/package.json` 增加 `@admin-core/preferences` 依赖，和 `table-shared` 中实际 import 对齐。
- 配置集中化：
  - 新增 `internal/build-config/configs/eslint/*`
  - 新增 `internal/build-config/configs/vitest/*`
  - 删除重复的包内 eslint/vitest 配置壳文件，改为包脚本显式指定集中配置
- 构建/类型链路稳定性：
  - `turbo.json` 中 `typecheck.dependsOn` 增加 `^build`，避免新 shared 包在声明未产出时被下游类型检查提前引用
  - `page-shared` 泛型约束与 `page-core` 对齐（`TTableApi extends PageQueryTableExecutor`）
  - 修复 `layout-react/layout-vue` 的 `MenuItem` 重复导出冲突

## 6. 验证说明
- 已完成：
  - 重复文件哈希扫描（含按行数分层）
  - 新增 shared 包导出/依赖一致性核查
  - 新增守护脚本：`pnpm run check:duplicates`（`scripts/check-packages-duplicates.mjs`）
  - CI 接入：`.github/workflows/ci.yml` 增加 `pnpm check:duplicates`
  - 发布前接入：根 `release` 脚本增加 `pnpm check:duplicates`
  - 全量 `pnpm typecheck`（Turbo 全包）通过
  - 全量 `pnpm lint` 通过
  - `pnpm check:duplicates` 通过（`packages/**` 精确重复文件组=0）
