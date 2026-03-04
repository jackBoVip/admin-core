<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router';
import {
  BasicLayout,
  useVueRouterAdapter,
  type BasicLayoutProps,
} from '@admin-core/layout-vue';

/**
 * 页面外部输入属性。
 * @description `menus` 由路由访问初始化流程注入，作为布局菜单数据源。
 */
const props = defineProps<{
  menus: NonNullable<BasicLayoutProps['menus']>;
}>();

/**
 * 当前登录用户信息（示例数据）。
 */
const userInfo = {
  id: '1',
  username: 'admin',
  displayName: 'Admin User',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
  roles: ['admin'],
};

/**
 * 路由适配器配置，供 `BasicLayout` 内部导航能力使用。
 */
const router = useRouter();
const route = useRoute();
const routerConfig = useVueRouterAdapter(router, route);

/**
 * 处理退出登录事件。
 *
 * @returns 无返回值。
 */
const handleLogout = () => {
  if (confirm('确定要退出登录吗？')) {
    router.push('/login');
  }
};

/**
 * 处理全局搜索触发事件。
 * @description 示例项目预留扩展点，当前不执行具体逻辑。
 *
 * @returns 无返回值。
 */
const handleSearch = () => {};

/**
 * 处理刷新事件。
 * @description 示例项目预留扩展点，当前不执行具体逻辑。
 *
 * @returns 无返回值。
 */
const handleRefresh = () => {};

/**
 * 处理锁屏事件。
 * @description 锁屏状态由布局内部统一管理，此处预留事件扩展入口。
 *
 * @returns 无返回值。
 */
const handleLockScreen = () => {};
</script>

<template>
  <!-- 
    BasicLayout 已内置：
    - PreferencesProvider（偏好设置上下文）
    - PreferencesDrawer（偏好设置抽屉）
    - 偏好设置按钮（右侧固定）
    用户无需手动配置！
  -->
  <!-- 
    不传递 layout 属性，让布局响应偏好设置的变化
    用户可以通过偏好设置面板切换布局类型
  -->
  <BasicLayout
    :menus="props.menus"
    :router="routerConfig"
    :user-info="userInfo"
    :logo="{ source: 'https://vitejs.dev/logo.svg' }"
    app-name="Admin"
    @logout="handleLogout"
    @global-search="handleSearch"
    @refresh="handleRefresh"
    @lock-screen="handleLockScreen"
  >
    <!-- 内容区域 -->
    <template #default>
      <router-view v-slot="{ Component }">
        <component :is="Component" />
      </router-view>
    </template>

  </BasicLayout>
</template>

<style>
/* 全局样式 */
html, body, #app {
  margin: 0;
  padding: 0;
  height: 100%;
}
</style>
