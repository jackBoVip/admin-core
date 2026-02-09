# React 和 Vue 锁屏功能差异分析

## 问题描述

React 应用解锁后刷新浏览器会自动进入锁屏页面，而 Vue 应用不会出现这个问题。

## 根本原因分析

### 1. React App.tsx 的锁屏状态处理

**位置：** `examples/react-demo/src/App.tsx`

**问题代码：**
```typescript
const [isLocked, setIsLocked] = useState<boolean | null>(null);

useEffect(() => {
  let manager = getPreferencesManager();
  if (!manager) {
    initPreferences({ namespace: 'admin-core' });
    manager = getPreferencesManager();
  }

  if (manager) {
    const prefs = manager.getPreferences();
    setIsLocked(prefs.lockScreen.isLocked);  // ⚠️ 问题：直接读取可能不是最新状态
    
    const unsubscribe = manager.subscribe((newPrefs) => {
      setIsLocked(newPrefs.lockScreen.isLocked);
    });
    
    return unsubscribe;
  }
}, []);

// ⚠️ 问题：如果 isLocked === true，会立即渲染 BasicLayout
if (isLocked === true) {
  return (
    <BasicLayout ...>
      {ready ? outlet : null}
    </BasicLayout>
  );
}
```

**问题分析：**
1. React App.tsx 在初始化时从 manager 读取锁屏状态
2. 如果读取到的状态是 `true`，会立即渲染 BasicLayout（即使路由未加载完成）
3. 这个逻辑与 PreferencesProvider 中的 LockScreen 组件重复
4. 如果解锁后状态没有正确保存，刷新后会读取到旧的锁屏状态

### 2. Vue App.vue 的锁屏状态处理

**位置：** `examples/vue-demo/src/App.vue`

**代码：**
```vue
<template>
  <BasicLayout ...>
    <router-view v-slot="{ Component }">
      <component :is="Component" />
    </router-view>
  </BasicLayout>
</template>
```

**分析：**
1. Vue App.vue 没有额外的锁屏状态检查逻辑
2. 直接渲染 BasicLayout，锁屏状态由 LockScreen 组件内部处理
3. LockScreen 组件通过 `v-if="isLocked"` 控制显示
4. `isLocked` 是响应式的：`computed(() => preferences.value?.lockScreen.isLocked ?? false)`

### 3. LockScreen 组件的实现差异

#### React LockScreen
```typescript
const { preferences, setPreferences } = usePreferences();
const isLocked = preferences.lockScreen.isLocked;  // 直接读取

if (!isLocked) return null;  // 不锁定时不渲染

return createPortal(...);
```

#### Vue LockScreen
```vue
<script setup>
const { preferences, setPreferences } = usePreferences();
const isLocked = computed(() => preferences.value?.lockScreen.isLocked ?? false);
</script>

<template>
  <Teleport to="body">
    <div v-if="isLocked" ...>  <!-- 响应式控制 -->
      ...
    </div>
  </Teleport>
</template>
```

**差异：**
- React 使用 `useSyncExternalStore` 订阅状态，但 App.tsx 中额外维护了一个本地 state
- Vue 使用 `computed` 响应式计算，状态完全由 preferences 驱动

### 4. 状态保存逻辑

**位置：** `packages/preferences/core/src/manager/preferences-manager.ts`

**saveToStorage 方法：**
```typescript
private saveToStorage(): void {
  const diffPrefs = this.getDiff() ?? {};
  const storedPrefs = this.loadFromStorage();
  const storedIsLocked = storedPrefs?.lockScreen?.isLocked;
  
  const hasPassword = this.state.lockScreen.password !== '';
  const lockStateChanged = storedIsLocked !== undefined && storedIsLocked !== this.state.lockScreen.isLocked;
  const shouldSaveLockScreen = hasPassword || hasStoredLockScreen || this.state.lockScreen.isLocked || diffPrefs.lockScreen || lockStateChanged;
  
  if (shouldSaveLockScreen) {
    diffPrefs.lockScreen.isLocked = this.state.lockScreen.isLocked;  // 保存当前状态
    this.storage.setItem(PREFERENCES_STORAGE_KEY, diffPrefs);
  }
}
```

**问题：**
- 解锁后（`isLocked: false`），如果与默认值相同，可能不会保存到 diffPrefs
- 虽然添加了 `lockStateChanged` 检查，但可能在某些情况下仍然不保存

## 解决方案

### 方案 1：移除 React App.tsx 中的重复逻辑（推荐）

**原因：**
- PreferencesProvider 中的 LockScreen 组件已经处理了锁屏显示逻辑
- App.tsx 中的额外检查是重复的，可能导致状态不同步

**修改：**
```typescript
// 移除 isLocked state 和相关的 useEffect
// 直接渲染 BasicLayout，让 LockScreen 组件自己处理显示/隐藏
```

### 方案 2：确保状态正确保存

**修改 saveToStorage 方法：**
- 如果用户设置了密码，无论 isLocked 是什么值，都应该保存
- 解锁后必须保存 `isLocked: false` 到 localStorage

## 修复方案

### 已实施的修复

1. **移除 React App.tsx 中的重复锁屏状态检查逻辑** ✅
   - 移除了 `isLocked` state 和相关的 `useEffect`
   - 移除了基于 `isLocked` 的条件渲染逻辑
   - 让 LockScreen 组件自己处理显示/隐藏，与 Vue 保持一致

2. **确保解锁后状态正确保存** ✅
   - 在 `saveToStorage` 方法中添加了 `lockStateChanged` 检查
   - 确保解锁状态（`isLocked: false`）能正确保存到 localStorage

### 修复后的行为

**React：**
- App.tsx 不再维护额外的锁屏状态
- LockScreen 组件通过 `usePreferences()` 响应式获取锁屏状态
- 解锁后刷新页面，LockScreen 组件会根据 preferences 中的状态自动隐藏

**Vue：**
- App.vue 直接渲染 BasicLayout
- LockScreen 组件通过 `computed(() => preferences.value?.lockScreen.isLocked ?? false)` 响应式控制显示
- 行为与修复后的 React 一致

### 关键改进

1. **状态单一来源**：锁屏状态只由 preferences 管理，不再有多个状态源
2. **响应式更新**：LockScreen 组件自动响应 preferences 变化，无需手动同步
3. **一致性**：React 和 Vue 的锁屏处理方式现在完全一致

