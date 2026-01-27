import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import './styles/index.css';

// 路由配置
const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('./views/Home.vue'),
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: () => import('./views/Dashboard.vue'),
    },
    {
      path: '/settings',
      name: 'Settings',
      component: () => import('./views/Settings.vue'),
    },
    {
      path: '/about',
      name: 'About',
      component: () => import('./views/About.vue'),
    },
  ],
});

const app = createApp(App);
app.use(router);
app.mount('#app');
