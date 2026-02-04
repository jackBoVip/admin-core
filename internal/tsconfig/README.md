# @admin-core/tsconfig

> Admin Core Monorepo 共享 TypeScript 配置 (ESNext 2025)

## 配置文件

| 配置 | 用途 | 适用场景 |
|------|------|----------|
| `base.json` | 基础配置 | 所有项目继承 |
| `library.json` | 库项目 | 框架无关的包 |
| `vue.json` | Vue 库 | Vue 3 组件库 |
| `react.json` | React 库 | React 组件库 |
| `app.json` | 应用基础 | 应用项目基础 |
| `app-vue.json` | Vue 应用 | Vue 3 应用 |
| `app-react.json` | React 应用 | React 应用 |

## 使用方式

### 库项目

```json
// packages/xxx/tsconfig.json
{
  "extends": "@admin-core/tsconfig/library.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist"
  },
  "include": ["src/**/*.ts"]
}
```

### Vue 库

```json
{
  "extends": "@admin-core/tsconfig/vue.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist"
  },
  "include": ["src/**/*.ts", "src/**/*.vue"]
}
```

### React 库

```json
{
  "extends": "@admin-core/tsconfig/react.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist"
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"]
}
```

### Vue 应用

```json
{
  "extends": "@admin-core/tsconfig/app-vue.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.vue"]
}
```

### React 应用

```json
{
  "extends": "@admin-core/tsconfig/app-react.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"]
}
```

## 技术基线

- **TypeScript**: 5.7+
- **Target**: ESNext
- **Module**: ESNext
- **Module Resolution**: Bundler

## 严格模式特性

所有配置默认启用最严格的类型检查：

- `strict: true` - 启用所有严格检查
- `strictNullChecks` - 严格空值检查
- `strictFunctionTypes` - 严格函数类型检查
- `noImplicitAny` - 禁止隐式 any
- `noUncheckedIndexedAccess` - 索引访问检查
- `exactOptionalPropertyTypes` - 精确可选属性类型
- `noImplicitOverride` - 显式 override
- `verbatimModuleSyntax` - 严格导入语法

## 注意事项

1. 所有包必须使用 `@admin-core/tsconfig` 配置
2. 不要在子项目中覆盖严格模式配置
3. 库项目使用 `library.json` 系列，应用使用 `app-*.json` 系列
4. 配置定期更新以保持最新 TypeScript 特性
