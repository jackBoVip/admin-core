# @admin-core/preferences-vue

> Vue 3 偏好设置集成，提供 Composables 和组件。

## 特性

- **Vue 3 支持**: 基于 Vue 3 Composition API 构建
- **Composables API**: 使用 Vue Composables 实现响应式状态管理
- **开箱即用组件**: 预构建的抽屉、标签页和表单组件
- **TypeScript**: 完整的类型定义，类型安全
- **响应式优化**: 使用 shallowRef 实现高效的订阅管理

## 安装

```bash
# npm
npm install @admin-core/preferences-vue

# pnpm
pnpm add @admin-core/preferences-vue

# yarn
yarn add @admin-core/preferences-vue
```

**对等依赖:**
- `vue >= 3.3.0`

## 快速开始

### 1. 初始化偏好设置

```typescript
// main.ts
import { createApp } from 'vue';
import { initPreferences } from '@admin-core/preferences-vue';
import '@admin-core/preferences/styles';
import App from './App.vue';

// 应用启动时初始化一次
initPreferences({
  namespace: 'my-app',
  overrides: {
    theme: { colorPrimary: 'oklch(0.6 0.2 250)' },
    app: { locale: 'zh-CN' },
  },
});

createApp(App).mount('#app');
```

### 2. 使用 PreferencesProvider（推荐）

`PreferencesProvider` 组件自动集成锁屏、快捷键和偏好设置抽屉功能。

```vue
<!-- App.vue -->
<script setup lang="ts">
import { PreferencesProvider } from '@admin-core/preferences-vue';

const handleLogout = () => {
  // 处理登出
};

const handleSearch = () => {
  // 处理全局搜索
};
</script>

<template>
  <PreferencesProvider @logout="handleLogout" @search="handleSearch">
    <YourAppContent />
  </PreferencesProvider>
</template>
```

### 3. 在组件中使用 Composables

```vue
<script setup lang="ts">
import { usePreferences, usePreferencesContext } from '@admin-core/preferences-vue';

// 访问偏好设置状态
const { preferences, setPreferences, isDark, toggleTheme } = usePreferences();

// 访问 Provider 上下文（锁屏、抽屉控制）
const { lock, togglePreferences, isPreferencesOpen } = usePreferencesContext();
</script>

<template>
  <div>
    <p>当前主题: {{ isDark ? '深色' : '浅色' }}</p>
    <button @click="toggleTheme">切换主题</button>
    <button @click="togglePreferences">打开设置</button>
    <button @click="lock">锁定屏幕</button>
  </div>
</template>
```

## 进阶用法

### 使用独立 Composables

```vue
<script setup lang="ts">
import { useTheme, useLayout } from '@admin-core/preferences-vue';

const { isDark, toggleTheme, setPrimaryColor } = useTheme();
const { isSidebarCollapsed, toggleSidebar, setLayout } = useLayout();
</script>

<template>
  <div>
    <button @click="toggleTheme">
      {{ isDark ? '🌙' : '☀️' }}
    </button>
    <button @click="() => setPrimaryColor('oklch(0.6 0.2 150)')">
      绿色主题
    </button>
    <button @click="toggleSidebar">
      {{ isSidebarCollapsed ? '展开' : '折叠' }}
    </button>
    <button @click="() => setLayout('header-nav')">
      使用顶部导航
    </button>
  </div>
</template>
```

### 使用分类 Composable

```vue
<script setup lang="ts">
import { usePreferencesCategory } from '@admin-core/preferences-vue';

const { value, setValue, reset } = usePreferencesCategory('tabbar');
</script>

<template>
  <div>
    <label>
      <input
        type="checkbox"
        :checked="value?.enable"
        @change="(e) => setValue({ enable: (e.target as HTMLInputElement).checked })"
      />
      启用标签栏
    </label>
    <button @click="reset">重置为默认</button>
  </div>
</template>
```

### 单独使用组件

```vue
<script setup lang="ts">
import { ref } from 'vue';
import {
  PreferencesDrawer,
  PreferencesTrigger,
} from '@admin-core/preferences-vue';

const open = ref(false);
</script>

<template>
  <PreferencesTrigger @click="open = true" />
  
  <PreferencesDrawer
    v-model:open="open"
    default-tab="appearance"
  />
</template>
```

## 组件

### PreferencesProvider

主要包装组件，提供上下文并集成各项功能。

```vue
<PreferencesProvider
  @logout="handleLogout"
  @search="handleSearch"
  lock-screen-background="url"
  :enable-shortcuts="true"
  :enable-lock-screen="true"
>
  <slot />
</PreferencesProvider>
```

### PreferencesDrawer

带有标签页导航的设置抽屉。

```vue
<PreferencesDrawer
  v-model:open="open"
  default-tab="appearance"
  :tabs="['appearance', 'layout', 'general', 'shortcuts']"
/>
```

### 标签页组件

可独立使用的各个标签页组件：

- `AppearanceTab` - 主题、颜色、模式设置
- `LayoutTab` - 布局类型、侧边栏、顶栏设置
- `GeneralTab` - 语言、快捷键、水印设置
- `ShortcutKeysTab` - 键盘快捷键配置

### 表单组件

用于自定义设置 UI 的构建块：

- `PreferencesBlock` - 带标题的区块容器
- `PreferencesSwitchItem` - 开关切换
- `PreferencesSelectItem` - 下拉选择
- `PreferencesSliderItem` - 范围滑块

## API 参考

完整的 API 参考请参见 [API 文档](./API.md)。

## 相关链接

- [@admin-core/preferences](../core/README.zh-CN.md) - 核心包
- [@admin-core/preferences-react](../react/README.zh-CN.md) - React 集成

## 许可证

MIT
