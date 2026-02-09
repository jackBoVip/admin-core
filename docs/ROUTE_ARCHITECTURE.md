# 路由架构说明

## 概述

`@admin-core/layout` 支持三种路由配置方式，可以灵活组合使用：

1. **静态路由** (`staticRoutes`): 基础路由，如首页、登录页等
2. **路由模块** (`routeModules`): 模块化路由，支持自动扫描
3. **动态路由** (`fetchMenuList`): 从后端 API 获取的路由配置

## 合并顺序

路由的合并顺序为：**静态路由 → 路由模块 → 动态路由**

后面的路由会覆盖前面同名的路由，这样可以实现：
- 静态路由定义基础结构
- 路由模块按功能模块组织
- 动态路由根据权限或配置动态调整

## 使用方式

### Vue 示例

```typescript
import { createVueRouteAccess } from '@admin-core/layout-vue';
import { staticRoutes } from './router/static-routes';
import { fetchMenuList } from './router/menu-api';

// 自动扫描路由模块
const routeModules = import.meta.glob('./router/modules/**/*.ts', { eager: true });

const { menus, routeRecords } = await createVueRouteAccess({
  staticRoutes,        // 静态路由
  routeModules,        // 路由模块（自动扫描）
  fetchMenuList,       // 动态路由 API
  pageMap,             // 页面组件映射
  viewsRoot: '/src/views',
  layoutMap: {
    LAYOUT: Layout,
  },
});
```

### React 示例

```typescript
import { createReactRouteAccess } from '@admin-core/layout-react';
import { staticRoutes } from './router/static-routes';
import { fetchMenuList } from './router/menu-api';

// 自动扫描路由模块
const routeModules = import.meta.glob('./router/modules/**/*.ts', { eager: true });

const { menus, routeObjects } = await createReactRouteAccess({
  staticRoutes,        // 静态路由
  routeModules,        // 路由模块（自动扫描）
  fetchMenuList,       // 动态路由 API
  pageMap,             // 页面组件映射
  viewsRoot: '/src/pages',
  layoutMap: {
    LAYOUT: Outlet,
  },
  routerComponents: {
    Navigate,
    Outlet,
  },
});
```

## 路由模块结构

路由模块文件应放在 `router/modules/` 目录下，每个模块文件导出一个路由数组：

```typescript
// router/modules/dashboard.ts
import type { RouteRecordStringComponent } from '@admin-core/layout';

const routes: RouteRecordStringComponent[] = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    component: 'LAYOUT',
    meta: {
      title: '仪表盘',
      icon: '📊',
      order: 2,
    },
    children: [
      {
        name: 'DashboardAnalysis',
        path: '/dashboard/analysis',
        component: '/dashboard/Analysis',
        meta: {
          title: '分析页',
          icon: '📈',
        },
      },
    ],
  },
];

export default routes;
```

## 优势

1. **模块化组织**: 按功能模块拆分路由，便于维护
2. **自动扫描**: 使用 `import.meta.glob` 自动发现路由模块，无需手动导入
3. **灵活组合**: 三种方式可以任意组合，适应不同场景
4. **向后兼容**: 原有的 `staticRoutes` 和 `fetchMenuList` 方式仍然支持

## 迁移指南

### 从旧版本迁移

如果你之前只使用 `fetchMenuList`，可以逐步迁移：

1. **第一步**: 保持 `fetchMenuList` 不变，继续使用
2. **第二步**: 将部分路由提取到路由模块中
3. **第三步**: 完全迁移到路由模块（可选）

### 示例迁移

**迁移前**（所有路由在 `fetchMenuList` 中）:
```typescript
export async function fetchMenuList() {
  return [
    { name: 'Dashboard', path: '/dashboard', ... },
    { name: 'System', path: '/system', ... },
  ];
}
```

**迁移后**（路由模块化）:
```typescript
// router/modules/dashboard.ts
export default [{ name: 'Dashboard', path: '/dashboard', ... }];

// router/modules/system.ts
export default [{ name: 'System', path: '/system', ... }];

// router/menu-api.ts
export async function fetchMenuList() {
  // 可以返回空数组，或者返回一些动态路由
  return [];
}
```

## 注意事项

1. **路由名称唯一性**: 确保路由的 `name` 字段唯一，避免覆盖问题
2. **模块导出格式**: 路由模块必须使用 `export default` 导出路由数组
3. **路径冲突**: 注意不同来源的路由路径不要冲突
4. **性能考虑**: 路由模块使用 `eager: true` 会立即加载所有模块，如果模块很多，可以考虑按需加载

