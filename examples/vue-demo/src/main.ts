import { createApp } from 'vue';
import App from './App.vue';
import router, { setupRouteAccess } from './router';

// 样式
import './styles/index.css';

async function bootstrap() {
  const { menus } = await setupRouteAccess();

  const app = createApp(App, { menus });
  app.use(router);
  app.mount('#app');
}

bootstrap();
