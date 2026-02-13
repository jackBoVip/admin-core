import { createApp } from 'vue';
import App from './App.vue';
import router, { setupRouteAccess } from './router';
import { h } from 'vue';
import { setupAdminFormVue } from '@admin-core/form-vue';
import { setupAdminTableVue } from '@admin-core/table-vue';
import {
  VxeButton,
  VxeCheckbox,
  VxeCheckboxGroup,
  VxeDatePicker,
  VxeDateRangePicker,
  VxeInput,
  VxePasswordInput,
  VxeRadioGroup,
  VxeSelect,
  VxeSwitch,
  VxeTextarea,
} from 'vxe-pc-ui';

// 样式
import './styles/index.css';

async function bootstrap() {
  setupAdminFormVue({
    library: 'vxe',
    libraries: {
      vxe: {
        capabilities: {
          customModelProp: true,
          slots: true,
        },
        components: {
          checkbox: VxeCheckbox as any,
          'checkbox-group': VxeCheckboxGroup as any,
          date: VxeDatePicker as any,
          'date-range': VxeDateRangePicker as any,
          'default-button': ((props: any, { slots }: any) =>
            h(
              VxeButton as any,
              {
                ...props,
                mode: 'text',
              },
              slots
            )) as any,
          input: VxeInput as any,
          password: VxePasswordInput as any,
          'primary-button': ((props: any, { slots }: any) =>
            h(
              VxeButton as any,
              {
                ...props,
                status: 'primary',
              },
              slots
            )) as any,
          'radio-group': VxeRadioGroup as any,
          select: VxeSelect as any,
          switch: VxeSwitch as any,
          textarea: VxeTextarea as any,
        },
        modelPropNameMap: {
          checkbox: 'modelValue',
          switch: 'modelValue',
        },
      },
    },
  });

  setupAdminTableVue({
    locale: 'zh-CN',
  });

  const { menus } = await setupRouteAccess();

  const app = createApp(App, { menus });
  app.use(router);
  app.mount('#app');
}

bootstrap();
