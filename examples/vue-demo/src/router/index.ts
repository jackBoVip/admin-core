import { createRouter, createWebHistory } from 'vue-router';

// 页面组件
const Home = () => import('../views/Home.vue');
const DashboardAnalysis = () => import('../views/dashboard/Analysis.vue');
const DashboardMonitor = () => import('../views/dashboard/Monitor.vue');
const DashboardWorkplace = () => import('../views/dashboard/Workplace.vue');
const SystemUser = () => import('../views/system/User.vue');
const SystemRole = () => import('../views/system/Role.vue');
const SystemMenu = () => import('../views/system/Menu.vue');
const SystemDept = () => import('../views/system/Dept.vue');
const ComponentsButton = () => import('../views/components/Button.vue');
const ComponentsForm = () => import('../views/components/Form.vue');
const ComponentsTable = () => import('../views/components/Table.vue');
const About = () => import('../views/About.vue');

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home,
    },
    {
      path: '/dashboard',
      redirect: '/dashboard/analysis',
    },
    {
      path: '/dashboard/analysis',
      name: 'DashboardAnalysis',
      component: DashboardAnalysis,
    },
    {
      path: '/dashboard/monitor',
      name: 'DashboardMonitor',
      component: DashboardMonitor,
    },
    {
      path: '/dashboard/workplace',
      name: 'DashboardWorkplace',
      component: DashboardWorkplace,
    },
    {
      path: '/system',
      redirect: '/system/user',
    },
    {
      path: '/system/user',
      name: 'SystemUser',
      component: SystemUser,
    },
    {
      path: '/system/role',
      name: 'SystemRole',
      component: SystemRole,
    },
    {
      path: '/system/menu',
      name: 'SystemMenu',
      component: SystemMenu,
    },
    {
      path: '/system/dept',
      name: 'SystemDept',
      component: SystemDept,
    },
    {
      path: '/components',
      redirect: '/components/button',
    },
    {
      path: '/components/button',
      name: 'ComponentsButton',
      component: ComponentsButton,
    },
    {
      path: '/components/form',
      name: 'ComponentsForm',
      component: ComponentsForm,
    },
    {
      path: '/components/table',
      name: 'ComponentsTable',
      component: ComponentsTable,
    },
    {
      path: '/about',
      name: 'About',
      component: About,
    },
  ],
});

export default router;
