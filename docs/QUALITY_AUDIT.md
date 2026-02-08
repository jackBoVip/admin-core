# 质量审计报告（Layout + Preferences）

## 范围与方法
- 范围：`/Users/zhouhongbo/Documents/workspace/admin-core/packages/layout/*` 与 `/Users/zhouhongbo/Documents/workspace/admin-core/packages/preferences/*`
- 目标：识别性能风险、逻辑一致性问题、硬编码与重复实现、以及 React/Vue 与 core 的统一抽取程度
- 方法：
1. 组件清单与对照
2. 硬编码扫描（内联 SVG、中文文案、固定数值）
3. 事件监听与节流检查
4. Core 统一抽取缺口梳理

## 一致性矩阵（核心组件级别）
| 组件 | React 入口 | Vue 入口 | Core 依赖点 | 结论 | 备注 |
| --- | --- | --- | --- | --- | --- |
| Header | `/Users/zhouhongbo/Documents/workspace/admin-core/packages/layout/react/src/components/layout/LayoutHeader.tsx` | `/Users/zhouhongbo/Documents/workspace/admin-core/packages/layout/vue/src/components/layout/LayoutHeader.vue` | layout core 计算与 tokens | 基本一致 | 建议持续收敛菜单/图标/文案依赖 core |
| Sidebar | `/Users/zhouhongbo/Documents/workspace/admin-core/packages/layout/react/src/components/layout/SidebarMenu.tsx` | `/Users/zhouhongbo/Documents/workspace/admin-core/packages/layout/vue/src/components/layout/SidebarMenu.vue` | LAYOUT_UI_TOKENS 部分使用 | 一致性需加强 | 仍存在硬编码渲染参数与节流不一致 |
| Tabbar | `/Users/zhouhongbo/Documents/workspace/admin-core/packages/layout/react/src/components/layout/LayoutTabbar.tsx` | `/Users/zhouhongbo/Documents/workspace/admin-core/packages/layout/vue/src/components/layout/LayoutTabbar.vue` | LAYOUT_UI_TOKENS + core icons | 基本一致 | Tab render chunk 已 core 化，但仍有衍生参数在组件层 |
| Menu | `/Users/zhouhongbo/Documents/workspace/admin-core/packages/layout/react/src/components/menu/Menu.tsx` | `/Users/zhouhongbo/Documents/workspace/admin-core/packages/layout/vue/src/components/menu/Menu.vue` | resolveMenuIconMeta / tokens 部分使用 | 一致性需加强 | 子菜单渲染 chunk 与 overscan 未统一 |
| Widgets（Search/Notify/Language） | `/Users/zhouhongbo/Documents/workspace/admin-core/packages/layout/react/src/components/widgets/*` | `/Users/zhouhongbo/Documents/workspace/admin-core/packages/layout/vue/src/components/widgets/*` | core locale 与 icon 部分使用 | 存在差异 | LanguageToggle 硬编码中文，建议统一到 core locale |
| Preferences Drawer | `/Users/zhouhongbo/Documents/workspace/admin-core/packages/preferences/react/src/components/drawer/PreferencesDrawer.tsx` | `/Users/zhouhongbo/Documents/workspace/admin-core/packages/preferences/vue/src/components/drawer/PreferencesDrawer.vue` | preferences core locales / tokens | 基本一致 | 文案以 core locale 为主，少量 fallback 仍存在 |
| Lock Screen | `/Users/zhouhongbo/Documents/workspace/admin-core/packages/preferences/react/src/components/lock-screen/LockScreen.tsx` | `/Users/zhouhongbo/Documents/workspace/admin-core/packages/preferences/vue/src/components/lock-screen/LockScreen.vue` | preferences core locales / utils | 基本一致 | Vue 仍有少量中文 fallback |

## 问题清单（含证据定位）

### A. 统一性与硬编码
**A1. 中文文案硬编码（应来自 core locales）**
- `/Users/zhouhongbo/Documents/workspace/admin-core/packages/layout/react/src/components/widgets/LanguageToggle.tsx`
- `/Users/zhouhongbo/Documents/workspace/admin-core/packages/layout/vue/src/components/widgets/LanguageToggle.vue`
- `/Users/zhouhongbo/Documents/workspace/admin-core/packages/preferences/vue/src/components/lock-screen/LockPasswordModal.vue`（`'关闭'` fallback）

**A2. 固定渲染参数未统一到 tokens**
- `RENDER_CHUNK / SUB_RENDER_CHUNK / CHILD_RENDER_CHUNK`
  - React: `/Users/zhouhongbo/Documents/workspace/admin-core/packages/layout/react/src/components/layout/MixedSidebarMenu.tsx`
  - React: `/Users/zhouhongbo/Documents/workspace/admin-core/packages/layout/react/src/components/layout/SidebarMenu.tsx`
  - React: `/Users/zhouhongbo/Documents/workspace/admin-core/packages/layout/react/src/components/menu/SubMenu.tsx`
  - React: `/Users/zhouhongbo/Documents/workspace/admin-core/packages/layout/react/src/components/menu/Menu.tsx`
  - Vue: `/Users/zhouhongbo/Documents/workspace/admin-core/packages/layout/vue/src/components/layout/MixedSidebarMenu.vue`
  - Vue: `/Users/zhouhongbo/Documents/workspace/admin-core/packages/layout/vue/src/components/layout/SidebarMenu.vue`
  - Vue: `/Users/zhouhongbo/Documents/workspace/admin-core/packages/layout/vue/src/components/menu/SubMenu.vue`
  - Vue: `/Users/zhouhongbo/Documents/workspace/admin-core/packages/layout/vue/src/components/menu/Menu.vue`
- `VIRTUAL_OVERSCAN / RESULT_OVERSCAN`
  - React: `/Users/zhouhongbo/Documents/workspace/admin-core/packages/layout/react/src/components/menu/Menu.tsx`
  - React: `/Users/zhouhongbo/Documents/workspace/admin-core/packages/layout/react/src/components/widgets/NotificationButton.tsx`
  - React: `/Users/zhouhongbo/Documents/workspace/admin-core/packages/layout/react/src/components/widgets/GlobalSearch.tsx`
  - Vue: `/Users/zhouhongbo/Documents/workspace/admin-core/packages/layout/vue/src/components/menu/SubMenu.vue`
  - Vue: `/Users/zhouhongbo/Documents/workspace/admin-core/packages/layout/vue/src/components/menu/Menu.vue`
  - Vue: `/Users/zhouhongbo/Documents/workspace/admin-core/packages/layout/vue/src/components/widgets/NotificationButton.vue`
  - Vue: `/Users/zhouhongbo/Documents/workspace/admin-core/packages/layout/vue/src/components/widgets/GlobalSearch.vue`

**A3. 内联 SVG 分布**
- core 图标库内联 SVG 属于合理使用（保持），但 UI 层仍存在自绘 svg 的点位：
  - `/Users/zhouhongbo/Documents/workspace/admin-core/packages/layout/react/src/components/layout/LayoutTabbar.tsx`
  - `/Users/zhouhongbo/Documents/workspace/admin-core/packages/layout/react/src/components/menu/MenuIcon.tsx`
  - `/Users/zhouhongbo/Documents/workspace/admin-core/packages/layout/react/src/utils/icon-renderer.tsx`
  - `/Users/zhouhongbo/Documents/workspace/admin-core/packages/layout/react/src/utils/render-layout-icon.tsx`
  - `/Users/zhouhongbo/Documents/workspace/admin-core/packages/layout/vue/src/components/common/LayoutIcon.vue`
  - `/Users/zhouhongbo/Documents/workspace/admin-core/packages/layout/vue/src/components/common/MenuIcon.vue`
  - `/Users/zhouhongbo/Documents/workspace/admin-core/packages/layout/vue/src/components/layout/LayoutTabbar.vue`

### B. 性能风险点
**B1. scroll/resize 监听未统一节流（建议统一使用 core `rafThrottle`）**
- React:
  - `/Users/zhouhongbo/Documents/workspace/admin-core/packages/layout/react/src/components/layout/MixedSidebarMenu.tsx`
  - `/Users/zhouhongbo/Documents/workspace/admin-core/packages/layout/react/src/components/layout/SidebarMenu.tsx`
  - `/Users/zhouhongbo/Documents/workspace/admin-core/packages/layout/react/src/components/menu/Menu.tsx`
  - `/Users/zhouhongbo/Documents/workspace/admin-core/packages/layout/react/src/components/menu/SubMenu.tsx`
- Vue:
  - `/Users/zhouhongbo/Documents/workspace/admin-core/packages/layout/vue/src/components/layout/MixedSidebarMenu.vue`
  - `/Users/zhouhongbo/Documents/workspace/admin-core/packages/layout/vue/src/components/layout/SidebarMenu.vue`
  - `/Users/zhouhongbo/Documents/workspace/admin-core/packages/layout/vue/src/components/menu/Menu.vue`
  - `/Users/zhouhongbo/Documents/workspace/admin-core/packages/layout/vue/src/components/menu/SubMenu.vue`

### C. 功能文件分类（结构一致性）
- 现有分层：`core` 负责 tokens/icons/utils/locales，`react/vue` 负责 UI 适配。
- 仍存在“逻辑级参数/文案”留在 UI 层：
  - LanguageToggle 的本地化显示
  - 菜单渲染 chunk / overscan 参数
- 建议继续收敛到 core 的目录：
  - `packages/layout/core/src/constants/ui-tokens.ts`
  - `packages/layout/core/src/locales/*`

## Core 下沉缺口清单（建议优先级）

**P0（高优先级）**
- 将 `RENDER_CHUNK / SUB_RENDER_CHUNK / CHILD_RENDER_CHUNK / VIRTUAL_OVERSCAN / RESULT_OVERSCAN` 统一到 `LAYOUT_UI_TOKENS`
- LanguageToggle 的语言显示列表改为 core `getSupportedLocales()` 或 core locale

**P1（中优先级）**
- 将所有 scroll/resize handler 统一通过 core `rafThrottle`
- 清除 Vue 锁屏中的中文 fallback（使用 core locale）

**P2（低优先级）**
- 评估 Menu/Tabbar 的 SVG 是否可进一步统一为 core icons（如允许保持 UI 层 svg，则记录为“合理重复”）

## 未来修复路线（可选）
1. 统一 tokens（render chunk / overscan）
2. 统一语言显示来源
3. 统一节流策略
4. 回归测试（build + UI 快速验收）

## 建议验证脚本（后续修复阶段）
- `pnpm -C /Users/zhouhongbo/Documents/workspace/admin-core/packages/layout/core test:run`
- `pnpm -C /Users/zhouhongbo/Documents/workspace/admin-core/packages/preferences/core test:run`
- `pnpm -C /Users/zhouhongbo/Documents/workspace/admin-core/packages/layout/react build`
- `pnpm -C /Users/zhouhongbo/Documents/workspace/admin-core/packages/layout/vue build`
- `pnpm -C /Users/zhouhongbo/Documents/workspace/admin-core/packages/preferences/react build`
- `pnpm -C /Users/zhouhongbo/Documents/workspace/admin-core/packages/preferences/vue build`
